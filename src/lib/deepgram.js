// Deepgram Voice Agent API integration.
// A SINGLE WebSocket (wss://agent.deepgram.com/v1/agent/converse) handles STT,
// the LLM, TTS, and interruption natively — no manual pipeline. Uses
// VITE_DEEPGRAM_API_KEY.

const DG_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
export const hasDeepgram = Boolean(DG_KEY);

const AGENT_URL = 'wss://agent.deepgram.com/v1/agent/converse';
const INPUT_RATE = 16000; // mic → agent (linear16)
const OUTPUT_RATE = 24000; // agent → speaker (linear16)

// Resample a Float32 mic buffer to 16 kHz Int16 PCM (linear16).
function floatTo16BitPCM(float32, inRate, outRate = INPUT_RATE) {
  const ratio = inRate / outRate;
  const outLength = Math.floor(float32.length / ratio);
  const out = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const s = Math.max(-1, Math.min(1, float32[Math.floor(i * ratio)] || 0));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function buildSettings(prompt) {
  return {
    type: 'Settings',
    audio: {
      input: { encoding: 'linear16', sample_rate: INPUT_RATE },
      output: { encoding: 'linear16', sample_rate: OUTPUT_RATE, container: 'none' },
    },
    agent: {
      listen: { provider: { type: 'deepgram', model: 'flux-general-en' } },
      think: {
        provider: { type: 'anthropic', model: 'claude-sonnet-4-6' },
        prompt,
      },
      speak: { provider: { type: 'deepgram', model: 'flux-alexis-en' } },
    },
  };
}

// Create a Voice Agent session controller.
//
// callbacks:
//   onState(state)         — 'listening' | 'thinking' | 'speaking'
//   onTranscript(role,text)— role 'user' | 'assistant'
//   onLevel(0..1)          — output amplitude for the orb visualizer
//   onOpen(), onError(err), onClose()
//
// Returns { start(), stop(), setMuted(bool) }.
export function createVoiceAgent({
  prompt,
  greeting,
  onState,
  onTranscript,
  onLevel,
  onOpen,
  onError,
  onClose,
} = {}) {
  if (!DG_KEY) throw new Error('Missing VITE_DEEPGRAM_API_KEY');

  const AudioCtx = window.AudioContext || window.webkitAudioContext;

  let ws = null;
  let closed = false;

  // --- Mic capture (input) -------------------------------------------------
  let micStream = null;
  let inputCtx = null;
  let micSource = null;
  let processor = null;

  // --- Playback (output) ---------------------------------------------------
  const outputCtx = new AudioCtx({ sampleRate: OUTPUT_RATE });
  const analyser = outputCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  const freqData = new Uint8Array(analyser.frequencyBinCount);
  let outConnected = false;
  const connectOut = () => {
    if (!outConnected) {
      analyser.connect(outputCtx.destination);
      outConnected = true;
    }
  };
  const disconnectOut = () => {
    if (outConnected) {
      try {
        analyser.disconnect();
      } catch {}
      outConnected = false;
    }
  };
  connectOut();

  const scheduled = new Set(); // live AudioBufferSourceNodes
  let nextStartTime = 0; // gapless scheduling cursor
  let carry = null; // odd byte spanning two binary frames
  let speaking = false;
  let agentAudioDone = false; // agent finished sending audio for this turn

  // Orb amplitude loop.
  let levelRaf = null;
  const startLevelLoop = () => {
    if (levelRaf || !onLevel) return;
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

  const onPlaybackDrained = () => {
    speaking = false;
    stopLevelLoop();
    if (agentAudioDone) {
      agentAudioDone = false;
      onState?.('listening');
    }
  };

  const scheduleChunk = (arrayBuffer) => {
    if (closed) return;
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

    const samples = bytes.length / 2;
    const buffer = outputCtx.createBuffer(1, samples, OUTPUT_RATE);
    const f32 = new Float32Array(samples);
    const i16 = new Int16Array(bytes.buffer, bytes.byteOffset, samples);
    for (let i = 0; i < samples; i++) f32[i] = i16[i] / 32768;
    buffer.copyToChannel(f32, 0);

    const src = outputCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(analyser);
    const startAt = Math.max(outputCtx.currentTime, nextStartTime);
    src.start(startAt);
    nextStartTime = startAt + buffer.duration;
    scheduled.add(src);

    if (!speaking) {
      speaking = true;
      onState?.('speaking');
      startLevelLoop();
    }
    src.onended = () => {
      scheduled.delete(src);
      if (scheduled.size === 0) onPlaybackDrained();
    };
  };

  // Barge-in: the agent detected the user speaking — drop any buffered audio.
  const flushPlayback = () => {
    scheduled.forEach((s) => {
      try {
        s.stop();
      } catch {}
      try {
        s.disconnect();
      } catch {}
    });
    scheduled.clear();
    nextStartTime = 0;
    carry = null;
    speaking = false;
    agentAudioDone = false;
    stopLevelLoop();
  };

  // --- Message handling ----------------------------------------------------
  const handleMessage = (msg) => {
    switch (msg.type) {
      case 'SettingsApplied':
        // Inject the opening line once the agent is configured.
        if (greeting && ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'InjectAgentMessage', message: greeting }));
        }
        onState?.('listening');
        break;
      case 'ConversationText':
        if (msg.content) onTranscript?.(msg.role || 'assistant', msg.content);
        break;
      case 'UserStartedSpeaking':
        flushPlayback(); // native interruption — stop talking over the user
        onState?.('listening');
        break;
      case 'AgentThinking':
      case 'AgentStartedThinking':
        onState?.('thinking');
        break;
      case 'AgentStartedSpeaking':
        onState?.('speaking');
        break;
      case 'AgentAudioDone':
        agentAudioDone = true;
        if (scheduled.size === 0) onPlaybackDrained();
        break;
      case 'Error':
        onError?.(new Error(msg.description || msg.message || 'Agent error'));
        break;
      default:
        break; // Welcome, PromptUpdated, Warning, etc.
    }
  };

  // --- Mic setup -----------------------------------------------------------
  const startMic = async () => {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
    inputCtx = new AudioCtx({ sampleRate: INPUT_RATE });
    micSource = inputCtx.createMediaStreamSource(micStream);
    processor = inputCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      if (closed || !ws || ws.readyState !== WebSocket.OPEN) return;
      const pcm = floatTo16BitPCM(e.inputBuffer.getChannelData(0), inputCtx.sampleRate);
      ws.send(pcm.buffer);
    };
    micSource.connect(processor);
    processor.connect(inputCtx.destination);
  };

  return {
    async start() {
      try {
        if (outputCtx.state === 'suspended') await outputCtx.resume();
      } catch {}

      ws = new WebSocket(AGENT_URL, ['token', DG_KEY]);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        ws.send(JSON.stringify(buildSettings(prompt)));
        onOpen?.();
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
          handleMessage(msg);
        } else {
          scheduleChunk(evt.data); // binary = agent audio
        }
      };
      ws.onerror = (e) => {
        if (!closed) onError?.(e);
      };
      ws.onclose = () => {
        if (!closed) onClose?.();
      };

      await startMic();
    },

    setMuted(muted) {
      if (muted) disconnectOut();
      else connectOut();
    },

    stop() {
      if (closed) return;
      closed = true;
      flushPlayback();
      stopLevelLoop();
      try {
        ws?.close();
      } catch {}
      // Tear down mic.
      try {
        processor?.disconnect();
      } catch {}
      try {
        micSource?.disconnect();
      } catch {}
      micStream?.getTracks().forEach((t) => t.stop());
      inputCtx?.close().catch(() => {});
      outputCtx.close().catch(() => {});
    },
  };
}
