import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShieldAlert,
  TrendingUp,
  Activity,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { accounts, portfolioSummary } from '../data/accounts.js';
import { usageSparklines } from '../data/usage.js';
import {
  formatCurrency,
  healthClasses,
  statusMeta,
  riskLevelClasses,
} from '../lib/format.js';
import { PageHeader, MetricCard, SectionTitle, HealthRing, Sparkline, Badge } from '../components/ui.jsx';

function TrendIcon({ trend, className }) {
  if (trend === 'up') return <ArrowUpRight size={14} className={className || 'text-emerald-500'} />;
  if (trend === 'down') return <ArrowDownRight size={14} className={className || 'text-rose-500'} />;
  return <Minus size={14} className={className || 'text-slate-400'} />;
}

function AccountCard({ account, onClick }) {
  const cls = healthClasses(account.health);
  const status = statusMeta[account.status];
  const spark = usageSparklines[account.id] || [];
  const sparkColor =
    account.usageTrend === 'down' ? '#f43f5e' : account.usageTrend === 'flat' ? '#94a3b8' : '#10b981';

  return (
    <button
      onClick={onClick}
      className="group card overflow-hidden p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-cardhover focus-ring"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-brand-700">
            {account.name}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {account.industry} · {account.region}
          </p>
        </div>
        <HealthRing score={account.health} size={56} stroke={6} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="metric-label">ARR</div>
          <div className="mt-0.5 text-lg font-bold text-slate-900">
            {formatCurrency(account.arr)}
          </div>
        </div>
        <div>
          <div className="metric-label">Usage Trend</div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Sparkline data={spark} color={sparkColor} width={64} height={22} />
            <span
              className={`text-xs font-semibold ${
                account.usageGrowth > 0
                  ? 'text-emerald-600'
                  : account.usageGrowth < 0
                    ? 'text-rose-600'
                    : 'text-slate-500'
              }`}
            >
              {account.usageGrowth > 0 ? '+' : ''}
              {account.usageGrowth}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <Badge className={`ring-1 ring-inset ${status.cls}`}>{status.label}</Badge>
          <Badge className={riskLevelClasses(account.riskLevel)}>
            {account.riskLevel} risk
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          Renews {account.renewalDate}
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}

export default function Portfolio() {
  const navigate = useNavigate();
  const attention = accounts.filter((a) => a.status === 'attention');

  return (
    <div className="mx-auto max-w-7xl px-8 py-8 animate-fade-in">
      <PageHeader
        eyebrow="Portfolio"
        title="Strategic Account Portfolio"
        subtitle="North America · 5 enterprise accounts · Owned by Kris Korich"
      />

      {/* Portfolio metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard
          label="Total ARR"
          value={formatCurrency(portfolioSummary.totalARR)}
          sub="Across 5 accounts"
          icon={DollarSign}
        />
        <MetricCard
          label="ARR at Risk"
          value={formatCurrency(portfolioSummary.arrAtRisk)}
          sub="2 accounts flagged"
          accent="text-rose-600"
          icon={ShieldAlert}
        />
        <MetricCard
          label="Expansion Pipeline"
          value={formatCurrency(portfolioSummary.expansionPipeline)}
          sub="Weighted opportunity"
          accent="text-emerald-600"
          icon={TrendingUp}
        />
        <MetricCard
          label="Average Health"
          value={portfolioSummary.averageHealth}
          sub="Portfolio composite"
          accent="text-emerald-600"
          icon={Activity}
        />
        <MetricCard
          label="Need Attention"
          value={portfolioSummary.accountsRequiringAttention}
          sub="Action required"
          accent="text-amber-600"
          icon={Bell}
        />
      </div>

      {/* Attention */}
      <div className="mb-8">
        <SectionTitle icon={AlertTriangle} title="Accounts Requiring Attention" />
        <div className="grid gap-3 md:grid-cols-2">
          {attention.map((a) => {
            const cls = healthClasses(a.health);
            return (
              <button
                key={a.id}
                onClick={() => navigate(`/account/${a.id}`)}
                className="group card flex items-start gap-4 border-l-4 border-l-amber-400 p-4 text-left transition-all hover:shadow-cardhover focus-ring"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                  <AlertTriangle size={17} className="text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 group-hover:text-brand-700">
                      {a.name}
                    </span>
                    <span className={`text-xs font-semibold ${cls.text}`}>Health {a.health}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{a.attentionReason}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* All accounts */}
      <div>
        <SectionTitle title="All Accounts" hint={`${accounts.length} total`} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => (
            <AccountCard key={a.id} account={a} onClick={() => navigate(`/account/${a.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}
