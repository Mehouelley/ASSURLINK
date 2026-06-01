# Deploiement gratuit pour tests

Objectif: mettre ASSURLINK en ligne gratuitement pour une beta avec quelques amis.

## Stack conseillee

- Frontend: Vercel, plan Hobby gratuit.
- Backend: Render, Free Web Service.
- Base de donnees: Aiven for MySQL, free tier.
- Fichiers: Cloudinary, free tier.

Pourquoi ce choix:

- Le projet utilise deja React/Vite, parfait pour Vercel.
- Le backend NestJS lit deja `PORT`, donc Render peut le demarrer.
- Le schema Prisma est configure en MySQL, donc Aiven evite de migrer vers PostgreSQL.

Limites a connaitre:

- Render Free met le backend en veille apres environ 15 minutes sans trafic. Le premier chargement peut prendre environ une minute.
- Aiven MySQL free est limite a 1 GB, suffisant pour une beta.
- Ce setup est fait pour tester, pas pour vendre en production.

## 1. Base MySQL sur Aiven

1. Creer un compte Aiven.
2. Creer un service `Aiven for MySQL` en free tier.
3. Copier l'URL de connexion MySQL.
4. Garder cette valeur pour `DATABASE_URL`.

La valeur ressemble a:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED
```

## 2. Backend sur Render

Creer un `Web Service` Render depuis le repo GitHub.

Configuration:

```text
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run prisma:generate && npm run prisma:push && npm run build
Start Command: npm run start:prod
```

Variables d'environnement Render:

```env
NODE_ENV=production
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED
JWT_SECRET=une-valeur-longue-aleatoire
JWT_REFRESH_SECRET=une-autre-valeur-longue-aleatoire
CORS_ORIGIN=https://TON-FRONTEND.vercel.app
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FEDAPAY_API_KEY=
FEDAPAY_SECRET_KEY=
FEDAPAY_ENVIRONMENT=sandbox
```

Apres deploy, Render donne une URL du type:

```text
https://assurlink-api.onrender.com
```

Tester:

```text
https://assurlink-api.onrender.com/health
```

## 3. Frontend sur Vercel

Importer le meme repo GitHub dans Vercel.

Configuration:

```text
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
```

Variables d'environnement Vercel:

```env
VITE_API_URL=https://TON-BACKEND.onrender.com
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Ensuite, redeployer le frontend.

## 4. Derniers reglages

1. Reprendre l'URL Vercel finale.
2. Retourner dans Render.
3. Mettre `CORS_ORIGIN` avec l'URL Vercel exacte.
4. Redeployer le backend.
5. Creer un compte depuis `/register`.

## 5. Checklist beta amis

- Tester inscription.
- Tester connexion.
- Creer un client.
- Creer un contrat.
- Creer un sinistre.
- Creer un paiement.
- Tester sur telephone.
- Ne pas mettre de vraies donnees sensibles pendant la beta gratuite.
