# RazorRecover AI — Recovery Policy & Guardrail Specifications

## 1. Purpose & Scope
This document outlines the strict financial safety policies enforced by the **Centralized Guardrail Service** (`guardrails.service.js`) in RazorRecover AI.

All policies are executed deterministically on the backend. The frontend UI and AI models cannot bypass these rules.

---

## 2. Recovery Policy Rules Matrix

| Policy Rule | Condition / Limit | Policy Enforcement Action |
| :--- | :--- | :--- |
| **Max Retry Limit** | Attempt count $\ge 3$ | Recovery is immediately halted; Case status $\rightarrow$ `STOPPED`. Prevents card network spam and fee escalation. |
| **Double-Charge Lock** | `CAPTURED` or `customerDebited` | Payment retry is strictly **BLOCKED**. Suggests `VERIFY_SETTLEMENT` instead. |
| **Uncertain State Safety** | `PENDING` or `AUTHORIZED` | Payment charge is blocked. Enforces `VERIFY_PAYMENT` before any subsequent action. |
| **High-Value Threshold** | Amount $\ge \text{₹}50,000$ (5,000,000 paise) | Automatic execution is held; Case status $\rightarrow$ `AWAITING_APPROVAL`. Requires explicit merchant sign-off. |
| **Maximum Auto Ceiling** | Amount $> \text{₹}1,00,000$ (10,000,000 paise) | Automatic recovery prohibited. Case status $\rightarrow$ `ESCALATED` to human compliance team. |
| **AI Confidence Floor** | Confidence $< 0.70$ ($70\%$) | Automatic execution withheld; Case status $\rightarrow$ `AWAITING_APPROVAL` or `ESCALATED`. |
| **Critical Risk Hold** | Risk status `CRITICAL` | Automatic execution blocked; Case routed to `ESCALATED`. |
| **Cooldown Period** | $24\text{ Hours}$ between automated retries | Prevents rapid automated retry storms on the same payment method. |
| **Idempotency** | Unique request `idempotencyKey` | Prevents duplicate / concurrent execution across multiple requests or workers. |

---

## 3. Recovery State Transitions & Policy Enforcement

```
[ OPEN ]
   │
   ├─► (AI Diagnosis) ──► [ ANALYZING ] ──► [ ACTION_RECOMMENDED ]
   │                                                 │
   │                                                 ├─► Amount >= ₹50k or Conf < 0.70 ──► [ AWAITING_APPROVAL ]
   │                                                 │                                              │
   │                                                 │                                       ┌──────┴──────┐
   │                                                 │                                       ▼             ▼
   │                                                 │                                  [ APPROVED ]   [ STOPPED ]
   │                                                 │                                       │
   │                                                 ▼                                       ▼
   └──────────────────────────────────────────► [ EXECUTING ]
                                                     │
                                                     ▼
                                              [ VERIFYING ]
                                                     │
                                          ┌──────────┴──────────┐
                                          ▼                     ▼
                             [ VERIFIED_RECOVERED ]         [ FAILED ]
                             (Increments Recovered)             │
                                                                ├─► Attempts < 3 ──► [ OPEN ]
                                                                └─► Attempts >= 3 ──► [ STOPPED ]
```

---

## 4. Merchant Approval Workflow

When a recovery case enters `AWAITING_APPROVAL`:
1. An alert notification is dispatched (`type: 'HUMAN_APPROVAL_REQUIRED'`).
2. The case is badged in the **Approval Queue** of the Recovery Agent dashboard.
3. Only authorized merchants can invoke:
   - `POST /api/recovery/cases/:id/approve` $\rightarrow$ transitions `APPROVED` $\rightarrow$ `EXECUTING`.
   - `POST /api/recovery/cases/:id/reject` $\rightarrow$ transitions `STOPPED` with rejection audit log.

---

## 5. Verification Integrity

Recovered Revenue calculations strictly adhere to the following rule:
- **Rule:** A transaction is considered recovered **only** when provider status confirms capture (`status = 'CAPTURED'` / `SETTLEMENT_PROCESSED`) and `RecoveryCase.status = 'VERIFIED_RECOVERED'`.
- Attempted retries, generated payment links, or pending statuses **never** contribute to Recovered Revenue.
