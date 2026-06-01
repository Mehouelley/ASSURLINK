import { useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: 'Bienvenue sur ASSURLINK',
    description: "Suivez ce court tour pour découvrir les actions clés : créer un client, créer un contrat et déclarer un sinistre.",
    actionLabel: 'Commencer',
    action: () => {},
  },
  {
    title: 'Créer un client',
    description: "Ajoutez vos clients et consultez leurs fiches. Cliquez sur le bouton pour aller à la page Clients.",
    actionLabel: 'Aller aux clients',
    action: () => { window.history.pushState({}, '', '/clients'); window.dispatchEvent(new PopStateEvent('popstate')); },
  },
  {
    title: 'Créer un contrat',
    description: "Créez un contrat lié à un client et suivez ses échéances.",
    actionLabel: 'Aller aux contrats',
    action: () => { window.history.pushState({}, '', '/policies'); window.dispatchEvent(new PopStateEvent('popstate')); },
  },
  {
    title: 'Déclarer un sinistre',
    description: "Enregistrez un sinistre depuis la fiche client ou la page Sinistres.",
    actionLabel: 'Aller aux sinistres',
    action: () => { window.history.pushState({}, '', '/claims'); window.dispatchEvent(new PopStateEvent('popstate')); },
  },
  {
    title: 'Fin du tour',
    description: "Vous êtes prêt·e ! Utilisez le bouton d'aide en haut pour relancer ce tour à tout moment.",
    actionLabel: 'Terminer',
    action: () => {},
  },
];

export function OnboardingTour({ open, onClose }: OnboardingTourProps) {
  const [index, setIndex] = useState(0);
  if (!open) return null;

  const step = steps[index];

  function next() {
    if (index < steps.length - 1) setIndex(index + 1);
    else handleClose();
  }

  function prev() {
    if (index > 0) setIndex(index - 1);
  }

  function handleAction() {
    try { step.action(); } catch (e) { /* ignore */ }
  }

  function handleClose() {
    localStorage.setItem('assurlink.tour_shown', 'true');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 p-6 z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">{step.title}</h3>
            <p className="text-sm text-gray-600 mt-2">{step.description}</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={prev} disabled={index === 0} className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Précédent
            </button>
            <button onClick={handleAction} className="px-3 py-2 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              {step.actionLabel}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500">Étape {index + 1} / {steps.length}</div>
            <button onClick={next} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2">
              {index === steps.length - 1 ? 'Terminer' : 'Suivant'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingTour;
