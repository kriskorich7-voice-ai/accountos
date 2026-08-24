// Deepgram STT + TTS helpers. Uses VITE_DEEPGRAM_API_KEY.
// TTS: Flux (flux-alexis-en) via the v2 speak endpoint.
// STT: Flux streaming (flux-general-en) via the v2 listen WebSocket.

const DG_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;

export const hasDeepgram = Boolean(DG_KEY);

// ---- Text-to-Speech: Flux -------------------------------------------------

// Synthesize speech with Deepgram Flux TTS and return the raw audio bytes.
// Callers play this through the Web Audio API.
export async function synthesizeSpeech(text) {
  if (!DG_KEY) throw new Error('Missing VITE_DEEPGRAM_API_KEY');
  // Keep spoken responses concise for latency.
  const clipped = text.length > 1800 ? text.slice(0, 1800) : text;
  const res = await fetch('https://api.deepgram.com/v2/speak?model=flux-alexis-en', {
    method: 'POST',
    headers: {
      Authorization: `Token ${DG_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: clipped }),
  });
  if (!res.ok) throw new Error(`Deepgram TTS ${res.status}`);
  return await res.arrayBuffer();
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

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
