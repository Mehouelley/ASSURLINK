import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, FileText, AlertTriangle, CreditCard, Users, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';

export function ReportsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0, totalClients: 0, activeContracts: 0,
    openClaims: 0, closedClaims: 0, refusedClaims: 0,
    pendingPayments: 0, completedPayments: 0,
    contractsByType: {} as Record<string, number>,
    claimsByStatus: {} as Record<string, number>,
    paymentsByMethod: {} as Record<string, number>,
  });

  useEffect(() => {
    if (profile?.company_id) loadStats();
  }, [profile?.company_id]);

  async function loadStats() {
    setLoading(true);
    const cid = profile!.company_id;

    const [clientsRes, policiesRes, claimsRes, paymentsRes] = await Promise.all([
      backendApi.from('clients').select('id', { count: 'exact' }).eq('company_id', cid).eq('is_active', true),
      backendApi.from('policies').select('id, status, insurance_type').eq('company_id', cid),
      backendApi.from('claims').select('id, status').eq('company_id', cid),
      backendApi.from('payments').select('id, amount, status, payment_method').eq('company_id', cid),
    ]);

    const policies = policiesRes.data ?? [];
    const claims = claimsRes.data ?? [];
    const payments = paymentsRes.data ?? [];

    const contractsByType: Record<string, number> = {};
    policies.forEach(p => { contractsByType[p.insurance_type] = (contractsByType[p.insurance_type] ?? 0) + 1; });

    const claimsByStatus: Record<string, number> = {};
    claims.forEach(c => { claimsByStatus[c.status] = (claimsByStatus[c.status] ?? 0) + 1; });

    const paymentsByMethod: Record<string, number> = {};
    payments.forEach(p => {
      if (p.payment_method) paymentsByMethod[p.payment_method] = (paymentsByMethod[p.payment_method] ?? 0) + 1;
    });

    const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount ?? 0), 0);

    setStats({
      totalRevenue,
      totalClients: clientsRes.count ?? 0,
      activeContracts: policies.filter(p => p.status === 'active').length,
      openClaims: claims.filter(c => ['new', 'analyzing'].includes(c.status)).length,
      closedClaims: claims.filter(c => c.status === 'closed').length,
      refusedClaims: claims.filter(c => c.status === 'refused').length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      completedPayments: payments.filter(p => p.status === 'completed').length,
      contractsByType,
      claimsByStatus,
      paymentsByMethod,
    });
    setLoading(false);
  }

  function fmt(n: number) { return new Intl.NumberFormat('fr-FR').format(n); }

  function handleExportPdf() {
    const doc = new jsPDF();
    const pdfDoc = doc as jsPDF & { lastAutoTable?: { finalY?: number } };
    const dateLabel = new Date().toLocaleDateString('fr-FR');

    doc.setFontSize(18);
    doc.text('ASSURLINK - Rapport de synthèse', 14, 16);
    doc.setFontSize(10);
    doc.text(`Date d'export : ${dateLabel}`, 14, 23);
    doc.text(`Client : ${profile?.company_id ?? 'N/A'}`, 14, 29);

    autoTable(doc, {
      startY: 36,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Revenus totaux', `${fmt(stats.totalRevenue)} XOF`],
        ['Clients actifs', String(stats.totalClients)],
        ['Contrats actifs', String(stats.activeContracts)],
        ['Sinistres ouverts', String(stats.openClaims)],
        ['Sinistres clôturés', String(stats.closedClaims)],
        ['Sinistres refusés', String(stats.refusedClaims)],
        ['Paiements complétés', String(stats.completedPayments)],
        ['Paiements en attente', String(stats.pendingPayments)],
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const contractsRows = Object.entries(stats.contractsByType).map(([key, value]) => [insuranceLabels[key] ?? key, String(value)]);
    const claimsRows = Object.entries(stats.claimsByStatus).map(([key, value]) => [claimStatusLabels[key] ?? key, String(value)]);
    const paymentsRows = Object.entries(stats.paymentsByMethod).map(([key, value]) => [methodLabels[key] ?? key, String(value)]);
    const startAfterSummary = pdfDoc.lastAutoTable?.finalY ?? 110;

    autoTable(doc, {
      startY: startAfterSummary + 10,
      head: [['Contrats par type', 'Nombre']],
      body: contractsRows.length > 0 ? contractsRows : [['Aucune donnée', '—']],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
    });

    autoTable(doc, {
      startY: (pdfDoc.lastAutoTable?.finalY ?? startAfterSummary) + 10,
      head: [['Sinistres par statut', 'Nombre']],
      body: claimsRows.length > 0 ? claimsRows : [['Aucune donnée', '—']],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245, 158, 11] },
    });

    autoTable(doc, {
      startY: (pdfDoc.lastAutoTable?.finalY ?? startAfterSummary) + 10,
      head: [['Paiements par méthode', 'Nombre']],
      body: paymentsRows.length > 0 ? paymentsRows : [['Aucune donnée', '—']],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 184, 166] },
    });

    doc.save(`rapport-assurlink-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const insuranceLabels: Record<string, string> = {
    automobile: 'Automobile', sante: 'Santé', vie: 'Vie', habitation: 'Habitation',
    voyage: 'Voyage', entreprise: 'Entreprise', moto: 'Moto'
  };

  const methodLabels: Record<string, string> = {
    mobile_money: 'Mobile Money', card: 'Carte bancaire', transfer: 'Virement', cash: 'Espèces'
  };

  const claimStatusLabels: Record<string, string> = {
    new: 'Nouveau', analyzing: 'En analyse', validated: 'Validé',
    refused: 'Refusé', reimbursed: 'Remboursé', closed: 'Clôturé',
  };

  const typeColors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-teal-500', 'bg-slate-500', 'bg-orange-500'];

  function BarChart({ data, labels, colors = typeColors }: { data: Record<string, number>; labels: Record<string, string>; colors?: string[] }) {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(e => e[1]), 1);
    return (
      <div className="space-y-3">
        {entries.map(([key, count], i) => (
          <div key={key} className="flex items-center gap-3">
            <div className="w-28 text-xs text-gray-600 text-right flex-shrink-0">{labels[key] ?? key}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden flex items-center">
              <svg className="w-full h-6" viewBox="0 0 100 24" role="img" aria-label={`${labels[key] ?? key}: ${count}`}>
                <rect x="0" y="0" width="100" height="24" rx="12" fill="#f3f4f6" />
                <rect x="0" y="0" width={Math.max((count / max) * 100, 5)} height="24" rx="12" fill={colors[i % colors.length].includes('blue') ? '#3b82f6' : colors[i % colors.length].includes('green') ? '#22c55e' : colors[i % colors.length].includes('amber') ? '#f59e0b' : colors[i % colors.length].includes('red') ? '#ef4444' : colors[i % colors.length].includes('teal') ? '#14b8a6' : colors[i % colors.length].includes('orange') ? '#f97316' : '#64748b'} />
                <text x="4" y="16" fill="#ffffff" fontSize="10" fontWeight="600">{count}</text>
              </svg>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>}
      </div>
    );
  }

  return (
    <AppLayout title="Rapports & Statistiques">
      <div className="space-y-6">
        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-24 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenus totaux', value: fmt(stats.totalRevenue) + ' XOF', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
              { label: 'Clients actifs', value: stats.totalClients, icon: Users, color: 'text-blue-600 bg-blue-50' },
              { label: 'Contrats actifs', value: stats.activeContracts, icon: FileText, color: 'text-teal-600 bg-teal-50' },
              { label: 'Sinistres ouverts', value: stats.openClaims, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
              { label: 'Sinistres clôturés', value: stats.closedClaims, icon: AlertTriangle, color: 'text-gray-600 bg-gray-50' },
              { label: 'Sinistres refusés', value: stats.refusedClaims, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
              { label: 'Paiements complétés', value: stats.completedPayments, icon: CreditCard, color: 'text-green-600 bg-green-50' },
              { label: 'Paiements en attente', value: stats.pendingPayments, icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${item.color.split(' ')[1]}`}>
                    <item.icon className={`w-5 h-5 ${item.color.split(' ')[0]}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                    <p className="text-lg font-bold text-gray-900">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contracts by type */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-1">
              <h3 className="font-semibold text-gray-900 mb-4">Contrats par type</h3>
              <BarChart data={stats.contractsByType} labels={insuranceLabels} />
            </div>

            {/* Claims by status */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-1">
              <h3 className="font-semibold text-gray-900 mb-4">Sinistres par statut</h3>
              <BarChart data={stats.claimsByStatus} labels={claimStatusLabels}
                colors={['bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-red-500', 'bg-teal-500', 'bg-gray-400']} />
            </div>

            {/* Payments by method */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-1">
              <h3 className="font-semibold text-gray-900 mb-4">Paiements par méthode</h3>
              <BarChart data={stats.paymentsByMethod} labels={methodLabels} />
            </div>
          </div>
        )}

        {/* Revenue summary */}
        {!loading && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Résumé financier</h3>
              <button onClick={handleExportPdf} className="flex items-center gap-2 text-sm text-blue-600 hover:underline" aria-label="Exporter le rapport en PDF" title="Exporter le rapport en PDF">
                <Download className="w-4 h-4" /> Exporter PDF
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-600 font-medium">Revenus confirmés</p>
                <p className="text-xl font-bold text-green-700 mt-1">{fmt(stats.totalRevenue)}</p>
                <p className="text-xs text-green-600">XOF</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs text-amber-600 font-medium">En attente</p>
                <p className="text-xl font-bold text-amber-700 mt-1">{stats.pendingPayments}</p>
                <p className="text-xs text-amber-600">paiements</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium">Taux de sinistralité</p>
                <p className="text-xl font-bold text-blue-700 mt-1">
                  {stats.activeContracts > 0 ? Math.round((stats.openClaims / stats.activeContracts) * 100) : 0}%
                </p>
                <p className="text-xs text-blue-600">sinistres / contrats</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-4">
                <p className="text-xs text-teal-600 font-medium">Satisfaction</p>
                <p className="text-xl font-bold text-teal-700 mt-1">
                  {(stats.closedClaims + stats.refusedClaims) > 0
                    ? Math.round((stats.closedClaims / (stats.closedClaims + stats.refusedClaims)) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-teal-600">dossiers résolus</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
