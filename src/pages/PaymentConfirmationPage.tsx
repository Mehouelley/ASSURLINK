import { CheckCircle2, ShieldCheck, ArrowRight, Mail, Phone } from 'lucide-react';

export function PaymentConfirmationPage() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('fedapay_status') ?? 'unknown';
  const paymentType = params.get('payment_type') ?? 'premium';
  const tx = params.get('fedapay_tx');

  const isCompleted = ['approved', 'completed', 'success'].includes(status.toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isCompleted ? 'bg-green-100' : 'bg-amber-100'}`}>
            {isCompleted ? <CheckCircle2 className="w-8 h-8 text-green-600" /> : <ShieldCheck className="w-8 h-8 text-amber-600" />}
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">ASSURLINK</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Paiement confirmé</h1>
          </div>
        </div>

        <div className="space-y-4 text-slate-700">
          <p className="text-lg">
            {isCompleted
              ? paymentType === 'premium'
                ? 'Votre contrat d’assurance est maintenant pris en compte.'
                : 'Votre opération a été enregistrée avec succès.'
              : 'Votre paiement est en cours de traitement.'}
          </p>

          {paymentType === 'premium' && (
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-blue-900">
              <p className="font-semibold mb-1">Votre assurance est active</p>
              <p className="text-sm">
                Le contrat a été payé et l’assurance est désormais validée. Vous pouvez conserver cette page comme preuve de confirmation.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <InfoCard label="Statut" value={status} />
            <InfoCard label="Référence transaction" value={tx ?? '—'} />
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <p className="font-semibold text-slate-900 mb-2">Besoin d’aide ?</p>
            <div className="flex flex-col sm:flex-row gap-3 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2"><Mail className="w-4 h-4" /> Contactez votre assureur par email</span>
              <span className="inline-flex items-center gap-2"><Phone className="w-4 h-4" /> Ou par WhatsApp / téléphone</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.close()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-white font-medium hover:bg-slate-800"
            >
              Fermer la page
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-900 break-all">{value}</p>
    </div>
  );
}