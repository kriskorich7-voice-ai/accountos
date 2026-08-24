// Deepgram STT + TTS helpers. Uses VITE_DEEPGRAM_API_KEY.
// TTS: Flux (flux-alexis-en) over a persistent v2 speak WebSocket that stays
//      open for the whole conversation and uses the Interrupt protocol.
// STT: Flux streaming (flux-general-en) via the v2 listen WebSocket.

const DG_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;

export const hasDeepgram = Boolean(DG_KEY);

// ---- Text-to-Speech: Flux streaming ---------------------------------------

const TTS_SAMPLE_RATE = 24000;

// Normalize text so Flux TTS reads numbers, currency, and acronyms naturally.
// e.g. "87/100" → "87 out of 100", "$4.8M" → "4.8 million dollars".
export function normalizeForTTS(text) {
  return text
    // Fix score formats like 87/100 → "87 out of 100"
    .replace(/(\d+)\/(\d+)/g, '$1 out of $2')
    // Fix percentage with + sign like +18% → "18 percent"
    .replace(/\+(\d+)%/g, '$1 percent')
    // Fix standalone percentages like 18% → "18 percent"
    .replace(/(\d+)%/g, '$1 percent')
    // Fix dollar amounts like $4.8M → "4.8 million dollars"
    .replace(/\$(\d+\.?\d*)M/g, '$1 million dollars')
    // Fix dollar amounts like $780K → "780 thousand dollars"
    .replace(/\$(\d+\.?\d*)K/g, '$1 thousand dollars')
    // Fix YoY → "year over year"
    .replace(/YoY/g, 'year over year')
    // Fix ARR → "annual recurring revenue"
    .replace(/\bARR\b/g, 'annual recurring revenue')
    // Fix remaining +number like +18 → "18"
    .replace(/\+(\d+)/g, '$1')
    .trim();
}

