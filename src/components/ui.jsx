import { useEffect } from 'react';
import { X } from 'lucide-react';
import { healthClasses } from '../lib/format.js';

// ---- Page scaffolding -------------------------------------------------------

export function PageHeader({ eyebrow, title, subtitle, actions, children }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ icon: Icon, title, hint, right }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={17} className="text-slate-400" />}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        {hint && <span className="text-xs text-slate-400">· {hint}</span>}
      </div>
      {right}
    </div>
  );
}

// ---- Badges -----------------------------------------------------------------

export function Badge({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

// ---- Metric card ------------------------------------------------------------

export function MetricCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="card p-4 transition-shadow hover:shadow-cardhover">
      <div className="flex items-center justify-between">
        <span className="metric-label">{label}</span>
        {Icon && <Icon size={15} className="text-slate-300" />}
      </div>
      <div className={`mt-2 text-2xl font-bold tracking-tight ${accent || 'text-slate-900'}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

// ---- Confidence / progress bar ---------------------------------------------

export function ConfidenceBar({ value, className = '', showLabel = true }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 65 ? 'bg-brand-500' : 'bg-amber-500';
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-semibold text-slate-600">
          {value}%
        </span>
      )}
    </div>
  );
}

// ---- Circular health ring ---------------------------------------------------

export function HealthRing({ score, size = 72, stroke = 7 }) {
  const cls = healthClasses(score);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eef2f7" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={cls.stroke}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${cls.text}`}>{score}</span>
      </div>
    </div>
  );
}

// ---- Sparkline --------------------------------------------------------------

export function Sparkline({ data, color = '#6366f1', width = 96, height = 30 }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---- Slide-over drawer ------------------------------------------------------

export function Drawer({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-pop animate-slide-in">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="pr-4">
            {subtitle && (
              <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                {subtitle}
              </div>
            )}
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

// ---- Buttons ----------------------------------------------------------------

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20 active:bg-brand-800',
    secondary:
      'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    dark: 'bg-slate-900 text-white hover:bg-slate-800',
  };
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus-ring disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ---- Toast (lightweight, self-dismissing) -----------------------------------

export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-fade-in">
      <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-pop">
        {message}
      </div>
    </div>
  );
}
