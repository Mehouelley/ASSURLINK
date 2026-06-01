# FedaPay Integration Guide - ASSURLINK

## 🎯 Overview
Intégration FedaPay en sandbox pour les paiements d'assurance ASSURLINK.

**Flux:** Client → Prime/Sinistre → Route de paiement → FedaPay → Redirect URL → Webhook Callback → Paiement confirmé

---

## 📋 Endpoints

### 1. Créer un paiement de prime (Policy Payment)

**Route:** `POST /payments/fedapay/policy-payment`

**Headers:**
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "policyId": "65f4e2a1b8c9d0e2f3g4h5i6",
  "clientId": "65f4e2a1b8c9d0e2f3g4h5i6",
  "amount": 50000,
  "phoneNumber": "+22967000000",
  "reference": "POL-2026-001" // optional
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "payment": {
    "id": "pay-uuid",
    "status": "pending",
    "amount": 50000,
    "reference": "transaction-id-fedapay",
    "payment_method": "mobile_money",
    "payment_type": "premium",
    "created_at": "2026-05-30T10:30:00Z"
  },
  "fedapay_transaction": {
    "id": "transaction-id",
    "url": "https://pay.fedapay.com/checkout-url" // Redirect client here
  },
  "redirect_url": "https://pay.fedapay.com/checkout-url"
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:3001/payments/fedapay/policy-payment \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "policy-123",
    "clientId": "client-456",
    "amount": 50000,
    "phoneNumber": "+22967000000"
  }'
```

---

### 2. Créer un remboursement de sinistre (Claim Reimbursement)

**Route:** `POST /payments/fedapay/claim-reimbursement`

**Request Body:**
```json
{
  "claimId": "65f4e2a1b8c9d0e2f3g4h5i6",
  "clientId": "65f4e2a1b8c9d0e2f3g4h5i6",
  "amount": 150000,
  "phoneNumber": "+22967000000",
  "reference": "CLAIM-2026-001" // optional
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "payment": {
    "id": "pay-uuid",
    "status": "pending",
    "amount": 150000,
    "reference": "transaction-id-fedapay",
    "payment_method": "mobile_money",
    "payment_type": "reimbursement",
    "created_at": "2026-05-30T10:30:00Z"
  },
  "fedapay_transaction": {
    "id": "transaction-id",
    "url": "https://pay.fedapay.com/checkout-url"
  },
  "redirect_url": "https://pay.fedapay.com/checkout-url"
}
```

---

### 3. Vérifier le statut d'une transaction

**Route:** `GET /payments/fedapay/:transactionId/status`

**Example:**
```bash
curl -X GET http://localhost:3001/payments/fedapay/txn-123456/status \
  -H "Authorization: Bearer <JWT>"
```

**Response:**
```json
{
  "id": "txn-123456",
  "status": "completed",
  "amount": 50000,
  "currency": "XOF",
  "reference": "POL-2026-001",
  "metadata": {
    "policy_id": "policy-123",
    "payment_type": "policy_premium"
  }
}
```

---

## 🔄 Webhook Integration

### FedaPay Webhook: Payment Confirmation

**URL:** `POST /webhooks/payments/fedapay`

**Purpose:** Reçoit les callbacks de FedaPay quand un paiement est confirmé

**FedaPay Configuration:**
1. Aller à https://dashboard.fedapay.com
2. Settings → Webhooks
3. Ajouter endpoint: `https://your-domain.com/webhooks/payments/fedapay`
4. Events: `charge.completed`, `charge.failed`

**Expected Request from FedaPay:**
```json
{
  "type": "charge.completed",
  "data": {
    "id": "txn-123456",
    "amount": 50000,
    "currency": "XOF",
    "status": "completed",
    "customer": {
      "id": "customer-id",
      "email": "client@example.com"
    },
    "metadata": {
      "policy_id": "policy-123",
      "payment_type": "policy_premium"
    }
  }
}
```

**What happens:**
1. ✅ Signature validated (HMAC-SHA256)
2. ✅ Payment status updated to `completed` in DB
3. ✅ If payment type = `premium`, policy status updated to `active`
4. ✅ Response: `{ success: true, payment: {...} }`

---

## 🧪 Testing (Sandbox)

### Credentials
- **API Key:** `sk_sandbox_test` (in backend/.env)
- **Environment:** Sandbox (api.sandbox.fedapay.com)
- **Currency:** XOF (Franc CFA Béninois)

### Test Phone Numbers
FedaPay Sandbox accepts these formats:
- `+22967000000` (Bénin - Airtel Bénin)
- `+22963000000` (Bénin - MTN Bénin)
- `+22950000000` (Bénin - Orange Bénin)

### Test Flow

1. **Create Policy Payment:**
```bash
curl -X POST http://localhost:3001/payments/fedapay/policy-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-jwt>" \
  -d '{
    "policyId": "pol-test-1",
    "clientId": "client-test-1",
    "amount": 5000,
    "phoneNumber": "+22967000000"
  }'
```

2. **Response has `redirect_url`** → Open in browser or redirect client

3. **On FedaPay Sandbox Checkout Page:**
   - Select operator (MTN, Airtel, Orange)
   - Confirm payment
   - Redirected to success page

4. **Webhook fires automatically** (FedaPay → Your backend)
   - `POST /webhooks/payments/fedapay` with completed transaction
   - Backend updates payment status to `completed`
   - If premium: policy status → `active`

5. **Check status:**
```bash
curl -X GET http://localhost:3001/payments/fedapay/<transaction-id>/status \
  -H "Authorization: Bearer <test-jwt>"
```

---

## 📊 Database Schema

### Payment Table (Updated via Webhook)
```sql
CREATE TABLE Payment (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  client_id VARCHAR(36) NOT NULL,
  policy_id VARCHAR(36) NULL,
  claim_id VARCHAR(36) NULL,
  payment_type ENUM('premium', 'reimbursement', 'commission'),
  payment_method ENUM('mobile_money', 'card', 'transfer', 'cash'),
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'cancelled'),
  reference VARCHAR(255), -- FedaPay Transaction ID
  notes TEXT,
  payment_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔐 Security

### Webhook Signature Validation
Every webhook payload is validated using HMAC-SHA256:

```typescript
// Backend validates:
signature = HMAC-SHA256(payload, API_KEY)
// Unauthorized webhooks are rejected
```

### Best Practices
- ✅ Always use HTTPS in production
- ✅ Store API keys in environment variables
- ✅ Validate webhook signatures
- ✅ Use JWT tokens for API authentication
- ✅ Log all payment transactions

---

## 🚀 Next Steps

1. **Frontend Integration:**
   - Call `/payments/fedapay/policy-payment` from submit button
   - Use `redirect_url` to redirect to FedaPay checkout
   - After payment: Check status with `/payments/fedapay/status` endpoint

2. **Production Setup:**
   - Update `FEDAPAY_API_KEY` with production key
   - Update `FEDAPAY_ENV` to `production`
   - Configure webhook URL in FedaPay dashboard
   - Update `API_URL` to production domain

3. **Error Handling:**
   - Catch payment failures and retry logic
   - Send email notifications on payment status changes
   - Add UI alerts for payment failures

4. **Reporting:**
   - Dashboard showing payment statistics
   - Export payment reports (CSV/PDF)
   - Track by policy, claim, client

---

## 📞 Support

**FedaPay Documentation:** https://docs.fedapay.com  
**FedaPay Sandbox:** https://sandbox.fedapay.com  
**Backend Logs:** `backend/dist/main.js` console output

---

**Last Updated:** 30 Mai 2026  
**Status:** ✅ Sandbox Ready
