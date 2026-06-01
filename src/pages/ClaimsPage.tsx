import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, AlertTriangle, Eye, Edit } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Modal } from '../components/ui/Modal';
import { FileUploader } from '../components/ui/FileUploader';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import { Claim, Client, Policy, ClaimStatus } from '../types';
import { canEditClaims, canUpdateClaimStatus } from '../lib/access';

const statusColors: Record<ClaimStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  analyzing: 'bg-amber-100 text-amber-700',
  validated: 'bg-green-100 text-green-700',
  refused: 'bg-red-100 text-red-700',
  reimbursed: 'bg-teal-100 text-teal-700',
  closed: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<ClaimStatus, string> = {
  new: 'Nouveau', analyzing: 'En analyse', validated: 'Validé',
  refused: 'Refusé', reimbursed: 'Remboursé', closed: 'Clôturé',
};

const workflowSteps: { key: ClaimStatus; label: string }[] = [
  { key: 'new', label: 'Déclaration' },
  { key: 'analyzing', label: 'Analyse' },
  { key: 'validated', label: 'Validation' },
  { key: 'reimbursed', label: 'Remboursement' },
  { key: 'closed', label: 'Clôture' },
];

export function ClaimsPage() {
  const { profile } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewClaim, setViewClaim] = useState<Claim | null>(null);
  const [editClaim, setEditClaim] = useState<Claim | null>(null);
  const [saving, setSaving] = useState(false);
  const [copyingLinkId, setCopyingLinkId] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_id: '', policy_id: '', incident_date: new Date().toISOString().split('T')[0],
    incident_description: '', incident_location: '', estimated_amount: '', status: 'new',
    expert_report: '', approved_amount: '', media: [] as string[]
  });
  const [clientPolicies, setClientPolicies] = useState<Policy[]>([]);
  type ClientSummary = { first_name?: string | null; last_name?: string | null; phone?: string | null; email?: string | null };

  const loadClaims = useCallback(async () => {
    setLoading(true);
    const { data } = await backendApi.from('claims')
      .select('*, client:clients(first_name, last_name, phone, email), policy:policies(policy_number, insurance_type)')
      .eq('company_id', profile?.company_id)
      .order('created_at', { ascending: false });
    setClaims((data as Claim[]) ?? []);
    setLoading(false);
  }, [profile]);

  const loadClients = useCallback(async () => {
    const { data } = await backendApi.from('clients').select('id, first_name, last_name, phone, email')
      .eq('company_id', profile?.company_id).eq('is_active', true).order('first_name');
    setClients(data ?? []);
  }, [profile]);

  const loadPolicies = useCallback(async () => {
    const { data } = await backendApi.from('policies').select('id, policy_number, client_id, insurance_type')
      .eq('company_id', profile?.company_id).eq('status', 'active');
    setPolicies((data as Policy[]) ?? []);
  }, [profile]);

  useEffect(() => {
    if (profile?.company_id) {
      loadClaims();
      loadClients();
      loadPolicies();
    }
  }, [profile?.company_id, loadClaims, loadClients, loadPolicies]);

  async function onClientChange(clientId: string) {
    setForm(f => ({ ...f, client_id: clientId, policy_id: '' }));
    setClientPolicies(policies.filter(p => p.client_id === clientId));
  }

  function openNew() {
    setEditClaim(null);
    setForm({ client_id: '', policy_id: '', incident_date: new Date().toISOString().split('T')[0], incident_description: '', incident_location: '', estimated_amount: '', status: 'new', expert_report: '', approved_amount: '', media: [] });
    setClientPolicies([]);
    setModalOpen(true);
  }

  function openEdit(c: Claim) {
    setEditClaim(c);
    setClientPolicies(policies.filter(p => p.client_id === c.client_id));
    setForm({
      client_id: c.client_id, policy_id: c.policy_id, incident_date: c.incident_date,
      incident_description: c.incident_description, incident_location: c.incident_location ?? '',
      estimated_amount: String(c.estimated_amount), status: c.status,
      expert_report: c.expert_report ?? '', approved_amount: String(c.approved_amount), media: [],
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      client_id: form.client_id, policy_id: form.policy_id, incident_date: form.incident_date,
      incident_description: form.incident_description, incident_location: form.incident_location,
      estimated_amount: parseFloat(form.estimated_amount) || 0, status: form.status,
      expert_report: form.expert_report, approved_amount: parseFloat(form.approved_amount) || 0,
    };
    if (editClaim) {
      await backendApi.from('claims').update({ ...payload }).eq('id', editClaim.id);
    } else {
      const { data: inserted, error } = await backendApi.from('claims').insert({ ...payload }).select().single();
      if (!error && inserted && form.media && form.media.length > 0) {
        // create document records for each uploaded media and link to claim
        for (const url of form.media) {
          try {
            await backendApi.from('documents').insert({
              name: `Preuve ${inserted.claim_number}`,
              document_type: 'photo_accident',
              file_url: url,
              company_id: profile!.company_id,
              claim_id: inserted.id,
              uploaded_by: profile!.id,
            });
          } catch (e) { console.error('document insert failed', e); }
        }
      }
    }
    setSaving(false);
    setModalOpen(false);
    loadClaims();
  }

  const filtered = claims.filter(c => {
    const client = c.client as ClientSummary | undefined;
    const matchSearch = `${client?.first_name} ${client?.last_name} ${c.claim_number}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const canEdit = canEditClaims(profile?.role);
  const canUpdateStatus = canUpdateClaimStatus(profile?.role);

  function fmt(n: number) { return new Intl.NumberFormat('fr-FR').format(n) + ' XOF'; }

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

  async function copyPublicClaimLink(claimId: string) {
    try {
      setCopyingLinkId(claimId);
      const { data, error } = await backendApi.claims.generatePublicClaimLink(claimId);
      if (error || !data) throw error ?? new Error('Lien introuvable');
      await copyToClipboard(data.url);
      window.alert('Lien de déclaration copié. Vous pouvez l’envoyer au client.');
    } catch (error) {
      console.error(error);
      window.alert('Impossible de copier le lien de déclaration.');
    } finally {
      setCopyingLinkId(null);
    }
  }

  async function updateClaimStatus(claimId: string, status: ClaimStatus) {
    await backendApi.from('claims').update({ status }).eq('id', claimId);
    setClaims((prev) => prev.map((c) => (c.id === claimId ? { ...c, status } : c)));
    if (viewClaim?.id === claimId) setViewClaim((prev) => prev ? { ...prev, status } : prev);
  }

  return (
    <AppLayout title="Sinistres">
      <div className="space-y-5">
        {/* Status overview */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {workflowSteps.map((step) => {
            const count = claims.filter(c => c.status === step.key).length;
            return (
              <button key={step.key} onClick={() => setStatusFilter(statusFilter === step.key ? 'all' : step.key)}
                className={`p-3 rounded-xl border text-center transition-all ${statusFilter === step.key ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{step.label}</p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input placeholder="Rechercher un sinistre..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-700 placeholder-gray-400 w-full bg-transparent" />
          </div>
          {canEdit && (
            <button onClick={openNew}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0">
              <Plus className="w-4 h-4" /> Déclarer un sinistre
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
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Aucun sinistre trouvé</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">N° Sinistre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Date incident</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Montant estimé</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Montant approuvé</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((claim) => {
                    const client = claim.client as ClientSummary | undefined;
                    return (
                      <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono font-medium text-gray-700">{claim.claim_number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{client?.first_name} {client?.last_name}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-500">
                          {new Date(claim.incident_date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-900">
                          {fmt(claim.estimated_amount)}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-sm font-medium text-green-700">
                          {claim.approved_amount > 0 ? fmt(claim.approved_amount) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[claim.status]}`}>
                            {statusLabels[claim.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setViewClaim(claim)} title="Voir le sinistre" aria-label="Voir le sinistre"
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <button onClick={() => openEdit(claim)} title="Modifier le sinistre" aria-label="Modifier le sinistre"
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
              {filtered.map((claim) => {
                const client = claim.client as ClientSummary | undefined;
                return (
                  <article key={claim.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-gray-500 truncate">{claim.claim_number}</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{client?.first_name} {client?.last_name}</p>
                      </div>
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusColors[claim.status]}`}>
                        {statusLabels[claim.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400 uppercase tracking-wider mb-0.5">Date</p>
                        <p className="text-gray-700">{new Date(claim.incident_date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase tracking-wider mb-0.5">Montant estimé</p>
                        <p className="text-gray-700 truncate">{fmt(claim.estimated_amount)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => setViewClaim(claim)}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Voir details
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => openEdit(claim)}
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
        <p className="text-xs text-gray-400">{filtered.length} sinistre(s)</p>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editClaim ? 'Modifier le sinistre' : 'Déclarer un sinistre'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
            <select value={form.client_id} onChange={(e) => onClientChange(e.target.value)} aria-label="Client" title="Client"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
              <option value="">Sélectionner un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contrat *</label>
            <select value={form.policy_id} onChange={(e) => setForm(f => ({ ...f, policy_id: e.target.value }))} aria-label="Contrat" title="Contrat"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
              <option value="">Sélectionner un contrat</option>
              {clientPolicies.map(p => <option key={p.id} value={p.id}>{p.policy_number}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de l'incident *</label>
            <input type="date" value={form.incident_date} onChange={(e) => setForm(f => ({ ...f, incident_date: e.target.value }))} aria-label="Date de l'incident" title="Date de l'incident"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lieu de l'incident</label>
            <input type="text" value={form.incident_location} onChange={(e) => setForm(f => ({ ...f, incident_location: e.target.value }))}
              placeholder="Ex: Carrefour Cadjehoun" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant estimé (XOF)</label>
            <input type="number" value={form.estimated_amount} onChange={(e) => setForm(f => ({ ...f, estimated_amount: e.target.value }))}
              placeholder="0" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
          </div>
          {canUpdateStatus && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
                <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} aria-label="Statut du sinistre" title="Statut du sinistre"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
                  {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant approuvé (XOF)</label>
                <input type="number" value={form.approved_amount} onChange={(e) => setForm(f => ({ ...f, approved_amount: e.target.value }))}
                  placeholder="0" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
              </div>
            </>
          )}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description de l'incident *</label>
            <textarea value={form.incident_description} onChange={(e) => setForm(f => ({ ...f, incident_description: e.target.value }))}
              rows={3} placeholder="Décrivez l'incident en détail..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preuves (photos / PDF)</label>
            <FileUploader multiple accept="image/*,application/pdf,video/*" onUploaded={(url) => setForm(f => ({ ...f, media: [...(f.media || []), url] }))} />
            <div className="flex gap-2 mt-2 flex-wrap">
              {(form.media || []).map((u, i) => (
                <div key={u} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs">
                  <a href={u} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Fichier {i + 1}</a>
                </div>
              ))}
            </div>
          </div>
          {canUpdateStatus && (
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rapport d'expertise</label>
              <textarea value={form.expert_report} onChange={(e) => setForm(f => ({ ...f, expert_report: e.target.value }))}
                rows={3} placeholder="Rapport de l'expert..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 resize-none" />
            </div>
          )}
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving || !form.client_id || !form.policy_id || !form.incident_description}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {editClaim ? 'Enregistrer' : 'Déclarer'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewClaim} onClose={() => setViewClaim(null)} title="Détails du sinistre" size="lg">
        {viewClaim && (
          <div className="space-y-4">
            {/* Workflow */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {workflowSteps.map((step, i) => {
                const stepIndex = workflowSteps.findIndex(s => s.key === viewClaim.status);
                const currentIndex = workflowSteps.findIndex(s => s.key === step.key);
                const isDone = currentIndex <= stepIndex && viewClaim.status !== 'refused';
                return (
                  <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${isDone && viewClaim.status !== 'refused' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0 ${isDone ? 'border-white' : 'border-gray-300'}`}>
                        {isDone ? '✓' : workflowSteps.findIndex(s => s.key === step.key) + 1}
                      </span>
                      {step.label}
                    </div>
                    {i < workflowSteps.length - 1 && <div className="w-4 h-0.5 bg-gray-200 flex-shrink-0" />}
                  </div>
                );
              })}
              {viewClaim.status === 'refused' && (
                <span className="text-xs font-medium px-2.5 py-1.5 rounded-full bg-red-100 text-red-700 ml-2">Refusé</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {viewClaim.status !== 'closed' && (
                <button
                  onClick={() => copyPublicClaimLink(viewClaim.id)}
                  disabled={copyingLinkId === viewClaim.id}
                  className="px-3 py-2 text-sm rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                >
                  {copyingLinkId === viewClaim.id ? 'Copie...' : 'Copier le lien client'}
                </button>
              )}
              {viewClaim.status === 'new' && (
                <button onClick={() => updateClaimStatus(viewClaim.id, 'analyzing')} className="px-3 py-2 text-sm rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100">
                  Passer en analyse
                </button>
              )}
              {viewClaim.status === 'analyzing' && (
                <>
                  <button onClick={() => updateClaimStatus(viewClaim.id, 'validated')} className="px-3 py-2 text-sm rounded-lg bg-green-50 text-green-700 hover:bg-green-100">
                    Valider
                  </button>
                  <button onClick={() => updateClaimStatus(viewClaim.id, 'refused')} className="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100">
                    Refuser
                  </button>
                </>
              )}
              {viewClaim.status === 'validated' && (
                <button onClick={() => updateClaimStatus(viewClaim.id, 'reimbursed')} className="px-3 py-2 text-sm rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100">
                  Marquer remboursé
                </button>
              )}
              {viewClaim.status === 'reimbursed' && (
                <button onClick={() => updateClaimStatus(viewClaim.id, 'closed')} className="px-3 py-2 text-sm rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100">
                  Clôturer
                </button>
              )}
              {viewClaim.status === 'validated' && (
                <button onClick={() => updateClaimStatus(viewClaim.id, 'reimbursed')} className="px-3 py-2 text-sm rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100">
                  Marquer remboursé
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoRow label="N° Sinistre" value={viewClaim.claim_number} />
              <InfoRow label="Statut" value={statusLabels[viewClaim.status]} />
              <InfoRow label="Client" value={`${(viewClaim.client as ClientSummary | undefined)?.first_name ?? ''} ${(viewClaim.client as ClientSummary | undefined)?.last_name ?? ''}`.trim()} />
              <InfoRow label="Telephone client" value={(viewClaim.client as ClientSummary | undefined)?.phone} />
              <InfoRow label="Email client" value={(viewClaim.client as ClientSummary | undefined)?.email} />
              <InfoRow label="Date incident" value={new Date(viewClaim.incident_date).toLocaleDateString('fr-FR')} />
              <InfoRow label="Lieu" value={viewClaim.incident_location} />
              <InfoRow label="Montant estimé" value={fmt(viewClaim.estimated_amount)} />
              <InfoRow label="Montant approuvé" value={viewClaim.approved_amount > 0 ? fmt(viewClaim.approved_amount) : undefined} />
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700">{viewClaim.incident_description}</p>
            </div>
            {viewClaim.expert_report && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs font-medium text-blue-600 mb-1">Rapport d'expertise</p>
                <p className="text-sm text-gray-700">{viewClaim.expert_report}</p>
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
