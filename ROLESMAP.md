# 🏢 Structure d'une Agence d'Assurance & Valeur du SaaS ASSURLINK

## Rôles & Responsabilités

### 1️⃣ **DIRECTEUR / GÉRANT** `director`
**Responsabilités :**
- Stratégie commerciale, croissance, profitabilité
- Supervision globale, reporting aux propriétaires
- Décisions majeures (partenariats, produits, tarifs)

**Valeur ASSURLINK :**
- ✅ Dashboard centralisé (KPIs, CA, sinistres, taux conversion)
- ✅ Reports automatsés (mensuel/trimestriel/annuel)
- ✅ Analytics clients/contrats/performance équipe
- ✅ Alertes anomalies (sinistres anormaux, impayés)
- ✅ Comparatifs équipe/performance individuals

---

### 2️⃣ **COMMERCIAL / AGENT** `commercial`
**Responsabilités :**
- Prospection et acquisition clients
- Négociation et vente de contrats
- Fidélisation clients existants
- Suivi des dossiers en cours

**Valeur ASSURLINK :**
- ✅ CRM clients (fiches, historique, interactions)
- ✅ Pipeline de ventes (prospects → clients)
- ✅ Automations (rappels renouvellements, relances)
- ✅ Documents/contrats à signer fast
- ✅ Suivi commissions & performance
- ✅ Partage de leads entre équipe

---

### 3️⃣ **EXPERT / SINISTRE** `expert`
**Responsabilités :**
- Évaluation des sinistres déclarés
- Décisions (acceptation/refus/compensation)
- Coordination avec assureurs partenaires
- Documentation dossier et justifications

**Valeur ASSURLINK :**
- ✅ Workflow sinistres digitalisé (réception → décision)
- ✅ Checklist / checklist dossiers incomplets
- ✅ Communications standardisées (lettres, formulaires)
- ✅ Historique client (antécédents sinistres)
- ✅ Traçabilité 100% des décisions
- ✅ Alertes sinistres critiques (montants élevés, fraude suspectée)

---

### 4️⃣ **RH / PAIE** `hr`
**Responsabilités :**
- Gestion du personnel (embauche, contrats, paie)
- Formations, évaluations
- Compliance légale / RGPD
- Gestion absences/congés

**Valeur ASSURLINK :**
- ✅ Base de données agents et leurs attributions
- ✅ Tracking performance agents (clients/contrats/sinistres)
- ✅ Attribution clients à agents (load balancing)
- ✅ Historique actions de chaque agent (audit trail)
- ✅ Rapports pour évaluations annuelles
- ✅ Données brutes pour paie (commissions, bonus)

---

### 5️⃣ **COMPTABLE** `accountant`
**Responsabilités :**
- Facturation clients
- Suivi trésorerie (paiements, relances)
- Reports financiers (balance, P&L)
- Réconciliation banque

**Valeur ASSURLINK :**
- ✅ Facturation automatsée par contrat
- ✅ Suivi paiements (échus, retards, totaux)
- ✅ Relances automatsées (dettes clients)
- ✅ Exports vers comptabilité (fichiers pour logiciel)
- ✅ Bilan CA/dépenses par période
- ✅ Rapports TVA/taxes

---

### 6️⃣ **ADMIN / SUPPORT** `admin`
**Responsabilités :**
- Gestion système, utilisateurs, droits accès
- Support technique utilisateurs
- Backup, sécurité, compliance
- Configuration produits/tarifs

**Valeur ASSURLINK :**
- ✅ Gestion utilisateurs & permissions granulaires
- ✅ Audit logs (qui a fait quoi, quand)
- ✅ Backups automatsés, récupération données
- ✅ Monitoring système, alertes
- ✅ Configuration produits d'assurance
- ✅ Gestion modèles documents

---

### 7️⃣ **CLIENT** `client`
**Responsabilités :**
- Acheter des contrats d'assurance
- Payer les primes
- Déclarer sinistres si besoin
- Consulter ses contrats

**Valeur ASSURLINK :**
- ✅ Portail client (mes contrats, mes sinistres)
- ✅ Auto-déclaration sinistre (formulaire simple)
- ✅ Suivi sinistre (état avancement)
- ✅ Documents récupérables (devis, contrats, attestations)
- ✅ Historique paiements et factures
- ✅ Notifications automatsées (renouvellements, changements)

---

## 🎯 Résumé Valeur par Rôle

| Rôle | Besoin #1 | Besoin #2 | Besoin #3 |
|------|-----------|-----------|-----------|
| **Directeur** | Dashboard/Analytics | Reporting automatsé | Alertes anomalies |
| **Commercial** | CRM Clients | Pipeline ventes | Automations relances |
| **Expert** | Workflow sinistres | Traçabilité décisions | Checklist dossiers |
| **RH** | Base agents | Performance tracking | Audit trail |
| **Comptable** | Facturation auto | Suivi trésorerie | Exports financiers |
| **Admin** | Gestion utilisateurs | Audit logs | Backups/Sécurité |
| **Client** | Portail self-service | Déclaration sinistre | Historique contrats |

---

## 🌱 Seed Demo Users

```
1. Admin@assurlink       → super_admin (propriété du SaaS)
2. Director Jean         → director (dirige l'agence)
3. Commercial Alice      → commercial (vend contrats)
4. Commercial Bob        → commercial (vend contrats)
5. Expert Carla          → expert (évalue sinistres)
6. RH David              → hr (gère personnel)
7. Comptable Eve         → accountant (facturation)
8. Client 1 (Jean D.)    → client (achète contrats)
9. Client 2 (Marie M.)   → client (achète contrats)
10. Client 3 (ACME)      → client (entreprise)
```

**Chaque user aura :**
- Son dashboard adapté à son rôle
- Ses actions autorisées (commercial ne voit pas paie, comptable ne gère pas sinistres)
- Ses listes & reports spécifiques
- Son fil d'activité pertinent

---

