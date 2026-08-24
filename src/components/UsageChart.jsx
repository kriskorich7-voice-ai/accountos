import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { usageSeries, usageMeta } from '../data/usage.js';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const actual = payload.find((p) => p.dataKey === 'value' && p.value != null);
  const fc = payload.find((p) => p.dataKey === 'forecast' && p.value != null);
  const point = actual || fc;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-pop">
      <div className="text-xs font-semibold text-slate-900">{label}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: actual ? '#6366f1' : '#f59e0b' }}
        />
        <span className="text-slate-500">{actual ? 'Actual' : 'Forecast'}:</span>
        <span className="font-semibold text-slate-900">{point.value}M units</span>
      </div>
      <div className="mt-0.5 text-[11px] text-slate-400">Capacity: {usageMeta.capacityLabel}</div>
    </div>
  );
}

export default function UsageChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={usageSeries} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            interval={1}
          />
          <YAxis
            domain={[6, 12]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}M`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Over-capacity danger zone */}
          <ReferenceArea y1={usageMeta.capacity / 1_000_000} y2={12} fill="#f43f5e" fillOpacity={0.05} />

          {/* Contracted capacity threshold */}
          <ReferenceLine
            y={usageMeta.capacity / 1_000_000}
            stroke="#e11d48"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{
              value: `Contracted Capacity · ${usageMeta.capacityLabel}`,
              position: 'insideTopRight',
              fill: '#e11d48',
              fontSize: 10,
              fontWeight: 600,
            }}
          />

          {/* "Today" marker at the actual/forecast handoff */}
          <ReferenceLine
            x="Aug '26"
            stroke="#94a3b8"
            strokeDasharray="2 3"
            label={{ value: 'Today', position: 'top', fill: '#64748b', fontSize: 10 }}
          />

          {/* Historical actual */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#usageFill)"
            dot={false}
            connectNulls
          />

          {/* Forecast (dotted) */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#f59e0b"
            strokeWidth={2.5}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
