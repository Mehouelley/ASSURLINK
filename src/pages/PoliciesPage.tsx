import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, FileText, Eye, Edit, Calendar } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import { Policy, Client, InsuranceType, PolicyStatus } from '../types';
import { canManageOperationalData } from '../lib/access';

const statusColors: Record<PolicyStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
};
const statusLabels: Record<PolicyStatus, string> = {
  draft: 'Brouillon', active: 'Actif', suspended: 'Suspendu', expired: 'Expiré', cancelled: 'Résilié'
};

const insuranceLabels: Record<InsuranceType, string> = {
  automobile: 'Automobile', sante: 'Santé', vie: 'Vie', habitation: 'Habitation',
  voyage: 'Voyage', entreprise: 'Entreprise', moto: 'Moto'
};

const insuranceIcons: Record<InsuranceType, string> = {
  automobile: '🚗', sante: '🏥', vie: '❤️', habitation: '🏠',
  voyage: '✈️', entreprise: '🏢', moto: '🏍️'
};

const FEDAPAY_MAX_AMOUNT = 999999998;

export function PoliciesPage() {
  const { profile } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewPolicy, setViewPolicy] = useState<Policy | null>(null);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: '', insurance_type: 'automobile', status: 'active',
    premium_amount: '', coverage_amount: '', deductible: '0',
    start_date: '', end_date: '', description: ''
  });
  type ClientSummary = { first_name?: string | null; last_name?: string | null; phone?: string | null; email?: string | null };
  type FedapayResponse = { redirect_url?: string };

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    const { data } = await backendApi
      .from('policies')
      .select('*, client:clients(first_name, last_name, phone, email)')
      .eq('company_id', profile?.company_id)
      .order('created_at', { ascending: false });
    setPolicies((data as Policy[]) ?? []);
    setLoading(false);
  }, [profile]);

  const loadClients = useCallback(async () => {
    const { data } = await backendApi.from('clients').select('id, first_name, last_name, phone, email')
      .eq('company_id', profile?.company_id).eq('is_active', true).order('first_name');
    setClients(data ?? []);
  }, [profile]);

  const loadPayments = useCallback(async () => {
    const { data } = await backendApi.from('payments').select('id, policy_id, status')
      .eq('company_id', profile?.company_id).order('created_at', { ascending: false });
    setPayments(data ?? []);
  }, [profile]);

  useEffect(() => {
    if (profile?.company_id) {
      loadPolicies();
      loadClients();
      loadPayments();
    }
  }, [profile?.company_id, loadPolicies, loadClients, loadPayments]);

  function openNew() {
    setEditPolicy(null);
    setForm({ client_id: '', insurance_type: 'automobile', status: 'active', premium_amount: '', coverage_amount: '', deductible: '0', start_date: new Date().toISOString().split('T')[0], end_date: '', description: '' });
    setModalOpen(true);
  }

  function openEdit(p: Policy) {
    setEditPolicy(p);
    setForm({
      client_id: p.client_id, insurance_type: p.insurance_type, status: p.status,
      premium_amount: String(p.premium_amount), coverage_amount: String(p.coverage_amount),
      deductible: String(p.deductible), start_date: p.start_date, end_date: p.end_date, description: p.description ?? ''
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      client_id: form.client_id, insurance_type: form.insurance_type, status: form.status,
      premium_amount: parseFloat(form.premium_amount) || 0,
      coverage_amount: parseFloat(form.coverage_amount) || 0,
      deductible: parseFloat(form.deductible) || 0,
      start_date: form.start_date, end_date: form.end_date, description: form.description,
    };
    if (editPolicy) {
      await backendApi.from('policies').update({ ...payload }).eq('id', editPolicy.id);
    } else {
      await backendApi.from('policies').insert({ ...payload });
    }
    setSaving(false);
    setModalOpen(false);
    loadPolicies();
  }

  const filtered = policies.filter(p => {
    const client = p.client as ClientSummary | undefined;
    const matchSearch = `${client?.first_name} ${client?.last_name} ${p.policy_number}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const canEdit = canManageOperationalData(profile?.role);

  function fmt(amount: number) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
  }

  async function updatePolicyStatus(policyId: string, status: PolicyStatus, extra: Record<string, unknown> = {}) {
    await backendApi.from('policies').update({ status, ...extra }).eq('id', policyId);
    setPolicies((prev) => prev.map((p) => (p.id === policyId ? { ...p, status, ...extra } as Policy : p)));
    if (viewPolicy?.id === policyId) {
      setViewPolicy((prev) => prev ? ({ ...prev, status, ...extra } as Policy) : prev);
    }
  }

  async function renewPolicy(policy: Policy) {
    const start = new Date(policy.end_date);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    await updatePolicyStatus(policy.id, 'active', {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    });
  }

  function isPolicyPaid(policyId: string): boolean {
    return payments.some(p => p.policy_id === policyId && p.status === 'completed');
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

  async function startFedapayPolicyPayment(policy: Policy) {
    const client = policy.client as Client | undefined;
    if (!client?.phone) return;
    const amount = Math.round(Number(policy.premium_amount) || 0);

    if (amount < 100) {
      window.alert('Montant FedaPay invalide. Minimum 100 XOF.');
      return;
    }

    if (amount >= FEDAPAY_MAX_AMOUNT) {
      window.alert(`Montant trop élevé pour FedaPay. Maximum ${FEDAPAY_MAX_AMOUNT.toLocaleString('fr-FR')} XOF.`);
      return;
    }

    try {
      const { data, error } = await backendApi.payments.createFedapayPolicyPayment({
      policyId: policy.id,
      clientId: policy.client_id,
      amount,
      phoneNumber: client.phone,
      reference: policy.policy_number,
    });

      if (error) {
        throw error;
      }

      const fedapayData = data as FedapayResponse | undefined;
      const redirectUrl = fedapayData?.redirect_url;
      if (redirectUrl) {
        await copyToClipboard(redirectUrl);
        window.alert('Lien FedaPay copié. Vous pouvez l’envoyer par WhatsApp, email ou autre.');
      } else {
        window.alert('Lien FedaPay introuvable.');
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <AppLayout title="Contrats">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 w-full bg-transparent" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut" title="Filtrer par statut"
              className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none text-gray-700">
              <option value="all">Tous les statuts</option>
              {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {canEdit && (
            <button onClick={openNew}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0">
              <Plus className="w-4 h-4" /> Nouveau contrat
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
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Aucun contrat trouvé</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">N° Police</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Prime</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Période</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((policy) => {
                    const client = policy.client as ClientSummary | undefined;
                    return (
                      <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono font-medium text-gray-700">{policy.policy_number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{client?.first_name} {client?.last_name}</p>
                          <p className="text-xs text-gray-400">{client?.phone}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="flex items-center gap-1.5 text-sm text-gray-700">
                            <span>{insuranceIcons[policy.insurance_type]}</span>
                            {insuranceLabels[policy.insurance_type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-sm font-medium text-gray-900">
                          {fmt(policy.premium_amount)}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(policy.start_date).toLocaleDateString('fr-FR')} — {new Date(policy.end_date).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[policy.status]}`}>
                            {statusLabels[policy.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setViewPolicy(policy)} title="Voir le contrat" aria-label="Voir le contrat"
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <button onClick={() => openEdit(policy)} title="Modifier le contrat" aria-label="Modifier le contrat"
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((policy) => {
                const client = policy.client as ClientSummary | undefined;
                return (
                  <article key={policy.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-gray-500 truncate">{policy.policy_number}</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{client?.first_name} {client?.last_name}</p>
                      </div>
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusColors[policy.status]}`}>
                        {statusLabels[policy.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400 uppercase tracking-wider mb-0.5">Type</p>
                        <p className="text-gray-700 truncate">{insuranceIcons[policy.insurance_type]} {insuranceLabels[policy.insurance_type]}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase tracking-wider mb-0.5">Prime</p>
                        <p className="text-gray-700 truncate">{fmt(policy.premium_amount)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => setViewPolicy(policy)}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Voir details
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => openEdit(policy)}
                          className="flex-1 px-3 py-2 rounded-xl bg-blue-600 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Modifier
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            </>
          )}
        </div>
        <p className="text-xs text-gray-400">{filtered.length} contrat(s)</p>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editPolicy ? 'Modifier le contrat' : 'Nouveau contrat'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} aria-label="Client" title="Client"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
              <option value="">Sélectionner un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type d'assurance *</label>
            <select value={form.insurance_type} onChange={(e) => setForm({ ...form, insurance_type: e.target.value })} aria-label="Type d'assurance" title="Type d'assurance"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
              {Object.entries(insuranceLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} aria-label="Statut du contrat" title="Statut du contrat"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
              {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <NumField label="Montant prime (XOF) *" value={form.premium_amount} onChange={(v) => setForm({ ...form, premium_amount: v })} />
          <NumField label="Montant couverture (XOF)" value={form.coverage_amount} onChange={(v) => setForm({ ...form, coverage_amount: v })} />
          <NumField label="Franchise (XOF)" value={form.deductible} onChange={(v) => setForm({ ...form, deductible: v })} />
          <DateField label="Date début *" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
          <DateField label="Date fin *" value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} />
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} placeholder="Détails du contrat..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 resize-none" />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving || !form.client_id || !form.premium_amount || !form.start_date || !form.end_date}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {editPolicy ? 'Enregistrer' : 'Créer le contrat'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewPolicy} onClose={() => setViewPolicy(null)} title="Détails du contrat" size="md">
        {viewPolicy && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                {insuranceIcons[viewPolicy.insurance_type]}
              </div>
              <div>
                <p className="font-mono text-sm text-gray-500">{viewPolicy.policy_number}</p>
                <h3 className="text-lg font-bold text-gray-900">{insuranceLabels[viewPolicy.insurance_type]}</h3>
              </div>
              <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[viewPolicy.status]}`}>
                {statusLabels[viewPolicy.status]}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {viewPolicy.status !== 'active' && (
                <button onClick={() => updatePolicyStatus(viewPolicy.id, 'active')} className="px-3 py-2 text-sm rounded-lg bg-green-50 text-green-700 hover:bg-green-100">
                  Activer
                </button>
              )}
              {viewPolicy.status !== 'suspended' && (
                <button onClick={() => updatePolicyStatus(viewPolicy.id, 'suspended')} className="px-3 py-2 text-sm rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100">
                  Suspendre
                </button>
              )}
              {viewPolicy.status !== 'cancelled' && (
                <button onClick={() => updatePolicyStatus(viewPolicy.id, 'cancelled')} className="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100">
                  Résilier
                </button>
              )}
              {(viewPolicy.status === 'expired' || viewPolicy.status === 'cancelled') && (
                <button onClick={() => renewPolicy(viewPolicy)} className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                  Renouveler 1 an
                </button>
              )}
              {viewPolicy.status === 'active' && (viewPolicy.client as Client | undefined)?.phone && (
                isPolicyPaid(viewPolicy.id) ? (
                  <button disabled className="px-3 py-2 text-sm rounded-lg bg-green-50 text-green-700 cursor-not-allowed opacity-70">
                    ✓ Prime payée
                  </button>
                ) : (
                  <button onClick={() => startFedapayPolicyPayment(viewPolicy)} className="px-3 py-2 text-sm rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                    Copier le lien FedaPay
                  </button>
                )
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoRow label="Client" value={`${(viewPolicy.client as ClientSummary | undefined)?.first_name ?? ''} ${(viewPolicy.client as ClientSummary | undefined)?.last_name ?? ''}`.trim()} />
              <InfoRow label="Prime mensuelle" value={fmt(viewPolicy.premium_amount)} />
              <InfoRow label="Couverture" value={fmt(viewPolicy.coverage_amount)} />
              <InfoRow label="Franchise" value={fmt(viewPolicy.deductible)} />
              <InfoRow label="Début" value={new Date(viewPolicy.start_date).toLocaleDateString('fr-FR')} />
              <InfoRow label="Fin" value={new Date(viewPolicy.end_date).toLocaleDateString('fr-FR')} />
            </div>
            {viewPolicy.description && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700">{viewPolicy.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} min="0" placeholder="0"
        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} title={label}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
    </div>
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
