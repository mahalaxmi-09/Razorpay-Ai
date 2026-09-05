/**
 * Central Audit Trail Dataset - RazorRecover AI
 * 
 * Contains immutable audit trail logs including the 13 milestones
 * for the simulated "Customer Debited - Merchant Settlement Missing" (TXN_SETTLE_001)
 * and "Wrong Number Payment" (TXN_WRONG_001) test scenarios.
 */

export const auditLogsData = [
  // --- Scenario: Customer Debited - Merchant Settlement Missing (TXN_SETTLE_001) ---
  {
    id: 'AUDIT_SETTLE_13',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'MERCHANT_NOTIFICATION_GENERATED',
    actor: 'NOTIFICATION_ENGINE',
    details: 'Merchant notification generated: Settlement verified for ₹18,500. Successfully reconciled in Razorpay Test Mode without duplicate charge.',
    timestamp: new Date(Date.now() - 30 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_12',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'RECOVERY_CASE_VERIFIED_RECOVERED',
    actor: 'STATE_MACHINE',
    details: 'Recovery case CASE_SETTLE_001 transitioned state from VERIFYING to VERIFIED_RECOVERED.',
    timestamp: new Date(Date.now() - 45 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_11',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'SETTLEMENT_VERIFIED_TEST_MODE',
    actor: 'VERIFICATION_ENGINE',
    details: 'Settlement verified: Payment provider confirmed batch settlement processed for ₹18,500 in Test Mode.',
    timestamp: new Date(Date.now() - 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_10',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'SETTLEMENT_VERIFICATION_STARTED',
    actor: 'RECOVERY_ENGINE',
    details: 'Settlement verification started: Querying gateway settlement API and banking batch reconciliation pipeline.',
    timestamp: new Date(Date.now() - 90 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_09',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'AUTOMATIC_RETRY_BLOCKED',
    actor: 'GUARDRAILS_ENGINE',
    details: 'Automatic retry blocked: Customer was already debited; retry strictly halted to prevent double-charging.',
    timestamp: new Date(Date.now() - 110 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_08',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'DUPLICATE_PAYMENT_GUARDRAIL_TRIGGERED',
    actor: 'GUARDRAILS_ENGINE',
    details: 'Duplicate Payment Prevention guardrail triggered (customerDebited=true, status=CAPTURED, merchantSettlement=PENDING).',
    timestamp: new Date(Date.now() - 120 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_07',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'AI_RECOMMENDATION_GENERATED',
    actor: 'AI_AGENT',
    details: 'AI recommendation generated: VERIFY_SETTLEMENT. Decision: DO NOT RETRY PAYMENT. Action: VERIFY & RECONCILE.',
    timestamp: new Date(Date.now() - 140 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_06',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'AI_ROOT_CAUSE_IDENTIFIED',
    actor: 'OPENAI_GPT4O',
    details: 'AI diagnosed root cause: Payment capture succeeded, but settlement confirmation is unavailable or delayed (96% confidence).',
    timestamp: new Date(Date.now() - 150 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_05',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'AI_ANALYSIS_STARTED',
    actor: 'AI_AGENT',
    details: 'Autonomous recovery agent initiated OpenAI root cause analysis on ₹18,500 settlement mismatch.',
    timestamp: new Date(Date.now() - 160 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_04',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'REVENUE_RISK_DETECTED',
    actor: 'RISK_ENGINE',
    details: 'Revenue risk detected: ₹18,500 flagged AT_RISK due to settlement reconciliation delay.',
    timestamp: new Date(Date.now() - 170 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_03',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'SETTLEMENT_CONFIRMATION_MISSING',
    actor: 'SETTLEMENT_LEDGER',
    details: 'Settlement confirmation missing: Bank reconciliation ledger pending sync.',
    timestamp: new Date(Date.now() - 180 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_02',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'CUSTOMER_DEBIT_DETECTED',
    actor: 'TELEMETRY_INGESTION',
    details: 'Customer debit confirmed: Rahul Sharma debited ₹18,500 via UPI.',
    timestamp: new Date(Date.now() - 190 * 1000).toISOString()
  },
  {
    id: 'AUDIT_SETTLE_01',
    transactionId: 'TXN_SETTLE_001',
    eventType: 'PAYMENT_CAPTURED',
    actor: 'GATEWAY_WEBHOOK',
    details: 'Payment captured: Razorpay Test Mode confirmed payment capture pay_TEST_SETTLE_001 for ₹18,500.',
    timestamp: new Date(Date.now() - 200 * 1000).toISOString()
  },

  // --- Scenario: Wrong Number Payment (TXN_WRONG_001) ---
  {
    id: 'AUDIT_WRONG_08',
    transactionId: 'TXN_WRONG_001',
    eventType: 'TEST_PAYMENT_VERIFIED',
    actor: 'VERIFICATION_ENGINE',
    details: 'Test payment verified: Provider capture confirmed as VERIFIED_RECOVERED in Razorpay Test Mode.',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_07',
    transactionId: 'TXN_WRONG_001',
    eventType: 'TEST_RECOVERY_EXECUTED',
    actor: 'RECOVERY_ENGINE',
    details: 'Test recovery executed: Dispatched safe simulated retry with corrected identifier merchant@upi.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_06',
    transactionId: 'TXN_WRONG_001',
    eventType: 'CORRECT_RECIPIENT_CONFIRMED',
    actor: 'MERCHANT_PORTAL',
    details: 'Correct recipient confirmed: Customer Ananya Reddy verified correct merchant VPA merchant@upi.',
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_05',
    transactionId: 'TXN_WRONG_001',
    eventType: 'RECIPIENT_VERIFICATION_REQUIRED',
    actor: 'GUARDRAILS_ENGINE',
    details: 'Recipient verification required: Case marked AWAITING_APPROVAL with manual verification flag.',
    timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_04',
    transactionId: 'TXN_WRONG_001',
    eventType: 'AUTOMATIC_RETRY_BLOCKED',
    actor: 'GUARDRAILS_ENGINE',
    details: 'Automatic retry blocked: Recipient Verification Guardrail prevented automated money transfer to wrongnumber@upi.',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_03',
    transactionId: 'TXN_WRONG_001',
    eventType: 'RECOVERY_RECOMMENDATION_GENERATED',
    actor: 'AI_AGENT',
    details: 'Recovery recommendation generated: Verify recipient before retry. Stop auto-retry to prevent misrouted funds.',
    timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_02',
    transactionId: 'TXN_WRONG_001',
    eventType: 'AI_ANALYSIS_COMPLETED',
    actor: 'OPENAI_GPT4O',
    details: 'AI analysis completed: Diagnosed Payment Routing Error / Recipient Mismatch with 92% confidence.',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_01',
    transactionId: 'TXN_WRONG_001',
    eventType: 'WRONG_RECIPIENT_DETECTED',
    actor: 'TELEMETRY_INGESTION',
    details: 'Wrong recipient detected: ₹4,500 UPI payment failed with recipient mismatch (entered: wrongnumber@upi, expected: merchant@upi).',
    timestamp: new Date(Date.now() - 11 * 60 * 1000).toISOString()
  },

  // --- Base Audit Trail ---
  {
    id: 'AUDIT_101',
    transactionId: 'TXN_10011',
    eventType: 'RECOVERY_VERIFIED',
    actor: 'VERIFICATION_ENGINE',
    details: 'Payment provider confirmed capture of ₹5,000 in Test Mode.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_102',
    transactionId: 'TXN_10011',
    eventType: 'RECOVERY_EXECUTION_COMPLETED',
    actor: 'RECOVERY_ENGINE',
    details: 'Customer retry executed successfully with provider reference pay_TEST10011.',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_103',
    transactionId: 'TXN_10004',
    eventType: 'APPROVAL_REQUIRED',
    actor: 'GUARDRAILS_ENGINE',
    details: 'High-value transaction (₹98,000) exceeded automatic threshold. Held in AWAITING_APPROVAL.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_104',
    transactionId: 'TXN_10004',
    eventType: 'AI_DIAGNOSIS_COMPLETED',
    actor: 'OPENAI_GPT4O',
    details: 'Diagnosed FRAUD_RISK_FLAG with 94% confidence.',
    timestamp: new Date(Date.now() - 46 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_105',
    transactionId: 'TXN_10006',
    eventType: 'SETTLEMENT_VERIFY_INITIATED',
    actor: 'RECOVERY_ENGINE',
    details: 'Initiated settlement reconciliation for ₹45,000 captured payment.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_106',
    transactionId: 'TXN_10005',
    eventType: 'CUSTOMER_LINK_GENERATED',
    actor: 'RECOVERY_ENGINE',
    details: 'Dispatched dynamic 3DS recovery link to customer Deepa Nair (₹3,198).',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  }
];
