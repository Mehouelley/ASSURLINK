import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import { Notification } from '../types';

const typeConfig: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
};

export function NotificationsPage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) loadNotifications();
  }, [profile?.id]);

  async function loadNotifications() {
    setLoading(true);
    const { data } = await backendApi
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${profile!.id},company_id.eq.${profile!.company_id}`)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
    setLoading(false);
  }

  async function markRead(id: string) {
    await backendApi.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await backendApi.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppLayout title="Notifications">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">Toutes les notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
              <CheckCheck className="w-4 h-4" /> Tout marquer comme lu
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">Aucune notification</p>
            <p className="text-sm text-gray-400 mt-1">Vous êtes à jour !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = typeConfig[notif.type] ?? typeConfig.info;
              const Icon = config.icon;
              return (
                <div key={notif.id}
                  className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-all ${notif.is_read ? 'border-gray-100 opacity-70' : 'border-blue-100 shadow-sm'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${notif.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                  {!notif.is_read && (
                    <button onClick={() => markRead(notif.id)} title="Marquer comme lu" aria-label="Marquer comme lu"
                      className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
