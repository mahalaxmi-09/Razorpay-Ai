# RazorRecover AI — 5-Minute Buildathon Demo Script

> **Goal:** Deliver a crisp, compelling 5-minute live demonstration of RazorRecover AI for hackathon evaluators.

---

### ⏱️ Timeline Summary

| Time | Stage | Action / Talking Point |
| :--- | :--- | :--- |
| **0:00 – 0:30** | **The Problem** | Merchants lose 2-5% of revenue from silent payment drops, network timeouts, and unverified settlements. Blind retries risk duplicate charges. |
| **0:30 – 1:00** | **The Solution** | RazorRecover AI: Autonomous recovery platform combining OpenAI `gpt-4o` root-cause reasoning with strict financial safety guardrails. |
| **1:00 – 1:45** | **Live Dashboard** | Show live database KPIs (Revenue at Risk, Recovered Revenue, Active Cases). Highlight Razorpay Test Mode badge and real-time state. |
| **1:45 – 2:30** | **AI Diagnosis** | Navigate to Recovery Agent page. Open failed payment `TXN_10002`. Click **"Analyze with AI"** — watch OpenAI diagnose `INSUFFICIENT_FUNDS` with 92% confidence. |
| **2:30 – 3:15** | **Safety Guardrails** | Show case `TXN_10004` (₹98,000). AI recommends retry, but Guardrail holds it in `AWAITING_APPROVAL` because amount $\ge \text{₹}50,000$. Click **"Approve"**. |
| **3:15 – 4:00** | **Execution & Verification** | State transitions: `APPROVED` $\rightarrow$ `EXECUTING` $\rightarrow$ `VERIFYING` $\rightarrow$ `VERIFIED_RECOVERED`. Provider confirms capture in Test Mode. |
| **4:00 – 4:30** | **Dashboard & Audit Trail** | Return to Dashboard — show Recovered Revenue increase live from DB. Open **Audit Logs** to show the complete chronological proof of every transition. |
| **4:30 – 5:00** | **Grounded AI Copilot & Wrap-up** | Open AI Copilot. Ask: *"What is the current revenue at risk?"* Copilot responds accurately using real DB metrics. Summarize core philosophy. |

---

### 📋 Detailed Step-by-Step Demo Guide

#### 1. Reset & Seed Live Dataset
Before the presentation, run:
```bash
curl -X POST http://localhost:5000/api/test/seed
```
This loads 11 realistic scenarios into SQLite/PostgreSQL.

#### 2. Dashboard Tour (1:00)
- Point out the 4 KPI cards:
  - **Revenue at Risk:** Live sum of unresolved risk events.
  - **Recovered Revenue:** Only verified captures.
  - **Active Cases:** In-flight cases being monitored or analyzed.
  - **Recovery Rate:** Percentage of recovered vs total cases.

#### 3. Autonomous Recovery Agent (1:45)
- Open **Recovery Agent** (`#/recovery`).
- Walk through the pipeline tabs: `Detect` $\rightarrow$ `Analyze` $\rightarrow$ `Decide` $\rightarrow$ `Approval` $\rightarrow$ `Execute` $\rightarrow$ `Verify`.
- Select `TXN_10002` (Failed payment) and click **"Analyze"**.
- Point out the AI Decision banner: Root cause, model, confidence %, and merchant message.

#### 4. Guardrail & Approval Demonstration (2:30)
- Select the `Approval` tab and click on `TXN_10004` (₹98,000).
- Explain: *"Our guardrails prevent automatic execution of transactions above ₹50,000. It requires explicit merchant sign-off."*
- Click **"Approve"**.

#### 5. Verification & Audit Trail (3:15 - 4:30)
- Watch the case move to `VERIFYING` and resolve into `VERIFIED_RECOVERED`.
- Navigate to **Audit Logs** (`#/audit-logs`).
- Show the complete audit trail:
  `PAYMENT_SYNC` $\rightarrow$ `GUARDRAIL_CHECKED` $\rightarrow$ `APPROVAL_REQUIRED` $\rightarrow$ `RECOVERY_APPROVED` $\rightarrow$ `RECOVERY_EXECUTION_STARTED` $\rightarrow$ `VERIFICATION_COMPLETED` $\rightarrow$ `RECOVERY_VERIFIED`.

#### 6. AI Copilot (4:30)
- Open **AI Copilot** in the sidebar.
- Ask: *"What is the current revenue at risk?"*
- Point out that the Copilot cites the exact live database metrics without hallucinating.

#### 7. Closing Statement (5:00)
> *"RazorRecover AI embodies a simple, robust principle: **AI recommends. Backend decides. Guardrails control. Verification confirms. Audit logs record.** Thank you!"*
