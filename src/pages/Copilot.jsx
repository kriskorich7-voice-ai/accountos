import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Volume2, VolumeX, User, Mic } from 'lucide-react';
import { createVoiceAgent, hasDeepgram } from '../lib/deepgram.js';
import AnimatedOrb from '../components/AnimatedOrb.jsx';

// System prompt + opening line for the Voice Agent (Claude Sonnet 4.6). Numbers
// are spelled out so Flux TTS reads them naturally.
const AGENT_PROMPT =
  'You are AccountOS, an AI strategic account intelligence copilot for Kris Korich, a Strategic Account Manager at Deepgram. You have deep knowledge of the Acme Corporation account. Key facts: $2.4M ARR, 87 health score out of 100, 18 percent usage growth year over year, projected capacity exhaustion in 47 days, 3 expansion opportunities: Conversational AI worth 780 thousand to 1.2 million dollars, Sales Voice worth 250 to 400 thousand dollars, Marketing worth 180 to 300 thousand dollars. Business unit adoption: Customer Service 92 percent, Training 76 percent, Sales 34 percent, Operations 18 percent, Marketing 4 percent, Digital Experience 0 percent. Key contacts: Sarah Mitchell VP of Customer Experience, Daniel Rodriguez Director of AI Platforms. Answer questions about the account strategically and concisely. Be direct and actionable. Never use markdown formatting, asterisks, or bullet points in your responses — speak in natural sentences only. When mentioning numbers, say them as words: say eighty-seven not 87, say eighteen percent not 18%, say 2.4 million not $2.4M.';

const GREETING =
  "Hello Kris, I'm AccountOS, your AI account copilot for Acme Corporation. What would you like to know?";

const SUGGESTIONS = [
  'Why is this account healthy?',
  'What should I do next?',
  'Where is the biggest expansion opportunity?',
  "Which business units aren't using Deepgram?",
  'Prepare me for my next meeting',
  'What are the biggest risks?',
];

const STATUS = {
  idle: { label: 'Ready' },
  connecting: { label: 'Connecting…' },
  listening: { label: 'Listening…' },
  thinking: { label: 'Thinking…' },
  speaking: { label: 'Speaking…' },
};

function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser ? 'bg-slate-200 text-slate-600' : 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
        }`}
      >
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-slate-800 text-white'
            : 'rounded-tl-sm bg-white text-slate-700 ring-1 ring-inset ring-slate-200'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default function Copilot() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle when no session
  const [sessionActive, setSessionActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');

  const scrollRef = useRef(null);
  const agentRef = useRef(null);
  const levelRef = useRef(0); // output amplitude for the orb

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  useEffect(() => {
    return () => agentRef.current?.stop();
  }, []);

  // Append a transcript line, de-duping an identical consecutive entry.
  const addTranscript = useCallback((role, content) => {
    setMessages((m) => {
      const last = m[m.length - 1];
      if (last && last.role === role && last.content === content) return m;
      return [...m, { role, content }];
    });
  }, []);

  const startSession = useCallback(async () => {
    if (!hasDeepgram) {
      setError('Set VITE_DEEPGRAM_API_KEY to enable the voice agent.');
      return;
    }
    setError('');
    setSessionActive(true);
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
        onError: () => setError('Voice agent connection error. Please try again.'),
        onClose: () => {},
      });
      agent.setMuted(muted);
      await agent.start();
      agentRef.current = agent;
    } catch {
      setSessionActive(false);
      setStatus('idle');
      setError('Could not start the voice agent. Check your microphone permission.');
    }
  }, [addTranscript, muted]);

  const endSession = useCallback(() => {
    agentRef.current?.stop();
    agentRef.current = null;
    levelRef.current = 0;
    setSessionActive(false);
    setStatus('idle');
  }, []);

  const toggleSession = useCallback(() => {
    if (sessionActive) endSession();
    else startSession();
  }, [sessionActive, startSession, endSession]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      agentRef.current?.setMuted(next);
      return next;
    });
  };

  const empty = messages.length === 0;
  const s = STATUS[status] || STATUS.idle;

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-white to-slate-50">
      {/* Slim header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Ask AccountOS</h1>
            <p className="text-xs text-slate-500">Your AI strategic account copilot · Deepgram Voice Agent</p>
          </div>
        </div>
        <button
          onClick={toggleMute}
          title={muted ? 'Unmute agent' : 'Mute agent'}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Centerpiece: orb + status, with suggestions or transcript below */}
      <div className="flex flex-1 flex-col items-center overflow-hidden px-6 py-6">
        <div className={`flex shrink-0 flex-col items-center gap-4 ${empty ? 'my-auto' : 'pt-4'}`}>
          {/* Orb is the sole session control */}
          <button
            type="button"
            onClick={toggleSession}
            aria-label={sessionActive ? 'Stop conversation' : 'Start conversation'}
            className="group rounded-full outline-none transition-transform focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 active:scale-95"
          >
            <AnimatedOrb
              status={status === 'connecting' ? 'thinking' : status}
              getLevel={() => levelRef.current}
            />
          </button>
          <div className="text-center">
            <div className="text-base font-semibold text-slate-800">{s.label}</div>
            <div className="mt-1 min-h-[18px] text-sm text-slate-400">
              {sessionActive ? 'Click orb to stop' : 'Click orb to start'}
            </div>
            {error && <div className="mt-1 text-xs font-medium text-rose-500">{error}</div>}
          </div>

          {/* Suggested prompts — shown before a conversation begins */}
          {empty && (
            <div className="mt-2 w-full max-w-xl">
              <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Try asking out loud
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={toggleSession}
                    className="group rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-cardhover"
                  >
                    <span className="flex items-center gap-2 font-medium group-hover:text-brand-700">
                      <Mic size={13} className="text-slate-300 group-hover:text-brand-400" />
                      {q}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transcript */}
        {!empty && (
          <div
            ref={scrollRef}
            className="mt-6 w-full max-w-2xl space-y-4 overflow-y-auto px-1"
            style={{ maxHeight: 340 }}
          >
            {messages.map((m, i) => (
              <Bubble key={i} msg={m} />
            ))}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="border-t border-slate-200 bg-white px-8 py-3">
        <p className="text-center text-[11px] text-slate-400">
          {sessionActive
            ? 'Live voice session — speak naturally, the agent handles turns and interruptions'
            : 'Deepgram Voice Agent · Flux STT + Claude Sonnet 4.6 + Flux TTS · one real-time connection'}
        </p>
      </div>
    </div>
  );
}