// Persistent Flux TTS session over a SINGLE WebSocket that stays open for the
// whole conversation (Interrupt does not reset the voice, so the connection is
// reused for voice consistency). A session-wide playback clock advances
// monotonically and is the offset we hand to the Interrupt message.
//
// callbacks: { onStart, onLevel(0..1), onError }
// Returns a controller: speak(text) -> Promise<{interrupted, textSpoken, noAudio}>,
//                       interrupt(), isSpeaking(), playbackMs(), close().
export function createSpeechSession({ onStart, onLevel, onError } = {}) {
  if (!DG_KEY) throw new Error('Missing VITE_DEEPGRAM_API_KEY');

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioCtx({ sampleRate: TTS_SAMPLE_RATE });

  // Analyser feeds the orb visualizer: source → analyser → destination.
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  analyser.connect(audioContext.destination);
  const freqData = new Uint8Array(analyser.frequencyBinCount);

  const url = `wss://api.deepgram.com/v2/speak?model=flux-alexis-en&encoding=linear16&sample_rate=${TTS_SAMPLE_RATE}`;
  // Token via the Sec-WebSocket-Protocol handshake (browsers can't set headers).
  const ws = new WebSocket(url, ['token', DG_KEY]);
  ws.binaryType = 'arraybuffer';

  // ---- Session-wide state (NEVER reset per turn) --------------------------
  let sessionPlaybackMs = 0; // monotonic playback clock for Interrupt offset
  let isInterruptInProgress = false;

  // ---- Audio queue --------------------------------------------------------
  const audioQueue = [];
  let isPlayingAudio = false;
  let currentSource = null;
  let carry = null; // leftover odd byte spanning two binary frames

  // ---- Per-utterance state ------------------------------------------------
  let pending = null; // { resolve } for the in-flight speak()
  let flushReceived = false;
  let onStartFired = false;
  let closed = false;

  // ---- Amplitude loop for the orb ----------------------------------------
  let levelRaf = null;
  const startLevelLoop = () => {
    if (!onLevel || levelRaf) return;
    const tick = () => {
      analyser.getByteFrequencyData(freqData);
      let sum = 0;
      for (let i = 0; i < freqData.length; i++) sum += freqData[i];
      onLevel(sum / freqData.length / 255);
      levelRaf = requestAnimationFrame(tick);
    };
    levelRaf = requestAnimationFrame(tick);
  };
  const stopLevelLoop = () => {
    if (levelRaf) cancelAnimationFrame(levelRaf);
    levelRaf = null;
    onLevel?.(0);
  };

  const resolvePending = (result) => {
    const p = pending;
    pending = null;
    if (p) p.resolve(result);
  };

  // Play queued chunks strictly sequentially so the session clock stays exact.
  const playNext = () => {
    if (closed || isInterruptInProgress) {
      isPlayingAudio = false;
      return;
    }
    if (audioQueue.length === 0) {
      isPlayingAudio = false;
      stopLevelLoop();
      if (flushReceived && pending) resolvePending({ interrupted: false, textSpoken: null });
      return;
    }
    isPlayingAudio = true;
    const chunk = audioQueue.shift(); // even-length Uint8Array, offset 0
    const samples = chunk.length / 2;
    const durationMs = (samples / TTS_SAMPLE_RATE) * 1000; // (len/2)/24000*1000

    const audioBuffer = audioContext.createBuffer(1, samples, TTS_SAMPLE_RATE);
    const float32 = new Float32Array(samples);
    const int16 = new Int16Array(chunk.buffer, chunk.byteOffset, samples);
    for (let i = 0; i < samples; i++) float32[i] = int16[i] / 32768;
    audioBuffer.copyToChannel(float32, 0);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    currentSource = source;

    if (!onStartFired) {
      onStartFired = true;
      onStart?.();
      startLevelLoop();
    }

    source.onended = () => {
      sessionPlaybackMs += durationMs; // advance the monotonic clock
      if (currentSource === source) currentSource = null;
      playNext();
    };
    try {
      source.start();
    } catch {
      sessionPlaybackMs += durationMs;
      playNext();
    }
  };

  const enqueue = (arrayBuffer) => {
    if (isInterruptInProgress || closed) return; // drop frames mid-interrupt
    let bytes = new Uint8Array(arrayBuffer);
    if (carry) {
      const merged = new Uint8Array(carry.length + bytes.length);
      merged.set(carry);
      merged.set(bytes, carry.length);
      bytes = merged;
      carry = null;
    }
    if (bytes.length % 2 !== 0) {
      carry = bytes.slice(bytes.length - 1);
      bytes = bytes.slice(0, bytes.length - 1);
    }
    if (bytes.length === 0) return;
    audioQueue.push(new Uint8Array(bytes)); // fresh, aligned copy
    if (!isPlayingAudio) playNext();
  };

  const clearAudioQueue = () => {
    audioQueue.length = 0;
    isPlayingAudio = false;
    carry = null;
    if (currentSource) {
      try {
        currentSource.stop();
      } catch {}
      try {
        currentSource.disconnect();
      } catch {}
      currentSource = null;
    }
    stopLevelLoop();
  };

  ws.onmessage = (evt) => {
    if (closed) return;
    if (typeof evt.data === 'string') {
      let msg;
      try {
        msg = JSON.parse(evt.data);
      } catch {
        return;
      }
      const type = msg.type;

      if (type === 'SpeechInterrupted') {
        isInterruptInProgress = false;
        const textSpoken = msg.text_spoken ?? msg.text ?? '';
        resolvePending({ interrupted: true, textSpoken });
        return;
      }

      if (type === 'Warning') {
        const code = `${msg.warn_code || msg.code || msg.description || ''}`;
        // Another Interrupt already in flight — ignore, don't send more.
        if (/INTERRUPT_IN_PROGRESS/i.test(code)) return;
        // Interrupted before any audio was produced — skip SpeechInterrupted
        // handling and let the caller go straight to listening.
        if (/NO_AUDIO_GENERATED/i.test(code)) {
          isInterruptInProgress = false;
          resolvePending({ interrupted: true, textSpoken: '', noAudio: true });
          return;
        }
        return;
      }

      // Natural end of the flushed utterance.
      if (type === 'AudioDone' || type === 'Flushed' || type === 'Done') {
        flushReceived = true;
        if (!isPlayingAudio && audioQueue.length === 0 && pending) {
          resolvePending({ interrupted: false, textSpoken: null });
        }
        return;
      }
      return; // Metadata / Cleared / etc.
    }
    enqueue(evt.data);
  };

  ws.onerror = (e) => {
    if (!closed) onError?.(e);
  };

  const wsReady = () =>
    new Promise((res) => {
      if (ws.readyState === WebSocket.OPEN) return res();
      ws.addEventListener('open', () => res(), { once: true });
    });

  return {
    // Synthesize `text` on the SAME socket. Resolves on natural completion or on
    // SpeechInterrupted (barge-in). Does NOT reset the session playback clock.
    async speak(text) {
      const spoken = normalizeForTTS(text);
      flushReceived = false;
      onStartFired = false;
      carry = null;
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
        } catch {}
      }
      await wsReady();
      return new Promise((resolve) => {
        pending = { resolve };
        try {
          ws.send(JSON.stringify({ type: 'Speak', text: spoken }));
          ws.send(JSON.stringify({ type: 'Flush' }));
        } catch {
          resolvePending({ interrupted: false, textSpoken: null });
        }
      });
    },

    // Barge-in: stop local audio immediately and send Interrupt (same socket)
    // with the session-wide playback offset. Do not send a second Interrupt
    // while one is in progress.
    interrupt() {
      if (isInterruptInProgress || closed) return;
      isInterruptInProgress = true;
      clearAudioQueue();
      try {
        ws.send(
          JSON.stringify({
            type: 'Interrupt',
            playback_offset: { type: 'time_ms', value: Math.round(sessionPlaybackMs) },
          }),
        );
      } catch {}
    },

    isSpeaking() {
      return isPlayingAudio || pending != null;
    },
    playbackMs() {
      return sessionPlaybackMs;
    },

    // Only called when the whole conversation ends (orb clicked to stop).
    close() {
      if (closed) return;
      closed = true;
      clearAudioQueue();
      stopLevelLoop();
      try {
        analyser.disconnect();
      } catch {}
      try {
        ws.close();
      } catch {}
      audioContext.close().catch(() => {});
      if (pending) resolvePending({ interrupted: false, textSpoken: null, closed: true });
    },
  };
}

