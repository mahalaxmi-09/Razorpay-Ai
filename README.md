# RazorRecover AI

Recover revenue. Intelligently.

> **IMPORTANT DISCLAIMER:** This project uses Razorpay Test Mode and synthetic development data. No real money is processed during transaction or recovery simulations.

---

## 🏗️ Project Architecture

RazorRecover AI is structured as a fullstack application:
* **Frontend**: React + Vite + Tailwind CSS v4. Centralized `/api` communication proxy.
* **Backend**: Node.js + Express.js API server running on port `5000`.
* **Database**: PostgreSQL database accessed via **Prisma ORM**.
* **Integrations**: Razorpay API Client (Test Mode only) and secure webhook signature verification middleware.
* **Logic Layer**: Deterministic Risk Rules Engine deciding risk levels, case prioritizations, and recommended actions.

```
                  ┌────────────────────────┐
                  │   Razorpay Test Mode   │
                  └───────────┬────────────┘
                              │
                    Webhooks  │  Payments API
                              ▼
                  ┌────────────────────────┐
                  │  RazorRecover Backend  │
                  └───────────┬────────────┘
                              │ Webhook Signature & Idempotency
                              ▼
                  ┌────────────────────────┐
                  │       PostgreSQL       │
                  └───────────┬────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │   Risk Rules Engine    │
                  └───────────┬────────────┘
                              │ Active Metrics Aggregates
                              ▼
                  ┌────────────────────────┐
                  │  Existing Frontend UI  │
                  └────────────────────────┘
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the root folder:

```ini
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/razorrecover?schema=public"

RAZORPAY_KEY_ID="rzp_test_yourKeyId"
RAZORPAY_KEY_SECRET="yourSecretHere"
RAZORPAY_WEBHOOK_SECRET="webhookSecretHere"

# Reserved for Phase 3 OpenAI Agents
OPENAI_API_KEY="sk-proj-yourOpenAiKey"
```

---

## 🗄️ Database Setup & Migrations

To configure the PostgreSQL database and models:

1. **Install PostgreSQL**: Ensure PostgreSQL is installed and running (default port `5432`).
2. **Apply DB Schema**: Run the Prisma migration mapping script to create the tables in your PostgreSQL database:
   ```bash
   npm run db:push
   ```
3. **Seed Database**: Load the development scenario datasets into your tables:
   ```bash
   npm run seed
   ```

### Seeding Scenarios Created:
1. **TXN_10001**: Successful Captured payment with settled status.
2. **TXN_10002**: Failed transaction -> Flagged with `PAYMENT_FAILED` risk event and opens a `RecoveryCase` (Priority: High, Status: OPEN).
3. **TXN_10003**: Captured payment with pending settlement -> Flagged with `SETTLEMENT_PENDING` risk event (Priority: Medium, Status: MONITORING).
4. **TXN_10004**: Settlement delay -> Resolved, recovered revenue (Status: RECOVERED).
5. **TXN_10005**: Lost/Stolen card failure -> Case status escalated (Priority: High, Status: ESCALATED).

---

## 🚀 Running the Project

To boot both the Express server backend and Vite client frontend concurrently:

```bash
npm run dev:all
```

Alternatively, you can run them in separate terminals:
* **Run Server Only**: `npm run server` (starts node server on `http://localhost:5000`)
* **Run Client Only**: `npm run dev` (starts development environment on `http://localhost:5173`)

---

## ⚓ Razorpay Webhooks Integration

### Webhook Validation & Security
1. Signature checks are processed using raw request payload buffers before any JSON parsing alters whitespaces.
2. We verify the computed HMAC SHA-256 signature using the configured `RAZORPAY_WEBHOOK_SECRET` against the header `X-Razorpay-Signature`. Invalid signatures return `403 Forbidden` and cancel execution.
3. **Idempotency**: Webhook events are checked against the `WebhookEvent` table. Duplicate events with the same `externalEventId` are ignored with a fast `200 OK` response to prevent duplicate risk events or logs.

---

## 🧪 Testing

To execute local test suites checking signature validation, rules engine configurations, and connection setups:

```bash
npm run test
```

---

## 🔮 Phase 3 — Next Steps

In the upcoming Phase 3, we will add:
* **OpenAI LLM Integration**: Connect OpenAI to perform dynamic, multi-factor risk logic inside the background worker instead of deterministic rules.
* **Dynamic AI Decision Schema**: Secure schema outputs parsing LLM suggestions before feeding them to safety guardrails.
* **Auto-Recovery Actions**: Verification emails, retries scheduling, and notifications alerts.
