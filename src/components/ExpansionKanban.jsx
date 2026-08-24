import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { TrendingUp, Layers, DollarSign, Target, Percent, User, Clock } from 'lucide-react';
import { pipelineSummary, pipelineStages, pipelineOpportunities } from '../data/pipeline.js';
import { formatCurrency } from '../lib/format.js';
import { MetricCard, SectionTitle, ConfidenceBar, Toast } from './ui.jsx';

const mid = (o) => Math.round((o.low + o.high) / 2);

// Group opportunities into { stageId: [opp, ...] }, preserving array order.
function groupByStage(opps) {
  const cols = {};
  pipelineStages.forEach((s) => (cols[s.id] = []));
  opps.forEach((o) => cols[o.stage]?.push(o));
  return cols;
}

function OppCard({ opp, dragging }) {
  const stale = opp.daysInStage > 30;
  return (
    <div
      className={`rounded-xl border bg-white p-3.5 shadow-sm transition-shadow ${
        dragging ? 'border-brand-300 shadow-pop ring-2 ring-brand-200' : 'border-slate-200 hover:shadow-cardhover'
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
        {opp.account}
      </div>
      <div className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{opp.title}</div>

      <div className="mt-2.5 text-sm font-bold text-slate-900">
        {formatCurrency(opp.low)}–{formatCurrency(opp.high)}
      </div>

      <div className="mt-2">
        <ConfidenceBar value={opp.confidence} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          <User size={11} className="text-slate-400" /> {opp.contact}
        </span>
        <span
          className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            stale ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Clock size={10} /> {opp.daysInStage}d
        </span>
      </div>

      {opp.products?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {opp.products.map((p) => (
            <span key={p} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExpansionKanban() {
  const [columns, setColumns] = useState(() => groupByStage(pipelineOpportunities));
  const [toast, setToast] = useState('');

  const onDragStart = () => setToast('Syncing to Salesforce…');

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) {
      setToast('');
      return;
    }
    const from = source.droppableId;
    const to = destination.droppableId;

    setColumns((prev) => {
      const next = { ...prev, [from]: [...prev[from]], [to]: [...prev[to]] };
      const [moved] = next[from].splice(source.index, 1);
      moved.stage = to;
      // If dropped back where it started, keep it in the same array.
      const target = from === to ? next[from] : next[to];
      target.splice(destination.index, 0, moved);
      return next;
    });

    if (from !== to) {
      const stageTitle = pipelineStages.find((s) => s.id === to)?.title;
      setToast(`✓ Opportunity moved to ${stageTitle} · Synced to Salesforce`);
    } else {
      setToast('');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Pipeline summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Expansion Pipeline"
          value={formatCurrency(pipelineSummary.totalPipeline)}
          sub="All open opportunities"
          accent="text-brand-600"
          icon={Layers}
        />
        <MetricCard
          label="Weighted Pipeline"
          value={formatCurrency(pipelineSummary.weightedPipeline)}
          sub="Confidence-adjusted"
          accent="text-emerald-600"
          icon={TrendingUp}
        />
        <MetricCard
          label="Avg Deal Size"
          value={formatCurrency(pipelineSummary.avgDealSize)}
          sub="Across pipeline"
          icon={DollarSign}
        />
        <MetricCard
          label="Win Rate"
          value={`${pipelineSummary.winRate}%`}
          sub="Trailing 4 quarters"
          accent="text-emerald-600"
          icon={Percent}
        />
      </div>

      <SectionTitle icon={Target} title="Expansion Pipeline" hint="Drag cards between stages" />

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => {
            const items = columns[stage.id] || [];
            const total = items.reduce((sum, o) => sum + mid(o), 0);
            return (
              <div key={stage.id} className="flex w-72 shrink-0 flex-col">
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{stage.title}</span>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-[11px] font-bold text-slate-600">
                      {items.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {total > 0 ? formatCurrency(total) : '—'}
                  </span>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex min-h-[120px] flex-1 flex-col gap-2.5 rounded-xl border p-2.5 transition-colors ${
                        snapshot.isDraggingOver
                          ? 'border-brand-300 bg-brand-50/50'
                          : 'border-slate-200 bg-slate-100/70'
                      }`}
                    >
                      {items.map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(dp, ds) => (
                            <div
                              ref={dp.innerRef}
                              {...dp.draggableProps}
                              {...dp.dragHandleProps}
                              style={dp.draggableProps.style}
                            >
                              <OppCard opp={opp} dragging={ds.isDragging} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-1 items-center justify-center py-6 text-[11px] text-slate-400">
                          Drop opportunities here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
