import { useEffect, useMemo, useState } from 'react';
import { Building2, Search, Power, PowerOff } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import { Company } from '../types';

export function CompaniesPage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (profile?.role === 'super_admin') loadCompanies();
  }, [profile?.role]);

  async function loadCompanies() {
    setLoading(true);
    const { data } = await backendApi.from('companies').select('*').order('created_at', { ascending: false });
    setCompanies((data as Company[]) ?? []);
    setLoading(false);
  }

  const filtered = useMemo(
    () => companies.filter((c) => `${c.name} ${c.country} ${c.email ?? ''}`.toLowerCase().includes(search.toLowerCase())),
    [companies, search],
  );

  async function toggleActive(company: Company) {
    await backendApi.from('companies').update({ is_active: !company.is_active }).eq('id', company.id);
    setCompanies((prev) => prev.map((c) => (c.id === company.id ? { ...c, is_active: !c.is_active } : c)));
  }

  if (profile?.role !== 'super_admin') {
    return (
      <AppLayout title="Compagnies">
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
          Accès réservé au super administrateur.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Compagnies">
      <div className="space-y-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            placeholder="Rechercher une compagnie..."
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
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Aucune compagnie trouvée</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Pays</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{company.name}</p>
                        <p className="text-xs text-gray-400">{company.currency}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">{company.country}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600">{company.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${company.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {company.is_active ? 'Active' : 'Suspendue'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleActive(company)}
                          title={company.is_active ? 'Suspendre la compagnie' : 'Activer la compagnie'}
                          aria-label={company.is_active ? 'Suspendre la compagnie' : 'Activer la compagnie'}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-50 hover:bg-slate-100 text-slate-700"
                        >
                          {company.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          {company.is_active ? 'Suspendre' : 'Activer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((company) => (
                <article key={company.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{company.name}</p>
                      <p className="text-xs text-gray-500 truncate">{company.country} · {company.currency}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${company.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {company.is_active ? 'Active' : 'Suspendue'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 truncate">{company.email || '—'}</p>

                  <button
                    onClick={() => toggleActive(company)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-slate-50 hover:bg-slate-100 text-slate-700"
                  >
                    {company.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    {company.is_active ? 'Suspendre' : 'Activer'}
                  </button>
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
