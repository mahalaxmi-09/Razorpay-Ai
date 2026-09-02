# RazorRecover AI — System Architecture

## Overview
RazorRecover AI is designed as a secure, multi-tier autonomous revenue recovery system. It bridges payment gateway telemetry from Razorpay Test Mode with OpenAI `gpt-4o` reasoning and a deterministic backend guardrail engine.

---

## 🏗️ Architectural Topology

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|                                                                                 |
|   +-------------------------------------------------------------------------+   |
|   |                      React 19 + Tailwind CSS + Lucide                    |   |
|   |  - Real-time KPI Dashboard (Live DB aggregation)                        |   |
|   |  - Pipeline Workflow Kanban (Detect -> Analyze -> Decide -> Execute)    |   |
|   |  - Autonomous Agent Controls (Approve / Reject / Execute / Verify)       |   |
|   |  - Grounded AI Copilot (Strict DB context Q&A)                           |   |
|   |  - Audit Log Timeline & Notification Center                             |   |
|   +-------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------+
                                      |
                                      | HTTPS / REST JSON
                                      v
+---------------------------------------------------------------------------------+
|                                 BACKEND TIER                                    |
|                                                                                 |
|   +-------------------------------------------------------------------------+   |
|   |                        Express.js Application Layer                     |   |
|   |  - REST API Routes (/api/recovery, /api/payments, /api/copilot)         |   |
|   |  - Webhook Receiver (HMAC SHA-256 signature verification)               |   |
|   +-------------------------------------------------------------------------+   |
|                                     |                                           |
|   +---------------------------------+---------------------------------------+   |
|   |                                 |                                       |   |
|   v                                 v                                       v   |
| +--------------------+    +--------------------+    +---------------------+     |
| | Risk Detection     |    | OpenAI gpt-4o      |    | Central Guardrails  |     |
| | Engine             |    | Reasoning Engine   |    | Service             |     |
| | - Pattern match    |    | - Root cause       |    | - Max 3 attempts    |     |
| | - Risk scoring     |    | - Recommended act  |    | - 24h cooldown      |     |
| | - Case creation    |    | - Zod validation   |    | - ₹50k approval hold|     |
| +--------------------+    +--------------------+    +---------------------+     |
|                                     |                                       |   |
|                                     v                                       |   |
|   +-------------------------------------------------------------------------+   |
|   |                 Autonomous Recovery State Machine (11 States)           |   |
|   |   OPEN -> ANALYZING -> ACTION_RECOMMENDED -> AWAITING_APPROVAL ->       |   |
|   |   APPROVED -> EXECUTING -> VERIFYING -> VERIFIED_RECOVERED / FAILED      |   |
|   +-------------------------------------------------------------------------+   |
|                                     |                                           |
|                                     v                                           |
|   +-------------------------------------------------------------------------+   |
|   |                     Provider Abstraction Adapter                        |   |
|   |  - Razorpay Test SDK Integration                                        |   |
|   |  - Safe Test Mode Retries, Customer Recovery Links, Settlement Checks   |   |
|   +-------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------+
                                      |
                                      | Prisma ORM (Typed Queries & Transactions)
                                      v
+---------------------------------------------------------------------------------+
|                                 DATABASE TIER                                   |
|                                                                                 |
|   - Transaction Table (Minor units in paise, provider payment ID, risk level)   |
|   - RevenueRiskEvent Table (Risk type, detectedAt, status)                      |
|   - RecoveryCase Table (Finite state machine, attempt counters, approval flags) |
|   - AIDecision Table (Root cause, confidence, model, reasoning summary)         |
|   - RecoveryAction Table (Idempotency key, provider ref, verification status)   |
|   - AuditLog Table (Immutable chronological event log)                          |
|   - Notification Table (Real-time alert messages)                               |
+---------------------------------------------------------------------------------+
```

---

## 🔄 End-to-End Data Lifecycle

1. **Ingestion & Sync:**
   - Transactions flow in via Razorpay Test Webhooks (`payment.failed`, `payment.captured`) or REST sync.
   - All amounts are normalized to integer minor currency units (paise) to avoid floating point imprecision.

2. **Risk Detection:**
   - The Risk Engine inspects status codes, failure reasons, and debited states.
   - Creates a `RevenueRiskEvent` and opens a `RecoveryCase` in `OPEN` state.

3. **AI Root-Cause Diagnosis:**
   - State advances to `ANALYZING`.
   - OpenAI `gpt-4o` evaluates the transaction metadata and returns a structured JSON payload conforming to the strict Zod schema (`AIDecisionSchema`).
   - If OpenAI is unreachable or invalid, the deterministic rules fallback engine immediately responds with zero downtime.

4. **Guardrail Evaluation:**
   - State advances to `ACTION_RECOMMENDED`.
   - Before executing, `guardrailsService.validateAction()` checks:
     - Is the payment already captured? $\rightarrow$ Block retry immediately.
     - Is the amount $\ge \text{₹}50,000$? $\rightarrow$ Move to `AWAITING_APPROVAL`.
     - Is the attempt count $\ge 3$? $\rightarrow$ Move to `STOPPED`.
     - Is AI confidence $< 0.70$? $\rightarrow$ Hold for approval.

5. **Execution & Verification:**
   - Upon clearance or merchant approval, state advances to `EXECUTING`.
   - Provider creates safe test retry or customer recovery token.
   - State advances to `VERIFYING`.
   - Gateway is queried to confirm capture.
   - Only upon positive capture confirmation is state set to `VERIFIED_RECOVERED`.

6. **Metric Aggregation & Audit Trail:**
   - Database aggregates live totals. Recovered revenue increases only from confirmed `VERIFIED_RECOVERED` cases.
   - An immutable audit log entry is written for every step.
