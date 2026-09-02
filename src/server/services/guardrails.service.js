/**
 * Safety Guardrails Service
 * 
 * Validates every proposed recovery action to prevent duplicate charges,
 * unauthorized retries, and unapproved high-value operations.
 */

const HUMAN_APPROVAL_THRESHOLD = 5000000; // 50,000 INR (paise)
const MAX_RETRY_LIMIT = 3;

export const guardrailsService = {
  validateAction: (transaction, actionType) => {
    const {
      amount,
      status,
      customerDebited,
      retryCount = 0
    } = transaction;

    // Guardrail 1: Duplicate payment prevention
    // Never allow payment retry if customer is already debited or transaction is captured
    if (
      (status === 'CAPTURED' || status === 'SETTLEMENT_PENDING' || status === 'SETTLEMENT_PROCESSED' || customerDebited) &&
      (actionType === 'RETRY_ELIGIBLE_PAYMENT' || actionType === 'SCHEDULE_RETRY')
    ) {
      return {
        allowed: false,
        guardrailResult: 'BLOCKED',
        reason: 'Payment is already captured or customer has been debited. Automatic retry is blocked to prevent duplicate charging.'
      };
    }

    // Guardrail 2: Retry Limit Enforcement
    if (
      (actionType === 'RETRY_ELIGIBLE_PAYMENT' || actionType === 'SCHEDULE_RETRY') &&
      retryCount >= MAX_RETRY_LIMIT
    ) {
      return {
        allowed: false,
        guardrailResult: 'BLOCKED',
        reason: `Maximum retry limit of ${MAX_RETRY_LIMIT} attempts exceeded.`
      };
    }

    // Guardrail 3: Human Approval Threshold
    if (
      amount >= HUMAN_APPROVAL_THRESHOLD &&
      (actionType === 'RETRY_ELIGIBLE_PAYMENT' || actionType === 'SCHEDULE_RETRY')
    ) {
      return {
        allowed: false,
        guardrailResult: 'HUMAN_APPROVAL_REQUIRED',
        reason: `Transaction amount (${amount / 100} INR) exceeds automatic retry threshold. Human approval required.`
      };
    }

    // All guardrail checks passed
    return {
      allowed: true,
      guardrailResult: 'PASSED',
      reason: 'Safety guardrails verified. Action cleared for execution.'
    };
  }
};
