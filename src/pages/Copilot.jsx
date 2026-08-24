import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, Mic, Square, Volume2, VolumeX, User } from 'lucide-react';
import { askClaude, localAnswer } from '../lib/copilot.js';
import { transcribeAudio, synthesizeSpeech, hasDeepgram } from '../lib/deepgram.js';
import { Button } from '../components/ui.jsx';

const SUGGESTIONS = [
  'Why is this account healthy?',
  'What should I do next?',
  'Where is the biggest expansion opportunity?',
  "Which business units aren't using Deepgram?",
  'Prepare me for my next meeting',
  'What are the biggest risks?',
];

const STATUS = {
  idle: { label: 'Ready', dot: 'bg-slate-300' },
  listening: { label: 'Listening', dot: 'bg-rose-500' },
  thinking: { label: 'Thinking', dot: 'bg-amber-500' },
  speaking: { label: 'Speaking', dot: 'bg-emerald-500' },
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
  const [busy, setBusy] = useState(false);

  const scrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  const speak = useCallback(async (text) => {
    if (mutedRef.current || !hasDeepgram) return;
    try {
      setStatus('speaking');
      const url = await synthesizeSpeech(text);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setStatus('idle');
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => setStatus('idle');
      await audio.play();
    } catch {
      setStatus('idle');
    }
  }, []);

  const submit = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setInput('');
      setBusy(true);
      const history = messages;
      setMessages((m) => [...m, { role: 'user', content: trimmed }]);
      setStatus('thinking');

      let reply;
      try {
        reply = await askClaude(history, trimmed);
      } catch {
        // Proxy/API unavailable — fall back to the local knowledge base.
        reply = localAnswer(trimmed);
      }

      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
      setBusy(false);
      await speak(reply);
      setStatus((s) => (s === 'speaking' ? s : 'idle'));
    },
    [messages, busy, speak],
  );

  const startRecording = useCallback(async () => {
    if (audioRef.current) audioRef.current.pause();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setStatus('thinking');
        try {
          const transcript = await transcribeAudio(blob);
          if (transcript) submit(transcript);
          else setStatus('idle');
        } catch {
          setStatus('idle');
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setStatus('listening');
    } catch {
      setStatus('idle');
    }
  }, [submit]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop();
  }, []);

  const toggleMic = () => (status === 'listening' ? stopRecording() : startRecording());
  const empty = messages.length === 0;

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
            onClick={() => setMuted((m) => !m)}
            title={muted ? 'Unmute voice' : 'Mute voice'}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-3xl">
          {empty ? (
            <div className="flex flex-col items-center justify-center pt-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
                <Sparkles size={26} />
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-900">
                What can I tell you about Acme?
              </h2>
              <p className="mt-1.5 max-w-md text-sm text-slate-500">
                Ask about account health, expansion, risks, or use the mic for a voice conversation.
                {!hasDeepgram && ' (Set VITE_DEEPGRAM_API_KEY to enable voice.)'}
              </p>
              <div className="mt-7 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="group rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-cardhover"
                  >
                    <span className="font-medium group-hover:text-brand-700">{s}</span>
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
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 bg-white px-8 py-4">
        <div className="mx-auto max-w-3xl">
          {!empty && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  disabled={busy}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
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
              onClick={toggleMic}
              disabled={busy && status !== 'listening'}
              title={hasDeepgram ? 'Voice input' : 'Set VITE_DEEPGRAM_API_KEY to enable voice'}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-50 ${
                status === 'listening'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/40'
                  : 'bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:text-brand-600 hover:ring-brand-300'
              }`}
            >
              {status === 'listening' ? <Square size={16} /> : <Mic size={18} />}
            </button>
            <Button type="submit" size="lg" disabled={!input.trim() || busy} className="h-10">
              <Send size={16} />
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            AccountOS Copilot · Claude Sonnet 4.6 · Deepgram Aura-2 voice
          </p>
        </div>
      </div>
    </div>
  );
}
