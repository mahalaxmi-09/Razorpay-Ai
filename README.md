# RazorRecover AI — Intelligent Revenue Recovery

> **SAFETY NOTICE:** This application operates strictly in **RAZORPAY TEST MODE**. No live payments, real customer money, or production credentials are used or permitted.

---

## 🏗️ Architecture

```
Razorpay TEST API / Webhooks / CSV
                ↓
    Payment Provider Adapter
                ↓
       Express Backend API (Port 5000)
                ↓
       PostgreSQL Database (Prisma ORM)
                ↓
      Transaction Processor
                ↓
      Revenue Risk Detection
                ↓
      Deterministic Rules Engine
                ↓
         Safety Guardrails
                ↓
      Recovery Simulator (Safe Sandbox)
                ↓
      Audit Trail & Notification Logger
                ↓
      React 19 Frontend (Port 5174)
                ↓
      AI Copilot (Grounded Assistant)
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```ini
# Server & App Config
PORT=5000
FRONTEND_URL="http://localhost:5174"
APP_URL="http://localhost:5000"

# PostgreSQL Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/razorrecover?schema=public"

# Razorpay TEST API Credentials (TEST MODE ONLY - never use rzp_live_ keys)
RAZORPAY_KEY_ID="your_test_key_id"
RAZORPAY_KEY_SECRET="your_test_key_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# OpenAI API Credentials (Optional)
OPENAI_API_KEY="your_openai_key"
OPENAI_MODEL="gpt-4o"
```

> **Security Note:** `.env` is strictly ignored in `.gitignore` and must never be committed to source control.

---

## 🚀 Quick Start Commands

```bash
# 1. Start both Express Backend (Port 5000) and Frontend UI (Port 5174)
npm run dev:all

# 2. Synchronize PostgreSQL database schema
npm run db:push

# 3. Seed 10 development scenarios
npm run seed

# 4. Run automated test suite
npm run test
```

---

## 🔌 API Endpoints Summary

### Payments & Ingestion
* `GET /api/payments` — Query paginated transactions with status, risk, and settlement filters.
* `GET /api/payments/:paymentId` — Detailed view with risk events, AI decisions, actions, and audit logs.
* `GET /api/payments/:paymentId/status` — Fast status query.
* `POST /api/payments/sync` — Synchronizes payments from Razorpay TEST API into PostgreSQL and evaluates risk.
* `POST /api/payments/verify-settlement/:paymentId` — Verifies settlement reconciliation.

### Webhooks
* `POST /api/webhooks/razorpay` — Secure webhook listener with HMAC SHA-256 signature verification and idempotency protection.

### AI Copilot & Recovery
* `POST /api/copilot` — Grounded AI Copilot assistant querying live database records.
* `GET /api/recovery/cases` — Active and historical recovery cases.
* `POST /api/recovery/cases/:id/simulate` — Executes safe simulated recovery actions.

---

## 🧪 Testing

Run all unit and integration tests:
```bash
npm run test
```
