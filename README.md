# RazorRecover AI — Autonomous Revenue Recovery Platform

> **SAFETY NOTICE:** This application operates strictly in **RAZORPAY TEST MODE**. No live money operations, production keys, or unverified fund claims are used or permitted.

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)](https://nodejs.org)
[![Vite + React](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%2019-blue)](https://vitejs.dev)
[![Prisma ORM](https://img.shields.io/badge/Database-Prisma%20ORM-indigo)](https://prisma.io)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI%20GPT--4o-orange)](https://openai.com)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay%20Test%20API-0096FF)](https://razorpay.com)

---

## 💡 Problem & Solution

### The Problem
E-commerce businesses and merchants lose significant revenue daily due to:
1. **Silent Payment Failures:** Bank authorization drops, network timeouts, and balance issues.
2. **Uncertain Settlement Status:** Payments captured on gateway but pending bank reconciliation.
3. **Risky Blind Retries:** Retrying payments without checking status leads to accidental double-charging.
4. **Manual Overhead:** Compliance and support teams lack automated triage and risk intelligence.

### The Solution
**RazorRecover AI** is an intelligent, autonomous revenue recovery agent that continuously:
- **Detects** payment failures, capture anomalies, and settlement delays.
- **Diagnoses** the exact root cause using OpenAI `gpt-4o` structured intelligence.
- **Validates** safety guardrails (max 3 retries, 24h cooldown, ₹50k approval threshold, double-charge locks).
- **Executes** safe Test Mode recovery workflows (customer retry links, payment verification, settlement audits).
- **Verifies** provider capture before recording a single rupee as Recovered Revenue.
- **Maintains** an immutable audit trail of every decision and state transition.

---

## ⚙️ Core Philosophy

```
AI Recommends.
Backend Decides.
Guardrails Control.
Verification Confirms.
Audit Logs Record.
```

- **No Blind Retries:** Never retry a payment in an uncertain state.
- **No Direct AI Money Control:** OpenAI outputs structured recommendations only; backend guardrail engine makes the final execution decision.
- **No Unearned Revenue:** Recovered Revenue is incremented **only** when `status = 'VERIFIED_RECOVERED'`.

---

## 🏗️ System Architecture

```
                                  +---------------------------------------+
                                  |    Razorpay TEST API & Webhooks       |
                                  +---------------------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |      Payment Provider Adapter         |
                                  +---------------------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |      Express REST API (Port 5000)     |
                                  +---------------------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |       Prisma ORM / SQLite / PG        |
                                  +---------------------------------------+
                                                     |
                                                     v
+------------------------+        +---------------------------------------+        +------------------------+
|  OpenAI gpt-4o Engine  | <----> |       Autonomous Recovery Agent       | <----> |   Safety Guardrails    |
| (Structured Reasoning) |        |       (11-State Finite Machine)       |        | (Caps, Limits, Checks) |
+------------------------+        +---------------------------------------+        +------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |       Verification Engine (Test)      |
                                  +---------------------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |       Immutable Audit Trail Log       |
                                  +---------------------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |      Vite + React UI (Port 5174)      |
                                  +---------------------------------------+
```

---

## 🔄 Autonomous Recovery State Machine

```
OPEN ──> ANALYZING ──> ACTION_RECOMMENDED ──> AWAITING_APPROVAL ──> APPROVED
                                                          │             │
                                                          ▼             ▼
                                                       STOPPED      EXECUTING
                                                                        │
                                                                        ▼
                                                                    VERIFYING
                                                                 ┌──────┴──────┐
                                                                 ▼             ▼
                                                        VERIFIED_RECOVERED   FAILED
```

- **OPEN:** Risk event detected and case created.
- **ANALYZING:** AI reasoning engine evaluating transaction context and root causes.
- **ACTION_RECOMMENDED:** Safe recovery action proposed with confidence score.
- **AWAITING_APPROVAL:** High-value ($\ge \text{₹}50,000$) or low-confidence ($< 0.70$) hold.
- **APPROVED:** Merchant or compliance officer confirmed recovery execution.
- **EXECUTING:** Safe provider retry or verification workflow initiated.
- **VERIFYING:** Gateway queried for live capture and settlement proof.
- **VERIFIED_RECOVERED:** Confirmed capture; updates dashboard Recovered Revenue.
- **FAILED:** Execution declined or failed verification; no recovered revenue added.
- **ESCALATED:** Critical risk routed to compliance queue.
- **STOPPED:** Max 3 attempts reached or rejected by merchant.

---

## 🛡️ Centralized Safety Guardrails

| Guardrail Rule | Threshold / Condition | Enforced Action |
| :--- | :--- | :--- |
| **Max Retry Limit** | 3 attempts per case | Transitions to `STOPPED`; prevents endless retries |
| **Double-Charge Block** | `CAPTURED` or `customerDebited` | Strictly blocks retry; suggests `VERIFY_SETTLEMENT` |
| **Uncertain State** | `PENDING` or `AUTHORIZED` | Blocks charge; enforces `VERIFY_PAYMENT` |
| **High-Value Hold** | $\ge \text{₹}50,000$ | Enforces `AWAITING_APPROVAL` before execution |
| **Maximum Auto Ceiling** | $> \text{₹}1,00,000$ | Automatic execution blocked; requires escalation |
| **AI Confidence Hold** | Confidence $< 0.70$ | Automated execution blocked; requires approval |
| **Critical Risk Hold** | Risk status `CRITICAL` | Routed to `ESCALATED` / human compliance queue |
| **Cooldown Period** | 24 Hours between auto retries | Prevents rapid automated retry storms |
| **Idempotency** | Unique request key | Prevents duplicate / concurrent execution |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v18+ installed.
- Razorpay Test Account credentials (`rzp_test_...`).
- OpenAI API Key (optional, deterministic fallback included).

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/mahalaxmi-09/Razorpay-Ai.git
cd Razorpay-Ai

# Install dependencies
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```ini
PORT=5000
FRONTEND_URL="http://localhost:5174"
APP_URL="http://localhost:5000"
DATABASE_URL="file:./dev.db"

# Razorpay Test Mode Credentials (TEST ONLY)
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_key_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# OpenAI Configuration
OPENAI_API_KEY="sk-proj-your_openai_key"
OPENAI_MODEL="gpt-4o"
```

### 4. Database Setup & Seed
```bash
# Push schema to SQLite/PostgreSQL
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed 11 realistic demonstration scenarios
curl -X POST http://localhost:5000/api/test/seed
```

### 5. Run the Application
```bash
# Terminal 1: Start Express Backend (Port 5000)
npm run server

# Terminal 2: Start Vite Frontend (Port 5174)
npm run dev
```

Open your browser at: **[http://localhost:5174](http://localhost:5174)**

---

## 🧪 Automated Test Suite

Run the full automated test suite verifying all 21 security, OpenAI, Razorpay Test Mode, guardrail, and state-machine scenarios:

```bash
node src/server/tests/run-tests.js
```

---

## 📚 Documentation Index

- **[System Architecture](docs/architecture.md)** — Detailed component breakdown and ASCII data flow diagram.
- **[Security Model](docs/security.md)** — Secret isolation, HMAC verification, idempotency, and guardrail controls.
- **[Demo Script (5-Min Walkthrough)](docs/demo-script.md)** — Step-by-step presentation script for Buildathon judges.
