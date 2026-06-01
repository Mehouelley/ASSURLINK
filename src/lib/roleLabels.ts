const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Createur plateforme',
  admin: 'Responsable agence',
  director: 'Directeur',
  agent: 'Employe / Conseiller',
  commercial: 'Commercial',
  expert: 'Expert sinistre',
  client: 'Assure',
  president: 'President',
  directeur_general: 'Directeur general',
  chef_agence: 'Chef agence',
  chef_commercial: 'Chef commercial',
  charge_clientele: 'Charge clientele',
  conseiller_clientele: 'Conseiller clientele',
  gestionnaire_portefeuille: 'Gestionnaire portefeuille',
  gestionnaire_sinistre: 'Gestionnaire sinistre',
  souscripteur: 'Souscripteur',
  responsable_agence: 'Responsable agence',
  responsable_rh: 'Responsable RH',
  juriste: 'Juriste',
  comptable: 'Comptable',
  informatique: 'Informatique',
  controle_interne: 'Controle interne',
};

function toTitleCaseFromSlug(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function roleLabel(role?: string | null): string {
  if (!role) return '';
  return ROLE_LABELS[role] ?? toTitleCaseFromSlug(role);
}
