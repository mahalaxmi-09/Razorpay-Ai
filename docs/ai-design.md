# RazorRecover AI — AI Architecture & Design Specification

## 1. Executive Summary & Safety Foundation

> **CRITICAL SAFETY PRINCIPLE:**
> **"AI recommends. Backend decides. Guardrails control. Verification confirms. Audit logs record."**
> 
> The AI Reasoning Engine does **NOT** directly control or execute financial operations. OpenAI `gpt-4o` operates as an intelligent advisory layer. All AI recommendations are parsed against strict structural schemas and evaluated by the deterministic backend **Guardrail Engine** prior to any state transition or execution.

---

## 2. Why AI is Needed in Revenue Recovery

Traditional payment systems rely on static boolean logic (e.g. `if status == FAILED then retry()`). This causes three major failure modes:
1. **Blind Retries:** Triggering charges on payments that were actually debited at the customer's bank causes customer frustration and chargebacks.
2. **Lack of Root-Cause Context:** A payment failed due to `INSUFFICIENT_FUNDS` requires a customer fallback link, whereas a failure due to `BANK_OUTAGE` requires waiting for network recovery.
3. **High-Risk Exposure:** Treating a ₹1,000 retail failure the same as a ₹1,00,000 corporate payment risks major compliance violations.

OpenAI `gpt-4o` analyzes unstructured error messages, gateway codes, retry history, settlement states, and customer behavior to provide nuanced root-cause diagnoses and tailored recovery recommendations.

---

## 3. AI Input & Contextual Telemetry

The backend formats a structured context object for each analyzed transaction:

```json
{
  "transaction_id": "TXN_10002",
  "provider_payment_id": "pay_TEST10002",
  "amount_in_inr": 6800.00,
  "currency": "INR",
  "status": "FAILED",
  "payment_method": "CARD",
  "captured": false,
  "customer_debited": false,
  "merchant_settlement_status": "UNSETTLED",
  "failure_reason": "Insufficient customer funds during bank auth",
  "retry_count": 0,
  "detected_risk_type": "PAYMENT_FAILED",
  "risk_level": "HIGH"
}
```

---

## 4. AI Structured Output (Zod Schema Validation)

All AI responses must strictly conform to the `AIDecisionSchema` parsed via Zod. Any response with invalid schemas or unrecognized properties is rejected.

### Schema Definition:
```typescript
interface AIDecision {
  root_cause: 
    | "INSUFFICIENT_FUNDS"
    | "AUTHENTICATION_FAILED"
    | "BANK_DOWNTIME"
    | "CARD_EXPIRED"
    | "NETWORK_TIMEOUT"
    | "FRAUD_RISK_FLAG"
    | "LIMIT_EXCEEDED"
    | "SETTLEMENT_DELAY"
    | "GATEWAY_ERROR"
    | "UNKNOWN";
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommended_action: 
    | "RETRY_PAYMENT"
    | "REQUEST_CUSTOMER_RETRY"
    | "VERIFY_PAYMENT"
    | "VERIFY_SETTLEMENT"
    | "ESCALATE"
    | "STOP_RECOVERY";
  confidence: number; // Constrained: 0.0 to 1.0
  reasoning_summary: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  should_escalate: boolean;
  stop_recovery: boolean;
  merchant_message: string;
}
```

---

## 5. Decision Flow & Safety Guardrails Integration

```
                         +-----------------------+
                         |  Failed Payment Event |
                         +-----------------------+
                                     |
                                     v
                         +-----------------------+
                         |  OpenAI gpt-4o Engine |
                         | (Structured Analysis) |
                         +-----------------------+
                                     |
                                     v
                         +-----------------------+
                         | Zod Schema Validation |
                         +-----------------------+
                           /                   \
                 [PASS]   /                     \ [FAIL / TIMEOUT]
                         v                       v
            +-----------------------+  +---------------------------+
            | AI Recommendation     |  | Deterministic Rule Engine |
            | Payload               |  | Fallback Mode             |
            +-----------------------+  +---------------------------+
                         \                       /
                          \                     /
                           v                   v
                         +-----------------------+
                         |   Guardrail Engine    |
                         |  (Backend Authority)  |
                         +-----------------------+
                               /     |     \
               [ALLOW]        /      |      \  [REQUIRE APPROVAL]
                             v       |       v
           +--------------------+    |   +--------------------+
           | Execute Recovery   |    |   | AWAITING_APPROVAL  |
           | Workflow           |    |   | Hold               |
           +--------------------+    |   +--------------------+
                                     v
                             [BLOCK / ESCALATE]
                             +------------------+
                             | Stop / Escalate  |
                             | to Human Queue   |
                             +------------------+
```

---

## 6. Resilience & Zero-Downtime Fallback Mode

If OpenAI is unavailable, times out (> 10s), or returns an unparseable response:
1. The system logs `status: 'FALLBACK'` in `AIAnalysisLog`.
2. The **Deterministic Rules Engine** (`rulesEngine.service.js`) evaluates the transaction using deterministic heuristic rules.
3. The response clearly marks `decision_source = 'RULE_ENGINE'` (never fabricating an OpenAI response).
4. Normal recovery operations proceed with zero merchant disruption.

---

## 7. AI Copilot Grounding Architecture

The AI Copilot assistant (`POST /api/copilot`) uses Retrieval-Augmented Grounding (RAG):
- The backend queries current PostgreSQL / SQLite aggregations (`revenueAtRisk`, `recoveredRevenue`, `activeCases`, `failedPayments`).
- The live database state is injected into the system prompt as immutable facts.
- The model is instructed to answer strictly using the provided context and never fabricate metrics.
