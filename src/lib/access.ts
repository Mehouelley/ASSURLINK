const ADMIN_ROLES = new Set([
  'super_admin',
  'admin',
  'director',
  'responsable_agence',
  'chef_agence',
  'directeur',
  'directeur_general',
  'president',
]);

const SALES_ROLES = new Set([
  'agent',
  'commercial',
  'chef_commercial',
  'charge_clientele',
  'conseiller_clientele',
  'gestionnaire_portefeuille',
  'souscripteur',
]);

const EXPERT_ROLES = new Set([
  'expert',
  'gestionnaire_sinistre',
  'juriste',
]);

export function isAdminRole(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.has(role);
}

export function isSalesRole(role?: string | null): boolean {
  return !!role && SALES_ROLES.has(role);
}

export function isExpertRole(role?: string | null): boolean {
  return !!role && EXPERT_ROLES.has(role);
}

export function canManageUsers(role?: string | null): boolean {
  return isAdminRole(role);
}

export function canManageOperationalData(role?: string | null): boolean {
  return isAdminRole(role) || isSalesRole(role);
}

export function canEditClaims(role?: string | null): boolean {
  return isAdminRole(role) || isSalesRole(role) || isExpertRole(role);
}

export function canUpdateClaimStatus(role?: string | null): boolean {
  return isAdminRole(role) || isExpertRole(role);
}
