# 📋 Gestion des Prospections dans ASSURLINK

## 🎯 Qu'est-ce qu'une Prospection ?

**Prospect** = Contact / Entreprise en cours de conversion vers CLIENT

**Workflow :**
```
Prospect (nouveau contact)
    ↓ (contact + présentation)
Prospect Intéressé (devis envoyé)
    ↓ (négociation)
Prospect en Négociation (relances)
    ↓ (signature)
Prospect Converti → CLIENT CONFIRMÉ (1er contrat signé)
    ↓
Prospect Perdu (non converti après X jours)
```

---

## 📊 Modèle de Données - Table PROSPECT

```prisma
enum ProspectStatus {
  new               // Nouveau contact
  contacted         // Première prise de contact
  interested        // Intéressé (devis envoyé)
  negotiating       // En négociation (relances)
  converted         // Converti en client
  lost              // Perdu / Pas intéressé
}

enum ProspectSource {
  referral          // Recommandation
  cold_call         // Appel froid
  web               // Site web / formulaire
  event             // Événement / salon
  existing_client   // Client existant (nouveau produit)
  partnership       // Partenariat
  other
}

enum ProspectType {
  individual        // Personne physique
  corporate         // Entreprise
}

model Prospect {
  id                 String        @id @default(uuid())
  company_id         String
  company            Company       @relation(fields: [company_id], references: [id])
  
  // Contact Info
  first_name         String
  last_name          String
  email              String
  phone              String
  company_name       String?       // Pour prospects corporate
  prospect_type      ProspectType  @default(individual)
  
  // Gestion
  status             ProspectStatus @default(new)
  source             ProspectSource @default(other)
  assigned_to_id     String?       // Commercial assigné
  assigned_to        Profile?      @relation(fields: [assigned_to_id], references: [id])
  
  // Données commerciales
  needs              String?       // Type d'assurance cherchée (auto, habitation, pro, etc.)
  budget_estimate    Float?        // Budget estimé annuel
  priority           String?       // high, medium, low
  
  // Workflow
  first_contact_date DateTime?
  last_contact_date  DateTime?
  next_followup_date DateTime?
  
  // Conversion
  client_id          String?       // Une fois converti
  client             Client?       @relation(fields: [client_id], references: [id])
  conversion_date    DateTime?
  loss_reason        String?       // Si perdu
  
  // Tracking
  notes              String?
  interactions_count Int @default(0)
  
  // Timestamps
  created_by         String?
  created_at         DateTime      @default(now())
  updated_at         DateTime      @updatedAt
  
  // Relations
  interactions       ProspectInteraction[]
  quotes             Quote[]
  files              ProspectDocument[]
}

model ProspectInteraction {
  id                 String   @id @default(uuid())
  prospect_id        String
  prospect           Prospect @relation(fields: [prospect_id], references: [id], onDelete: Cascade)
  
  type               String   // call, email, meeting, sms, other
  status_before      String?  // Ancien statut prospect
  status_after       String?  // Nouveau statut après interaction
  summary            String
  notes              String?
  
  done_by_id         String?  // ID du commercial/agent
  created_at         DateTime @default(now())
}

model Quote {
  id                 String   @id @default(uuid())
  company_id         String
  company            Company  @relation(fields: [company_id], references: [id])
  prospect_id        String
  prospect           Prospect @relation(fields: [prospect_id], references: [id], onDelete: Cascade)
  
  quote_number       String @unique
  insurance_type     String   // auto, habitation, pro, etc.
  premium_amount     Float
  coverage_description String?
  
  valid_until        DateTime // Validité du devis
  status             String?  // draft, sent, accepted, expired
  
  created_by         String?
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt
}

model ProspectDocument {
  id                 String   @id @default(uuid())
  prospect_id        String
  prospect           Prospect @relation(fields: [prospect_id], references: [id], onDelete: Cascade)
  
  name               String   // ex: "ID prospect", "Pièce identité", etc.
  file_url           String
  document_type      String?
  uploaded_at        DateTime @default(now())
}
```

---

## 🛠️ Fonctionnalités à Implémenter

### 1. **Dashboard Commercial** (Vue "Prospects")
```
📊 Statistics
  ├─ Nouveaux prospects ce mois
  ├─ Prospects intéressés (en cours)
  ├─ Taux de conversion (%)
  └─ Valeur pipeline estimée

📋 Listes Segmentées
  ├─ Mes prospects assignés
  ├─ Suivis aujourd'hui
  ├─ À relancer cette semaine
  ├─ Devis en attente de réponse
  └─ Entonnoir ventes (visuellement)

🎯 Actions Rapides
  ├─ Ajouter prospect
  ├─ Créer devis
  ├─ Mettre à jour statut
  ├─ Planifier relance
  └─ Convertir en client
```

