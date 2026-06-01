# CAHIER DES CHARGES - ASSURLINK

Dernière mise à jour: 1 juin 2026

## 1. Présentation

ASSURLINK est une plateforme SaaS destinée aux compagnies d’assurance africaines permettant de digitaliser et centraliser les opérations métiers: gestion clients, contrats, paiements, sinistres, agents, documents et reporting.

## 2. Contexte

De nombreuses compagnies utilisent aujourd'hui des processus manuels (Excel, papier, WhatsApp). ASSURLINK vise à moderniser ces processus pour réduire les erreurs, accélérer le traitement et centraliser les données.

## 3. Objectifs

- Digitaliser les opérations d’assurance
- Réduire les erreurs administratives
- Automatiser les traitements récurrents
- Centraliser les données par compagnie (multi-tenant)
- Intégrer les paiements digitaux (Mobile Money, cartes)

## 4. Type de solution

Solution SaaS multi-tenant (séparation logique via `company_id` dans la même base).

## 5. Utilisateurs et rôles

- Super Administrateur: gestion globale, compagnies, abonnement, logs
- Administrateur Assurance: gestion interne compagnie (utilisateurs, contrats, paiements)
- Agent / Courtier: enregistrement clients, création contrats, déclarer sinistres
- Expert Assurance: analyser sinistres, rapports, estimations
- Client: consulter contrats, déclarer sinistres, paiements

## 6. Modules fonctionnels (résumé)

- Authentification & sécurité (JWT, refresh tokens, RBAC)
- Gestion des compagnies
- Gestion utilisateurs
- Gestion clients
- Gestion contrats (policies)
- Gestion paiements (intégrations)
- Gestion sinistres (uploads médias, workflow)
- Gestion documentaire (upload, versioning)
- Gestion agents (commissions, performance)
- Notifications (email, SMS, WhatsApp future)
- Reporting & statistiques (PDF / Excel export)
- Administration système (logs, sauvegardes)

## 7. Architecture technique (préconisations)

- Frontend: React + TypeScript + Tailwind (actuellement Vite)
- Backend: Node.js + NestJS + TypeScript (API REST)
- Base: MySQL (unique DB multi-tenant)
- ORM: Prisma
- Auth: JWT personnalisé avec refresh tokens
- Stockage fichiers: Cloudinary ou AWS S3
- Déploiement: Frontend (Vercel), Backend (Railway / VPS), Base (MySQL Cloud)

## 8. Sécurité

- HTTPS obligatoire
- Chiffrement mots de passe
- Validation côté client et serveur
- Protection XSS/CSRF
- Rate limiting
- Logs & audit

## 9. Performances & SLA

- Temps de réponse < 2s
- Disponibilité cible 99%

## 10. Données & schéma (extrait)

Tables principales attendues:
- companies, profiles (users), clients, policies, claims, payments, agents, documents, notifications, reports, logs

## 11. API (endpoints principaux)

- Auth: POST /auth/login, /auth/register, /auth/forgot-password, /auth/reset-password
- Clients: CRUD /clients
- Policies: CRUD /policies
- Claims: CRUD /claims
- Payments: GET/POST /payments
- Documents: POST /documents/upload, GET /documents/:id

## 12. Phases & planning

- MVP (2-3 mois): authentification, clients, contrats, paiements (basic), sinistres (déclaration + upload)
- Phase 2 (2 mois): agents, reporting, notifications, documents avancés
- Phase 3 (3 mois): IA, app mobile, automations

## 13. Risques

- Sécurité des données, conformité locale
- Adoption & intégration Mobile Money
- Gestion médias lourds (photos/vidéo)

## 14. Critères de réussite

- Simplicité d'usage
- Sécurité et performance
- Intégration Mobile Money
- Support client

Pour détails complets et spécifications UI/UX, se référer au document de spécification initial.
