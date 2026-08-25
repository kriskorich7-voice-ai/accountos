import { useState, useRef, useEffect, useCallback } from 'react';
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

// Status labels keyed by orb state.
const STATUS_LABEL = {
  idle: 'Click to speak with AccountOS',
  connecting: 'Connecting…',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'AccountOS is speaking…',
  error: 'Something went wrong. Click to try again.',
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

export default function Copilot() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | connecting | listening | thinking | speaking | error
  const [sessionActive, setSessionActive] = useState(false);

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

  const failToError = useCallback(() => {
    agentRef.current?.stop();
    agentRef.current = null;
    levelRef.current = 0;
    setSessionActive(false);
    setStatus('error');
  }, []);

  // --- Deepgram Voice Agent session (connection logic unchanged) -----------
  const startSession = useCallback(async () => {
    if (!hasDeepgram) {
      setStatus('error');
      return;
    }
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
        onError: () => failToError(),
        onClose: () => {},
      });
      await agent.start();
      agentRef.current = agent;
    } catch {
      failToError();
    }
  }, [addTranscript, failToError]);

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

  const startFromChip = useCallback(() => {
    if (!sessionActive) startSession();
  }, [sessionActive, startSession]);

  const showTranscript = messages.length > 0;
  const showChips = !sessionActive && messages.length === 0;

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

        {/* Orb — click to start / stop */}
        <button
          type="button"
          onClick={toggleSession}
          aria-label={sessionActive ? 'Stop conversation' : 'Start conversation'}
          className="group mt-8 rounded-full outline-none transition-transform focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 active:scale-95"
        >
          <AnimatedOrb status={status} getLevel={() => levelRef.current} />
        </button>

        {/* Status */}
        <div
          className={`mt-5 min-h-[24px] text-center text-sm font-medium ${
            status === 'error' ? 'text-rose-500' : 'text-slate-600'
          }`}
        >
          {STATUS_LABEL[status] || STATUS_LABEL.idle}
        </div>

        {/* Suggested questions — before a conversation starts */}
        {showChips && (
          <div className="mt-7 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                onClick={startFromChip}
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
            className="mt-7 w-full max-w-xl space-y-3 overflow-y-auto px-1"
            style={{ maxHeight: 250 }}
          >
            {messages.map((m, i) => (
              <Bubble key={i} msg={m} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pb-6 text-center text-[11px] text-slate-400">
        Powered by Deepgram Voice Agent API · Claude Sonnet 4.6
      </div>
    </div>
  );
}
