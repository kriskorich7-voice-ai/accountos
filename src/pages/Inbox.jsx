import { useState } from 'react';
import {
  Mail,
  Sparkles,
  Check,
  Copy,
  Lightbulb,
  Send,
  RotateCw,
} from 'lucide-react';
import { emails as seedEmails } from '../data/inbox.js';
import { draftEmailReply, localEmailReply } from '../lib/copilot.js';
import { priorityClasses } from '../lib/format.js';
import { PageHeader, SectionTitle, Button, Modal, Toast, Badge } from '../components/ui.jsx';

function initials(name) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2);
}

function EmailCard({ email, done, onReply, onDone }) {
  return (
    <div
      className={`card p-5 transition-all hover:shadow-cardhover ${
        done ? 'opacity-55' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-500">
          {initials(email.from)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-slate-900">{email.from}</span>
            <span className="text-xs text-slate-400">
              {email.title} · {email.company}
            </span>
            <span className="ml-auto text-[11px] text-slate-400">{email.time}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge className={priorityClasses(email.priority)}>{email.priority}</Badge>
            <span className={`text-sm font-semibold ${done ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
              {email.subject}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-slate-500">{email.preview}</p>

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-brand-50/60 px-3 py-2">
            <Lightbulb size={14} className="mt-0.5 shrink-0 text-brand-600" />
            <span className="text-xs text-slate-700">
              <span className="font-semibold text-brand-700">Suggested: </span>
              {email.suggestedAction}
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => onReply(email)} disabled={done}>
              <Sparkles size={14} /> Reply with AI
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDone(email.id)}>
              <Check size={14} /> {done ? 'Done' : 'Mark Done'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Inbox() {
  const [doneIds, setDoneIds] = useState(new Set());
  const [replyTo, setReplyTo] = useState(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');

  const openReply = async (email) => {
    setReplyTo(email);
    setCopied(false);
    setDraft('');
    setLoading(true);
    let text;
    try {
      text = await draftEmailReply(email);
    } catch {
      text = localEmailReply(email);
    }
    setDraft(text);
    setLoading(false);
  };

  const regenerate = () => replyTo && openReply(replyTo);

  const markDone = (id) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast('Copy unavailable in this environment.');
    }
  };

  const send = () => {
    if (replyTo) markDone(replyTo.id);
    setReplyTo(null);
    setToast('Reply sent via Gmail and logged to Salesforce.');
  };

  const outstanding = seedEmails.filter((e) => !doneIds.has(e.id)).length;

  return (
    <div className="mx-auto max-w-4xl px-8 py-8 animate-fade-in">
      <PageHeader
        eyebrow="Inbox"
        title="Inbox Triage"
        subtitle="AI-prioritized email from your accounts"
        actions={
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
            <Mail size={14} className="text-brand-500" /> {outstanding} to triage
          </span>
        }
      />
      <SectionTitle icon={Mail} title="Priority Inbox" hint="From Gmail" />
      <div className="grid gap-3">
        {seedEmails.map((e) => (
          <EmailCard
            key={e.id}
            email={e}
            done={doneIds.has(e.id)}
            onReply={openReply}
            onDone={markDone}
          />
        ))}
      </div>

      {/* AI reply modal */}
      <Modal
        open={!!replyTo}
        onClose={() => setReplyTo(null)}
        icon={Sparkles}
        subtitle={replyTo ? `Reply to ${replyTo.from}` : ''}
        title="AI-Drafted Reply"
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={regenerate} disabled={loading}>
              <RotateCw size={14} /> Regenerate
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={copyDraft} disabled={loading || !draft}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button onClick={send} disabled={loading || !draft}>
                <Send size={15} /> Send Reply
              </Button>
            </div>
          </div>
        }
      >
        {replyTo && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold text-slate-500">
                Re: {replyTo.subject}
              </div>
              <p className="mt-1 text-xs text-slate-500">{replyTo.preview}</p>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
                <span className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 animate-bounce rounded-full bg-brand-400"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </span>
                Claude is drafting a reply…
              </div>
            ) : (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={12}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            )}
            <p className="text-[11px] text-slate-400">
              Drafted by Claude Sonnet 4.6 · Review before sending.
            </p>
          </div>
        )}
      </Modal>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
