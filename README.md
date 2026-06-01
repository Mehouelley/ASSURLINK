# ASSURLINK

Plateforme SaaS de gestion des assurances (MVP). Frontend React + Vite, backend NestJS, Prisma et MySQL.

## But

Offrir aux compagnies d'assurance un espace pour gérer clients, contrats, sinistres, paiements, documents et reporting.

## Installation (dev)

1. Copier le dépôt
2. Installer les dépendances frontend et backend

```bash
npm install
cd backend
npm install
```

3. Créer un fichier `.env` (ou `.env.local`) avec les variables suivantes:

- `VITE_API_URL` - URL de l'API NestJS
- `VITE_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `VITE_CLOUDINARY_UPLOAD_PRESET` - Cloudinary unsigned upload preset

Exemple minimal `.env`:

```
VITE_API_URL=http://localhost:3001
VITE_CLOUDINARY_CLOUD_NAME=moncloud
VITE_CLOUDINARY_UPLOAD_PRESET=unsigned_preset
```

4. Configurer le backend avec `backend/.env`:

```
DATABASE_URL=mysql://user:password@localhost:3306/assurlink
JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
CORS_ORIGIN=http://localhost:5173
```

5. Générer Prisma puis lancer les serveurs en dev

```bash
cd backend
npm run prisma:generate
npm run start:dev

# dans un autre terminal, à la racine
npm run dev
```

## Notes

- Le frontend consomme l'API NestJS via `src/lib/backendApi.ts`.
- L'authentification utilise JWT + refresh tokens côté backend.
- Le composant `FileUploader` utilise Cloudinary en upload unsigned (nécessite `upload_preset` configuré dans Cloudinary).
- Pour la production, envisagez des uploads signés côté backend pour plus de sécurité.

## Structure importante

- `src/` : code frontend
- `src/lib/backendApi.ts` : client API frontend
- `src/context/AuthContext.tsx` : gestion auth/profil
- `src/components/ui/FileUploader.tsx` : composant upload Cloudinary
- `backend/` : API NestJS
- `prisma/schema.prisma` : schéma Prisma

## Prochaines étapes recommandées

- Stabiliser les tests backend
- Brancher le frontend sur les uploads signés backend
- Mettre en place CI, tests unitaires et e2e
- Finaliser intégration Mobile Money et gestion abonnements

---

Pour plus de détails, voir `CAHIER_DES_CHARGES.md`.
