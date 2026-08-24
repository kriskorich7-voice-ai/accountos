import { TrendingUp, Grid3x3, Package } from 'lucide-react';
import { products, businessUnits, adoptionInsight } from '../data/products.js';
import { PageHeader, SectionTitle, Badge } from '../components/ui.jsx';
import AccountTabs from '../components/AccountTabs.jsx';
import AIInsight from '../components/AIInsight.jsx';

const statusBadge = (status) =>
  status === 'Adopted'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
    : 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200';

// Penetration color coding — makes whitespace visually obvious.
function penetrationStyle(v) {
  if (v >= 75) return { bar: 'bg-emerald-500', chip: 'text-emerald-700 bg-emerald-50', label: 'Strong' };
  if (v >= 40) return { bar: 'bg-brand-500', chip: 'text-brand-700 bg-brand-50', label: 'Growing' };
  if (v >= 15) return { bar: 'bg-amber-500', chip: 'text-amber-700 bg-amber-50', label: 'Low' };
  if (v > 0) return { bar: 'bg-rose-500', chip: 'text-rose-700 bg-rose-50', label: 'Minimal' };
  return { bar: 'bg-slate-300', chip: 'text-slate-500 bg-slate-100', label: 'None' };
}

function ProductCard({ p }) {
  return (
    <div className="card p-5 transition-shadow hover:shadow-cardhover">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{p.name}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{p.tagline}</p>
        </div>
        <Badge className={statusBadge(p.status)}>{p.status}</Badge>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="metric-label">Adoption</div>
          <div className="text-2xl font-bold text-slate-900">{p.adoption}%</div>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
          <TrendingUp size={15} />+{p.growth}%
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${p.status === 'Adopted' ? 'bg-emerald-500' : 'bg-brand-500'}`}
          style={{ width: `${p.adoption}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{p.description}</p>
    </div>
  );
}

export default function Adoption() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-8 animate-fade-in">
      <PageHeader eyebrow="Account" title="Acme Corporation" subtitle="Financial Services · North America" />
      <AccountTabs />

      {/* Products */}
      <div className="mb-8">
        <SectionTitle icon={Package} title="Product Adoption" hint="5 Deepgram products" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>

      {/* Business unit matrix */}
      <div className="mb-6">
        <SectionTitle icon={Grid3x3} title="Business Unit Penetration" />
        <div className="card overflow-hidden p-6">
          <div className="space-y-4">
            {businessUnits.map((bu) => {
              const s = penetrationStyle(bu.current);
              return (
                <div key={bu.name} className="flex items-center gap-4">
                  <span className="w-40 shrink-0 text-sm font-medium text-slate-700">{bu.name}</span>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
                    <div
                      className={`flex h-full items-center rounded-lg ${s.bar} px-2.5 transition-all duration-700`}
                      style={{ width: `${Math.max(bu.current, 6)}%` }}
                    >
                      {bu.current >= 12 && (
                        <span className="text-[11px] font-bold text-white">{bu.current}%</span>
                      )}
                    </div>
                    {bu.current < 12 && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500">
                        {bu.current}%
                      </span>
                    )}
                  </div>
                  <span className={`w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold ${s.chip}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Strong 75%+</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-brand-500" /> Growing 40–74%</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-amber-500" /> Low 15–39%</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-rose-500" /> Minimal 1–14%</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-slate-300" /> No adoption</span>
          </div>
        </div>
      </div>

      <AIInsight>{adoptionInsight}</AIInsight>
    </div>
  );
}
