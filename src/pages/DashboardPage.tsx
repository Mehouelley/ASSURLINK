import { useEffect, useState } from 'react';
import { Users, FileText, AlertTriangle, CreditCard, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { StatCard } from '../components/ui/StatCard';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import { DashboardStats } from '../types';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  analyzing: 'bg-amber-100 text-amber-700',
  validated: 'bg-green-100 text-green-700',
  refused: 'bg-red-100 text-red-700',
  reimbursed: 'bg-teal-100 text-teal-700',
  closed: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  suspended: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  analyzing: 'En analyse',
  validated: 'Validé',
  refused: 'Refusé',
  reimbursed: 'Remboursé',
  closed: 'Clôturé',
  active: 'Actif',
  draft: 'Brouillon',
  suspended: 'Suspendu',
  expired: 'Expiré',
  pending: 'En attente',
  completed: 'Complété',
};

export function DashboardPage() {
  const { profile, company } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0, activePolicies: 0, openClaims: 0, monthlyRevenue: 0,
    pendingPayments: 0, totalPolicies: 0, totalClaims: 0, totalPayments: 0,
  });
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.company_id) return;
    loadStats();
  }, [profile?.company_id]);

  async function loadStats() {
    const cid = profile!.company_id;
    setLoading(true);

    const [clientsRes, policiesRes, claimsRes, paymentsRes] = await Promise.all([
      backendApi.from('clients').select('id', { count: 'exact' }).eq('company_id', cid).eq('is_active', true),
      backendApi.from('policies').select('id, status', { count: 'exact' }).eq('company_id', cid),
      backendApi.from('claims').select('id, status', { count: 'exact' }).eq('company_id', cid),
      backendApi.from('payments').select('id, amount, status, payment_date').eq('company_id', cid),
    ]);

    const activePolicies = policiesRes.data?.filter(p => p.status === 'active').length ?? 0;
    const openClaims = claimsRes.data?.filter(c => ['new', 'analyzing'].includes(c.status)).length ?? 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyRevenue = paymentsRes.data
      ?.filter(p => p.status === 'completed' && p.payment_date >= monthStart)
      .reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0;
    const pendingPayments = paymentsRes.data?.filter(p => p.status === 'pending').length ?? 0;

    setStats({
      totalClients: clientsRes.count ?? 0,
      activePolicies,
      openClaims,
      monthlyRevenue,
      pendingPayments,
      totalPolicies: policiesRes.count ?? 0,
      totalClaims: claimsRes.count ?? 0,
      totalPayments: paymentsRes.count ?? 0,
    });

    // Recent claims
    const { data: claims } = await backendApi
      .from('claims')
      .select('*, client:clients(first_name, last_name)')
      .eq('company_id', cid)
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentClaims(claims ?? []);

    // Recent payments
    const { data: payments } = await backendApi
      .from('payments')
      .select('*, client:clients(first_name, last_name)')
      .eq('company_id', cid)
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentPayments(payments ?? []);

    setLoading(false);
  }

  function fmt(amount: number) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
  }

  return (
    <AppLayout title="Tableau de bord">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold">Bonjour, {profile?.first_name} 👋</h2>
          <p className="text-blue-100 text-sm mt-1">
            Bienvenue sur {company?.name} · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-28 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-7 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Clients" value={stats.totalClients} subtitle="Clients actifs" icon={Users} color="blue" />
            <StatCard title="Contrats Actifs" value={stats.activePolicies} subtitle={`Sur ${stats.totalPolicies} contrats`} icon={FileText} color="green" />
            <StatCard title="Sinistres Ouverts" value={stats.openClaims} subtitle={`Sur ${stats.totalClaims} sinistres`} icon={AlertTriangle} color="amber" />
            <StatCard title="Revenus du mois" value={fmt(stats.monthlyRevenue)} subtitle="Paiements complétés" icon={TrendingUp} color="teal" />
            <StatCard title="Paiements en attente" value={stats.pendingPayments} icon={Clock} color="red" />
            <StatCard title="Total Contrats" value={stats.totalPolicies} icon={FileText} color="slate" />
            <StatCard title="Total Sinistres" value={stats.totalClaims} icon={AlertTriangle} color="slate" />
            <StatCard title="Total Paiements" value={stats.totalPayments} icon={CreditCard} color="slate" />
          </div>
        )}

        {/* Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent claims */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Sinistres récents</h3>
                <a href="/claims" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/claims'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                  className="text-sm text-blue-600 hover:underline">Voir tout</a>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {recentClaims.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Aucun sinistre enregistré</div>
              ) : recentClaims.map((claim) => (
                <div key={claim.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {claim.client?.first_name} {claim.client?.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{claim.claim_number}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[claim.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[claim.status] || claim.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent payments */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Paiements récents</h3>
                <a href="/payments" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/payments'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                  className="text-sm text-blue-600 hover:underline">Voir tout</a>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {recentPayments.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Aucun paiement enregistré</div>
              ) : recentPayments.map((payment) => (
                <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${payment.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'}`}>
                      {payment.status === 'completed'
                        ? <CheckCircle className="w-4 h-4 text-green-600" />
                        : <Clock className="w-4 h-4 text-amber-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.client?.first_name} {payment.client?.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(payment.payment_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{fmt(payment.amount)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[payment.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[payment.status] || payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
