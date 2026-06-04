import { useEffect, useState } from 'react';
import { Upload, Search, FolderOpen, FileText, Trash2, Download, Eye } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Modal } from '../components/ui/Modal';
import { FileUploader } from '../components/ui/FileUploader';
import { useAuth } from '../context/AuthContext';
import { api as backendApi } from '../lib/api';
import { Document, Client } from '../types';

const docTypeLabels: Record<string, string> = {
  cni: 'CNI', passport: 'Passeport', permis: 'Permis', contrat: 'Contrat signé',
  photo_accident: 'Photo accident', rapport_expert: 'Rapport expert',
  justificatif_paiement: 'Justificatif paiement', other: 'Autre'
};

const docTypeColors: Record<string, string> = {
  cni: 'bg-blue-100 text-blue-700', passport: 'bg-teal-100 text-teal-700',
  permis: 'bg-green-100 text-green-700', contrat: 'bg-gray-100 text-gray-700',
  photo_accident: 'bg-red-100 text-red-700', rapport_expert: 'bg-amber-100 text-amber-700',
  justificatif_paiement: 'bg-green-100 text-green-700', other: 'bg-gray-100 text-gray-600',
};

export function DocumentsPage() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', document_type: 'other', file_url: '', client_id: '' });

  useEffect(() => {
    if (profile?.company_id) { loadDocuments(); loadClients(); }
  }, [profile?.company_id]);

  async function loadDocuments() {
    setLoading(true);
    const { data } = await backendApi.from('documents')
      .select('*')
      .eq('company_id', profile!.company_id)
      .order('created_at', { ascending: false });
    setDocuments(data ?? []);
    setLoading(false);
  }

  async function loadClients() {
    const { data } = await backendApi.from('clients').select('id, first_name, last_name')
      .eq('company_id', profile!.company_id).eq('is_active', true).order('first_name');
    setClients(data ?? []);
  }

  async function handleSave() {
    if (!form.name || !form.file_url) return;
    setSaving(true);
    await backendApi.from('documents').insert({
      name: form.name,
      document_type: form.document_type,
      file_url: form.file_url,
      client_id: form.client_id || null,
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ name: '', document_type: 'other', file_url: '', client_id: '' });
    loadDocuments();
  }

  const filtered = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  function formatBytes(bytes: number) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <AppLayout title="Documents">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input placeholder="Rechercher un document..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-700 placeholder-gray-400 w-full bg-transparent" />
          </div>
          <button onClick={() => setModalOpen(true)} aria-label="Ajouter un document" title="Ajouter un document"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0">
            <Upload className="w-4 h-4" /> Ajouter document
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">Aucun document trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" aria-label="Voir le document" title="Voir le document"
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                    <a href={doc.file_url} download aria-label="Télécharger le document" title="Télécharger le document"
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate mb-1">{doc.name}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${docTypeColors[doc.document_type ?? 'other'] ?? 'bg-gray-100 text-gray-600'}`}>
                    {docTypeLabels[doc.document_type ?? 'other'] ?? doc.document_type}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ajouter un document" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du document *</label>
            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: CNI - Jean Dupont"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de document</label>
            <select value={form.document_type} onChange={(e) => setForm(f => ({ ...f, document_type: e.target.value }))} aria-label="Type de document" title="Type de document"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
              {Object.entries(docTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client (optionnel)</label>
            <select value={form.client_id} onChange={(e) => setForm(f => ({ ...f, client_id: e.target.value }))} aria-label="Client associé" title="Client associé"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500">
              <option value="">Sans client spécifique</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fichier *</label>
            <FileUploader accept="image/*,application/pdf,video/*" onUploaded={(url) => setForm(f => ({ ...f, file_url: url }))} />
            {form.file_url && (
              <p className="text-xs text-gray-400 mt-1">Fichier prêt: <a href={form.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Voir</a></p>
            )}
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving || !form.name || !form.file_url}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Ajouter
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
