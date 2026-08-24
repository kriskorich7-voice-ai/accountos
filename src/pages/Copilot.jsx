import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, Mic, PhoneOff, Volume2, VolumeX, User } from 'lucide-react';
import { askClaude, localAnswer } from '../lib/copilot.js';
import { startLiveTranscription, streamSpeech } from '../lib/deepgram.js';
import { Button } from '../components/ui.jsx';
import AnimatedOrb from '../components/AnimatedOrb.jsx';

const SUGGESTIONS = [
  'Why is this account healthy?',
  'What should I do next?',
  'Where is the biggest expansion opportunity?',
  "Which business units aren't using Deepgram?",
  'Prepare me for my next meeting',
  'What are the biggest risks?',
];

const STATUS = {
  idle: { label: 'Ready', hint: 'Start a conversation or type below', dot: 'bg-slate-300' },
  listening: { label: 'Listening…', hint: 'Speak now — I’m listening', dot: 'bg-emerald-500' },
  thinking: { label: 'Thinking…', hint: 'Analyzing the Acme account', dot: 'bg-amber-500' },
  speaking: { label: 'Speaking…', hint: 'Tap the mic or speak to interrupt', dot: 'bg-brand-500' },
};

function StatusPill({ status }) {
  const s = STATUS[status];
  const animate = status !== 'idle';
  return (
    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
      <span className="relative flex h-2 w-2">
        {animate && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dot} opacity-60`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      {s.label}
    </div>
  );
}

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
            ? 'rounded-tr-sm bg-brand-600 text-white'
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
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [muted, setMuted] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const scrollRef = useRef(null);
  const liveRef = useRef(null); // continuous STT controller
  const ttsRef = useRef(null); // active streaming-TTS controller
  const levelRef = useRef(0); // latest TTS amplitude (0..1) for the orb
  const respondRef = useRef(null); // late-bound to break the init-order cycle

  // Live flags read inside async callbacks (avoid stale closures).
  const sessionRef = useRef(false);
  const thinkingRef = useRef(false); // awaiting Claude — ignore incoming finals
  const speakingRef = useRef(false); // TTS playing — a final means barge-in
  const messagesRef = useRef(messages);
  const mutedRef = useRef(muted);
  messagesRef.current = messages;
  mutedRef.current = muted;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status, liveTranscript]);

  useEffect(() => {
    return () => {
      liveRef.current?.stop();
      ttsRef.current?.stop();
    };
  }, []);

  // Speak text via Flux TTS streaming. Resolves when audio finishes (or muted).
  const speak = useCallback(
    (text) =>
      new Promise((resolve) => {
        if (mutedRef.current) {
          resolve();
          return;
        }
        speakingRef.current = true;
        try {
          ttsRef.current = streamSpeech(text, {
            onStart: () => setStatus('speaking'),
            onLevel: (v) => {
              levelRef.current = v;
            },
            onEnd: () => {
              speakingRef.current = false;
              levelRef.current = 0;
              ttsRef.current = null;
              resolve();
            },
            onError: () => {
              speakingRef.current = false;
              levelRef.current = 0;
              ttsRef.current = null;
              resolve();
            },
          });
        } catch {
          speakingRef.current = false;
          resolve();
        }
      }),
    [],
  );

  // Core turn: user utterance → Claude → spoken reply → back to listening/idle.
  const respond = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || thinkingRef.current) return;
      thinkingRef.current = true;
      setInput('');
      setLiveTranscript('');
      const history = messagesRef.current;
      setMessages((m) => [...m, { role: 'user', content: trimmed }]);
      setStatus('thinking');

      let reply;
      try {
        reply = await askClaude(history, trimmed);
      } catch {
        reply = localAnswer(trimmed);
      }
      thinkingRef.current = false;
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);

      await speak(reply);
      // Continuous mode loops straight back to listening; otherwise idle.
      setStatus(sessionRef.current ? 'listening' : 'idle');
    },
    [speak],
  );
  respondRef.current = respond;

  // Stop any in-flight TTS immediately (barge-in / interruption).
  const cutSpeech = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.stop();
      ttsRef.current = null;
    }
    speakingRef.current = false;
    levelRef.current = 0;
  }, []);

  const startConversation = useCallback(async () => {
    sessionRef.current = true;
    setSessionActive(true);
    setLiveTranscript('');
    try {
      liveRef.current = await startLiveTranscription({
        onOpen: () => {
          if (!speakingRef.current && !thinkingRef.current) setStatus('listening');
        },
        onPartial: (t) => {
          if (!thinkingRef.current) setLiveTranscript(t);
        },
        onFinal: (t) => {
          const text = t.trim();
          if (!sessionRef.current || !text) return;
          if (thinkingRef.current) return; // still waiting on Claude — skip
          if (speakingRef.current) {
            // Barge-in: ignore tiny blips (likely residual echo), else interrupt.
            if (text.length < 3) return;
            cutSpeech();
          }
          respondRef.current?.(text);
        },
        onError: () => {},
        onClose: () => {
          if (sessionRef.current) setStatus((s) => (s === 'listening' ? 'idle' : s));
        },
      });
    } catch {
      sessionRef.current = false;
      setSessionActive(false);
      setStatus('idle');
    }
  }, [cutSpeech]);

  const endConversation = useCallback(() => {
    sessionRef.current = false;
    setSessionActive(false);
    liveRef.current?.stop();
    liveRef.current = null;
    cutSpeech();
    thinkingRef.current = false;
    setLiveTranscript('');
    setStatus('idle');
  }, [cutSpeech]);

  // Text / suggestion entry (works with or without an active voice session).
  const ask = useCallback(
    (text) => {
      if (thinkingRef.current) return;
      cutSpeech(); // typing interrupts speech too
      respond(text);
    },
    [cutSpeech, respond],
  );

  const empty = messages.length === 0;
  const s = STATUS[status];

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Ask AccountOS</h1>
            <p className="text-xs text-slate-500">Your AI strategic account copilot</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={status} />
          <button
            onClick={() => {
              if (!muted) cutSpeech();
              setMuted((m) => !m);
            }}
            title={muted ? 'Unmute voice' : 'Mute voice'}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Orb hero */}
      <div className="flex shrink-0 flex-col items-center gap-3 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/60 py-6">
        <AnimatedOrb status={status} getLevel={() => levelRef.current} />
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-800">{s.label}</div>
          <div className="mt-0.5 text-xs text-slate-400">
            {status === 'listening' && liveTranscript ? liveTranscript : s.hint}
          </div>
        </div>
        {sessionActive ? (
          <Button variant="secondary" onClick={endConversation} className="border-rose-200 text-rose-600 hover:bg-rose-50">
            <PhoneOff size={15} /> End Conversation
          </Button>
        ) : (
          <Button onClick={startConversation}>
            <Mic size={15} /> Start Conversation
          </Button>
        )}
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-3xl">
          {empty ? (
            <div className="flex flex-col items-center pt-2 text-center">
              <p className="max-w-md text-sm text-slate-500">
                Tap <span className="font-semibold text-slate-700">Start Conversation</span> for a
                hands-free voice session, or ask a question below.
              </p>
              <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="group rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-cardhover"
                  >
                    <span className="font-medium group-hover:text-brand-700">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((m, i) => (
                <Bubble key={i} msg={m} />
              ))}
              {status === 'thinking' && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <Sparkles size={16} />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 ring-1 ring-inset ring-slate-200">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* Live transcript while listening */}
              {status === 'listening' && liveTranscript && (
                <div className="flex justify-end animate-fade-in">
                  <div className="flex items-center gap-2 rounded-2xl rounded-tr-sm bg-brand-600/10 px-4 py-2.5 text-sm text-brand-800 ring-1 ring-inset ring-brand-200">
                    <Mic size={14} className="text-emerald-500" />
                    {liveTranscript}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 bg-white px-8 py-4">
        <div className="mx-auto max-w-3xl">
          {!empty && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  disabled={thinkingRef.current}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) ask(input);
            }}
            className="flex items-center gap-2"
          >
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Acme Corporation…"
                className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            {sessionActive ? (
              <button
                type="button"
                onClick={endConversation}
                title="End conversation"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm shadow-rose-500/40 transition-all hover:bg-rose-600"
              >
                <PhoneOff size={17} />
              </button>
            ) : (
              <button
                type="button"
                onClick={startConversation}
                title="Start voice conversation"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-inset ring-slate-200 transition-all hover:text-brand-600 hover:ring-brand-300"
              >
                <Mic size={18} />
              </button>
            )}
            <Button type="submit" size="lg" disabled={!input.trim()} className="h-10">
              <Send size={16} />
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            AccountOS Copilot · Claude Sonnet 4.6 · Deepgram Flux STT + Flux TTS voice
          </p>
        </div>
      </div>
    </div>
  );
}
