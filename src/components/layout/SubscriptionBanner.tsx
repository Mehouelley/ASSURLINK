import { AlertTriangle, CreditCard } from 'lucide-react';

type SubscriptionBannerProps = {
  onSubscribe: () => void;
};

export function SubscriptionBanner({ onSubscribe }: SubscriptionBannerProps) {
  return (
    <div className="mx-3 mt-3 sm:mx-4 lg:mx-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Abonnement expiré</p>
            <p className="text-sm text-amber-800">Votre entreprise n’a plus accès à l’application tant que l’abonnement n’est pas renouvelé ou que l’essai gratuit est activé.</p>
          </div>
        </div>
        <button
          onClick={onSubscribe}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          <CreditCard className="h-4 w-4" />
          S’abonner / activer l’essai
        </button>
      </div>
    </div>
  );
}
