// Shared formatting + color helpers.

export const formatCurrency = (value) => {
  if (value == null) return '—';
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${Math.round(value / 1_000)}K`;
  }
  return `$${value}`;
};

export const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value);

// Health color band: green 80+, amber 60–79, red <60.
export const healthColor = (score) => {
  if (score >= 80) return 'emerald';
  if (score >= 60) return 'amber';
  return 'rose';
};

export const healthClasses = (score) => {
  const band = healthColor(score);
  return {
    emerald: {
      text: 'text-emerald-600',
      bg: 'bg-emerald-500',
      bgSoft: 'bg-emerald-50',
      ring: 'ring-emerald-200',
      border: 'border-emerald-200',
      stroke: '#059669',
    },
    amber: {
      text: 'text-amber-600',
      bg: 'bg-amber-500',
      bgSoft: 'bg-amber-50',
      ring: 'ring-amber-200',
      border: 'border-amber-200',
      stroke: '#d97706',
    },
    rose: {
      text: 'text-rose-600',
      bg: 'bg-rose-500',
      bgSoft: 'bg-rose-50',
      ring: 'ring-rose-200',
      border: 'border-rose-200',
      stroke: '#e11d48',
    },
  }[band];
};

// Priority / severity badge styling: red HIGH, amber MEDIUM, blue LOW.
export const priorityClasses = (level) => {
  const key = (level || '').toUpperCase();
  return (
    {
      HIGH: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
      MEDIUM: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
      LOW: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    }[key] || 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'
  );
};

export const riskLevelClasses = (level) =>
  ({
    high: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    medium: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    low: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  })[level] || 'bg-slate-100 text-slate-600';

export const statusMeta = {
  attention: { label: 'Requires Attention', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  expanding: { label: 'Expanding', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  stable: { label: 'Stable', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  'at-risk': { label: 'At Risk', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
};
