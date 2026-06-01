# 🚀 AssurLink Backend - Guide de Déploiement Complet

## Vue d'ensemble

Le backend AssurLink est construit avec :
- **Framework** : NestJS 10.4.8
- **Base de données** : MySQL / SQLite
- **ORM** : Prisma 5.22.0
- **Authentification** : JWT (access + refresh tokens)
- **Autorisation** : RBAC avec 5 rôles
- **API** : RESTful avec 9 modules

## 🛠 Configuration Initiale

### 1. Installation des dépendances

```bash
cd backend
npm install
```

### 2. Configuration des variables d'environnement

Créez un fichier `.env` dans `backend/` :

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="mysql://root@localhost/assurlink"
JWT_SECRET="votre-secret-tres-long-et-aleatoire"
JWT_REFRESH_SECRET="votre-refresh-secret-tres-long"
CORS_ORIGIN="http://localhost:5173"
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"
FEDAPAY_API_KEY="votre-fedapay-key"
MTN_API_KEY="votre-mtn-key"
ORANGE_API_KEY="votre-orange-key"
```

### 3. Configuration Base de Données

#### Pour MySQL :

```bash
# Créer la base de données
sudo mysql -u root -e "CREATE DATABASE assurlink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Exécuter les migrations
npm run prisma:migrate:dev -- --name init

# Remplir avec des données de test (optionnel)
# DATABASE_URL="mysql://root@localhost/assurlink" node ../prisma/seed-updated.mjs
```

#### Pour SQLite (développement simple) :

Modifiez `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Et `.env` :

```env
DATABASE_URL="file:./dev.db"
```

## 📦 Schéma de Base de Données

Le schéma contient 9 modèles :

```
Company
  ├── Profile (utilisateurs)
  ├── Client
  │   ├── Policy (contrats)
  │   │   └── Document
  │   ├── Claim (sinistres)
  │   │   └── Document
  │   └── Payment (paiements)
  ├── Agent
  └── Notification
```

### Rôles et Permissions

| Rôle | Permissions |
|------|------------|
| **super_admin** | Accès complet à tous les modules |
| **admin** | Gestion clients, contrats, sinistres, paiements |
| **agent** | Création/édition clients, contrats, sinistres, paiements |
| **expert** | Consultation sinistres, édition statuts |
| **client** | Consultation propres contrats et sinistres |

## 🚀 Démarrage du Serveur

### Mode Développement

```bash
npm run start:dev
# Le serveur écoute sur http://localhost:3001
# Rechargement automatique à chaque modification
```

### Mode Production

```bash
npm run build
npm run start:prod
```

## 📋 Endpoints Disponibles

### 🔐 Authentication

```
POST   /auth/register        - Créer un compte
POST   /auth/login           - Se connecter
POST   /auth/refresh         - Rafraîchir le token
GET    /auth/me              - Infos utilisateur courant
GET    /auth/admin-only-check - Test accès super_admin
```

### 🏢 Companies

```
GET    /companies            - Lister (super_admin)
PATCH  /companies/:id        - Modifier (super_admin)
```

### 👥 Users

```
GET    /users                - Lister (super_admin)
PATCH  /users/:id            - Modifier (super_admin)
```

### 👤 Clients

```
GET    /clients              - Lister    (admin, agent)
POST   /clients              - Créer     (admin, agent)
PATCH  /clients/:id          - Modifier  (admin, agent)
DELETE /clients/:id          - Supprimer (admin, agent)
```

### 📋 Policies

```
GET    /policies             - Lister    (admin, agent)
POST   /policies             - Créer     (admin, agent)
PATCH  /policies/:id         - Modifier  (admin, agent)
DELETE /policies/:id         - Annuler   (admin, agent)
```

### 🚨 Claims

```
GET    /claims               - Lister    (admin, agent, expert)
POST   /claims               - Créer     (admin, agent, expert)
PATCH  /claims/:id           - Modifier  (admin, agent, expert)
DELETE /claims/:id           - Fermer    (admin, agent, expert)
```

### 💰 Payments

```
GET    /payments             - Lister    (admin, agent)
POST   /payments             - Créer     (admin, agent)
PATCH  /payments/:id         - Modifier  (admin, agent)
DELETE /payments/:id         - Annuler   (admin, agent)
```

### 📄 Documents

```
GET    /documents            - Lister (admin, agent, expert)
POST   /documents            - Créer  (admin, agent, expert)
```

### 📢 Notifications

```
GET    /notifications        - Lister       (tous)
PATCH  /notifications/:id/read - Marquer lu (tous)
```

### 🤝 Agents

```
GET    /agents               - Lister (admin, super_admin)
```

### 🎥 Webhook Paiements

```
POST   /webhooks/payments/fedapay   - FedaPay webhooks
POST   /webhooks/payments/mtn       - MTN Mobile Money webhooks
POST   /webhooks/payments/orange    - Orange Money webhooks
```

### 📤 Uploads Sécurisés

