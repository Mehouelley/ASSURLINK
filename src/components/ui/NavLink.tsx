import { LucideIcon } from 'lucide-react';
import { useLocation } from '../hooks/useLocation';

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function NavLink({ to, icon: Icon, label, collapsed, onNavigate }: NavLinkProps) {
  const location = useLocation();
  const isActive = location === to || (to !== '/dashboard' && location.startsWith(to));

  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
        onNavigate?.();
      }}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </a>
  );
}
