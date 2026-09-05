/**
 * Central Recovery Agent Dataset - RazorRecover AI
 * 
 * Contains realistic Test Mode recovery cases for the 6-stage pipeline,
 * including simulated test scenarios:
 * 1. "Customer Debited - Merchant Settlement Missing" (CASE_SETTLE_001)
 * 2. "Wrong Number Payment" (CASE_WRONG_001)
 */

export const recoveryCasesData = [
  {
    id: 'CASE_SETTLE_001',
    transactionId: 'TXN_SETTLE_001',
    status: 'VERIFYING',
    priority: 'HIGH',
    attempts: 0,
    maxAttempts: 3,
    approvalRequired: false,
    guardrailBlocked: false,
    guardrailRule: 'DUPLICATE PAYMENT PREVENTION',
    recommendedAction: 'VERIFY_SETTLEMENT',
    currentAction: 'VERIFY_SETTLEMENT',
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    transaction: {
      id: 'TXN_SETTLE_001',
      providerPaymentId: 'pay_TEST_SETTLE_001',
      amount: 1850000, // ₹18,500
      currency: 'INR',
      status: 'CAPTURED',
      merchantSettlementStatus: 'PENDING',
      customerDebited: true,
      failureReason: 'Customer payment captured but merchant settlement confirmation is missing.',
      customer: { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com' }
    },
    aiDecision: {
      rootCause: 'Payment capture succeeded, but settlement confirmation is unavailable or delayed.',
      riskSummary: 'Reconciliation mismatch between customer payment state and merchant settlement state.',
      confidence: 0.96,
      modelUsed: 'gpt-4o',
      reasoningSummary: 'DO NOT retry the customer payment immediately. 1. Verify payment provider state. 2. Check settlement status. 3. Prevent duplicate recovery. 4. Initiate safe settlement reconciliation.',
      merchantMessage: 'Verify & reconcile settlement. Duplicate payment prevention guardrail active.'
    }
  },
  {
    id: 'CASE_WRONG_001',
    transactionId: 'TXN_WRONG_001',
    status: 'AWAITING_APPROVAL',
    priority: 'HIGH',
    attempts: 0,
    maxAttempts: 3,
    approvalRequired: true,
    guardrailBlocked: true,
    guardrailRule: 'Recipient verification required',
    recommendedAction: 'VERIFY_RECIPIENT_BEFORE_RETRY',
    currentAction: null,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    transaction: {
      id: 'TXN_WRONG_001',
      providerPaymentId: 'pay_TEST_WRONG_001',
      amount: 450000,
      currency: 'INR',
      status: 'FAILED',
      merchantSettlementStatus: 'UNSETTLED',
      customerDebited: false,
      failureReason: 'Recipient/UPI identifier mismatch',
      enteredRecipient: 'wrongnumber@upi',
      expectedRecipient: 'merchant@upi',
      customer: { name: 'Ananya Reddy', email: 'ananya.reddy@gmail.com' }
    },
    aiDecision: {
      rootCause: 'Incorrect recipient/UPI identifier used during payment.',
      riskSummary: 'Payment may fail or be routed to an unintended recipient.',
      confidence: 0.92,
      modelUsed: 'gpt-4o',
      reasoningSummary: 'Do NOT automatically retry the payment to an unknown recipient. 1. Stop automatic retry. 2. Ask for recipient verification/correction. 3. Generate a safe payment retry recommendation. 4. Escalate if the recipient cannot be verified.',
      merchantMessage: 'Verify recipient before retry. Automatic retry blocked by recipient verification guardrail.'
    }
  },
  {
    id: 'CASE_10002',
    transactionId: 'TXN_10002',
    status: 'OPEN',
    priority: 'HIGH',
    attempts: 0,
    maxAttempts: 3,
    approvalRequired: false,
    recommendedAction: 'REQUEST_CUSTOMER_RETRY',
    currentAction: null,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    transaction: {
      id: 'TXN_10002',
      providerPaymentId: 'pay_TEST10002',
      amount: 680000,
      currency: 'INR',
      status: 'FAILED',
      merchantSettlementStatus: 'UNSETTLED',
      customerDebited: false,
      failureReason: 'Insufficient customer funds during bank auth',
      customer: { name: 'Shreya Patel', email: 'shreya.patel@outlook.com' }
    },
    aiDecision: null
  },
  {
    id: 'CASE_10003',
    transactionId: 'TXN_10003',
    status: 'ANALYZING',
    priority: 'HIGH',
    attempts: 0,
    maxAttempts: 3,
    approvalRequired: false,
    recommendedAction: 'RETRY_PAYMENT',
    currentAction: null,
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    transaction: {
      id: 'TXN_10003',
      providerPaymentId: 'pay_TEST10003',
      amount: 1450000,
      currency: 'INR',
      status: 'FAILED',
      merchantSettlementStatus: 'UNSETTLED',
      customerDebited: false,
      failureReason: 'Card limit exceeded on issuing bank',
      customer: { name: 'Amit Sharma', email: 'amit.sharma@yahoo.com' }
    },
    aiDecision: {
      rootCause: 'LIMIT_EXCEEDED',
      confidence: 0.88,
      modelUsed: 'gpt-4o',
      reasoningSummary: 'Bank returned card limit exceeded. Customer retry recommended.',
      merchantMessage: 'Advise customer to use alternative payment method or increase card limit.'
    }
  },
  {
    id: 'CASE_10004',
    transactionId: 'TXN_10004',
    status: 'AWAITING_APPROVAL',
    priority: 'CRITICAL',
    attempts: 0,
    maxAttempts: 3,
    approvalRequired: true,
    recommendedAction: 'RETRY_PAYMENT',
    currentAction: null,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    transaction: {
      id: 'TXN_10004',
      providerPaymentId: 'pay_TEST10004',
      amount: 9800000,
      currency: 'INR',
      status: 'FAILED',
      merchantSettlementStatus: 'UNSETTLED',
      customerDebited: false,
      failureReason: 'High value fraud shield trigger; Awaiting merchant approval',
      customer: { name: 'Vikram Mehta', email: 'vikram.mehta@corp.com' }
    },
    aiDecision: {
      rootCause: 'FRAUD_RISK_FLAG',
      confidence: 0.94,
      modelUsed: 'gpt-4o',
      reasoningSummary: 'High-value transaction (₹98,000) requires manual approval per financial safety policy.',
      merchantMessage: 'Please review transaction before authorizing recovery attempt.'
    }
  },
  {
    id: 'CASE_10006',
    transactionId: 'TXN_10006',
    status: 'EXECUTING',
    priority: 'MEDIUM',
    attempts: 1,
    maxAttempts: 3,
    approvalRequired: false,
    recommendedAction: 'VERIFY_SETTLEMENT',
    currentAction: 'VERIFY_SETTLEMENT',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    transaction: {
      id: 'TXN_10006',
      providerPaymentId: 'pay_TEST10006',
      amount: 4500000,
      currency: 'INR',
      status: 'CAPTURED',
      merchantSettlementStatus: 'PENDING',
      customerDebited: true,
      failureReason: 'Bank settlement reconciliation pending',
      customer: { name: 'Pooja Reddy', email: 'pooja.reddy@gmail.com' }
    },
    aiDecision: {
      rootCause: 'SETTLEMENT_DELAY',
      confidence: 0.96,
      modelUsed: 'gpt-4o',
      reasoningSummary: 'Payment captured on gateway. Settlement pending banking batch sync.',
      merchantMessage: 'Reconciling with gateway settlement ledger.'
    }
  },
  {
    id: 'CASE_10007',
    transactionId: 'TXN_10007',
    status: 'VERIFYING',
    priority: 'LOW',
    attempts: 1,
    maxAttempts: 3,
    approvalRequired: false,
    recommendedAction: 'VERIFY_SETTLEMENT',
    currentAction: 'VERIFY_SETTLEMENT',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    transaction: {
      id: 'TXN_10007',
      providerPaymentId: 'pay_TEST10007',
      amount: 11250000,
      currency: 'INR',
      status: 'SETTLEMENT_PROCESSED',
      merchantSettlementStatus: 'PROCESSED',
      customerDebited: true,
      failureReason: null,
      customer: { name: 'Rahul Verma', email: 'rahul.verma@gmail.com' }
    },
    aiDecision: {
      rootCause: 'SETTLEMENT_DELAY',
      confidence: 0.99,
      modelUsed: 'gpt-4o',
      reasoningSummary: 'Verification check active with payment provider.',
      merchantMessage: 'Confirming final bank credit.'
    }
  },
  {
    id: 'CASE_10011',
    transactionId: 'TXN_10011',
    status: 'VERIFIED_RECOVERED',
    priority: 'LOW',
    attempts: 1,
    maxAttempts: 3,
    approvalRequired: false,
    recommendedAction: 'RETRY_PAYMENT',
    currentAction: 'RETRY_PAYMENT',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    transaction: {
      id: 'TXN_10011',
      providerPaymentId: 'pay_TEST10011',
      amount: 500000,
      currency: 'INR',
      status: 'CAPTURED',
      merchantSettlementStatus: 'PROCESSED',
      customerDebited: true,
      failureReason: null,
      customer: { name: 'Karthik Rao', email: 'karthik.rao@gmail.com' }
    },
    aiDecision: {
      rootCause: 'NETWORK_TIMEOUT',
      confidence: 0.95,
      modelUsed: 'gpt-4o',
      reasoningSummary: 'Recovered and verified in Test Mode.',
      merchantMessage: 'Payment captured and funds accounted.'
    }
  }
];
