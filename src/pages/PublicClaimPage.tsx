import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { api as backendApi } from '../lib/api';

type PublicClaim = {
  id: string;
  claim_number: string;
  status: string;
  incident_date: string;
  incident_description: string;
  incident_location?: string | null;
  estimated_amount?: number | null;
  client?: { first_name?: string; last_name?: string; email?: string; phone?: string } | null;
  policy?: { policy_number?: string; insurance_type?: string } | null;
  company?: { name?: string; email?: string; phone?: string } | null;
};

function getTokenFromPath() {
  const match = window.location.pathname.match(/^\/claim\/([^/]+)$/);
  return match?.[1] ?? '';
}

export function PublicClaimPage() {
  const token = useMemo(() => getTokenFromPath(), []);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [claim, setClaim] = useState<PublicClaim | null>(null);
  const [form, setForm] = useState({
    incident_date: '',
    incident_description: '',
    incident_location: '',
    estimated_amount: '',
  });

  useEffect(() => {
    async function load() {
      if (!token) {
        setError('Lien de sinistre invalide.');
        setLoading(false);
        return;
      }

      const { data, error } = await backendApi.claims.getPublicClaim(token);
      if (error || !data) {
        setError(error?.message || 'Impossible de charger la déclaration.');
        setLoading(false);
        return;
      }

      setClaim(data);
      setForm({
        incident_date: data.incident_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        incident_description: data.incident_description ?? '',
        incident_location: data.incident_location ?? '',
        estimated_amount: data.estimated_amount ? String(data.estimated_amount) : '',
      });
      setLoading(false);
    }

    load();
  }, [token]);

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const { error } = await backendApi.claims.submitPublicClaim(token, {
        incident_date: form.incident_date,
        incident_description: form.incident_description,
        incident_location: form.incident_location,
        estimated_amount: form.estimated_amount ? Number(form.estimated_amount) : undefined,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('Impossible d’envoyer la déclaration.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Chargement de votre déclaration...</span>
        </div>
      </div>
    );
  }

  if (error && !claim) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-900">Déclaration inaccessible</h1>
          <p className="text-sm text-slate-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm max-w-lg w-full text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900">Déclaration envoyée</h1>
          <p className="text-sm text-slate-600 mt-2">
            Votre dossier de sinistre a bien été transmis à l’assureur. Vous serez recontacté si nécessaire.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
          <p className="text-sm/6 uppercase tracking-[0.2em] text-blue-100">ASSURLINK</p>
          <h1 className="text-2xl font-bold mt-2">Déclaration de sinistre client</h1>
          <p className="text-sm text-blue-100 mt-2">
            Complétez les informations ci-dessous pour transmettre votre sinistre à votre assureur.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoBox label="Compagnie" value={claim?.company?.name} />
            <InfoBox label="Contrat" value={claim?.policy?.policy_number} />
            <InfoBox label="Client" value={`${claim?.client?.first_name ?? ''} ${claim?.client?.last_name ?? ''}`.trim()} />
            <InfoBox label="Référence sinistre" value={claim?.claim_number} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Field label="Date de l’incident *" type="date" value={form.incident_date} onChange={(v) => setForm((f) => ({ ...f, incident_date: v }))} />
            <Field label="Description de l’incident *" as="textarea" value={form.incident_description} onChange={(v) => setForm((f) => ({ ...f, incident_description: v }))} />
            <Field label="Lieu de l’incident" value={form.incident_location} onChange={(v) => setForm((f) => ({ ...f, incident_location: v }))} />
            <Field label="Montant estimé (XOF)" type="number" value={form.estimated_amount} onChange={(v) => setForm((f) => ({ ...f, estimated_amount: v }))} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || !form.incident_date || !form.incident_description}
            className="w-full rounded-xl bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Envoyer la déclaration
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-1">{value || '—'}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  as = 'input',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  as?: 'input' | 'textarea';
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      {as === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        />
      )}
    </label>
  );
}
