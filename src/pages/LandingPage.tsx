import { ArrowRight, BadgeCheck, Briefcase, CheckCircle2, Clock3, FileCheck2, Globe2, ShieldCheck, Sparkles } from 'lucide-react';

function NavBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2 text-slate-900">
          <div className="rounded-xl bg-emerald-600 px-2 py-1 text-xs font-bold text-white">ASSUR</div>
          <span className="text-sm font-semibold tracking-wide">Assurlink</span>
        </a>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <a href="#fonctionnalites" className="hover:text-slate-900">Fonctionnalites</a>
          <a href="#etapes" className="hover:text-slate-900">Comment ca marche</a>
          <a href="#offres" className="hover:text-slate-900">Offres</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/login" className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:text-sm">Connexion</a>
          <a href="/subscribe" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 sm:text-sm">Demarrer</a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),transparent_48%),radial-gradient(circle_at_80%_10%,_rgba(14,165,233,0.18),transparent_42%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" /> SaaS assurance pour entreprises
          </p>
          <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Pilotez votre entreprise d'assurance,
            <span className="block text-emerald-600">du prospect au sinistre rembourse.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
            Assurlink centralise clients, contrats, paiements, documents et sinistres dans un seul outil.
            Vos equipes gagnent du temps, vos clients recoivent des liens simples, et tout remonte dans votre CRM.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="/subscribe" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
              Demarrer essai gratuit <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/login" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              J'ai deja un compte
            </a>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <div className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-600" /> Suivi temps reel</div>
            <div className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Donnees securisees</div>
            <div className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-600" /> Mise en place rapide</div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/40 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ce que vous obtenez</h2>
          <div className="mt-4 space-y-3">
            {[
              'Gestion complete des clients, contrats et paiements',
              'Creation de lien sinistre public pour declaration client',
              'Export de rapports PDF et suivi des performances',
              'Controle d\'acces par role (admin, agent, gestionnaire)',
              'Activation / suspension automatique selon abonnement',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const cards = [
    {
      icon: Briefcase,
      title: 'Gestion commerciale',
      desc: 'Prospects, devis, contrats et renouvellements depuis un tableau unique.',
    },
    {
      icon: FileCheck2,
      title: 'Sinistres fluides',
      desc: 'L\'assureur cree le dossier, envoie un lien client, et suit chaque etape jusqu\'a cloture.',
    },
    {
      icon: Globe2,
      title: 'Experience client simple',
      desc: 'Paiement et declaration via lien partage, sans exposer le dashboard interne.',
    },
  ];

  return (
    <section id="fonctionnalites" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Fonctionnalites</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Tout ce que propose Assurlink</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
            <card.icon className="h-5 w-5 text-emerald-600" />
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Steps() {
  const steps = [
    {
      title: '1. Inscription entreprise',
      text: 'Vous creez votre compte avec le nom de votre entreprise et vos informations de base.',
    },
    {
      title: '2. Activation essai ou abonnement',
      text: 'Vous activez l\'essai gratuit ou un plan payant pour autoriser l\'acces a la plateforme.',
    },
    {
      title: '3. Mise en route operationnelle',
      text: 'Vous ajoutez vos agents, clients, contrats, puis vous gerez paiements et sinistres.',
    },
    {
      title: '4. Exploitation et suivi',
      text: 'Vous suivez les KPI, exportez les rapports et pilotez votre croissance mois apres mois.',
    },
  ];

  return (
    <section id="etapes" className="bg-slate-900 py-14 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Etape par etape</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Comment cela se passe</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <article key={step.title} className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h3 className="text-base font-semibold text-emerald-300">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-200">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function OffersPreview() {
  return (
    <section id="offres" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Offres</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Choisissez votre formule</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
          Commencez avec l\'essai gratuit, puis passez a un plan adapte a votre volume de clients et de contrats.
          Les tarifs affiches sur la page abonnement sont indicatifs tant que le checkout commercial n\'est pas branche.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/subscribe" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
            Voir la page abonnement <ArrowRight className="h-4 w-4" />
          </a>
          <a href="/login" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white">
            Acceder a mon compte
          </a>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      name: 'Cabinet Nova Assur',
      role: 'Direction commerciale',
      quote: 'Nous avons centralise contrats, clients et sinistres dans un seul outil. Le lien client a simplifie le traitement des dossiers.',
    },
    {
      name: 'Agence Alpha Courtage',
      role: 'Responsable operations',
      quote: 'L\'equipe suit les paiements et les relances beaucoup plus facilement. La prise en main est rapide.',
    },
    {
      name: 'Assurance Horizon',
      role: 'Gestion des sinistres',
      quote: 'Le workflow sinistre et la page publique nous font gagner un temps considerable au quotidien.',
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Preuves sociales</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Ils structurent deja leur activité avec Assurlink</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">“{item.quote}”</p>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="font-semibold text-slate-900">{item.name}</p>
              <p className="text-sm text-slate-500">{item.role}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: 'L\'essai gratuit dure combien de temps ?',
      a: 'L\'essai gratuit est active pour 14 jours. A l\'expiration, l\'acces est suspendu jusqu\'a activation d\'un abonnement.',
    },
    {
      q: 'Que se passe-t-il si je n\'ai pas encore d\'abonnement ?',
      a: 'Vous pouvez consulter la landing et la page abonnement, mais le dashboard reste bloque tant qu\'aucun essai ni abonnement n\'est actif.',
    },
    {
      q: 'Puis-je envoyer un lien a mon client ?',
      a: 'Oui. Les liens publics permettent au client de payer ou de remplir un sinistre sans acceder au dashboard interne.',
    },
    {
      q: 'Puis-je adapter les prix ?',
      a: 'Oui. Les montants visibles sont commerciaux et peuvent etre relies a votre futur checkout ou a un devis sur mesure.',
    },
  ];

  return (
    <section className="bg-slate-50 py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">FAQ</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Questions frequemment posees</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <article key={faq.q} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{faq.q}</h3>
              <p className="mt-2 text-sm text-slate-600">{faq.a}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <NavBar />
      <Hero />
      <Features />
      <Steps />
      <Testimonials />
      <FAQ />
      <OffersPreview />
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} Assurlink. Tous droits reserves.</p>
          <div className="flex items-center gap-4">
            <a href="/landing" className="hover:text-slate-700">Accueil</a>
            <a href="/subscribe" className="hover:text-slate-700">Abonnement</a>
            <a href="/login" className="hover:text-slate-700">Connexion</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
