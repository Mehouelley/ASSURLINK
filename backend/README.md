# ASSURLINK Backend

Backend NestJS pour la plateforme ASSURLINK.

## Stack

- NestJS
- TypeScript
- Prisma ORM
- MySQL
- JWT

## Démarrage

```bash
npm install
npm run prisma:generate
npm run start:dev
```

## Variables d'environnement

Copier `./.env.example` vers `./.env` et renseigner :

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`

## Statut

Base initiale prête. Les modules métier seront complétés ensuite.
