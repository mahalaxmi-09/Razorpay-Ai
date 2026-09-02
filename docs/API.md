# RazorRecover AI — REST API Documentation (Phase 2)

RazorRecover AI is an enterprise-grade revenue recovery intelligence system. This API layer is **payment-provider agnostic** and operates with local PostgreSQL tables, deterministic rules, safety guardrails, AI advisory models, and simulation flows.

---

## 1. System Flow & Architecture

```
Synthetic Data / CSV / REST API
              ↓
   Payment Provider Adapter (Mock)
              ↓
           Backend
              ↓
         PostgreSQL
              ↓
    Transaction Processor
              ↓
        Risk Detection
              ↓
        Rules Engine
              ↓
          AI Layer (OpenAI)
              ↓
         Guardrails
              ↓
     Recovery Simulation
              ↓
         Verification
              ↓
        Audit Logging
              ↓
    Dashboard / Alerts / Copilot
```

---

## 2. API Endpoints

### Health Check
* **`GET /api/health`**
  * **Description**: Returns server, database, and AI status.
  * **Response**:
    ```json
    {
      "status": "ok",
      "database": "connected",
      "ai": "available",
      "timestamp": "2026-09-02T10:00:00.000Z"
    }
    ```

---

### Transaction Ingestion & Queries

* **`POST /api/transactions`**
  * **Description**: Ingests a new transaction, validates fields using Zod, evaluates risk, and opens a recovery case if applicable.
  * **Request Body**:
    ```json
    {
      "externalTransactionId": "TXN_10001",
      "amount": 500000,
      "currency": "INR",
      "status": "CAPTURED",
      "paymentMethod": "UPI",
      "customerDebited": true,
      "merchantSettlementStatus": "PENDING",
      "failureReason": null,
      "retryCount": 0
    }
    ```
  * **Response (201 Created)**:
    ```json
    {
      "success": true,
      "data": {
        "id": "TXN_10001",
        "amount": 5000,
        "currency": "INR",
        "status": "Settlement Pending",
        "risk": "Medium",
        "recommendation": "Verify Settlement"
      }
    }
    ```

* **`GET /api/transactions`**
  * **Description**: Returns paginated and filtered transactions.
  * **Query Params**: `status`, `currency`, `search`, `page`, `limit`
  * **Response**:
    ```json
    {
      "success": true,
      "data": [ ... ],
      "pagination": { "total": 10, "page": 1, "limit": 50, "totalPages": 1 }
    }
    ```

* **`GET /api/transactions/:id`**
  * **Description**: Returns detailed transaction view with associated risk events, recovery cases, AI decisions, actions, and audit trail.

* **`POST /api/transactions/import`**
  * **Description**: Multipart form-data CSV upload with column parsing and row validation.
  * **Fields**: `file` (CSV file with `transaction_id,amount,currency,status,payment_method,customer_debited,merchant_settlement_status,failure_reason,retry_count`)

---

### Dashboard & Analytics

* **`GET /api/dashboard/summary`**
  * **Description**: Real database calculations for revenue at risk, recovered revenue, active cases, and recovery rate.
  * **Response**:
    ```json
    {
      "revenueAtRisk": 298000,
      "recoveredRevenue": 115000,
      "activeCases": 6,
      "recoveryRate": 27.8,
      "pendingCases": 2,
      "escalatedCases": 2
    }
    ```

* **`GET /api/dashboard/activity`**
  * **Description**: Returns recent risk events, recovery actions, and notifications.

* **`GET /api/analytics/recovery`**
  * **Description**: Date-grouped yield metrics for Recharts visualization.

---

### Recovery Workflows & Simulation

* **`GET /api/recovery/cases`**
  * **Description**: List all active and past recovery cases.

* **`POST /api/recovery/cases/:id/analyze`**
  * **Description**: Runs Rules Engine + optional OpenAI analysis.

* **`POST /api/recovery/cases/:id/simulate`**
  * **Description**: Executes a safe recovery action simulation. Validates against safety guardrails before execution.
  * **Request Body**:
    ```json
    {
      "actionType": "VERIFY_STATUS"
    }
    ```

* **`POST /api/recovery/cases/:id/escalate`**
  * **Description**: Flags case as `ESCALATED` for manual review.

* **`POST /api/recovery/cases/:id/stop`**
  * **Description**: Halts recovery pipeline on uncollectable transactions.

---

### AI Copilot

* **`POST /api/copilot`**
  * **Description**: Grounded conversational assistant querying live PostgreSQL metrics.
  * **Request Body**:
    ```json
    {
      "message": "Why is my revenue at risk?",
      "lang": "English"
    }
    ```
  * **Response**:
    ```json
    {
      "success": true,
      "data": {
        "reply": "Based on your current transaction data, you have ₹2,98,000 revenue at risk across 6 active cases.",
        "grounded": true
      }
    }
    ```

---

## 3. Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TRANSACTION",
    "message": "Transaction data is invalid."
  }
}
```
