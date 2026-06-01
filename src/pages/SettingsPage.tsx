import { useEffect, useMemo, useState } from 'react';
import { Building2, User, Save, Shield, Plus, Trash2, Tag } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import { Role } from '../types';
import { canManageUsers } from '../lib/access';
import { roleLabel } from '../lib/roleLabels';

export function SettingsPage() {
  const { profile, company, refreshProfile } = useAuth();
  const [tab, setTab] = useState<'profile' | 'company' | 'roles'>('profile');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', label: '' });
  const [profileForm, setProfileForm] = useState({
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    phone: profile?.phone ?? '',
  });
  const [companyForm, setCompanyForm] = useState({
    name: company?.name ?? '',
    email: company?.email ?? '',
    phone: company?.phone ?? '',
    address: company?.address ?? '',
    country: company?.country ?? 'Bénin',
    currency: company?.currency ?? 'XOF',
    registration_number: company?.registration_number ?? '',
  });

  const canManageRoles = canManageUsers(profile?.role);

  useEffect(() => {
    if (canManageRoles) loadRoles();
  }, [canManageRoles]);

  async function loadRoles() {
    setRolesLoading(true);
    const { data } = await backendApi.from('roles').select('*').order('created_at', { ascending: true });
    setRoles((data as Role[]) ?? []);
    setRolesLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    await backendApi.from('profiles').update({ ...profileForm }).eq('id', profile!.id);
    await refreshProfile();
    setSaving(false);
    setSuccess('Profil mis à jour avec succès');
    setTimeout(() => setSuccess(''), 3000);
  }

  async function saveCompany() {
    setSaving(true);
    await backendApi.from('companies').update({ ...companyForm }).eq('id', company!.id);
    await refreshProfile();
    setSaving(false);
    setSuccess('Informations de la compagnie mises à jour');
    setTimeout(() => setSuccess(''), 3000);
  }

  async function createRole() {
    if (!roleForm.name.trim()) return;
    setSaving(true);
    await backendApi.from('roles').insert({
      name: roleForm.name.trim().toLowerCase().replace(/\s+/g, '_'),
      label: roleForm.label.trim() || roleForm.name.trim(),
      company_id: company?.id ?? null,
    });
    setRoleForm({ name: '', label: '' });
    await loadRoles();
    setSaving(false);
    setSuccess('Rôle ajouté avec succès');
    setTimeout(() => setSuccess(''), 3000);
  }

  async function deleteRole(id: string) {
    setSaving(true);
    await backendApi.from('roles').delete().eq('id', id);
    await loadRoles();
    setSaving(false);
    setSuccess('Rôle supprimé');
    setTimeout(() => setSuccess(''), 3000);
  }

  const roleSuggestions = useMemo(() => [
    'responsable_agence',
    'president',
    'directeur_general',
    'directeur',
    'chef_agence',
    'chef_commercial',
    'responsable_rh',
    'commercial',
    'charge_clientele',
    'conseiller_clientele',
    'gestionnaire_portefeuille',
    'gestionnaire_sinistre',
    'souscripteur',
    'juriste',
    'comptable',
    'informatique',
    'controle_interne',
  ], []);

  return (
    <AppLayout title="Paramètres">
      <div className="max-w-3xl space-y-5">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button onClick={() => setTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'profile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            <User className="w-4 h-4" /> Mon profil
          </button>
          {canManageUsers(profile?.role) && (
            <button onClick={() => setTab('company')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'company' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              <Building2 className="w-4 h-4" /> Compagnie
            </button>
          )}
          {canManageRoles && (
            <button onClick={() => setTab('roles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'roles' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              <Tag className="w-4 h-4" /> Rôles
            </button>
          )}
        </div>

        {/* Profile settings */}
        {tab === 'profile' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{profile?.first_name} {profile?.last_name}</h3>
                <p className="text-sm text-gray-500">{profile?.email}</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{roleLabel(profile?.role)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                <input type="text" value={profileForm.first_name} onChange={(e) => setProfileForm(f => ({ ...f, first_name: e.target.value }))} aria-label="Prénom" title="Prénom"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                <input type="text" value={profileForm.last_name} onChange={(e) => setProfileForm(f => ({ ...f, last_name: e.target.value }))} aria-label="Nom" title="Nom"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))} aria-label="Téléphone" title="Téléphone"
                  placeholder="+229 97 00 00 00"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={saveProfile} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* Company settings */}
        {tab === 'company' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informations de la compagnie</h3>
                <p className="text-sm text-gray-400">Gérez les paramètres de votre organisation</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de la compagnie</label>
                <input type="text" value={companyForm.name} onChange={(e) => setCompanyForm(f => ({ ...f, name: e.target.value }))} aria-label="Nom de la compagnie" title="Nom de la compagnie"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={companyForm.email} onChange={(e) => setCompanyForm(f => ({ ...f, email: e.target.value }))} aria-label="Email de la compagnie" title="Email de la compagnie"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                <input type="tel" value={companyForm.phone} onChange={(e) => setCompanyForm(f => ({ ...f, phone: e.target.value }))} aria-label="Téléphone de la compagnie" title="Téléphone de la compagnie"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                <input type="text" value={companyForm.address} onChange={(e) => setCompanyForm(f => ({ ...f, address: e.target.value }))} aria-label="Adresse" title="Adresse"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
                <input type="text" value={companyForm.country} onChange={(e) => setCompanyForm(f => ({ ...f, country: e.target.value }))} aria-label="Pays" title="Pays"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Devise</label>
                <select value={companyForm.currency} onChange={(e) => setCompanyForm(f => ({ ...f, currency: e.target.value }))} aria-label="Devise" title="Devise"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
                  <option value="XOF">XOF (Franc CFA)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar US)</option>
                  <option value="NGN">NGN (Naira)</option>
                  <option value="GHS">GHS (Cedi)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro d'enregistrement</label>
                <input type="text" value={companyForm.registration_number} onChange={(e) => setCompanyForm(f => ({ ...f, registration_number: e.target.value }))}
                  placeholder="RC-BJ-00-2024-..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={saveCompany} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {tab === 'roles' && canManageRoles && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gestion des rôles</h3>
                <p className="text-sm text-gray-400">Ajoutez les titres métier qui existent dans votre entreprise.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom technique</label>
                <input
                  value={roleForm.name}
                  onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="president"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Ex: president, directeur_general, responsable_rh</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Libellé affiché</label>
                <input
                  value={roleForm.label}
                  onChange={(e) => setRoleForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Président"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {roleSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setRoleForm((f) => ({ ...f, name: suggestion, label: f.label || suggestion.split('_').join(' ') }))}
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={createRole} disabled={saving || !roleForm.name.trim()} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60">
                <Plus className="w-4 h-4" /> Ajouter le rôle
              </button>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden">
              {rolesLoading ? (
                <div className="p-6 text-center text-gray-400">Chargement...</div>
              ) : roles.length === 0 ? (
                <div className="p-6 text-center text-gray-400">Aucun rôle défini</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Libellé</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {roles.map((role) => (
                      <tr key={role.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{role.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{role.label || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => deleteRole(role.id)} className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" /> Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Security info */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-slate-600" />
            <h3 className="font-medium text-slate-800 text-sm">Sécurité</h3>
          </div>
          <p className="text-sm text-slate-600">
            Pour modifier votre mot de passe, utilisez la fonctionnalité "Mot de passe oublié" depuis la page de connexion.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
