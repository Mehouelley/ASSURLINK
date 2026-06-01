import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, UserCircle, Phone, Mail, Edit, Eye } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import { Client } from '../types';
import { canManageOperationalData } from '../lib/access';

const genderLabels: Record<string, string> = { male: 'Homme', female: 'Femme', other: 'Autre' };
const typeLabels: Record<string, string> = { individual: 'Particulier', corporate: 'Entreprise' };

export function ClientsPage() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    address: '', profession: '', gender: 'male', date_of_birth: '',
    client_type: 'individual', id_number: '', notes: ''
  });

  const loadClients = useCallback(async () => {
    if (!profile?.company_id) return;

    setLoading(true);
    const { data } = await backendApi
      .from('clients')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  }, [profile?.company_id]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  function openNew() {
    setEditClient(null);
    setForm({ first_name: '', last_name: '', email: '', phone: '', address: '', profession: '', gender: 'male', date_of_birth: '', client_type: 'individual', id_number: '', notes: '' });
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditClient(client);
    setForm({
      first_name: client.first_name, last_name: client.last_name,
      email: client.email ?? '', phone: client.phone, address: client.address ?? '',
      profession: client.profession ?? '', gender: client.gender ?? 'male',
      date_of_birth: client.date_of_birth ?? '', client_type: client.client_type,
      id_number: client.id_number ?? '', notes: client.notes ?? ''
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    if (editClient) {
      await backendApi.from('clients').update({ ...form }).eq('id', editClient.id);
    } else {
      await backendApi.from('clients').insert({ ...form });
    }
    setSaving(false);
    setModalOpen(false);
    loadClients();
  }

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.phone} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  function initials(c: Client) {
    return `${c.first_name[0]}${c.last_name[0]}`.toUpperCase();
  }

  const canEdit = canManageOperationalData(profile?.role);

  return (
    <AppLayout title="Clients">
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-700 placeholder-gray-400 w-full bg-transparent"
            />
          </div>
          {canEdit && (
            <button onClick={openNew}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0">
              <Plus className="w-4 h-4" /> Nouveau client
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <UserCircle className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Aucun client trouvé</p>
              {canEdit && <p className="text-sm mt-1">Cliquez sur "Nouveau client" pour commencer</p>}
            </div>
          ) : (
            <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Profession</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Date d'ajout</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                            {initials(client)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{client.first_name} {client.last_name}</p>
                            <p className="text-xs text-gray-400">{genderLabels[client.gender ?? ''] ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone className="w-3 h-3" />{client.phone}
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Mail className="w-3 h-3" />{client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${client.client_type === 'corporate' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {typeLabels[client.client_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-500">{client.profession || '—'}</td>
                      <td className="px-4 py-3 hidden xl:table-cell text-sm text-gray-400">
                        {new Date(client.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewClient(client)} title="Voir les détails du client" aria-label="Voir les détails du client"
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button onClick={() => openEdit(client)} title="Modifier le client" aria-label="Modifier le client"
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((client) => (
                <article key={client.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {initials(client)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{client.first_name} {client.last_name}</p>
                        <p className="text-xs text-gray-500 truncate">{client.phone}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${client.client_type === 'corporate' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {typeLabels[client.client_type]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider mb-0.5">Genre</p>
                      <p className="text-gray-700">{genderLabels[client.gender ?? ''] ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider mb-0.5">Profession</p>
                      <p className="text-gray-700 truncate">{client.profession || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => setViewClient(client)}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Voir details
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => openEdit(client)}
                        className="flex-1 px-3 py-2 rounded-xl bg-blue-600 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Modifier
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            </>
          )}
        </div>

        <p className="text-xs text-gray-400">{filtered.length} client(s) trouvé(s)</p>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editClient ? 'Modifier le client' : 'Nouveau client'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Prénom *" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} placeholder="Jean" />
          <Field label="Nom *" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} placeholder="Dupont" />
          <Field label="Téléphone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+229 97 00 00 00" />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="email@exemple.com" />
          <Field label="Adresse" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Cotonou, Bénin" />
          <Field label="Profession" value={form.profession} onChange={(v) => setForm({ ...form, profession: v })} placeholder="Commerçant" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Genre</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} aria-label="Genre" title="Genre"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
              <option value="male">Homme</option>
              <option value="female">Femme</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de client</label>
            <select value={form.client_type} onChange={(e) => setForm({ ...form, client_type: e.target.value })} aria-label="Type de client" title="Type de client"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
              <option value="individual">Particulier</option>
              <option value="corporate">Entreprise</option>
            </select>
          </div>
          <Field label="Date de naissance" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} type="date" />
          <Field label="N° Pièce d'identité" value={form.id_number} onChange={(v) => setForm({ ...form, id_number: v })} placeholder="CNI-123456" />
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3} placeholder="Informations complémentaires..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 resize-none" />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving || !form.first_name || !form.last_name || !form.phone}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {editClient ? 'Enregistrer' : 'Créer le client'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewClient} onClose={() => setViewClient(null)} title="Détails du client" size="md">
        {viewClient && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
                {initials(viewClient)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewClient.first_name} {viewClient.last_name}</h3>
                <p className="text-sm text-gray-500">{typeLabels[viewClient.client_type]} · {genderLabels[viewClient.gender ?? ''] ?? ''}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoRow label="Téléphone" value={viewClient.phone} />
              <InfoRow label="Email" value={viewClient.email} />
              <InfoRow label="Adresse" value={viewClient.address} />
              <InfoRow label="Profession" value={viewClient.profession} />
              <InfoRow label="Date de naissance" value={viewClient.date_of_birth ? new Date(viewClient.date_of_birth).toLocaleDateString('fr-FR') : undefined} />
              <InfoRow label="N° Pièce d'identité" value={viewClient.id_number} />
            </div>
            {viewClient.notes && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{viewClient.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-gray-900">{value || '—'}</p>
    </div>
  );
}
