import { Menu, Bell, ChevronDown, Search, HelpCircle, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import OnboardingTour from '../ui/OnboardingTour';
import { roleLabel } from '../../lib/roleLabels';
import { api as backendApi } from '../../lib/api';
import { Notification } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
}

export function Header({ onToggleSidebar, title }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showTour, setShowTour] = useState(() => localStorage.getItem('assurlink.tour_shown') !== 'true');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function formatRelativeDate(date: string) {
    const diffMs = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'A l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `il y a ${days} j`;
    return new Date(date).toLocaleDateString('fr-FR');
  }

  async function loadNotifications() {
    if (!profile?.id) return;
    setLoadingNotifications(true);
    const { data } = await backendApi
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);
    setNotifications((data as Notification[]) ?? []);
    setLoadingNotifications(false);
  }

  async function markRead(id: string) {
    await backendApi.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  function goToNotifications() {
    setShowNotifications(false);
    window.history.pushState({}, '', '/notifications');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  // Fermer les menus en cliquant ailleurs
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (profile?.id) {
      loadNotifications();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (showNotifications) {
      loadNotifications();
    }
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="Basculer la barre latérale"
          title="Basculer la barre latérale"
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-72 lg:w-80 shadow-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 w-full"
          />
        </div>

        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full text-[10px] leading-4 text-white font-bold text-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-40">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {loadingNotifications ? (
                  <div className="p-6 text-center text-sm text-gray-500">Chargement...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">Aucune notification</div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        if (!notif.is_read) {
                          void markRead(notif.id);
                        }
                      }}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${notif.is_read ? '' : 'bg-blue-50/40'}`}
                    >
                      <p className={`text-sm font-medium ${notif.is_read ? 'text-gray-800' : 'text-gray-900'}`}>{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatRelativeDate(notif.created_at)}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-gray-100 text-center">
                <button onClick={goToNotifications} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Voir toutes les notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help / Tour */}
          <button onClick={() => setShowTour(true)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Aide" title="Aide / Tour">
          <HelpCircle className="w-5 h-5 text-gray-600" />
        </button>

        {/* User */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Menu utilisateur"
            title="Menu utilisateur"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{roleLabel(profile?.role)}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-40">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs text-gray-500">Connecté en tant que</p>
                <p className="text-sm font-semibold text-gray-900">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Settings className="w-4 h-4" /> Paramètres
              </button>
              <button
                onClick={() => {
                  signOut();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100"
              >
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
      <OnboardingTour open={showTour} onClose={() => setShowTour(false)} />
    </header>
  );
}
