import { useState } from 'react';
import {
  CalendarClock,
  ShieldAlert,
  ShieldCheck,
  Target,
  AlertTriangle,
  FileText,
  Users,
  Swords,
  MessageSquareQuote,
  ArrowRight,
} from 'lucide-react';
import { renewals, renewalSummary } from '../data/renewals.js';
import { formatCurrency, healthClasses } from '../lib/format.js';
import { MetricCard, SectionTitle, Button, Modal, Badge, Toast } from './ui.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: '0-90', label: '0–90 days' },
  { key: '91-180', label: '91–180 days' },
  { key: '181-365', label: '181–365 days' },
  { key: 'risk', label: 'At Risk' },
];

const riskBadge = (risk) =>
  ({
    HIGH: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    MEDIUM: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    LOW: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  })[risk] || 'bg-slate-100 text-slate-600';

const statusBadge = (status) =>
  status === 'AT RISK'
    ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200'
    : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';

// Days-remaining bar: fuller (more urgent) as the renewal nears; red <60, amber <120.
function daysBar(days) {
  const pct = Math.max(6, Math.min(100, ((365 - days) / 365) * 100));
  const color = days < 60 ? 'bg-rose-500' : days < 120 ? 'bg-amber-500' : 'bg-emerald-500';
  return { pct, color };
}

function matchesFilter(r, key) {
  if (key === 'all') return true;
  if (key === 'risk') return r.status === 'AT RISK' || r.risk === 'HIGH';
  if (key === '0-90') return r.daysRemaining <= 90;
  if (key === '91-180') return r.daysRemaining > 90 && r.daysRemaining <= 180;
  if (key === '181-365') return r.daysRemaining > 180 && r.daysRemaining <= 365;
  return true;
}

function RenewalCard({ r, onPrepare }) {
  const cls = healthClasses(r.health);
  const bar = daysBar(r.daysRemaining);
  return (
    <div className="card p-5 transition-shadow hover:shadow-cardhover">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{r.account}</h3>
            <Badge className={statusBadge(r.status)}>{r.status}</Badge>
            <Badge className={riskBadge(r.risk)}>{r.risk} RISK</Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{formatCurrency(r.arr)} ARR</span>
            <span className="flex items-center gap-1">
              <CalendarClock size={12} /> {r.renewalDate}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${cls.text}`}>{r.daysRemaining}d</div>
          <div className="text-[11px] text-slate-400">to renewal · health {r.health}</div>
        </div>
      </div>

      {/* Days-remaining progress */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar.color} transition-all duration-700`} style={{ width: `${bar.pct}%` }} />
      </div>

      <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3 text-xs">
        <div className="flex items-start gap-2">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
          <span className="text-slate-600">{r.signal}</span>
        </div>
        <div className="flex items-start gap-2">
          <Target size={13} className="mt-0.5 shrink-0 text-brand-500" />
          <span className="text-slate-700">
            <span className="font-semibold text-brand-700">Recommended: </span>
            {r.action}
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant={r.risk === 'HIGH' ? 'primary' : 'secondary'} size="sm" onClick={() => onPrepare(r)}>
          <FileText size={14} /> Prepare Renewal Strategy
        </Button>
      </div>
    </div>
  );
}

function StrategySection({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon size={14} /> {title}
      </div>
      {children}
    </div>
  );
}

export default function RenewalPipeline() {
  const [filter, setFilter] = useState('all');
  const [strategy, setStrategy] = useState(null);
  const [toast, setToast] = useState('');

  const list = renewals.filter((r) => matchesFilter(r, filter));

  return (
    <div className="animate-fade-in">
      {/* ARR at risk summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Up for Renewal (Year)"
          value={formatCurrency(renewalSummary.totalUpForRenewal)}
          sub="All 5 accounts"
          icon={CalendarClock}
        />
        <MetricCard
          label="ARR at Risk"
          value={formatCurrency(renewalSummary.arrAtRisk)}
          sub="Health below 75"
          accent="text-rose-600"
          icon={ShieldAlert}
        />
        <MetricCard
          label="ARR On Track"
          value={formatCurrency(renewalSummary.arrOnTrack)}
          sub="Healthy renewals"
          accent="text-emerald-600"
          icon={ShieldCheck}
        />
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === f.key
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <SectionTitle icon={CalendarClock} title="Renewal Timeline" hint={`${list.length} of ${renewals.length} accounts`} />
      <div className="grid gap-3">
        {list.map((r) => (
          <RenewalCard key={r.id} r={r} onPrepare={setStrategy} />
        ))}
        {list.length === 0 && (
          <div className="card p-8 text-center text-sm text-slate-400">
            No renewals in this window.
          </div>
        )}
      </div>

      {/* Strategy modal */}
      <Modal
        open={!!strategy}
        onClose={() => setStrategy(null)}
        icon={FileText}
        subtitle={strategy ? `${strategy.account} · ${strategy.daysRemaining} days to renewal` : ''}
        title="Renewal Strategy"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStrategy(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setStrategy(null);
                setToast('Renewal strategy saved and shared with the account team.');
              }}
            >
              Save Strategy <ArrowRight size={15} />
            </Button>
          </div>
        }
      >
        {strategy && (
          <div className="space-y-5">
            <StrategySection icon={Target} title="Renewal Objective">
              <p className="text-sm leading-relaxed text-slate-700">{strategy.strategy.objective}</p>
            </StrategySection>

            <StrategySection icon={AlertTriangle} title="Key Risks to Address">
              <ul className="space-y-2">
                {strategy.strategy.risks.map((x, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    {x}
                  </li>
                ))}
              </ul>
            </StrategySection>

            <StrategySection icon={FileText} title="Suggested Commercial Structure">
              <p className="rounded-lg bg-brand-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                {strategy.strategy.structure}
              </p>
            </StrategySection>

            <StrategySection icon={Users} title="Stakeholders to Engage">
              <div className="flex flex-wrap gap-1.5">
                {strategy.strategy.stakeholders.map((sk) => (
                  <span key={sk} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {sk}
                  </span>
                ))}
              </div>
            </StrategySection>

            <StrategySection icon={MessageSquareQuote} title="Talking Points">
              <ol className="space-y-2">
                {strategy.strategy.talkingPoints.map((tp, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                      {i + 1}
                    </span>
                    {tp}
                  </li>
                ))}
              </ol>
            </StrategySection>

            <StrategySection icon={Swords} title="Competitive Threats">
              {strategy.strategy.competitive ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                  {strategy.strategy.competitive}
                </p>
              ) : (
                <p className="text-sm text-slate-500">No active competitive threat identified.</p>
              )}
            </StrategySection>
          </div>
        )}
      </Modal>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