// ---- Speech-to-Text: Flux streaming ---------------------------------------

// Downsample a Float32 buffer to 16 kHz Int16 PCM (linear16).
function floatTo16BitPCM(float32, inRate, outRate = 16000) {
  const ratio = inRate / outRate;
  const outLength = Math.floor(float32.length / ratio);
  const out = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const sample = float32[Math.floor(i * ratio)] || 0;
    const s = Math.max(-1, Math.min(1, sample));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

// Opens a Flux streaming session. Captures mic audio, streams linear16 frames,
// and surfaces live + final transcripts via callbacks.
//
// callbacks: { onOpen, onPartial(text), onFinal(text), onError, onClose }
// Returns a controller with stop().
export async function startLiveTranscription({
  onOpen,
  onPartial,
  onFinal,
  onError,
  onClose,
} = {}) {
  if (!DG_KEY) throw new Error('Missing VITE_DEEPGRAM_API_KEY');

  // Echo cancellation keeps the mic from re-transcribing the AI's own TTS during
  // continuous conversation (enables clean barge-in).
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx({ sampleRate: 16000 });
  const inRate = audioCtx.sampleRate;
  const source = audioCtx.createMediaStreamSource(stream);
  const processor = audioCtx.createScriptProcessor(4096, 1, 1);

  const url =
    'wss://api.deepgram.com/v2/listen?model=flux-general-en&encoding=linear16&sample_rate=16000';
  // Browsers can't send auth headers on a WebSocket; Deepgram accepts the token
  // via the sub-protocol: ['token', <key>].
  const ws = new WebSocket(url, ['token', DG_KEY]);
  ws.binaryType = 'arraybuffer';

  let closed = false;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    try {
      processor.disconnect();
      source.disconnect();
    } catch {}
    stream.getTracks().forEach((t) => t.stop());
    audioCtx.close().catch(() => {});
  };

  ws.onopen = () => {
    source.connect(processor);
    processor.connect(audioCtx.destination);
    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const pcm = floatTo16BitPCM(e.inputBuffer.getChannelData(0), inRate);
      ws.send(pcm.buffer);
    };
    onOpen?.();
  };

  ws.onmessage = (evt) => {
    let msg;
    try {
      msg = JSON.parse(evt.data);
    } catch {
      return;
    }

    // Flux v2 turn-based schema and classic Listen schema are both handled.
    // Classic: { channel: { alternatives: [{ transcript }] }, is_final, speech_final }
    // Flux:    { type: 'TurnInfo', event: 'StartOfTurn'|'Update'|'EndOfTurn', transcript }
    const classicTranscript = msg?.channel?.alternatives?.[0]?.transcript;
    const fluxTranscript = msg?.transcript;
    const transcript = (classicTranscript ?? fluxTranscript ?? '').trim();

    const isFinal =
      msg?.speech_final === true ||
      msg?.event === 'EndOfTurn' ||
      msg?.type === 'EndOfTurn';

    if (!transcript) return;
    if (isFinal) onFinal?.(transcript);
    else onPartial?.(transcript);
  };

  ws.onerror = (e) => onError?.(e);
  ws.onclose = () => {
    cleanup();
    onClose?.();
  };

  return {
    stop() {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          // Ask Deepgram to flush any final result, then close.
          ws.send(JSON.stringify({ type: 'CloseStream' }));
          ws.close();
        }
      } catch {}
      cleanup();
    },
  };
}
