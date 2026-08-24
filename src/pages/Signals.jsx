import { useState } from 'react';
import { Radio, Hash, ArrowRight, Check, Zap, ListChecks } from 'lucide-react';
import { signals as seedSignals, signalStatusClasses } from '../data/signals.js';
import { priorityClasses } from '../lib/format.js';
import { PageHeader, SectionTitle, Button, Modal, Toast, Badge } from '../components/ui.jsx';

function SignalCard({ signal, resolved, onAction, onResolve }) {
  return (
    <div className={`card p-5 transition-all hover:shadow-cardhover ${resolved ? 'opacity-55' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            <Hash size={12} className="text-slate-400" />
            {signal.channel.replace('#', '')}
          </span>
          <span className="text-xs text-slate-400">{signal.company}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${signalStatusClasses[signal.status]}`}>
          {signal.status}
        </span>
      </div>

      <p className={`mt-3 text-sm ${resolved ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
        {signal.message}
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <Badge className={priorityClasses(signal.priority)}>{signal.priority}</Badge>
        <span className="text-slate-400">{signal.time}</span>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-brand-50/60 px-3 py-2">
        <ArrowRight size={14} className="mt-0.5 shrink-0 text-brand-600" />
        <span className="text-xs text-slate-700">
          <span className="font-semibold text-brand-700">Next step: </span>
          {signal.nextStep}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => onAction(signal)} disabled={resolved}>
          <Zap size={14} /> Take Action
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onResolve(signal.id)}>
          <Check size={14} /> {resolved ? 'Resolved' : 'Mark Resolved'}
        </Button>
      </div>
    </div>
  );
}

export default function Signals() {
  const [resolvedIds, setResolvedIds] = useState(new Set());
  const [active, setActive] = useState(null);
  const [toast, setToast] = useState('');

  const resolve = (id) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const createTask = () => {
    if (active) resolve(active.id);
    setActive(null);
    setToast('Follow-up task created and assigned to Kris Korich.');
  };

  const open = seedSignals.filter((s) => !resolvedIds.has(s.id)).length;

  return (
    <div className="mx-auto max-w-4xl px-8 py-8 animate-fade-in">
      <PageHeader
        eyebrow="Signals"
        title="Customer Slack Signals"
        subtitle="Real-time signals from shared customer channels"
        actions={
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
            <Radio size={14} className="text-brand-500" /> {open} open
          </span>
        }
      />
      <SectionTitle icon={Radio} title="Signal Feed" hint="From Slack" />
      <div className="grid gap-3 md:grid-cols-2">
        {seedSignals.map((s) => (
          <SignalCard
            key={s.id}
            signal={s}
            resolved={resolvedIds.has(s.id)}
            onAction={setActive}
            onResolve={resolve}
          />
        ))}
      </div>

      {/* Take action modal */}
      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        icon={Zap}
        subtitle={active ? `${active.channel} · ${active.company}` : ''}
        title="Take Action"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button onClick={createTask}>
              <ListChecks size={15} /> Create Follow-Up Task
            </Button>
          </div>
        }
      >
        {active && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-700">{active.message}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${signalStatusClasses[active.status]}`}>
                  {active.status}
                </span>
                <span className="text-[11px] text-slate-400">{active.time}</span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <ListChecks size={14} /> Suggested Next Steps
              </div>
              <ul className="space-y-2">
                {[
                  active.nextStep,
                  'Notify the account owner and relevant Deepgram stakeholders',
                  'Log the outcome to the Salesforce account record',
                ].map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
