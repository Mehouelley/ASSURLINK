import { NavLink } from '../ui/NavLink';
import {
  LayoutDashboard, Users, FileText, CreditCard, AlertTriangle,
  FolderOpen, UserCheck, BarChart3, Settings, LogOut, Shield,
  Building2, Bell, Target, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { roleLabel } from '../../lib/roleLabels';
import { isAdminRole, isSalesRole, isExpertRole } from '../../lib/access';

const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/prospects', icon: Target, label: 'Prospects' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/policies', icon: FileText, label: 'Contrats' },
  { to: '/claims', icon: AlertTriangle, label: 'Sinistres' },
  { to: '/payments', icon: CreditCard, label: 'Paiements' },
  { to: '/agents', icon: UserCheck, label: 'Employes' },
  { to: '/users', icon: Users, label: 'Utilisateurs' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/reports', icon: BarChart3, label: 'Rapports' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

const agentNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/prospects', icon: Target, label: 'Prospects' },
  { to: '/clients', icon: Users, label: 'Mes Clients' },
  { to: '/policies', icon: FileText, label: 'Contrats' },
  { to: '/claims', icon: AlertTriangle, label: 'Sinistres' },
  { to: '/payments', icon: CreditCard, label: 'Paiements' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
];

const expertNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/claims', icon: AlertTriangle, label: 'Sinistres' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
];

const clientNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Mon Espace' },
  { to: '/policies', icon: FileText, label: 'Mes Contrats' },
  { to: '/claims', icon: AlertTriangle, label: 'Mes Sinistres' },
  { to: '/payments', icon: CreditCard, label: 'Mes Paiements' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
];

const superAdminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/companies', icon: Building2, label: 'Compagnies' },
  { to: '/users', icon: Users, label: 'Utilisateurs' },
  { to: '/reports', icon: BarChart3, label: 'Statistiques' },
  { to: '/settings', icon: Settings, label: 'Administration' },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { profile, company, signOut } = useAuth();

  const navItems = profile?.role === 'super_admin' ? superAdminNav
    : isAdminRole(profile?.role) ? adminNav
    : isSalesRole(profile?.role) ? agentNav
    : isExpertRole(profile?.role) ? expertNav
    : clientNav;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${collapsed ? 'md:w-16' : 'md:w-64'} w-72 max-w-[85vw]`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-bold text-lg tracking-tight block truncate">ASSURLINK</span>
                <p className="text-xs text-slate-400 truncate">Gestion assurance</p>
              </div>
            )}
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fermer le menu"
            title="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Company info */}
      {!collapsed && company && (
        <div className="px-4 py-3 border-b border-slate-700">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Compagnie</p>
          <p className="text-sm font-medium text-white truncate mt-0.5">{company.name}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} icon={item.icon} label={item.label} collapsed={collapsed} onNavigate={onCloseMobile} />
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-slate-700 p-2">
        {!collapsed && profile && (
          <div className="px-2 py-2 mb-1">
            <p className="text-sm font-medium text-white truncate">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs text-slate-400">{roleLabel(profile.role)}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Déconnexion</span>}
        </button>
      </div>
      </aside>
    </>
  );
}
