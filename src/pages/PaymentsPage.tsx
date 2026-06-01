import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, CreditCard, Eye, CheckCircle, Clock } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import { Payment, Client, Policy, Claim, PaymentStatus } from '../types';
import { canManageOperationalData } from '../lib/access';

const statusColors: Record<PaymentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};
const statusLabels: Record<PaymentStatus, string> = {
  pending: 'En attente', completed: 'Complété', failed: 'Échoué', cancelled: 'Annulé'
};

const methodLabels: Record<string, string> = {
  mobile_money: 'Mobile Money', card: 'Carte bancaire', transfer: 'Virement', cash: 'Espèces'
};

const typeLabels: Record<string, string> = {
  premium: 'Prime (encaissement)', reimbursement: 'Remboursement sinistre', commission: 'Commission'
};

const FEDAPAY_MAX_AMOUNT = 999999998;

export function PaymentsPage() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);
  const [copyingLinkId, setCopyingLinkId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'manual' | 'fedapay'>('manual');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [form, setForm] = useState({
    client_id: '', policy_id: '', claim_id: '', amount: '',
    payment_type: 'premium', payment_method: 'mobile_money',
    status: 'completed', reference: '', notes: '',
    payment_date: new Date().toISOString().split('T')[0],
  });
  const [clientPolicies, setClientPolicies] = useState<Policy[]>([]);
  const [clientClaims, setClientClaims] = useState<Claim[]>([]);
  type ClientSummary = { first_name?: string | null; last_name?: string | null; phone?: string | null; email?: string | null };
  type FedapayResponse = { redirect_url?: string };

  const loadPayments = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    const { data } = await backendApi.from('payments')
      .select('*, client:clients(first_name, last_name, phone, email), policy:policies(policy_number)')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });
    setPayments((data as Payment[]) ?? []);
    setLoading(false);
  }, [profile]);

  const loadClients = useCallback(async () => {
    if (!profile?.company_id) return;
    const { data } = await backendApi.from('clients').select('id, first_name, last_name, phone, email')
      .eq('company_id', profile.company_id).eq('is_active', true).order('first_name');
    setClients(data ?? []);
  }, [profile]);

  const loadPolicies = useCallback(async () => {
    if (!profile?.company_id) return;
    const { data } = await backendApi.from('policies').select('id, policy_number, client_id')
      .eq('company_id', profile.company_id).eq('status', 'active');
    setPolicies((data as Policy[]) ?? []);
  }, [profile]);

  const loadClaims = useCallback(async () => {
    if (!profile?.company_id) return;
    const { data } = await backendApi.from('claims').select('id, claim_number, client_id, status')
      .eq('company_id', profile.company_id).order('created_at', { ascending: false });
    setClaims((data as Claim[]) ?? []);
  }, [profile]);

  useEffect(() => {
    if (profile?.company_id) { loadPayments(); loadClients(); loadPolicies(); loadClaims(); }
  }, [profile?.company_id, loadPayments, loadClients, loadPolicies, loadClaims]);

  function onClientChange(clientId: string) {
    const selectedClient = clients.find((c) => c.id === clientId) as ClientSummary | undefined;
    setForm(f => ({ ...f, client_id: clientId, policy_id: '', claim_id: '' }));
    setClientPolicies(policies.filter(p => p.client_id === clientId));
    setClientClaims(claims.filter(c => c.client_id === clientId));
    setPhoneNumber(selectedClient?.phone ?? '');
  }

  function onPaymentTypeChange(paymentType: string) {
    setForm((f) => ({
      ...f,
      payment_type: paymentType,
      policy_id: paymentType === 'premium' ? f.policy_id : '',
      claim_id: paymentType === 'reimbursement' ? f.claim_id : '',
    }));
    if (paymentType === 'commission' && paymentMode === 'fedapay') {
      setPaymentMode('manual');
    }
  }

  function resetModalState() {
    setModalOpen(false);
    setPaymentMode('manual');
    setForm({
      client_id: '', policy_id: '', claim_id: '', amount: '',
      payment_type: 'premium', payment_method: 'mobile_money',
      status: 'completed', reference: '', notes: '',
      payment_date: new Date().toISOString().split('T')[0],
    });
    setPhoneNumber('');
    setClientPolicies([]);
    setClientClaims([]);
  }

  async function copyToClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const amount = parseFloat(form.amount) || 0;
      if (paymentMode === 'fedapay') {
        if (amount < 100) {
          window.alert('Montant FedaPay invalide. Minimum 100 XOF.');
          return;
        }

        if (amount >= FEDAPAY_MAX_AMOUNT) {
          window.alert(`Montant trop élevé pour FedaPay. Maximum ${FEDAPAY_MAX_AMOUNT.toLocaleString('fr-FR')} XOF.`);
          return;
        }
      }

      if (paymentMode === 'fedapay' && form.payment_type === 'premium') {
        try {
          const { data, error } = await backendApi.payments.createFedapayPolicyPayment({
            policyId: form.policy_id,
            clientId: form.client_id,
            amount,
            phoneNumber,
          });

          if (error) throw error;

          const fedapayData = data as FedapayResponse | undefined;
          if (fedapayData?.redirect_url) {
            await copyToClipboard(fedapayData.redirect_url);
            window.alert('Lien FedaPay copié. Vous pouvez l’envoyer par WhatsApp, email ou autre.');
          } else {
            window.alert('Lien FedaPay introuvable.');
          }

          resetModalState();
          loadPayments();
          return;
        } catch (error) {
          throw error;
        }

        resetModalState();
        loadPayments();
        return;
      }

      if (paymentMode === 'fedapay' && form.payment_type === 'reimbursement') {
        window.alert('Un remboursement sinistre est une sortie d’argent. FedaPay n’est pas utilisé pour ce cas.');
        return;
      }

      await backendApi.from('payments').insert({
        client_id: form.client_id,
        policy_id: form.policy_id || undefined,
        claim_id: form.claim_id || undefined,
        amount,
        payment_type: form.payment_type,
        payment_method: form.payment_method,
        status: form.status,
        reference: form.reference,
        notes: form.notes,
        payment_date: new Date(form.payment_date).toISOString(),
        company_id: profile!.company_id,
        created_by: profile!.id,
      });

      resetModalState();
      loadPayments();
    } finally {
      setSaving(false);
    }
  }

  const filtered = payments.filter(p => {
    const client = p.client as ClientSummary | undefined;
    const matchSearch = `${client?.first_name} ${client?.last_name} ${p.reference ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCompleted = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  const canCreate = canManageOperationalData(profile?.role);
  function fmt(n: number) { return new Intl.NumberFormat('fr-FR').format(n) + ' XOF'; }

  async function updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    await backendApi.from('payments').update({ status }).eq('id', paymentId);
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status } : p)));
    if (viewPayment?.id === paymentId) setViewPayment((prev) => prev ? { ...prev, status } : prev);
  }

  async function copyPaymentLink(paymentId: string) {
    try {
      setCopyingLinkId(paymentId);
      const payment = payments.find((p) => p.id === paymentId);
      const link = payment?.fedapay_link;
      if (!link) {
        window.alert('Aucun lien FedaPay disponible.');
        return;
      }

      await copyToClipboard(link);
      window.alert('Lien de paiement copié. Vous pouvez l’envoyer manuellement par WhatsApp, email ou autre.');
    } catch (error) {
      console.error(error);
      window.alert('Impossible de copier le lien de paiement.');
    } finally {
      setCopyingLinkId(null);
    }
  }

  return (
    <AppLayout title="Paiements">
      <div className="space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total encaissé', value: fmt(totalCompleted), icon: CheckCircle, color: 'text-green-600 bg-green-50' },
            { label: 'En attente', value: fmt(totalPending), icon: Clock, color: 'text-amber-600 bg-amber-50' },
            { label: 'Nb paiements', value: payments.length, icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
            { label: 'Paiements complétés', value: payments.filter(p => p.status === 'completed').length, icon: CheckCircle, color: 'text-teal-600 bg-teal-50' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color.split(' ')[1]}`}>
                  <item.icon className={`w-4 h-4 ${item.color.split(' ')[0]}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 w-full bg-transparent" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer les paiements par statut" title="Filtrer les paiements par statut"
              className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none text-gray-700">
              <option value="all">Tous les statuts</option>
              {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {canCreate && (
            <button onClick={() => setModalOpen(true)} title="Enregistrer un paiement" aria-label="Enregistrer un paiement"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0">
              <Plus className="w-4 h-4" /> Enregistrer paiement
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Aucun paiement trouvé</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Méthode</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((payment) => {
                    const client = payment.client as ClientSummary | undefined;
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{client?.first_name} {client?.last_name}</p>
                          {payment.reference && <p className="text-xs text-gray-400">{payment.reference}</p>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${payment.payment_type === 'premium' ? 'bg-blue-50 text-blue-600' : payment.payment_type === 'reimbursement' ? 'bg-teal-50 text-teal-600' : 'bg-gray-50 text-gray-600'}`}>
                            {typeLabels[payment.payment_type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-500">
                          {methodLabels[payment.payment_method ?? ''] ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">{fmt(payment.amount)}</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-400">
                          {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[payment.status]}`}>
                            {statusLabels[payment.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setViewPayment(payment)} title="Voir le paiement" aria-label="Voir le paiement"
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((payment) => {
                const client = payment.client as ClientSummary | undefined;
                return (
                  <article key={payment.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{client?.first_name} {client?.last_name}</p>
                        <p className="text-xs text-gray-500 truncate">{payment.reference || 'Sans reference'}</p>
                      </div>
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusColors[payment.status]}`}>
                        {statusLabels[payment.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400 uppercase tracking-wider mb-0.5">Montant</p>
                        <p className="text-gray-700 font-semibold">{fmt(payment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase tracking-wider mb-0.5">Methode</p>
                        <p className="text-gray-700 truncate">{methodLabels[payment.payment_method ?? ''] ?? '—'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setViewPayment(payment)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Voir details
                    </button>
                  </article>
                );
              })}
            </div>
            </>
          )}
        </div>
        <p className="text-xs text-gray-400">{filtered.length} paiement(s)</p>
      </div>

      {/* Add Payment Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Enregistrer un paiement" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mode de traitement</label>
            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as 'manual' | 'fedapay')} aria-label="Mode de traitement" title="Mode de traitement"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
              <option value="manual">Comptabilisation manuelle</option>
              {form.payment_type === 'premium' && <option value="fedapay">FedaPay sandbox</option>}
            </select>
            <p className="mt-1 text-xs text-gray-400">Le mode FedaPay sert uniquement aux encaissements de primes client. Les remboursements sinistre sont gérés en sortie interne.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
            <select value={form.client_id} onChange={(e) => onClientChange(e.target.value)} aria-label="Client" title="Client"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
              <option value="">Sélectionner un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
          {form.payment_type === 'premium' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contrat *</label>
              <select value={form.policy_id} onChange={(e) => setForm(f => ({ ...f, policy_id: e.target.value }))} aria-label="Contrat associé" title="Contrat associé"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
                <option value="">Sélectionner un contrat</option>
                {clientPolicies.map(p => <option key={p.id} value={p.id}>{p.policy_number}</option>)}
              </select>
            </div>
          )}
          {form.payment_type === 'reimbursement' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sinistre *</label>
              <select value={form.claim_id} onChange={(e) => setForm(f => ({ ...f, claim_id: e.target.value }))} aria-label="Sinistre associé" title="Sinistre associé"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
                <option value="">Sélectionner un sinistre</option>
                {clientClaims.map(c => <option key={c.id} value={c.id}>{c.claim_number} — {c.status}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={form.payment_type} onChange={(e) => onPaymentTypeChange(e.target.value)} aria-label="Type de paiement" title="Type de paiement"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
                {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Méthode</label>
              <select value={paymentMode === 'fedapay' ? 'mobile_money' : form.payment_method} onChange={(e) => setForm(f => ({ ...f, payment_method: e.target.value }))} aria-label="Méthode de paiement" title="Méthode de paiement"
                disabled={paymentMode === 'fedapay' || form.payment_type === 'reimbursement'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500">
                {Object.entries(methodLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          {form.payment_type === 'reimbursement' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-medium">Remboursement sinistre = sortie d’argent</p>
              <p className="mt-1">Ce flux doit être enregistré comme un décaissement de l’entreprise vers le client. Aucun lien FedaPay n’est généré ici.</p>
            </div>
          )}
          {paymentMode === 'fedapay' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone Mobile Money *</label>
              <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+22967000000" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
              <p className="mt-1 text-xs text-gray-400">Saisir le numéro utilisé pour la transaction sandbox FedaPay.</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (XOF) *</label>
              <input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
              <select value={paymentMode === 'fedapay' ? 'pending' : form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} aria-label="Statut du paiement" title="Statut du paiement"
                disabled={paymentMode === 'fedapay'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500">
                {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de paiement</label>
            <input type="date" value={form.payment_date} onChange={(e) => setForm(f => ({ ...f, payment_date: e.target.value }))} aria-label="Date de paiement" title="Date de paiement"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Référence</label>
            <input type="text" value={form.reference} onChange={(e) => setForm(f => ({ ...f, reference: e.target.value }))}
              placeholder="N° de transaction" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} aria-label="Notes" title="Notes" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 resize-none" />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button onClick={resetModalState}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving || !form.client_id || !form.amount || (form.payment_type === 'premium' && !form.policy_id) || (form.payment_type === 'reimbursement' && !form.claim_id)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {paymentMode === 'fedapay' && form.payment_type === 'premium' ? 'Créer transaction FedaPay' : 'Enregistrer'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewPayment} onClose={() => setViewPayment(null)} title="Détails du paiement" size="sm">
        {viewPayment && (
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-4 rounded-xl ${statusColors[viewPayment.status].replace('text-', 'bg-').split(' ')[0]} bg-opacity-10`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColors[viewPayment.status]}`}>
                {viewPayment.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-xl text-gray-900">{new Intl.NumberFormat('fr-FR').format(viewPayment.amount)} XOF</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[viewPayment.status]}`}>
                  {statusLabels[viewPayment.status]}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {viewPayment.status !== 'completed' && (
                <button onClick={() => updatePaymentStatus(viewPayment.id, 'completed')} className="px-3 py-2 text-sm rounded-lg bg-green-50 text-green-700 hover:bg-green-100">
                  Marquer comme complété
                </button>
              )}
              {viewPayment.status !== 'cancelled' && (
                <button onClick={() => updatePaymentStatus(viewPayment.id, 'cancelled')} className="px-3 py-2 text-sm rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100">
                  Annuler
                </button>
              )}
              {canCreate && viewPayment.payment_type !== 'commission' && viewPayment.status !== 'cancelled' && (
                <button
                  onClick={async () => {
                    if (!confirm('Confirmer le remboursement/payout pour ce paiement ?')) return;
                    try {
                      const { data, error } = await backendApi.payments.refundPayment(viewPayment.id);
                      if (error) throw error;
                      window.alert('Demande de remboursement traitée. Voir logs pour détails.');
                      loadPayments();
                      setViewPayment(null);
                    } catch (err) {
                      console.error(err);
                      window.alert('Échec du remboursement automatique. Voir logs.');
                    }
                  }}
                  className="px-3 py-2 text-sm rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                >
                  Rembourser / Payer
                </button>
              )}
              {canCreate && viewPayment.payment_type === 'reimbursement' && (
                <button
                  onClick={async () => {
                    if (!confirm('Marquer ce remboursement comme payé manuellement ?')) return;
                    try {
                      const payload = {
                        status: 'completed',
                        refunded_at: new Date().toISOString(),
                        refund_method: 'manual',
                        refund_metadata: { note: 'Paiement manuel effectué' },
                      };
                      const { data, error } = await backendApi.from('payments').update(payload).eq('id', viewPayment.id);
                      if (error) throw error;
                      window.alert('Paiement marqué comme payé.');
                      loadPayments();
                      setViewPayment(null);
                    } catch (err) {
                      console.error(err);
                      window.alert('Impossible de marquer comme payé. Voir console.');
                    }
                  }}
                  className="px-3 py-2 text-sm rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                >
                  Marquer payé manuellement
                </button>
              )}
              {viewPayment.status === 'failed' && (
                <button onClick={() => updatePaymentStatus(viewPayment.id, 'pending')} className="px-3 py-2 text-sm rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100">
                  Remettre en attente
                </button>
              )}
              {viewPayment.fedapay_link && viewPayment.status === 'pending' && (
                <button
                  onClick={() => copyPaymentLink(viewPayment.id)}
                  disabled={copyingLinkId === viewPayment.id}
                  className="px-3 py-2 text-sm rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                >
                  {copyingLinkId === viewPayment.id ? 'Copie...' : 'Copier le lien'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoRow label="Client" value={`${(viewPayment.client as ClientSummary | undefined)?.first_name ?? ''} ${(viewPayment.client as ClientSummary | undefined)?.last_name ?? ''}`.trim()} />
              <InfoRow label="Telephone client" value={(viewPayment.client as ClientSummary | undefined)?.phone} />
              <InfoRow label="Email client" value={(viewPayment.client as ClientSummary | undefined)?.email} />
              <InfoRow label="Type" value={typeLabels[viewPayment.payment_type]} />
              <InfoRow label="Méthode" value={methodLabels[viewPayment.payment_method ?? ''] ?? '—'} />
              <InfoRow label="Référence" value={viewPayment.reference} />
              <InfoRow label="Lien FedaPay" value={viewPayment.fedapay_link} />
              <InfoRow label="Date" value={new Date(viewPayment.payment_date).toLocaleDateString('fr-FR')} />
              <InfoRow label="Remboursé le" value={viewPayment.refunded_at ? new Date(viewPayment.refunded_at).toLocaleString('fr-FR') : '—'} />
              <InfoRow label="Méthode de remboursement" value={viewPayment.refund_method ?? '—'} />
              <InfoRow label="Détails remboursement" value={viewPayment.refund_metadata ? JSON.stringify(viewPayment.refund_metadata) : '—'} />
            </div>
            {viewPayment.notes && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
                <p className="text-sm text-gray-700">{viewPayment.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-gray-900 font-medium">{value || '—'}</p>
    </div>
  );
}
