import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Activity,
  TrendingUp,
  Target,
  ShieldAlert,
  ArrowUpRight,
  ChevronRight,
  Zap,
  CalendarClock,
  Users,
} from 'lucide-react';
import { getAccount } from '../data/accounts.js';
import { healthScore, healthComponents } from '../data/healthScores.js';
import { usageMeta } from '../data/usage.js';
import { formatCurrency, healthClasses, statusMeta } from '../lib/format.js';
import {
  PageHeader,
  MetricCard,
  SectionTitle,
  HealthRing,
  Drawer,
  Button,
  Toast,
  Badge,
} from '../components/ui.jsx';
import AccountTabs from '../components/AccountTabs.jsx';
import AIInsight from '../components/AIInsight.jsx';
import UsageChart from '../components/UsageChart.jsx';

function HealthComponentRow({ c, onClick }) {
  const cls = healthClasses(c.score);
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50 focus-ring"
    >
      <span className="w-40 shrink-0 text-sm font-medium text-slate-700">{c.label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${cls.bg} transition-all duration-700`}
          style={{ width: `${c.score}%` }}
        />
      </div>
      <span className={`w-8 shrink-0 text-right text-sm font-bold ${cls.text}`}>{c.score}</span>
      <ChevronRight
        size={15}
        className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500"
      />
    </button>
  );
}

// Lite overview for non-Acme accounts (deep intelligence modules are Acme-only in V1).
function LiteOverview({ account }) {
  const navigate = useNavigate();
  const cls = healthClasses(account.health);
  const status = statusMeta[account.status];
  return (
    <div className="mx-auto max-w-6xl px-8 py-8 animate-fade-in">
      <PageHeader
        eyebrow="Account"
        title={account.name}
        subtitle={`${account.industry} · ${account.region}`}
        actions={<Badge className={`ring-1 ring-inset ${status.cls}`}>{status.label}</Badge>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="ARR" value={formatCurrency(account.arr)} icon={DollarSign} />
        <MetricCard
          label="Account Health"
          value={account.health}
          accent={cls.text}
          icon={Activity}
        />
        <MetricCard
          label="Usage Growth"
          value={`${account.usageGrowth > 0 ? '+' : ''}${account.usageGrowth}%`}
          accent={account.usageGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}
          icon={TrendingUp}
        />
        <MetricCard label="Renews" value={account.renewalDate} icon={CalendarClock} />
      </div>
      <AIInsight label="AI Account Summary" className="mb-6">
        {account.summary}
      </AIInsight>
      <div className="card p-6">
        <SectionTitle title="Deep-Dive Intelligence" />
        <p className="text-sm text-slate-600">
          Full intelligence modules — health decomposition, usage forecasting, adoption matrix, and
          expansion modeling — are demonstrated on the{' '}
          <button
            onClick={() => navigate('/account/acme')}
            className="font-semibold text-brand-600 hover:underline"
          >
            Acme Corporation
          </button>{' '}
          account in this V1 preview.
        </p>
      </div>
    </div>
  );
}

export default function AccountOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const account = getAccount(id || 'acme') || getAccount('acme');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');

  if (account.id !== 'acme') return <LiteOverview account={account} />;

  const cls = healthClasses(healthScore);

  return (
    <div className="mx-auto max-w-6xl px-8 py-8 animate-fade-in">
      <PageHeader
        eyebrow="Account"
        title="Acme Corporation"
        subtitle="Financial Services · North America"
        actions={
          <Button variant="secondary" onClick={() => navigate('/actions')}>
            <Target size={15} /> Next Best Actions
          </Button>
        }
      />

      <AccountTabs />

      {/* Key metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard label="ARR" value="$2.4M" sub="$4.8M contract" icon={DollarSign} />
        <MetricCard label="Account Health" value="87" accent={cls.text} sub="Healthy" icon={Activity} />
        <MetricCard
          label="Usage Growth"
          value="+18%"
          accent="text-emerald-600"
          sub="Year over year"
          icon={TrendingUp}
        />
        <MetricCard label="Expansion Opps" value="3" accent="text-brand-600" sub="$1.9M pipeline" icon={Target} />
        <MetricCard label="Active Risk" value="1" accent="text-rose-600" sub="High severity" icon={ShieldAlert} />
      </div>

      {/* AI summary */}
      <AIInsight label="AI Account Summary" className="mb-8">
        {account.summary}
      </AIInsight>

      {/* Health + usage grid */}
      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        {/* Health score */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <SectionTitle icon={Activity} title="Account Health Score" />
          </div>
          <div className="mb-4 flex items-center gap-5">
            <HealthRing score={healthScore} size={96} stroke={9} />
            <div>
              <div className="text-3xl font-bold text-slate-900">
                {healthScore}
                <span className="text-lg font-medium text-slate-400">/100</span>
              </div>
              <div className={`mt-1 text-sm font-semibold ${cls.text}`}>Healthy & Expanding</div>
              <div className="mt-0.5 text-xs text-slate-400">Weighted composite · 6 signals</div>
            </div>
          </div>
          <div className="-mx-3 space-y-0.5">
            {healthComponents.map((c) => (
              <HealthComponentRow key={c.id} c={c} onClick={() => setSelected(c)} />
            ))}
          </div>
          <p className="mt-3 px-3 text-[11px] text-slate-400">
            Select any component to view supporting signals.
          </p>
        </div>

        {/* Usage chart */}
        <div className="card p-6 lg:col-span-3">
          <div className="mb-4 flex items-start justify-between">
            <SectionTitle icon={TrendingUp} title="Usage & Capacity Forecast" />
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">{usageMeta.currentLabel}</div>
              <div className="text-[11px] text-slate-400">units / month · +18% YoY</div>
            </div>
          </div>
          <UsageChart />
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-brand-500" /> Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-amber-500" /> Forecast
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-rose-500" /> Capacity
            </span>
            <span className="ml-auto font-semibold text-rose-600">
              Projected exhaustion in {usageMeta.projectedExhaustionDays} days
            </span>
          </div>
        </div>
      </div>

      {/* Expansion signal */}
      <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/40">
              <Zap size={20} />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Expansion Signal · High Priority
              </div>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-800">
                At the current growth rate, Acme is projected to exceed contracted volume in
                approximately {usageMeta.projectedExhaustionDays} days.{' '}
                <span className="text-amber-700">
                  Begin an expansion conversation within the next 14 days.
                </span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setToast('Expansion action created and added to Next Best Actions.');
              setTimeout(() => navigate('/actions'), 900);
            }}
            className="shrink-0"
          >
            Create Expansion Action <ArrowUpRight size={15} />
          </Button>
        </div>
      </div>

      {/* Health component drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        subtitle="Health Signal"
        title={selected?.label}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <HealthRing score={selected.score} size={72} stroke={7} />
              <div>
                <div className="text-sm text-slate-500">Component score</div>
                <div className="text-2xl font-bold text-slate-900">{selected.score}/100</div>
                <div className="text-xs text-slate-400">Weight: {selected.weight}% of composite</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{selected.summary}</p>
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Users size={14} /> Supporting Signals
              </div>
              <ul className="space-y-2">
                {selected.signals.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Drawer>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
