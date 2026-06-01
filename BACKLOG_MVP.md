# Backlog MVP — ASSURLINK

Sprint 1 (2 weeks): Auth & Core
- Auth: login/register via backend NestJS + JWT — implemented
- RBAC backend + frontend — implemented, à renforcer par tests
- Create company on signup — implemented

Sprint 2 (2 weeks): Clients & Policies
- CRUD clients (frontend + backend done)
- CRUD policies (frontend + backend done)
- Search & filters
- Validations forms

Sprint 3 (2 weeks): Sinistres & Documents
- Sinistre declaration with upload (photos/PDF) — upload component added
- Store document records and link to claim — partial integration
- Preview / download

Sprint 4 (2 weeks): Paiements & Reporting
- Integrate payment provider (FedaPay / Mobile Money) — design & backend
- Payment webhooks & status update
- Basic reporting export (PDF/CSV)

Cross-cutting
- Tests (unit & e2e)
- CI pipeline
- Accessibility improvements
- Internationalisation

Notes:
- Prioriser uploads sécurisés (signed) en production.
- Stabiliser les tests backend et les uploads signés.
