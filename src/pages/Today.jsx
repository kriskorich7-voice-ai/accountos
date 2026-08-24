import { useState } from 'react';
import {
  Clock,
  Users,
  Target,
  ListChecks,
  HelpCircle,
  Activity,
  Radio,
  CalendarDays,
  FileText,
  PenLine,
} from 'lucide-react';
import { meetings } from '../data/meetings.js';
import { PageHeader, SectionTitle, Button, Modal, Toast } from '../components/ui.jsx';

const typeBadge = (type) => {
  if (type === 'Internal') return 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200';
  if (type === 'Quarterly Business Review')
    return 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200';
  if (type === 'Discovery Call')
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
  return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200';
};

function initials(name) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2);
}

function MeetingCard({ m, onPrep, onLog }) {
  return (
    <div className="card flex flex-col gap-4 p-5 transition-shadow hover:shadow-cardhover sm:flex-row sm:items-center">
      {/* Time rail */}
      <div className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 px-4 py-3 sm:w-28">
        <div className="text-lg font-bold text-slate-900">{m.time}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
          <Clock size={11} /> {m.duration}
        </div>
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{m.title}</h3>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeBadge(m.type)}`}>
            {m.type}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {m.attendees.map((a) => (
            <div key={a.name} className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                {initials(a.name)}
              </div>
              <span className="text-xs text-slate-600">
                <span className="font-medium text-slate-800">{a.name}</span> · {a.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" size="sm" onClick={() => onPrep(m)}>
          <FileText size={14} /> Prep for Meeting
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onLog(m)}>
          <PenLine size={14} /> Log Notes
        </Button>
      </div>
    </div>
  );
}

function PrepSection({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon size={14} /> {title}
      </div>
      {children}
    </div>
  );
}

export default function Today() {
  const [prep, setPrep] = useState(null);
  const [log, setLog] = useState(null);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');

  const openLog = (m) => {
    setNotes('');
    setLog(m);
  };

  const syncNotes = () => {
    setLog(null);
    setToast('Notes synced to Avoma and pushed to Salesforce CRM');
  };

  return (
    <div className="mx-auto max-w-5xl px-8 py-8 animate-fade-in">
      <PageHeader
        eyebrow="Today"
        title="Today's Meetings"
        subtitle="Monday · 4 meetings · Kris Korich"
        actions={
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
            <CalendarDays size={14} className="text-brand-500" /> Google Calendar
          </span>
        }
      />
      <SectionTitle icon={Clock} title="Schedule" hint="Local time" />
      <div className="grid gap-3">
        {meetings.map((m) => (
          <MeetingCard key={m.id} m={m} onPrep={setPrep} onLog={openLog} />
        ))}
      </div>

      {/* Prep modal */}
      <Modal
        open={!!prep}
        onClose={() => setPrep(null)}
        icon={Target}
        subtitle={prep ? `${prep.time} · ${prep.type}` : ''}
        title={prep?.title}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPrep(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setPrep(null);
                setToast('Prep brief saved to your meeting notes.');
              }}
            >
              Save Prep Brief
            </Button>
          </div>
        }
      >
        {prep && (
          <div className="space-y-5">
            <PrepSection icon={Target} title="Meeting Objective">
              <p className="text-sm leading-relaxed text-slate-700">{prep.prep.objective}</p>
            </PrepSection>

            <PrepSection icon={ListChecks} title="Key Topics to Cover">
              <ul className="space-y-2">
                {prep.prep.topics.map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </PrepSection>

            <PrepSection icon={Activity} title="Account Context">
              <div className="grid gap-2 sm:grid-cols-3">
                {prep.prep.context.map((c, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {c}
                  </div>
                ))}
              </div>
            </PrepSection>

            <PrepSection icon={HelpCircle} title="Suggested Questions">
              <ol className="space-y-2.5">
                {prep.prep.questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                      {i + 1}
                    </span>
                    {q}
                  </li>
                ))}
              </ol>
            </PrepSection>

            <PrepSection icon={Radio} title="Recent Email & Slack Signals">
              <ul className="space-y-2">
                {prep.prep.signals.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </PrepSection>
          </div>
        )}
      </Modal>

      {/* Log notes modal */}
      <Modal
        open={!!log}
        onClose={() => setLog(null)}
        icon={PenLine}
        subtitle={log ? log.title : ''}
        title="Log Meeting Notes"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setLog(null)}>
              Cancel
            </Button>
            <Button onClick={syncNotes} disabled={!notes.trim()}>
              Sync to Avoma &amp; Salesforce
            </Button>
          </div>
        }
      >
        {log && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users size={14} /> {log.attendees.map((a) => a.name).join(', ')}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={9}
              autoFocus
              placeholder="Capture key discussion points, decisions, and follow-ups…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <p className="text-[11px] text-slate-400">
              Notes will be transcribed into Avoma and logged to the Salesforce account record.
            </p>
          </div>
        )}
      </Modal>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