```
POST   /uploads/signature    - Générer signature Cloudinary
GET    /uploads/secure-url   - Générer URL sécurisée
POST   /uploads/validate-response - Valider upload Cloudinary
GET    /uploads/allowed-types - Types autorisés
GET    /uploads/transformations - Transformations images
```

## 🔐 Authentification

### Flow JWT

1. **Registration/Login** → Serveur genère :
   - `access_token` (valide 1h)
   - `refresh_token` (valide 7j, hashé en BDD)

2. **Requête authentifiée** :
   ```
   Authorization: Bearer <access_token>
   ```

3. **Renouvellement** :
   ```
   POST /auth/refresh
   { "refresh_token": "..." }
   ```

### Rôles et Guards

Utiliser le décorateur `@Roles()` sur les routes :

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'agent')
@Get('clients')
findAll(@CurrentUser() user) { }
```

## 🧪 Tests

### Tests Unitaires

```bash
npm test
```

### Tests E2E

```bash
npm run test:e2e
```

### Couverture

```bash
npm run test:cov
```

## 📦 Build et Déploiement

### Build TypeScript

```bash
npm run build
```

### Linter

```bash
npm run lint
```

### Vérifier compilation

```bash
npx tsc --noEmit -p tsconfig.json
```

## 📝 Identifiants de Test

Les données de seed créent automatiquement :

| Email | Password | Rôle |
|-------|----------|------|
| superadmin@assurlink.local | SuperAdmin123! | super_admin |
| admin@assurlink.local | Admin123! | admin |
| agent1@assurlink.local | Agent123! | agent |
| expert@assurlink.local | Expert123! | expert |

## 🌐 Variables d'Environnement Complètes

```bash
# Application
NODE_ENV=development|production
PORT=3001

# Base de données (MySQL)
DATABASE_URL=mysql://[user]:[password]@[host]:[port]/[database]

# JWT
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-super-secret
JWT_EXPIRATION=3600s
JWT_REFRESH_EXPIRATION=604800s

# CORS
CORS_ORIGIN=http://localhost:5173

# Cloudinary (uploads d'images/documents)
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Payment Webhooks
FEDAPAY_API_KEY=your-fedapay-key
MTN_API_KEY=your-mtn-key
ORANGE_API_KEY=your-orange-key
```

## 🔄 Webhooks de Paiement

### Configuration FedaPay

1. Accédez au dashboard FedaPay
2. Configurez webhook URL : `https://votre-domaine/webhooks/payments/fedapay`
3. Sélectionnez les événements : `charge.completed`, `charge.failed`
4. Copiez la clé API dans `FEDAPAY_API_KEY`

### Configuration MTN

1. Accédez à MTN API
2. URL webhook : `https://votre-domaine/webhooks/payments/mtn`
3. Configurez la clé API

### Configuration Orange

1. Accédez à Orange Money API
2. URL webhook : `https://votre-domaine/webhooks/payments/orange`
3. Configurez la clé API

## 📤 Uploads Sécurisés via Cloudinary

### Frontend (React)

```typescript
// 1. Récupérer la signature
const res = await fetch('/api/uploads/signature', {
  method: 'POST',
  body: JSON.stringify({ publicId: 'my-claim-doc' }),
  headers: { 'Authorization': `Bearer ${token}` }
});

const { cloudName, signature, timestamp, apiKey, folder } = await res.json();

// 2. Créer un formulaire d'upload
const formData = new FormData();
formData.append('file', file);
formData.append('api_key', apiKey);
formData.append('signature', signature);
formData.append('timestamp', timestamp);
formData.append('folder', folder);

// 3. Upload directement vers Cloudinary
const upload = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  { method: 'POST', body: formData }
);

// 4. Valider la réponse
const validated = await fetch('/api/uploads/validate-response', {
  method: 'POST',
  body: JSON.stringify(await upload.json()),
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🐛 Dépannage

### Erreur : "Cannot find module '@prisma/client'"

```bash
npm run prisma:generate
```

### Erreur : "DATABASE_URL not found"

Vérifiez que le fichier `.env` existe et contient `DATABASE_URL`

### Erreur : "Connection refused"

- MySQL n'est pas en cours d'exécution
- URL de base de données incorrect

### Erreur : "Invalid signature"

- Clé API webhook incorrecte
- Signature a expiré (> quelques minutes)

## 📊 Monitoring et Logs

Le serveur utilise `Logger` de NestJS. Les logs apparaissent en console :

```
[15:30:22] Starting compilation in watch mode...
[15:30:28] Successfully compiled 15 files with tsc
[NestFactory] Starting Nest application...
[AppModule] Core modules initialized
[AuthService] Super Admin registered...
```

## 🚀 Prochaines Étapes

1. ✅ Configuration initiale
2. ✅ Démarrage du serveur
3. ✅ Tests endpoints
4. ✅ Configuration webhooks paiements
5. ✅ Test uploads Cloudinary
6. ✅ Déploiement en production

## 📞 Support

Pour toute question ou problème, consultez :
- Documentation NestJS : https://docs.nestjs.com
- Prisma ORM : https://www.prisma.io/docs
- JWT : https://jwt.io
