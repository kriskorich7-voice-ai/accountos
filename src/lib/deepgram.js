// Deepgram STT + TTS helpers. Uses VITE_DEEPGRAM_API_KEY.
// TTS: Flux (flux-alexis-en) streamed over the v2 speak WebSocket.
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

// Stream speech from Deepgram Flux TTS over a WebSocket and play it gaplessly
// through the Web Audio API as linear16 chunks arrive. Lower latency than the
// REST endpoint since playback starts on the first chunk. An AnalyserNode is
// tapped so callers can drive a visualizer from real-time amplitude.
//
// callbacks: { onStart, onEnd, onError, onLevel(0..1) }
// Returns a controller with stop().
export function streamSpeech(text, { onStart, onEnd, onError, onLevel } = {}) {
  if (!DG_KEY) throw new Error('Missing VITE_DEEPGRAM_API_KEY');

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx({ sampleRate: TTS_SAMPLE_RATE });

  // Analyser taps the graph: sources → analyser → destination.
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  analyser.connect(ctx.destination);
  const freqData = new Uint8Array(analyser.frequencyBinCount);
  let levelRaf = null;

  const spokenText = normalizeForTTS(text);

  const url = `wss://api.deepgram.com/v2/speak?model=flux-alexis-en&encoding=linear16&sample_rate=${TTS_SAMPLE_RATE}`;
  // Browsers can't set headers on a WebSocket; Deepgram reads the token from the
  // Sec-WebSocket-Protocol handshake, expressed here as the sub-protocol array.
  const ws = new WebSocket(url, ['token', DG_KEY]);
  ws.binaryType = 'arraybuffer';

  const sources = [];
  let nextStartTime = 0; // AudioContext time cursor for gapless scheduling
  let carry = null; // leftover odd byte spanning two binary frames
  let started = false;
  let finished = false;

  // rAF loop feeding normalized amplitude (0..1) to the visualizer.
  const runLevelLoop = () => {
    if (!onLevel) return;
    const tick = () => {
      analyser.getByteFrequencyData(freqData);
      let sum = 0;
      for (let i = 0; i < freqData.length; i++) sum += freqData[i];
      const avg = sum / freqData.length / 255; // 0..1
      onLevel(avg);
      levelRaf = requestAnimationFrame(tick);
    };
    levelRaf = requestAnimationFrame(tick);
  };
  const stopLevelLoop = () => {
    if (levelRaf) cancelAnimationFrame(levelRaf);
    levelRaf = null;
    onLevel?.(0);
  };

  const teardown = () => {
    stopLevelLoop();
    try {
      ws.close();
    } catch {}
    ctx.close().catch(() => {});
  };

  // Called when the server signals AudioDone (or the socket closes). Waits for
  // any already-scheduled audio to finish, then reports completion.
  const finish = () => {
    if (finished) return;
    finished = true;
    try {
      ws.close();
    } catch {}
    const remainingMs = Math.max(0, (nextStartTime - ctx.currentTime) * 1000);
    setTimeout(() => {
      stopLevelLoop();
      ctx.close().catch(() => {});
      onEnd?.();
    }, remainingMs + 120);
  };

  const playChunk = (arrayBuffer) => {
    let bytes = new Uint8Array(arrayBuffer);
    if (carry) {
      const merged = new Uint8Array(carry.length + bytes.length);
      merged.set(carry);
      merged.set(bytes, carry.length);
      bytes = merged;
      carry = null;
    }
    // linear16 is 2 bytes/sample — hold back a trailing odd byte for next frame.
    if (bytes.length % 2 !== 0) {
      carry = bytes.slice(bytes.length - 1);
      bytes = bytes.slice(0, bytes.length - 1);
    }
    if (bytes.length === 0) return;

    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

    const buffer = ctx.createBuffer(1, float32.length, TTS_SAMPLE_RATE);
    buffer.getChannelData(0).set(float32);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(analyser);
    const startAt = Math.max(ctx.currentTime, nextStartTime);
    src.start(startAt);
    nextStartTime = startAt + buffer.duration;
    sources.push(src);

    if (!started) {
      started = true;
      onStart?.();
      runLevelLoop();
    }
  };

  ws.onopen = async () => {
    try {
      if (ctx.state === 'suspended') await ctx.resume();
    } catch {}
    ws.send(JSON.stringify({ type: 'Speak', text: spokenText }));
    ws.send(JSON.stringify({ type: 'Flush' }));
  };

  ws.onmessage = (evt) => {
    if (typeof evt.data === 'string') {
      let msg;
      try {
        msg = JSON.parse(evt.data);
      } catch {
        return;
      }
      // AudioDone marks the end of synthesized audio for the flushed text.
      if (msg.type === 'AudioDone' || msg.type === 'Done' || msg.type === 'Close') {
        finish();
      }
      return;
    }
    playChunk(evt.data);
  };

  ws.onerror = (e) => onError?.(e);
  ws.onclose = () => {
    if (!finished) finish();
  };

  return {
    stop() {
      finished = true;
      sources.forEach((s) => {
        try {
          s.stop();
        } catch {}
      });
      teardown();
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
