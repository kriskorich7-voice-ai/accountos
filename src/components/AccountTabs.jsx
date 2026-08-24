import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Layers, BrainCircuit, ListChecks } from 'lucide-react';

const tabs = [
  { to: '/account/acme', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/acme/adoption', label: 'Adoption', icon: Layers },
  { to: '/intelligence', label: 'Intelligence', icon: BrainCircuit },
  { to: '/actions', label: 'Actions', icon: ListChecks },
];

// Contextual sub-nav shown on Acme deep-dive screens.
export default function AccountTabs() {
  return (
    <div className="mb-6 flex gap-1 border-b border-slate-200">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
            }`
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </div>
  );
}
