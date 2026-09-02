# RazorRecover AI — Security & Guardrail Model

## 1. Safety Principles & Test Mode Boundaries

RazorRecover AI is designed with safety-first financial engineering principles:

1. **Strict Test Mode Isolation:**
   - The application enforces `rzp_test_` keys. Any attempt to initialize with production live credentials (`rzp_live_`) is explicitly blocked at startup.
   - All recovery executions operate within simulated and test-mode workflows.

2. **AI Never Controls Money Directly:**
   - OpenAI outputs structured recommendations only.
   - The deterministic backend **Guardrail Engine** makes all final execution decisions.

3. **No Unverified Revenue Claims:**
   - Recovered Revenue is only counted after positive provider verification (`status = 'VERIFIED_RECOVERED'`).

---

## 2. Secrets Management & Environment Isolation

- **Backend-Only Secrets:**
  - `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `OPENAI_API_KEY` are read exclusively by the Express backend.
  - No secret keys are included in Vite client environment variables or client-side bundles.
- **Source Control Security:**
  - `.env`, `.env.local`, and all `.env.*` files are registered in `.gitignore`.
  - `.env.example` provides sanitised placeholders only.

---

## 3. Webhook Security & Idempotency

- **HMAC SHA-256 Signature Verification:**
  - Every incoming webhook is verified against `RAZORPAY_WEBHOOK_SECRET` using `crypto.createHmac('sha256')`.
  - Payloads with missing or invalid signatures are rejected with HTTP 400.
- **Idempotency Protection:**
  - Webhook event IDs (`x-razorpay-event-id`) and recovery action idempotency keys are tracked in the database.
  - Duplicate requests are acknowledged safely without executing duplicate state transitions or retries.

---

## 4. Centralized Safety Guardrails

| Guardrail Rule | Threshold | System Action |
| :--- | :--- | :--- |
| **Max Retry Limit** | 3 attempts per case | Halts automated recovery, transitions to `STOPPED` |
| **Double-Charge Block** | `CAPTURED` or debited | Blocks retry; prevents duplicate charges |
| **Uncertain State Safety** | `PENDING` / `AUTHORIZED` | Blocks charge; enforces `VERIFY_PAYMENT` |
| **High-Value Threshold** | $\ge \text{₹}50,000$ (50,000 Minor Units $\times 100$) | Requires explicit merchant approval (`AWAITING_APPROVAL`) |
| **Absolute Auto Ceiling** | $> \text{₹}1,00,000$ | Blocks automated execution; requires human escalation |
| **AI Confidence Floor** | Confidence $< 0.70$ | Automated execution blocked; requires approval |
| **Critical Risk Hold** | Risk status `CRITICAL` | Routed to `ESCALATED` compliance queue |
| **Cooldown Period** | 24 Hours between auto retries | Prevents rapid automated retry storms |

---

## 5. Structured Output Validation (Zod Defense)

All AI responses from OpenAI `gpt-4o` are parsed through strict Zod schemas (`AIDecisionSchema`):
- Enforces strict enumerated types for root causes (`INSUFFICIENT_FUNDS`, `BANK_OUTAGE`, `AUTH_TIMEOUT`, etc.).
- Enforces numeric confidence bounding ($0.0 \le \text{confidence} \le 1.0$).
- Disallows arbitrary commands or unauthorized properties.
- In case of schema violation, the system falls back to the deterministic rules engine with zero downtime.