### 2. **Fiche Prospect Détaillée**
```
👤 Infos Contact
  ├─ Nom, email, phone
  ├─ Type (physique/corporate)
  ├─ Company + secteur
  └─ Besoins identifiés

📅 Historique Interactions
  ├─ Appels (date, notes)
  ├─ Emails (date, objet, résultat)
  ├─ Réunions (date, durée, décisions)
  ├─ SMS (date, contenu)
  └─ Timeline chronologique

📊 Commerciaux
  ├─ Commercial assigné
  ├─ Budget estimé
  ├─ Priorité (high/medium/low)
  ├─ Source d'acquisition
  └─ Last contact date + Next followup

📄 Documents
  ├─ Devis associés
  ├─ Documents fournis par prospect
  └─ Photos/documents de profil

🔄 Conversion
  ├─ Statut conversion
  ├─ Date conversion (si converti)
  ├─ Client lié (si converti)
  └─ Raison perte (si perdu)
```

### 3. **Automations & Workflows**
```
⏰ Rappels Automatsés
  ├─ "Prospect non contacté depuis 5j" → Alerte commercial
  ├─ "Devis expirant demain" → Alerte
  ├─ "Suivi prévu aujourd'hui" → Notification matin
  └─ "Pas de conversion après 30j" → Marquer comme "Perdu" (si OK)

📧 Templates Communications
  ├─ Email intro (premier contact)
  ├─ Email devis (avec PDF)
  ├─ Email relance (après 1 semaine)
  ├─ Email urgence (devis expirant)
  └─ Email fermeture (conversion ou perdu)

📊 Tâches Auto-Créées
  ├─ "Envoyer devis" attachée à quote
  ├─ "Appeler pour relancer" après X jours
  ├─ "Vérifier devis obsolète" à date expiration
  └─ "Marquer perdu" après inactivité 60j
```

### 4. **Analytics & Reporting pour Directeur**
```
📈 KPIs Prospection
  ├─ Nombre prospects actifs / total
  ├─ Taux de conversion (prospects → clients)
  ├─ Temps moyen conversion (days)
  ├─ Valeur pipeline estimée
  ├─ Source meilleure conversion
  ├─ Commercial top performer
  └─ Coût d'acquisition estimé

📊 Graphiques
  ├─ Entonnoir (prospects par statut)
  ├─ Timeline conversions (par mois)
  ├─ Source d'acquisition (pie chart)
  └─ Performance par commercial (leaderboard)

📋 Rapports Détaillés
  ├─ "Prospects perdus ce trimestre" (raisons)
  ├─ "Pipeline par commercial"
  ├─ "Prospects > 90j sans suivi" (at risk)
  └─ Export vers Excel/PDF
```

---

## 📱 Mockup : Fiche Prospect

```
┌─────────────────────────────────────────┐
│ Prospect: Jean Muller (Perdu)           │
│                                         │
│ 👤 Email: jean@example.com              │
│ 📱 Tél: +225 01 02 03 04               │
│                                         │
│ 🏢 Type: Individual                    │
│ 📋 Besoin: Assurance Auto              │
│ 💰 Budget: ~500k XOF/an                │
│ ⭐ Priorité: High                      │
│ 📌 Source: Appel froid                 │
│                                         │
│ [Commercial: Alice] [Assigné: 15/05]  │
│                                         │
│ ─────────────── Interactions ───────────│
│ 📞 15/05 - Appel prospection (Alice)   │
│    "Intéressé, envoi devis"           │
│                                         │
│ 📧 16/05 - Email devis (Alice)         │
│    Devis: DV-001 (500k, auto)         │
│    Valide jusqu'au: 30/05              │
│                                         │
│ 📞 25/05 - Appel relance (Alice)       │
│    "Will think about it"               │
│                                         │
│ ❌ 28/05 - Marq Perdu (Alice)          │
│    Reason: "Budget limité"             │
│                                         │
│ ─────────────────────────────────────│
│ 📄 Docs: [ID Photo] [2 docs]          │
│                                         │
│ [← Back] [Edit] [Call] [Email] [SMS] │
│ [Create Quote] [Convert] [Delete]     │
└─────────────────────────────────────────┘
```

---

## 🔄 Workflow Complet

```
1. DÉCOUVERTE
   Commercial ajoute prospect
   ↓
2. PREMIER CONTACT
   Commercial appelle → Email présentation
   Status: "contacted"
   ↓
3. INTÉRÊT
   Prospect répond → Devis créé & envoyé
   Status: "interested"
   ↓
4. NÉGOCIATION
   Relances → Appels → Réunion
   Status: "negotiating"
   Next followup planifié
   ↓
5. CONCLUSION (2 chemins)
   A) ✅ CONVERSION
      Contrat signé → Client créé
      Prospect marqué "converted"
      Devis → Policy créée
      
   B) ❌ PERTE
      Prospect marque "lost"
      Raison documentée
      Archivement
```

---

## 🚀 Prochaines Étapes

1. ✏️ Ajouter Prospect, ProspectInteraction, Quote, ProspectDocument au schema Prisma
2. 🗄️ Créer migration
3. 🛣️ Routes backend (CRUD prospects, interactions, quotes)
4. 🎨 UI Frontend (liste, fiche, formulaires)
5. ⚙️ Automations (rappels, templates, workflows)
6. 📊 Dashboard analytics

---
