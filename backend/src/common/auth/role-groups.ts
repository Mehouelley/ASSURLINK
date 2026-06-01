const ADMIN_ROLES = new Set([
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

/**
 * Expands a business role into technical aliases used by @Roles decorators.
 */
export function resolveRoleAliases(role?: string | null): string[] {
  if (!role) return [];

  const aliases = new Set<string>([role]);

  if (role === 'super_admin') {
    aliases.add('admin');
    aliases.add('agent');
    aliases.add('expert');
    aliases.add('client');
  }

  if (ADMIN_ROLES.has(role)) {
    aliases.add('admin');
  }

  if (SALES_ROLES.has(role)) {
    aliases.add('agent');
  }

  if (EXPERT_ROLES.has(role)) {
    aliases.add('expert');
  }

  return [...aliases];
}
