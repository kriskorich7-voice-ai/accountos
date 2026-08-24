import { Sparkles } from 'lucide-react';

// A reusable "AI-generated insight" callout, used across screens to signal
// which content is synthesized by AccountOS intelligence.
export default function AIInsight({ children, label = 'AI Insight', className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-4 ${className}`}
    >
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm shadow-brand-600/30">
          <Sparkles size={16} />
        </div>
        <div className="min-w-0">
          <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            {label}
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{children}</p>
        </div>
      </div>
    </div>
  );
}
