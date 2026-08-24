import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, Mic, MicOff, Volume2, VolumeX, User } from 'lucide-react';
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
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [muted, setMuted] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const [dictating, setDictating] = useState(false);

  const scrollRef = useRef(null);
  const liveRef = useRef(null); // continuous session STT controller
  const dictRef = useRef(null); // separate dictation STT controller
  const dictBaseRef = useRef(''); // input text captured before dictation began
  const ttsRef = useRef(null); // active streaming-TTS controller
  const levelRef = useRef(0); // latest TTS amplitude (0..1) for the orb
  const speakResolveRef = useRef(null); // resolves the in-flight speak() promise
  const respondRef = useRef(null); // late-bound to break the init-order cycle

  // Live flags read inside async callbacks (avoid stale closures).
  const sessionRef = useRef(false);
  const thinkingRef = useRef(false); // awaiting Claude — ignore incoming finals
  const speakingRef = useRef(false); // TTS playing — a final means barge-in
  const interruptedRef = useRef(false); // user barged in over the current reply
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
      dictRef.current?.stop();
      ttsRef.current?.stop();
    };
  }, []);

  // Fully tear down TTS playback and resolve any pending speak() promise so the
  // awaiting respond() unblocks. Safe to call repeatedly.
  const cutSpeech = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.stop(); // closes WS, stops+disconnects all audio nodes
      ttsRef.current = null;
    }
    speakingRef.current = false;
    levelRef.current = 0;
    const resolve = speakResolveRef.current;
    speakResolveRef.current = null;
    resolve?.();
  }, []);

  // Speak text via a FRESH Flux TTS WebSocket (never reused). Resolves when
  // audio finishes naturally, or immediately when cut short / muted.
  const speak = useCallback((text) => {
    interruptedRef.current = false;
    return new Promise((resolve) => {
      if (mutedRef.current) {
        resolve();
        return;
      }
      speakResolveRef.current = resolve;
      speakingRef.current = true;
      const done = () => {
        speakingRef.current = false;
        levelRef.current = 0;
        ttsRef.current = null;
        if (speakResolveRef.current === resolve) {
          speakResolveRef.current = null;
          resolve();
        }
      };
      try {
        ttsRef.current = streamSpeech(text, {
          onStart: () => setStatus('speaking'),
          onLevel: (v) => {
            levelRef.current = v;
          },
          onEnd: done,
          onError: done,
        });
      } catch {
        done();
      }
    });
  }, []);

  // Core turn: user utterance → Claude → spoken reply. Only COMPLETE replies are
  // added to history; an interruption never poisons context.
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
        reply = await askClaude(history, trimmed); // full response, not streamed
      } catch {
        reply = localAnswer(trimmed);
      }
      thinkingRef.current = false;
      // The reply is complete before we speak it, so recording it here can never
      // store a partial/interrupted response.
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);

      await speak(reply);

      // If the user barged in, the new turn already owns the UI state — don't
      // stomp it. Otherwise loop back to listening (session) or go idle.
      if (interruptedRef.current) return;
      setStatus(sessionRef.current ? 'listening' : 'idle');
    },
    [speak],
  );
  respondRef.current = respond;

  // --- Session control (owned by the orb) ---------------------------------

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
          if (!thinkingRef.current && !speakingRef.current) setLiveTranscript(t);
        },
        onFinal: (t) => {
          const text = t.trim();
          if (!sessionRef.current || !text) return;
          if (thinkingRef.current) return; // waiting on Claude — never interrupt that
          if (speakingRef.current) {
            // Barge-in: ignore very short blips (likely residual echo), else
            // hard-stop TTS and process ONLY the new input.
            if (text.replace(/[^a-z0-9]/gi, '').length < 4) return;
            interruptedRef.current = true;
            cutSpeech();
          }
          respondRef.current?.(text);
        },
        onError: () => {},
        onClose: () => {
          if (sessionRef.current) setStatus((st) => (st === 'listening' ? 'idle' : st));
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
    interruptedRef.current = false;
    setLiveTranscript('');
    setStatus('idle');
  }, [cutSpeech]);

  const toggleSession = useCallback(() => {
    if (sessionRef.current) endConversation();
    else startConversation();
  }, [startConversation, endConversation]);

  // --- Dictation (owned by the mic button, independent of the session) -----

  const stopDictation = useCallback(() => {
    dictRef.current?.stop();
    dictRef.current = null;
    setDictating(false);
  }, []);

  const toggleDictation = useCallback(async () => {
    if (dictRef.current) {
      stopDictation();
      return;
    }
    dictBaseRef.current = input ? input.trim() + ' ' : '';
    setDictating(true);
    try {
      dictRef.current = await startLiveTranscription({
        onOpen: () => {},
        onPartial: (t) => setInput(dictBaseRef.current + t),
        onFinal: (t) => {
          dictBaseRef.current = (dictBaseRef.current + t).trim() + ' ';
          setInput(dictBaseRef.current);
        },
        onError: () => stopDictation(),
        onClose: () => setDictating(false),
      });
    } catch {
      setDictating(false);
      dictRef.current = null;
    }
  }, [input, stopDictation]);

  // Text / suggestion entry (works with or without an active voice session).
  const ask = useCallback(
    (text) => {
      if (thinkingRef.current) return;
      if (speakingRef.current) {
        interruptedRef.current = true;
        cutSpeech(); // typing interrupts speech too
      }
      respond(text);
    },
    [cutSpeech, respond],
  );

  const empty = messages.length === 0;
  const s = STATUS[status];

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
            <p className="text-xs text-slate-500">Your AI strategic account copilot</p>
          </div>
        </div>
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

      {/* Centerpiece: orb + status, with suggestions or transcript below */}
      <div className="flex flex-1 flex-col items-center overflow-hidden px-6 py-6">
        <div className={`flex shrink-0 flex-col items-center gap-4 ${empty ? 'my-auto' : 'pt-4'}`}>
          {/* Orb is the primary conversation control — click to start/stop */}
          <button
            type="button"
            onClick={toggleSession}
            aria-label={sessionActive ? 'Stop conversation' : 'Start conversation'}
            className="group rounded-full outline-none transition-transform focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 active:scale-95"
          >
            <AnimatedOrb status={status} getLevel={() => levelRef.current} />
          </button>
          <div className="text-center">
            <div className="text-base font-semibold text-slate-800">{s.label}</div>
            <div className="mt-1 min-h-[18px] max-w-sm text-sm text-slate-400">
              {status === 'listening' && liveTranscript
                ? liveTranscript
                : sessionActive
                  ? 'Click orb to stop'
                  : 'Click orb to start'}
            </div>
          </div>

          {/* Suggested prompts — initial load only */}
          {empty && (
            <div className="mt-2 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
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
          )}
        </div>

        {/* Transcript — replaces suggestions once a conversation starts */}
        {!empty && (
          <div
            ref={scrollRef}
            className="mt-6 w-full max-w-2xl space-y-4 overflow-y-auto px-1"
            style={{ maxHeight: 300 }}
          >
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
            {status === 'listening' && liveTranscript && (
              <div className="flex justify-end animate-fade-in">
                <div className="flex items-center gap-2 rounded-2xl rounded-tr-sm bg-slate-800/90 px-4 py-2.5 text-sm text-white">
                  <Mic size={14} className="text-emerald-400" />
                  {liveTranscript}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar: input · mic (continuous toggle) · send */}
      <div className="border-t border-slate-200 bg-white px-8 py-4">
        <div className="mx-auto max-w-2xl">
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
            <button
              type="button"
              onClick={toggleDictation}
              title="Dictate"
              className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                dictating
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/40 hover:bg-brand-700'
                  : 'bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:text-brand-600 hover:ring-brand-300'
              }`}
            >
              {dictating && (
                <span className="absolute inset-0 animate-pulse-ring rounded-xl bg-brand-500/40" />
              )}
              {dictating ? <MicOff size={17} /> : <Mic size={18} />}
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {dictating ? 'Stop dictation' : 'Dictate'}
              </span>
            </button>
            <Button type="submit" size="lg" disabled={!input.trim()} className="h-10">
              <Send size={16} />
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            {sessionActive
              ? 'Conversation active — click the orb to stop · mic dictates into the box'
              : dictating
                ? 'Dictating… speak, then click the mic to stop'
                : 'Click the orb for hands-free voice · mic to dictate · or type'}
          </p>
        </div>
      </div>
    </div>
  );
}
