import { useState, useRef, useEffect, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { createVoiceAgent, hasDeepgram } from '../lib/deepgram.js';
import AnimatedOrb from '../components/AnimatedOrb.jsx';

// System prompt + opening line for the Deepgram Voice Agent (Claude Sonnet 4.6).
// Numbers are spelled out so Flux TTS reads them naturally.
const AGENT_PROMPT =
  'You are AccountOS, an AI strategic account intelligence copilot for Kris Korich, a Strategic Account Manager at Deepgram. You have deep knowledge of the Acme Corporation account. Key facts: $2.4M ARR, 87 health score out of 100, 18 percent usage growth year over year, projected capacity exhaustion in 47 days, 3 expansion opportunities: Conversational AI worth 780 thousand to 1.2 million dollars, Sales Voice worth 250 to 400 thousand dollars, Marketing worth 180 to 300 thousand dollars. Business unit adoption: Customer Service 92 percent, Training 76 percent, Sales 34 percent, Operations 18 percent, Marketing 4 percent, Digital Experience 0 percent. Key contacts: Sarah Mitchell VP of Customer Experience, Daniel Rodriguez Director of AI Platforms. Answer questions about the account strategically and concisely. Be direct and actionable. Never use markdown formatting, asterisks, or bullet points in your responses — speak in natural sentences only. When mentioning numbers, say them as words: say eighty-seven not 87, say eighteen percent not 18%, say 2.4 million not $2.4M.';

const GREETING =
  "Hello Kris, I'm AccountOS, your AI account copilot for Acme Corporation. What would you like to know?";

const ELEVENLABS_AGENT_ID = 'agent_0701m0zs4m0he9gsy3csgqayceyx';

const SUGGESTIONS = [
  'Why is this account healthy?',
  'What should I do next?',
  'Where is the biggest expansion opportunity?',
  "Which business units aren't using Deepgram?",
  'Prepare me for my next meeting',
  'What are the biggest risks?',
];

const STATUS_LABEL = {
  idle: 'Click to speak with AccountOS',
  connecting: 'Connecting…',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'AccountOS is speaking…',
  error: 'Something went wrong. Click to try again.',
};

const PROVIDER_LABEL = {
  deepgram: 'Powered by Deepgram Voice Agent · Flux STT · Flux TTS',
  elevenlabs: 'Powered by ElevenLabs Conversational AI',
};

function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-slate-800 text-white'
            : 'rounded-bl-sm bg-white text-slate-700 ring-1 ring-inset ring-slate-200'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function ProviderPill({ id, label, letter, active, disabled, activeCls, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(id)}
      title={disabled ? 'End conversation first' : `Use ${label}`}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
        active ? activeCls : 'bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:text-slate-700'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold ${
          active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {letter}
      </span>
      {label}
    </button>
  );
}

export default function Copilot() {
  const [provider, setProvider] = useState('deepgram'); // 'deepgram' | 'elevenlabs'
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle|connecting|listening|thinking|speaking|error

  const scrollRef = useRef(null);
  const agentRef = useRef(null); // Deepgram Voice Agent controller
  const levelRef = useRef(0); // Deepgram output amplitude for the orb

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  // Append a transcript line, de-duping an identical consecutive entry.
  const addTranscript = useCallback((role, content) => {
    if (!content) return;
    setMessages((m) => {
      const last = m[m.length - 1];
      if (last && last.role === role && last.content === content) return m;
      return [...m, { role, content }];
    });
  }, []);

  // --- ElevenLabs Conversational AI (hook must be called unconditionally) ---
  const elevenLabs = useConversation({
    onConnect: () => setStatus('listening'),
    onDisconnect: () => setStatus('idle'),
    onError: (error) => {
      console.error(error);
      setStatus('error');
    },
    onModeChange: (mode) => {
      if (mode?.mode === 'speaking') setStatus('speaking');
      if (mode?.mode === 'listening') setStatus('listening');
    },
    onMessage: (m) => {
      if (m?.message) addTranscript(m.source === 'user' ? 'user' : 'assistant', m.message);
    },
  });

  // Hold the latest conversation handle so the unmount cleanup reads it fresh.
  const elevenRef = useRef(elevenLabs);
  elevenRef.current = elevenLabs;

  // Cleanup on unmount — end any active sessions so leaving the page never
  // crashes. endSession() returns void (not a promise), so guard it in try/catch.
  useEffect(() => {
    return () => {
      try {
        if (elevenRef.current?.status === 'connected') elevenRef.current.endSession();
      } catch {
        // ignore cleanup errors
      }
      try {
        // createVoiceAgent().stop() closes the Deepgram WebSocket, stops the mic
        // tracks, and closes both AudioContexts internally.
        agentRef.current?.stop();
        agentRef.current = null;
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  const failToError = useCallback(() => {
    agentRef.current?.stop();
    agentRef.current = null;
    levelRef.current = 0;
    setStatus('error');
  }, []);

  // --- Deepgram Voice Agent (existing logic, unchanged) --------------------
  const startDeepgramSession = useCallback(async () => {
    if (!hasDeepgram) {
      setStatus('error');
      return;
    }
    setStatus('connecting');
    try {
      const agent = createVoiceAgent({
        prompt: AGENT_PROMPT,
        greeting: GREETING,
        onState: (st) => setStatus(st),
        onTranscript: (role, content) => addTranscript(role, content),
        onLevel: (v) => {
          levelRef.current = v;
        },
        onError: () => failToError(),
        onClose: () => {},
      });
      await agent.start();
      agentRef.current = agent;
    } catch {
      failToError();
    }
  }, [addTranscript, failToError]);

  const stopDeepgramSession = useCallback(() => {
    agentRef.current?.stop();
    agentRef.current = null;
    levelRef.current = 0;
    setStatus('idle');
  }, []);

  // --- ElevenLabs session control -----------------------------------------
  const startElevenLabsSession = useCallback(async () => {
    setStatus('connecting');
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await elevenLabs.startSession({ agentId: ELEVENLABS_AGENT_ID, connectionType: 'webrtc' });
      // onConnect switches status to 'listening'.
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  }, [elevenLabs]);

  // --- Orb click routes to the active provider ----------------------------
  const handleOrbClick = useCallback(async () => {
    if (status === 'idle' || status === 'error') {
      if (provider === 'deepgram') startDeepgramSession();
      else startElevenLabsSession();
    } else if (provider === 'deepgram') {
      stopDeepgramSession();
    } else {
      await elevenLabs.endSession();
      setStatus('idle');
    }
  }, [status, provider, startDeepgramSession, startElevenLabsSession, stopDeepgramSession, elevenLabs]);

  const busy = status !== 'idle' && status !== 'error';

  // Switching providers resets everything cleanly.
  const changeProvider = useCallback(
    (p) => {
      if (busy || p === provider) return; // toggle only when no session is active
      agentRef.current?.stop();
      agentRef.current = null;
      levelRef.current = 0;
      setMessages([]);
      setStatus('idle');
      setProvider(p);
    },
    [busy, provider],
  );

  const showTranscript = messages.length > 0;
  const showChips = !busy && messages.length === 0;

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-white to-slate-50">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        {/* Label + subtitle */}
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Ask AccountOS
          </div>
          <div className="mt-1.5 text-sm text-slate-500">Your AI strategic account copilot</div>
        </div>

        {/* Provider toggle */}
        <div className="mt-6 flex items-center gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Voice Provider
          </span>
          <div className="flex items-center gap-1.5">
            <ProviderPill
              id="deepgram"
              label="Deepgram"
              letter="D"
              active={provider === 'deepgram'}
              disabled={busy}
              activeCls="bg-brand-600 text-white shadow-sm shadow-brand-600/30"
              onClick={changeProvider}
            />
            <ProviderPill
              id="elevenlabs"
              label="ElevenLabs"
              letter="E"
              active={provider === 'elevenlabs'}
              disabled={busy}
              activeCls="bg-amber-500 text-white shadow-sm shadow-amber-500/30"
              onClick={changeProvider}
            />
          </div>
        </div>

        {/* Orb — click to start / stop the active provider */}
        <button
          type="button"
          onClick={handleOrbClick}
          aria-label={busy ? 'Stop conversation' : 'Start conversation'}
          className="group mt-7 rounded-full outline-none transition-transform focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 active:scale-95"
        >
          <AnimatedOrb
            status={status}
            getLevel={() => levelRef.current}
            breathe={provider === 'elevenlabs'}
          />
        </button>

        {/* Status */}
        <div
          className={`mt-5 min-h-[24px] text-center text-sm font-medium ${
            status === 'error' ? 'text-rose-500' : 'text-slate-600'
          }`}
        >
          {STATUS_LABEL[status] || STATUS_LABEL.idle}
        </div>

        {/* Provider label */}
        <div className="mt-1 text-center text-[11px] text-slate-400">{PROVIDER_LABEL[provider]}</div>

        {/* Suggested questions — before a conversation starts */}
        {showChips && (
          <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                onClick={handleOrbClick}
                className="group rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-cardhover"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Transcript — replaces chips once the conversation begins */}
        {showTranscript && (
          <div
            ref={scrollRef}
            className="mt-6 w-full max-w-xl space-y-3 overflow-y-auto px-1"
            style={{ maxHeight: 250 }}
          >
            {messages.map((m, i) => (
              <Bubble key={i} msg={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
