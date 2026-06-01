import { useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, CheckCircle2, Clock3, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const plans = [
  {
    name: 'Starter',
    price: '29 000 XOF/mois',
    highlight: false,
    features: ['Jusqu\'a 3 agents', 'Clients et contrats illimites', 'Sinistres et documents', 'Support standard'],
  },
  {
    name: 'Pro',
    price: '59 000 XOF/mois',
    highlight: true,
    features: ['Jusqu\'a 15 agents', 'Rapports avances', 'Priorite support', 'Automatisations operations'],
  },
  {
    name: 'Enterprise',
    price: 'Sur devis',
    highlight: false,
    features: ['Multi-agences', 'SLA dedie', 'Accompagnement premium', 'Integrations sur mesure'],
  },
];

function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="/landing" className="flex items-center gap-2 text-slate-900">
          <div className="rounded-xl bg-emerald-600 px-2 py-1 text-xs font-bold text-white">ASSUR</div>
          <span className="text-sm font-semibold tracking-wide">Assurlink</span>
        </a>
        <div className="flex items-center gap-2">
          <a href="/login" className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:text-sm">Connexion</a>
          <a href="/landing" className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 sm:text-sm">Retour accueil</a>
        </div>
      </div>
    </header>
  );
}

export function SubscribePage() {
  const { user, company, activateTrial } = useAuth();
  const [loadingTrial, setLoadingTrial] = useState(false);

  const trialStatus = useMemo(() => {
    if (!company?.trial_ends_at) return 'Aucun essai actif';
    const end = new Date(company.trial_ends_at);
    if (Number.isNaN(end.getTime())) return 'Aucun essai actif';
    const now = new Date();
    if (end <= now) return 'Essai expire';
    return `Essai actif jusqu'au ${end.toLocaleDateString('fr-FR')}`;
  }, [company?.trial_ends_at]);

  async function startTrial() {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setLoadingTrial(true);
    try {
      await activateTrial();
      window.alert("Essai gratuit active. Vous pouvez maintenant acceder a l'application.");
      window.location.href = '/dashboard';
    } catch (e) {
      console.error(e);
      window.alert('Activation de l\'essai impossible pour le moment. Veuillez reessayer.');
    } finally {
      setLoadingTrial(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f0fdfa_100%)] text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" /> Abonnement et essai gratuit
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
              Activez votre entreprise
              <span className="block text-emerald-600">et donnez acces a vos equipes</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Tant que l\'essai ou l\'abonnement n\'est pas actif, l\'acces au dashboard est bloque.
              Cette page explique le processus et permet d\'activer l\'essai gratuit.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-sm font-semibold text-slate-800">Statut actuel</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5"><Clock3 className="h-4 w-4 text-emerald-600" /> {trialStatus}</span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> {company?.is_active ? 'Compte actif' : 'Compte inactif'}</span>
              </div>
              {!user && (
                <p className="mt-3 text-sm text-amber-700">Connectez-vous d'abord pour activer l'essai gratuit de votre entreprise.</p>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-emerald-900">Essai gratuit 14 jours</h2>
              <p className="mt-2 text-sm text-emerald-800">Activez l'essai, testez toutes les fonctionnalites, puis choisissez votre plan.</p>
              <button
                onClick={startTrial}
                disabled={loadingTrial}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingTrial ? 'Activation...' : 'Activer essai gratuit'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Comment se passe l'activation ?</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-900">1.</span> Vous choisissez essai gratuit ou plan payant.</li>
              <li className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-900">2.</span> Le compte entreprise est active immediatement.</li>
              <li className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-900">3.</span> Vos utilisateurs accedent au dashboard et aux modules.</li>
              <li className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-900">4.</span> A expiration, l'acces est suspendu jusqu'au renouvellement.</li>
            </ol>

            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">Paiement abonnement</p>
              <p className="mt-1 text-sm text-slate-600">
                Les plans affiches ci-dessous sont des repères commerciaux. La vraie souscription payante doit être reliée à votre checkout ou à un devis commercial.
              </p>
              <a href="#plans" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <CreditCard className="h-4 w-4" /> Voir les plans
              </a>
            </div>
          </aside>
        </section>

        <section className="mt-10" id="plans">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Nos plans</h2>
            <p className="text-sm text-slate-500">Tarification indicative - a brancher sur le vrai module d'abonnement</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-5 ${plan.highlight ? 'border-emerald-400 bg-emerald-50 shadow-md' : 'border-slate-200 bg-white'}`}
              >
                <p className="text-sm font-semibold text-slate-700">{plan.name}</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{plan.price}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a href={user ? '/dashboard' : '/login'} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  {user ? 'Continuer' : 'Se connecter pour souscrire'} <BadgeCheck className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <p className="text-sm font-semibold">Note importante</p>
          <p className="mt-2 text-sm text-amber-900/80">
            Les montants visibles ici sont des repères marketing. Le systeme d'accès respecte la logique suivante : essai actif ou abonnement actif = acces ouvert, sinon acces bloque.
          </p>
        </section>
      </main>
    </div>
  );
}

export default SubscribePage;
