import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Building2,
  BrainCircuit,
  ListChecks,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const nav = [
  { to: '/', label: 'Portfolio', icon: LayoutGrid, end: true },
  { to: '/account/acme', label: 'Accounts', icon: Building2 },
  { to: '/intelligence', label: 'Intelligence', icon: BrainCircuit },
  { to: '/actions', label: 'Actions', icon: ListChecks },
  { to: '/copilot', label: 'AI Copilot', icon: Sparkles },
];

const sources = [
  'Salesforce',
  'Deepgram Usage API',
  'Product Analytics',
  'Support System',
  'Billing',
  'Slack',
];

export default function Sidebar() {
  const location = useLocation();
  // Accounts tab stays active across all /account/* and /adoption sub-routes.
  const accountActive =
    location.pathname.startsWith('/account') || location.pathname.startsWith('/adoption');

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-950 text-slate-300">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-lg shadow-brand-600/30">
          <svg viewBox="0 0 32 32" className="h-5 w-5">
            <path
              d="M9 21V11l7 5 7-5v10"
              fill="none"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className="text-[15px] font-bold leading-none tracking-tight text-white">
            AccountOS
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Account Intelligence
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon, end }) => {
          const forceActive = label === 'Accounts' && accountActive;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive || forceActive
                    ? 'bg-brand-600/15 text-white ring-1 ring-inset ring-brand-500/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={
                      isActive || forceActive
                        ? 'text-brand-300'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }
                  />
                  {label}
                  {label === 'AI Copilot' && (
                    <span className="ml-auto rounded bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-300">
                      Live
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Connected sources */}
      <div className="px-4 pb-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Connected Sources
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        </div>
        <div className="space-y-0.5 rounded-lg bg-white/[0.03] p-2 ring-1 ring-inset ring-white/5">
          {sources.map((s) => (
            <div key={s} className="flex items-center justify-between px-1 py-0.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-slate-400">{s}</span>
              </div>
              <span className="text-[10px] text-slate-600">14s ago</span>
            </div>
          ))}
        </div>
      </div>

      {/* Profile */}
      <div className="border-t border-white/5 px-3 py-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
            KK
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">Kris Korich</div>
            <div className="truncate text-[11px] text-slate-500">Strategic Account Manager</div>
          </div>
          <ChevronRight size={15} className="text-slate-600" />
        </button>
      </div>
    </aside>
  );
}
