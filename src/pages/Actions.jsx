import { useState } from 'react';
import {
  ListChecks,
  CalendarClock,
  ArrowRight,
  Target,
  Users,
  HelpCircle,
  Sparkles,
  ClipboardCheck,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { recommendations, meetingBrief, meetingBriefText } from '../data/recommendations.js';
import { priorityClasses } from '../lib/format.js';
import { PageHeader, SectionTitle, Button, Badge, Toast, Tabs } from '../components/ui.jsx';
import RenewalPipeline from '../components/RenewalPipeline.jsx';

const ACTION_TABS = [
  { key: 'nba', label: 'Next Best Actions', icon: ListChecks },
  { key: 'renewal', label: 'Renewal Pipeline', icon: CalendarClock },
];

function ActionCard({ rec, onCta }) {
  return (
    <div className="card p-5 transition-shadow hover:shadow-cardhover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Target size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{rec.title}</h3>
              <Badge className={priorityClasses(rec.priority)}>{rec.priority}</Badge>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">{rec.why}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
        <div>
          <div className="metric-label">Objective</div>
          <p className="mt-1 text-xs text-slate-600">{rec.objective}</p>
        </div>
        <div>
          <div className="metric-label">Stakeholders</div>
          <p className="mt-1 text-xs text-slate-600">{rec.stakeholders.join(', ')}</p>
        </div>
        <div>
          <div className="metric-label">Impact</div>
          <p className="mt-1 text-xs font-medium text-emerald-700">{rec.impact}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant={rec.priority === 'HIGH' ? 'primary' : 'secondary'} onClick={() => onCta(rec)}>
          {rec.cta} <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}

function MeetingPrep({ onBack, onToast }) {
  const [copied, setCopied] = useState(false);

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(meetingBriefText);
      setCopied(true);
      onToast('Meeting brief copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('Copy unavailable in this environment.');
    }
  };

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft size={15} /> Back to actions
      </button>

      <div className="mb-6 flex items-start gap-4 rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            AI Meeting Brief
          </div>
          <h2 className="mt-0.5 text-xl font-bold text-slate-900">{meetingBrief.title}</h2>
          <p className="mt-1 text-sm text-slate-600">With {meetingBrief.with}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="card p-5">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Target size={14} /> Meeting Objective
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{meetingBrief.objective}</p>
          </section>

          <section className="card p-5">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <RefreshCw size={14} /> What Changed Since Last Meeting
            </div>
            <ul className="space-y-2">
              {meetingBrief.whatChanged.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {c}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <HelpCircle size={14} /> Questions to Ask
            </div>
            <ol className="space-y-2.5">
              {meetingBrief.questions.map((q, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                    {i + 1}
                  </span>
                  {q}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Users size={14} /> People to Engage
            </div>
            <ul className="space-y-3">
              {meetingBrief.people.map((p) => (
                <li key={p.name} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                    {p.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.title}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <ClipboardCheck size={14} /> Recommended Next Step
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{meetingBrief.nextStep}</p>
          </section>

          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Estimated Expansion Value
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-700">{meetingBrief.expansionValue}</div>
          </section>

          <div className="flex flex-col gap-2">
            <Button onClick={copyBrief}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied' : 'Copy Meeting Brief'}
            </Button>
            <Button variant="secondary" onClick={() => onToast('Follow-up task created for Kris Korich.')}>
              Create Follow-Up
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Actions() {
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('nba');
  const [toast, setToast] = useState('');

  const handleCta = (rec) => {
    if (rec.ctaType === 'meeting') {
      setView('prep');
    } else if (rec.ctaType === 'opportunity') {
      setToast('Opportunity created and synced to Salesforce.');
    } else {
      setToast('Adoption plan drafted for Marketing pilot.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      {view === 'prep' ? (
        <MeetingPrep onBack={() => setView('list')} onToast={setToast} />
      ) : (
        <div className="animate-fade-in">
          <PageHeader
            eyebrow="Actions"
            title={tab === 'renewal' ? 'Renewal Pipeline' : 'What should I do next?'}
            subtitle={
              tab === 'renewal'
                ? 'Portfolio renewals ranked by urgency'
                : 'AI-prioritized actions for Acme Corporation'
            }
            actions={
              tab === 'nba' ? (
                <Button onClick={() => setView('prep')}>
                  <CalendarClock size={16} /> Prepare for My Next Meeting
                </Button>
              ) : null
            }
          />
          <Tabs tabs={ACTION_TABS} active={tab} onChange={setTab} className="mb-6" />

          {tab === 'renewal' ? (
            <RenewalPipeline />
          ) : (
            <>
              <SectionTitle icon={ListChecks} title="Recommended Actions" hint="Ranked by priority" />
              <div className="grid gap-4">
                {recommendations.map((rec) => (
                  <ActionCard key={rec.id} rec={rec} onCta={handleCta} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
