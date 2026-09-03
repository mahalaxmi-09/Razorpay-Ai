/**
 * Central Audit Trail Dataset - RazorRecover AI
 */

export const auditLogsData = [
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
