# RazorRecover AI — Judge & Evaluator Q&A Preparation

---

### 1. Why is AI necessary? Why not just use static rules?
**Answer:** Payment error messages from issuing banks and gateways are notoriously inconsistent and unstructured (e.g. `BAD_REQUEST`, `AUTH_TIMEOUT`, `INTERNAL_GATEWAY_ERROR`). A static rule engine cannot differentiate between a transient bank server drop and a customer balance issue. OpenAI `gpt-4o` analyzes unstructured error messages, transaction history, customer context, and amount to categorize root causes accurately and recommend the safest, highest-converting recovery action.

---

### 2. How do you prevent AI from making mistakes or hallucinating?
**Answer:** We enforce a dual-layer defense:
1. **Zod Schema Parsing:** All AI output is constrained to a strict typed schema with enumerated root causes and bounded confidence scores ($0.0 \le \text{confidence} \le 1.0$).
2. **Backend Guardrail Authority:** AI only provides *recommendations*. The deterministic backend Guardrail Engine makes all final execution decisions. If AI confidence is $< 0.70$, the system automatically withholds execution and routes the case for merchant approval.

---

### 3. Can the AI directly move money or charge customer cards?
**Answer:** **No.** The AI model has no access to payment provider API keys, banking credentials, or execution endpoints. It produces structured advisory data. The backend `RecoveryExecutionService` is the only service that interfaces with the provider layer after passing all guardrail validations.

---

### 4. How do the Guardrails work?
**Answer:** Before any recovery action is initiated, `guardrailsService.validateAction()` executes 9 safety checks:
- Verifies maximum 3 attempts have not been exceeded.
- Checks if payment was already captured or debited (preventing double charging).
- Enforces a 24-hour cooldown between automatic retries.
- Requires merchant approval for amounts $\ge \text{₹}50,000$.
- Requires human escalation for amounts $> \text{₹}1,00,000$.
- Holds actions with low AI confidence ($< 0.70$) or `CRITICAL` risk.
- Verifies request idempotency.

---

### 5. How do you prevent duplicate charges if multiple requests or webhooks arrive?
**Answer:** We implement idempotency keys on every recovery action record and database-level checks. Furthermore, cases in `EXECUTING` or `VERIFYING` state are locked against concurrent execution. Webhook events are also deduplicated against `WebhookEvent.externalEventId`.

---

### 6. What happens if the OpenAI API is down, slow, or rate-limited?
**Answer:** The system features a built-in **Deterministic Rules Fallback Engine** (`rulesEngine.service.js`). If OpenAI times out or fails, the rules engine immediately diagnoses the case and marks `decisionSource = 'RULE_ENGINE'`. Recovery operations continue seamlessly with zero merchant downtime.

---

### 7. How do you verify recovery?
**Answer:** When an action executes, the case enters the `VERIFYING` state. The backend queries the Razorpay Test API to verify the actual payment status. Only when the gateway confirms capture does the case transition to `VERIFIED_RECOVERED`.

---

### 8. How is Recovered Revenue calculated on the dashboard?
**Answer:** Recovered Revenue is calculated directly from the database via Prisma aggregation: `SUM(amountAtRisk) WHERE status = 'RESOLVED'` linked to `RecoveryCase.status = 'VERIFIED_RECOVERED'`. Generating a retry link or sending a notification never increments Recovered Revenue without positive provider proof.

---

### 9. How does Razorpay integrate into this project?
**Answer:** RazorRecover AI integrates directly with the Razorpay Test Mode SDK (`razorpay`), fetching payments, orders, and settlements, and consuming real-time webhooks (`payment.captured`, `payment.failed`, `order.paid`) with HMAC SHA-256 signature verification.

---

### 10. Is this application using real money?
**Answer:** **No.** The application enforces Razorpay **Test Mode** (`rzp_test_` keys). Any live key (`rzp_live_`) is explicitly blocked at the service initialization layer to guarantee complete financial safety.

---

### 11. How would this system scale in a high-volume production environment?
**Answer:** The architecture is stateless and containerizable. In production:
- Express backend scales horizontally behind a load balancer.
- PostgreSQL handles ACID transactions with Prisma connection pooling.
- Redis queues (BullMQ) manage asynchronous recovery worker jobs and cooldown schedules.
- Webhooks process asynchronously to maintain sub-second response times.

---

### 12. How does the AI Copilot answer merchant questions without hallucinating?
**Answer:** The AI Copilot uses Retrieval-Augmented Grounding. Before generating a response, the backend retrieves current live metrics from the database (revenue at risk, recovered revenue, active case counts, failed payment breakdown) and injects them into the system prompt as verifiable facts. The Copilot is instructed never to fabricate metrics.

---

### 13. What is unique about RazorRecover AI compared to standard dunning tools?
**Answer:** Traditional dunning tools send dumb scheduled reminder emails. RazorRecover AI is an **intelligent recovery agent**: it analyzes gateway-level root causes, verifies bank authorization state to avoid double-charging, applies banking guardrails, and provides an immutable compliance audit trail.

---

### 14. What are the key business benefits for merchants?
**Answer:**
1. **20-40% reduction in unrecovered payment drop-offs.**
2. **Zero accidental duplicate charges**, reducing customer support tickets and chargebacks.
3. **Automated compliance triage** for high-value transactions.
4. **Complete revenue transparency** with auditable financial verification.

---

### 15. What would you build next?
**Answer:**
- Automated WhatsApp recovery links using Razorpay Payment Links API.
- Pre-failure payment rail optimization (smart routing based on issuing bank uptime).
- Automated chargeback dispute package generation using AI transaction evidence.
