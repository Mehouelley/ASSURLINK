import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Users as UsersIcon } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import { Profile } from '../types';
import { roleLabel } from '../lib/roleLabels';
import { canManageUsers } from '../lib/access';

export function UsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'commercial',
    password: 'Password123!',
  });

  useEffect(() => {
    if (canManageUsers(profile?.role)) loadUsers();
  }, [profile?.role]);

  async function loadUsers() {
    setLoading(true);
    const { data } = await backendApi.from('profiles').select('*, company:companies(name)').order('created_at', { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }

  const filtered = useMemo(
    () => users.filter((u) => `${u.first_name} ${u.last_name} ${u.email ?? ''} ${u.role}`.toLowerCase().includes(search.toLowerCase())),
    [users, search],
  );

  if (!canManageUsers(profile?.role)) {
    return (
      <AppLayout title="Utilisateurs">
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
          Accès réservé aux administrateurs.
        </div>
      </AppLayout>
    );
  }

  async function createUser() {
    if (!form.email || !form.first_name || !form.last_name || !form.password) return;
    setSaving(true);
    await backendApi.from('users').insert(form);
    setSaving(false);
    setForm({ email: '', first_name: '', last_name: '', phone: '', role: 'commercial', password: 'Password123!' });
    loadUsers();
  }

  return (
    <AppLayout title="Utilisateurs">
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Prénom" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
          <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Nom" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
          <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Téléphone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Rôle (ex: commercial)" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
          <input className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Mot de passe initial" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <div className="md:col-span-3 flex justify-end">
            <button onClick={createUser} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
              <Plus className="w-4 h-4" /> Créer employé
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none text-sm text-gray-700 placeholder-gray-400 w-full bg-transparent"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Compagnie</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-400">{user.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">{user.company?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{roleLabel(user.role)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((user) => (
                <article key={user.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email || '—'}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider mb-0.5">Compagnie</p>
                      <p className="text-gray-700 truncate">{user.company?.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider mb-0.5">Rôle</p>
                      <p className="text-gray-700 truncate">{roleLabel(user.role)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
