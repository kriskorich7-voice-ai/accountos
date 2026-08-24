import { useState } from 'react';
import {
  ShieldAlert,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Lightbulb,
  Target,
  Users,
  Package,
  ArrowRight,
  BrainCircuit,
  Layers,
} from 'lucide-react';
import { risks } from '../data/risks.js';
import { opportunities } from '../data/opportunities.js';
import { businessUnits, whitespaceInsight } from '../data/products.js';
import { priorityClasses } from '../lib/format.js';
import { PageHeader, SectionTitle, ConfidenceBar, Drawer, Button, Badge, Tabs } from '../components/ui.jsx';
import AccountTabs from '../components/AccountTabs.jsx';
import AIInsight from '../components/AIInsight.jsx';
import ExpansionKanban from '../components/ExpansionKanban.jsx';

const INTEL_TABS = [
  { key: 'intel', label: 'Account Intelligence', icon: BrainCircuit },
  { key: 'pipeline', label: 'Expansion Pipeline', icon: Layers },
];

function RiskCard({ risk, onClick }) {
  const accent =
    risk.severity === 'HIGH' ? 'border-l-rose-400' : 'border-l-amber-400';
  return (
    <button
      onClick={onClick}
      className="group card flex items-start gap-4 border-l-4 border-l-transparent p-4 text-left transition-all hover:shadow-cardhover focus-ring"
    >
      <div className={`w-1 self-stretch rounded-full ${accent}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 group-hover:text-brand-700">{risk.title}</span>
          <Badge className={priorityClasses(risk.severity)}>{risk.severity}</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600">{risk.summary}</p>
      </div>
      <ChevronRight size={16} className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
    </button>
  );
}

function OpportunityCard({ opp, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-cardhover focus-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            {opp.unit}
          </div>
          <h3 className="mt-0.5 font-semibold text-slate-900 group-hover:text-brand-700">
            {opp.title}
          </h3>
        </div>
        <ChevronRight size={16} className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="metric-label">Potential ARR</div>
          <div className="text-xl font-bold text-slate-900">{opp.potentialLabel}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <span>Confidence</span>
        </div>
        <ConfidenceBar value={opp.confidence} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
        {opp.products.map((p) => (
          <span key={p} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {p}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function Intelligence() {
  const [risk, setRisk] = useState(null);
  const [opp, setOpp] = useState(null);
  const [tab, setTab] = useState('intel');

  return (
    <div className="mx-auto max-w-6xl px-8 py-8 animate-fade-in">
      <PageHeader eyebrow="Account" title="Acme Corporation" subtitle="Financial Services · North America" />
      <AccountTabs />

      <Tabs tabs={INTEL_TABS} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'pipeline' && <ExpansionKanban />}

      {tab === 'intel' && (
      <>
      {/* Risks */}
      <div className="mb-8">
        <SectionTitle icon={ShieldAlert} title="Risks" hint={`${risks.length} active`} />
        <div className="grid gap-3">
          {risks.map((r) => (
            <RiskCard key={r.id} risk={r} onClick={() => setRisk(r)} />
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <div className="mb-8">
        <SectionTitle icon={TrendingUp} title="Expansion Opportunities" hint="$1.9M weighted pipeline" />
        <div className="grid gap-4 md:grid-cols-3">
          {opportunities.map((o) => (
            <OpportunityCard key={o.id} opp={o} onClick={() => setOpp(o)} />
          ))}
        </div>
      </div>

      {/* Whitespace */}
      <div className="mb-6">
        <SectionTitle icon={BarChart3} title="Whitespace Analysis" hint="Current vs. potential adoption" />
        <div className="card p-6">
          <div className="space-y-4">
            {businessUnits.map((bu) => (
              <div key={bu.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{bu.name}</span>
                  <span className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-700">{bu.current}%</span> now ·{' '}
                    <span className="font-semibold text-brand-600">{bu.potential}%</span> potential
                    <span className="ml-1.5 font-semibold text-emerald-600">
                      +{bu.potential - bu.current} pts
                    </span>
                  </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
                  {/* potential (ghost) */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-brand-100"
                    style={{ width: `${bu.potential}%` }}
                  />
                  {/* current (solid) */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-brand-600 transition-all duration-700"
                    style={{ width: `${bu.current}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-brand-600" /> Current adoption</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-brand-100" /> Potential adoption</span>
          </div>
        </div>
      </div>

      <AIInsight label="AI Whitespace Insight">{whitespaceInsight}</AIInsight>
      </>
      )}

      {/* Risk drawer */}
      <Drawer open={!!risk} onClose={() => setRisk(null)} subtitle="Account Risk" title={risk?.title}>
        {risk && (
          <div className="space-y-5">
            <Badge className={priorityClasses(risk.severity)}>{risk.severity} SEVERITY</Badge>
            <p className="text-sm leading-relaxed text-slate-700">{risk.detail}</p>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Signals</div>
              <ul className="space-y-2">
                {risk.signals.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Impact</div>
              <p className="mt-1 text-sm text-slate-600">{risk.impact}</p>
            </div>
            <div className="rounded-lg bg-brand-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                <Lightbulb size={14} /> Recommendation
              </div>
              <p className="mt-1 text-sm text-slate-700">{risk.recommendation}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Opportunity drawer */}
      <Drawer
        open={!!opp}
        onClose={() => setOpp(null)}
        subtitle={opp?.unit}
        title={opp?.title}
        footer={
          <Button className="w-full" onClick={() => setOpp(null)}>
            Create Opportunity <ArrowRight size={15} />
          </Button>
        }
      >
        {opp && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="metric-label">Potential ARR</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{opp.potentialLabel}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="metric-label">Confidence</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{opp.confidence}%</div>
              </div>
            </div>
            <ConfidenceBar value={opp.confidence} showLabel={false} />

            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Target size={14} /> Evidence
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{opp.evidence}</p>
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Lightbulb size={14} /> Why Now
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{opp.whyNow}</p>
            </div>
            <div className="rounded-lg bg-brand-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Recommended Next Step
              </div>
              <p className="mt-1 text-sm text-slate-700">{opp.nextStep}</p>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Users size={14} /> Stakeholders
              </div>
              <ul className="space-y-1.5">
                {opp.stakeholders.map((s) => (
                  <li key={s} className="text-sm text-slate-700">• {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Package size={14} /> Deepgram Products
              </div>
              <div className="flex flex-wrap gap-1.5">
                {opp.products.map((p) => (
                  <span key={p} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
