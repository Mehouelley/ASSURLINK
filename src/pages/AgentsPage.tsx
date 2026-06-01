import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, UserCheck, Mail, Phone } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import type { Role } from '../types';
import { canManageUsers } from '../lib/access';

const FALLBACK_BUSINESS_ROLES: Array<{ name: string; label: string }> = [
  { name: 'commercial', label: 'Commercial' },
  { name: 'charge_clientele', label: 'Charge clientele' },
  { name: 'conseiller_clientele', label: 'Conseiller clientele' },
  { name: 'gestionnaire_portefeuille', label: 'Gestionnaire portefeuille' },
  { name: 'gestionnaire_sinistre', label: 'Gestionnaire sinistre' },
  { name: 'souscripteur', label: 'Souscripteur' },
  { name: 'chef_commercial', label: 'Chef commercial' },
  { name: 'responsable_agence', label: 'Responsable agence' },
  { name: 'directeur', label: 'Directeur' },
  { name: 'directeur_general', label: 'Directeur general' },
  { name: 'president', label: 'President' },
];

interface AgentWithProfile {
  id: string;
  commission_rate: number;
  total_clients: number;
  total_contracts: number;
  total_commission: number;
  is_active: boolean;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
  };
}

export function AgentsPage() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const [agents, setAgents] = useState<AgentWithProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: 'Password123!',
    commission_rate: '5',
    role: '',
  });
  const [message, setMessage] = useState('');

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    const { data } = await backendApi.from('roles').select('*').order('name', { ascending: true });
    setRoles((data as Role[]) ?? []);
    setRolesLoading(false);
  }, []);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    const { data } = await backendApi
      .from('agents')
      .select('*, profile:profiles(id, first_name, last_name, email, phone, role)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setAgents((data as AgentWithProfile[]) ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      loadAgents();
      loadRoles();
    }
  }, [companyId, loadAgents, loadRoles]);

  async function handleCreate() {
    if (!profile?.company_id) {
      setMessage('Impossible: votre compagnie n’est pas chargée.');
      return;
    }

    setSaving(true);
    setMessage('');

    await backendApi.from('users').insert({
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      password: form.password,
      role: form.role || 'agent',
      company_id: profile.company_id,
      commission_rate: Number(form.commission_rate),
    });

    setMessage('Agent créé. Il peut maintenant se connecter avec son email et son mot de passe initial.');
    await loadAgents();
    setSaving(false);
    setModalOpen(false);
  }

  const filtered = agents.filter(a => {
    const p = a.profile;
    return `${p?.first_name} ${p?.last_name} ${p?.email}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AppLayout title="Employes">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input placeholder="Rechercher un employe..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-700 placeholder-gray-400 w-full bg-transparent" />
          </div>
          {canManageUsers(profile?.role) && (
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0">
              <Plus className="w-4 h-4" /> Ajouter employe
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">Aucun employe enregistre</p>
            <p className="text-sm mt-1">Les employes apparaitront ici une fois leurs comptes crees.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((agent) => {
              const p = agent.profile;
              return (
                <div key={agent.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                      {p?.first_name?.[0]}{p?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{p?.first_name} {p?.last_name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${agent.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {agent.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {p?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}
                    {p?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{p.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{agent.total_clients}</p>
                      <p className="text-xs text-gray-400">Clients</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{agent.total_contracts}</p>
                      <p className="text-xs text-gray-400">Contrats</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-600">{agent.commission_rate}%</p>
                      <p className="text-xs text-gray-400">Commission</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ajouter un employe" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Creez le compte de l'employe directement ici, puis il pourra se connecter avec son email.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Prénom" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
            <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Nom" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
            <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm sm:col-span-2" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Téléphone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Commission %" value={form.commission_rate} onChange={(e) => setForm((f) => ({ ...f, commission_rate: e.target.value }))} />
            <select
              className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm sm:col-span-2 bg-white"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              aria-label="Rôle"
              title="Rôle"
            >
              <option value="">Sélectionner un rôle</option>
              {rolesLoading ? (
                <option value="" disabled>Chargement...</option>
              ) : roles.length > 0 ? (
                roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.label ?? role.name}
                  </option>
                ))
              ) : (
                FALLBACK_BUSINESS_ROLES.map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.label}
                  </option>
                ))
              )}
            </select>
            <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm sm:col-span-2" placeholder="Mot de passe initial" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          {message && <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-xl">{message}</p>}
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
          <button onClick={() => setModalOpen(false)} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleCreate} disabled={saving}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saving ? 'Creation...' : 'Creer employe'}
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
