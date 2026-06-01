import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Target, Clock, User, TrendingUp, Eye, Edit, type LucideIcon } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import { Prospect, ProspectInteraction, Quote } from '../types';

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  interested: 'Intéressé',
  negotiating: 'Négociation',
  converted: 'Converti',
  lost: 'Perdu',
};

const statusColors: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'teal'> = {
  new: 'blue',
  contacted: 'blue',
  interested: 'amber',
  negotiating: 'teal',
  converted: 'green',
  lost: 'red',
};

const sourceLabels: Record<string, string> = {
  referral: 'Recommandation',
  cold_call: 'Appel froid',
  web: 'Web',
  event: 'Événement',
  existing_client: 'Client existant',
  partnership: 'Partenariat',
  other: 'Autre',
};

export function ProspectsPage() {
  const { profile } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [interactions, setInteractions] = useState<ProspectInteraction[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [saving, setSaving] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [interactionForm, setInteractionForm] = useState({ type: 'call', summary: '', notes: '' });
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ insurance_type: 'auto', premium_amount: '', coverage_description: '', valid_until: '' });
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    prospect_type: 'individual',
    status: 'new',
    source: 'web',
    needs: '',
    budget_estimate: '',
    priority: 'medium',
    notes: '',
  });

  const loadProspects = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    const prospectsRes = await backendApi.from('prospects').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false });
    setProspects((prospectsRes.data as Prospect[]) ?? []);
    setLoading(false);
  }, [profile?.company_id]);

  useEffect(() => {
    if (profile?.company_id) loadProspects();
  }, [profile?.company_id, loadProspects]);

  const stats = useMemo(() => {
    const total = prospects.length;
    const open = prospects.filter((p) => ['new', 'contacted', 'interested', 'negotiating'].includes(p.status)).length;
    const converted = prospects.filter((p) => p.status === 'converted').length;
    const lost = prospects.filter((p) => p.status === 'lost').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    const pipelineValue = prospects
      .filter((p) => ['new', 'contacted', 'interested', 'negotiating'].includes(p.status))
      .reduce((sum, p) => sum + (p.budget_estimate ?? 0), 0);

    return { total, open, converted, lost, conversionRate, pipelineValue };
  }, [prospects]);

  const filtered = prospects.filter((p) => {
    const haystack = `${p.first_name} ${p.last_name} ${p.email} ${p.company_name ?? ''} ${p.phone} ${p.needs ?? ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  function openCreate() {
    setSelected(null);
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company_name: '',
      prospect_type: 'individual',
      status: 'new',
      source: 'web',
      needs: '',
      budget_estimate: '',
      priority: 'medium',
      notes: '',
    });
    setOpenModal(true);
  }

  function openEdit(p: Prospect) {
    setSelected(p);
    setForm({
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      phone: p.phone,
      company_name: p.company_name ?? '',
      prospect_type: p.prospect_type,
      status: p.status,
      source: p.source,
      needs: p.needs ?? '',
      budget_estimate: p.budget_estimate ? String(p.budget_estimate) : '',
      priority: p.priority ?? 'medium',
      notes: p.notes ?? '',
    });
    setOpenModal(true);
  }

  function openDetails(p: Prospect) {
    setSelected(p);
  }

  const loadInteractions = useCallback(async (prospectId?: string) => {
    if (!prospectId) return;
    const res = await backendApi.from('prospect_interactions').select('*').eq('prospect_id', prospectId).order('created_at', { ascending: false });
    setInteractions((res.data as ProspectInteraction[]) ?? []);
  }, []);

  const loadQuotes = useCallback(async (prospectId?: string) => {
    if (!prospectId) return;
    const res = await backendApi.from('quotes').select('*').eq('prospect_id', prospectId).order('created_at', { ascending: false });
    setQuotes((res.data as Quote[]) ?? []);
  }, []);

  async function saveProspect() {
    if (!profile?.company_id) return;
    setSaving(true);

    const payload = {
      ...form,
      company_id: profile.company_id,
      created_by: profile.id,
      budget_estimate: form.budget_estimate ? Number(form.budget_estimate) : null,
      company_name: form.company_name || null,
    };

    if (selected) {
      await backendApi.from('prospects').update(payload).eq('id', selected.id);
    } else {
      await backendApi.from('prospects').insert(payload);
    }

    setSaving(false);
    setOpenModal(false);
    loadProspects();
  }

  useEffect(() => {
    if (selected) {
      loadInteractions(selected.id);
      loadQuotes(selected.id);
    } else {
      setInteractions([]);
      setQuotes([]);
    }
  }, [selected, loadInteractions, loadQuotes]);

  async function createInteraction() {
    if (!selected) return;
    await backendApi.from('prospect_interactions').insert({ prospect_id: selected.id, ...interactionForm });
    setInteractionForm({ type: 'call', summary: '', notes: '' });
    setShowInteractionForm(false);
    loadInteractions(selected.id);
    loadProspects();
  }

  async function createQuote() {
    if (!selected) return;
    const payload = { prospect_id: selected.id, insurance_type: quoteForm.insurance_type, premium_amount: Number(quoteForm.premium_amount || 0), coverage_description: quoteForm.coverage_description || null, valid_until: quoteForm.valid_until || undefined };
    await backendApi.from('quotes').insert(payload);
    setQuoteForm({ insurance_type: 'auto', premium_amount: '', coverage_description: '', valid_until: '' });
    setShowQuoteForm(false);
    loadQuotes(selected.id);
    loadProspects();
  }

  function fmtAmount(v?: number | null) {
    if (!v) return '—';
    return new Intl.NumberFormat('fr-FR').format(v) + ' XOF';
  }

  return (
    <AppLayout title="Prospects">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Stat title="Total" value={stats.total} icon={Target} color="blue" subtitle="prospects" />
          <Stat title="Pipeline" value={stats.open} icon={TrendingUp} color="teal" subtitle="en cours" />
          <Stat title="Convertis" value={stats.converted} icon={User} color="green" subtitle={`${stats.conversionRate}% conversion`} />
          <Stat title="Perdus" value={stats.lost} icon={Clock} color="red" subtitle="à requalifier" />
          <Stat title="Valeur pipeline" value={fmtAmount(stats.pipelineValue)} icon={TrendingUp} color="amber" subtitle="estimée" />
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Gestion des prospects</h2>
            <p className="text-blue-100 text-sm mt-1">Suivez vos opportunités de vente, les relances et les devis envoyés.</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2.5 rounded-xl font-medium hover:bg-blue-50 transition-colors">
            <Plus className="w-4 h-4" /> Nouveau prospect
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un prospect..." className="outline-none bg-transparent w-full text-sm" />
          </div>
          <p className="text-xs text-gray-400">Les devis restent visibles via les contrats/prospects côté backend.</p>
        </div>

        {loading ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-100">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">Aucun prospect trouvé</p>
            <p className="text-sm mt-1">Créez votre première opportunité pour démarrer la prospection.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prospect</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Statut</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Budget</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Relance</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((prospect) => (
                    <tr key={prospect.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                            {prospect.first_name[0]}{prospect.last_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{prospect.first_name} {prospect.last_name}</p>
                            <p className="text-xs text-gray-400">{prospect.company_name ?? 'Particulier'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <Badge label={statusLabels[prospect.status] ?? prospect.status} color={statusColors[prospect.status]} />
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-600">{sourceLabels[prospect.source] ?? prospect.source}</td>
                      <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-600">{fmtAmount(prospect.budget_estimate)}</td>
                      <td className="px-4 py-4 hidden xl:table-cell text-sm text-gray-600">
                        {prospect.next_followup_date ? new Date(prospect.next_followup_date).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openDetails(prospect)} title="Voir le prospect" aria-label="Voir le prospect" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(prospect)} title="Modifier le prospect" aria-label="Modifier le prospect" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((prospect) => (
                <article key={prospect.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{prospect.first_name} {prospect.last_name}</p>
                      <p className="text-xs text-gray-500 truncate">{prospect.company_name ?? 'Particulier'}</p>
                    </div>
                    <Badge label={statusLabels[prospect.status] ?? prospect.status} color={statusColors[prospect.status]} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider mb-0.5">Source</p>
                      <p className="text-gray-700 truncate">{sourceLabels[prospect.source] ?? prospect.source}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider mb-0.5">Budget</p>
                      <p className="text-gray-700 truncate">{fmtAmount(prospect.budget_estimate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => openDetails(prospect)}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Voir details
                    </button>
                    <button
                      onClick={() => openEdit(prospect)}
                      className="flex-1 px-3 py-2 rounded-xl bg-blue-600 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Modifier
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={openModal} onClose={() => setOpenModal(false)} title={selected ? 'Modifier le prospect' : 'Nouveau prospect'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Prénom *" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
          <Field label="Nom *" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          <Field label="Téléphone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Société" value={form.company_name} onChange={(v) => setForm({ ...form, company_name: v })} />
          <Field label="Besoin" value={form.needs} onChange={(v) => setForm({ ...form, needs: v })} />
          <Select label="Type" value={form.prospect_type} onChange={(v) => setForm({ ...form, prospect_type: v })} options={[['individual', 'Particulier'], ['corporate', 'Entreprise']]} />
          <Select label="Statut" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[['new', 'Nouveau'], ['contacted', 'Contacté'], ['interested', 'Intéressé'], ['negotiating', 'Négociation'], ['converted', 'Converti'], ['lost', 'Perdu']]} />
          <Select label="Source" value={form.source} onChange={(v) => setForm({ ...form, source: v })} options={[['web', 'Web'], ['referral', 'Recommandation'], ['cold_call', 'Appel froid'], ['partnership', 'Partenariat'], ['event', 'Événement'], ['other', 'Autre']]} />
          <Field label="Budget estimé" value={form.budget_estimate} onChange={(v) => setForm({ ...form, budget_estimate: v })} type="number" />
          <Select label="Priorité" value={form.priority} onChange={(v) => setForm({ ...form, priority: v })} options={[['high', 'Haute'], ['medium', 'Moyenne'], ['low', 'Basse']]} />
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              placeholder="Commentaires, relance prévue, besoin détecté..."
              title="Notes"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button onClick={() => setOpenModal(false)} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">Annuler</button>
          <button onClick={saveProspect} disabled={saving || !form.first_name || !form.last_name || !form.phone} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {selected ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </Modal>

      <Modal open={!!selected && !openModal} onClose={() => setSelected(null)} title="Détails du prospect" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selected.first_name} {selected.last_name}</h3>
                <p className="text-sm text-gray-500 mt-1">{selected.company_name ?? 'Particulier'} · {selected.needs ?? '—'}</p>
              </div>
              <Badge label={statusLabels[selected.status] ?? selected.status} color={statusColors[selected.status]} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Info label="Email" value={selected.email} />
              <Info label="Téléphone" value={selected.phone} />
              <Info label="Source" value={sourceLabels[selected.source] ?? selected.source} />
              <Info label="Budget" value={fmtAmount(selected.budget_estimate)} />
              <Info label="Relance" value={selected.next_followup_date ? new Date(selected.next_followup_date).toLocaleDateString('fr-FR') : '—'} />
              <Info label="Interactions" value={String(selected.interactions_count)} />
            </div>
            <div className="flex gap-2 flex-wrap">
                  <button onClick={() => openEdit(selected)} title="Modifier le prospect" aria-label="Modifier le prospect" className="px-3 py-2 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Modifier</button>
              <button
                onClick={() => {
                  const nextStatus = selected.status === 'converted' ? 'converted' : 'interested';
                  backendApi.from('prospects').update({ status: nextStatus }).eq('id', selected.id).then(() => loadProspects());
                }}
                    title="Marquer comme suivi"
                    aria-label="Marquer comme suivi"
                className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Marquer comme suivi
              </button>
            </div>
            {selected.notes && <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700">{selected.notes}</div>}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Interactions</h4>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowInteractionForm((s) => !s)} className="text-sm px-2 py-1 rounded bg-gray-100">{showInteractionForm ? 'Annuler' : 'Nouvelle interaction'}</button>
                  </div>
                </div>
                {showInteractionForm && (
                  <div className="p-3 border border-gray-100 rounded-xl mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                      <select
                        value={interactionForm.type}
                        onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}
                        className="px-2 py-2 border rounded"
                        title="Type d'interaction"
                        aria-label="Type d'interaction"
                      >
                        <option value="call">Appel</option>
                        <option value="email">Email</option>
                        <option value="meeting">Rendez-vous</option>
                      </select>
                      <input value={interactionForm.summary} onChange={(e) => setInteractionForm({ ...interactionForm, summary: e.target.value })} placeholder="Résumé" className="px-2 py-2 border rounded" />
                      <input value={interactionForm.notes} onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })} placeholder="Notes (optionnel)" className="px-2 py-2 border rounded" />
                    </div>
                    <div className="text-right">
                      <button onClick={createInteraction} className="px-3 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {interactions.length === 0 ? <p className="text-sm text-gray-400">Aucune interaction</p> : (
                    interactions.map((it) => (
                      <div key={it.id} className="p-3 border rounded-xl bg-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{it.summary}</p>
                            <p className="text-xs text-gray-500">{it.type} · {new Date(it.created_at).toLocaleString('fr-FR')}</p>
                            {it.notes && <p className="text-sm text-gray-700 mt-1">{it.notes}</p>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Devis</h4>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowQuoteForm((s) => !s)} className="text-sm px-2 py-1 rounded bg-gray-100">{showQuoteForm ? 'Annuler' : 'Nouveau devis'}</button>
                  </div>
                </div>
                {showQuoteForm && (
                  <div className="p-3 border border-gray-100 rounded-xl mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                      <input value={quoteForm.insurance_type} onChange={(e) => setQuoteForm({ ...quoteForm, insurance_type: e.target.value })} placeholder="Type d'assurance" className="px-2 py-2 border rounded" />
                      <input value={quoteForm.premium_amount} onChange={(e) => setQuoteForm({ ...quoteForm, premium_amount: e.target.value })} placeholder="Prime" type="number" className="px-2 py-2 border rounded" />
                      <input value={quoteForm.valid_until} onChange={(e) => setQuoteForm({ ...quoteForm, valid_until: e.target.value })} placeholder="Valide jusqu'au (YYYY-MM-DD)" className="px-2 py-2 border rounded" />
                    </div>
                    <div className="mb-2">
                      <input value={quoteForm.coverage_description} onChange={(e) => setQuoteForm({ ...quoteForm, coverage_description: e.target.value })} placeholder="Description couverture" className="w-full px-2 py-2 border rounded" />
                    </div>
                    <div className="text-right">
                      <button onClick={createQuote} className="px-3 py-2 bg-blue-600 text-white rounded">Créer devis</button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {quotes.length === 0 ? <p className="text-sm text-gray-400">Aucun devis</p> : (
                    quotes.map((q) => (
                      <div key={q.id} className="p-3 border rounded-xl bg-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{q.quote_number} · {q.insurance_type}</p>
                            <p className="text-xs text-gray-500">Prime: {new Intl.NumberFormat('fr-FR').format(q.premium_amount)} · Valide jusqu'au {new Date(q.valid_until).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

function Stat({ title, value, subtitle, icon: Icon, color }: { title: string; value: string | number; subtitle: string; icon: LucideIcon; color: 'blue' | 'green' | 'amber' | 'red' | 'teal'; }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    teal: 'bg-teal-50 text-teal-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string; }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} title={label} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]>; }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} title={label} aria-label={label} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 bg-white">
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-gray-900">{value}</p>
    </div>
  );
}
