import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Shield, ArrowUpRight, ArrowDownRight, Repeat, DollarSign } from 'lucide-react';
import { nrrMetrics, arrWaterfall, nrrTrend, arrMovement } from '../data/nrr.js';
import { formatCurrency } from '../lib/format.js';
import { MetricCard, SectionTitle } from './ui.jsx';

function WaterfallLabel({ x, y, width, value, index }) {
  const item = arrWaterfall[index];
  if (!item) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      className="fill-slate-600"
      fontSize={11}
      fontWeight={600}
    >
      {item.label}
    </text>
  );
}

export default function NrrDashboard() {
  return (
    <div className="animate-fade-in">
      {/* Key metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard
          label="Net Revenue Retention"
          value={`${nrrMetrics.nrr}%`}
          sub="Trailing 12 months"
          accent="text-emerald-600"
          icon={TrendingUp}
        />
        <MetricCard
          label="Gross Retention"
          value={`${nrrMetrics.grossRetention}%`}
          sub="Excl. expansion"
          icon={Shield}
        />
        <MetricCard
          label="Expansion ARR"
          value={formatCurrency(nrrMetrics.expansionARR)}
          sub="Upsell + cross-sell"
          accent="text-emerald-600"
          icon={ArrowUpRight}
        />
        <MetricCard
          label="Churned ARR"
          value={formatCurrency(nrrMetrics.churnedARR)}
          sub="Lost this period"
          accent="text-rose-600"
          icon={ArrowDownRight}
        />
        <MetricCard
          label="Net New ARR"
          value={formatCurrency(nrrMetrics.netNewARR)}
          sub="Expansion − churn"
          accent="text-brand-600"
          icon={DollarSign}
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        {/* ARR waterfall */}
        <div className="card p-6 lg:col-span-3">
          <SectionTitle icon={Repeat} title="ARR Waterfall" hint="Start → end of period" />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={arrWaterfall} margin={{ top: 24, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  domain={[0, 12]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}M`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                  formatter={(v, _n, p) => [p?.payload?.label, p?.payload?.name]}
                />
                <Bar dataKey="base" stackId="a" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="size" stackId="a" radius={[4, 4, 0, 0]}>
                  {arrWaterfall.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                  <LabelList dataKey="size" content={<WaterfallLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NRR trend */}
        <div className="card p-6 lg:col-span-2">
          <SectionTitle icon={TrendingUp} title="NRR Trend" hint="12 months" />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={nrrTrend} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="nrrLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[100, 122]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip formatter={(v) => [`${v}%`, 'NRR']} />
                <ReferenceLine y={100} stroke="#cbd5e1" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="nrr"
                  stroke="url(#nrrLine)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#6366f1' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expansion vs churn table */}
      <div>
        <SectionTitle icon={Repeat} title="Expansion vs. Churn" hint="Accounts with movement" />
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Account</th>
                <th className="px-5 py-3">Movement</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {arrMovement.map((m) => {
                const positive = m.amount >= 0;
                const typeCls =
                  m.type === 'expansion'
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : m.type === 'contraction'
                      ? 'bg-amber-50 text-amber-700 ring-amber-200'
                      : 'bg-rose-50 text-rose-700 ring-rose-200';
                return (
                  <tr key={m.account} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-semibold text-slate-800">{m.account}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${typeCls}`}>
                        {m.type}
                      </span>
                    </td>
                    <td className={`px-5 py-3 font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {positive ? '+' : '−'}
                      {formatCurrency(Math.abs(m.amount))}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{m.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
