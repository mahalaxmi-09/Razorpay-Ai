/**
 * Central Audit Trail Dataset - RazorRecover AI
 * 
 * Contains immutable audit trail logs including the 8 milestones
 * for the simulated "Wrong Number Payment" test scenario.
 */

export const auditLogsData = [
  {
    id: 'AUDIT_WRONG_08',
    transactionId: 'TXN_WRONG_001',
    eventType: 'TEST_PAYMENT_VERIFIED',
    actor: 'VERIFICATION_ENGINE',
    details: 'Test payment verified: Provider capture confirmed as VERIFIED_RECOVERED in Razorpay Test Mode.',
    timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_07',
    transactionId: 'TXN_WRONG_001',
    eventType: 'TEST_RECOVERY_EXECUTED',
    actor: 'RECOVERY_ENGINE',
    details: 'Test recovery executed: Dispatched safe simulated retry with corrected identifier merchant@upi.',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_06',
    transactionId: 'TXN_WRONG_001',
    eventType: 'CORRECT_RECIPIENT_CONFIRMED',
    actor: 'MERCHANT_PORTAL',
    details: 'Correct recipient confirmed: Customer Ananya Reddy verified correct merchant VPA merchant@upi.',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_05',
    transactionId: 'TXN_WRONG_001',
    eventType: 'RECIPIENT_VERIFICATION_REQUIRED',
    actor: 'GUARDRAILS_ENGINE',
    details: 'Recipient verification required: Case marked AWAITING_APPROVAL with manual verification flag.',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_04',
    transactionId: 'TXN_WRONG_001',
    eventType: 'AUTOMATIC_RETRY_BLOCKED',
    actor: 'GUARDRAILS_ENGINE',
    details: 'Automatic retry blocked: Recipient Verification Guardrail prevented automated money transfer to wrongnumber@upi.',
    timestamp: new Date(Date.now() - 4 * 60 * 1000 - 30000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_03',
    transactionId: 'TXN_WRONG_001',
    eventType: 'RECOVERY_RECOMMENDATION_GENERATED',
    actor: 'AI_AGENT',
    details: 'Recovery recommendation generated: Verify recipient before retry. Stop auto-retry to prevent misrouted funds.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_02',
    transactionId: 'TXN_WRONG_001',
    eventType: 'AI_ANALYSIS_COMPLETED',
    actor: 'OPENAI_GPT4O',
    details: 'AI analysis completed: Diagnosed Payment Routing Error / Recipient Mismatch with 92% confidence.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000 - 30000).toISOString()
  },
  {
    id: 'AUDIT_WRONG_01',
    transactionId: 'TXN_WRONG_001',
    eventType: 'WRONG_RECIPIENT_DETECTED',
    actor: 'TELEMETRY_INGESTION',
    details: 'Wrong recipient detected: ₹4,500 UPI payment failed with recipient mismatch (entered: wrongnumber@upi, expected: merchant@upi).',
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString()
  },
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
