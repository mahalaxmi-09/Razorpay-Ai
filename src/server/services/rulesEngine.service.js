/**
 * Deterministic Rules Engine Service
 * 
 * Implements deterministic business rules for revenue risk detection and recovery recommendations.
 * Runs prior to AI advisory analysis and safety guardrails.
 */

const HIGH_VALUE_THRESHOLD = 5000000; // 50,000 INR (in paise)
const MAX_RETRY_LIMIT = 3;

export const rulesEngineService = {
  evaluateRules: (transaction) => {
    const {
      amount,
      status,
      customerDebited,
      merchantSettlementStatus,
      retryCount = 0,
      failureReason
    } = transaction;

    let riskType = null;
    let riskLevel = 'Low';
    let recommendedAction = 'VERIFY_STATUS';
    let priority = 'Low';
    let reason = '';
    let createCase = false;
    let eligibleForRetry = false;

    // Rule 5: High Value Transaction Check
    const isHighValue = amount >= HIGH_VALUE_THRESHOLD;

    // Rule 1 & Customer debited not settled
    if (customerDebited && merchantSettlementStatus !== 'PROCESSED' && status !== 'FAILED') {
      if (status === 'CAPTURED' && merchantSettlementStatus === 'PENDING') {
        riskType = 'SETTLEMENT_PENDING';
        riskLevel = isHighValue ? 'High' : 'Medium';
        recommendedAction = isHighValue ? 'ESCALATE_TO_HUMAN' : 'VERIFY_STATUS';
        priority = isHighValue ? 'High' : 'Medium';
        createCase = true;
        reason = isHighValue
          ? 'High-value transaction captured; settlement pending confirmation by gateway.'
          : 'Payment captured on gateway but merchant settlement is pending.';
      } else {
        riskType = 'CUSTOMER_DEBITED_NOT_SETTLED';
        riskLevel = 'High';
        recommendedAction = isHighValue ? 'ESCALATE_TO_HUMAN' : 'VERIFY_STATUS';
        priority = 'High';
        createCase = true;
        reason = 'Customer debited according to transaction data, but merchant settlement not confirmed.';
      }
    } 
    // Rule 2, 4, 6: Failed Payment Evaluations
    else if (status === 'FAILED') {
      riskType = 'PAYMENT_FAILED';
      createCase = true;

      if (retryCount >= MAX_RETRY_LIMIT) {
        // Rule 4: Retry limit exceeded
        riskLevel = 'High';
        recommendedAction = 'STOP_RECOVERY';
        priority = 'Medium';
        reason = `Retry limit of ${MAX_RETRY_LIMIT} attempts exceeded. Recovery halted to avoid customer fatigue.`;
      } else if (retryCount >= 2 || isHighValue) {
        // Rule 5 & 6: Repeated failures or high value
        riskLevel = 'High';
        recommendedAction = 'ESCALATE_TO_HUMAN';
        priority = 'High';
        reason = isHighValue
          ? `High-value failed transaction (${amount / 100} INR). Human review required.`
          : `Multiple failed attempts (${retryCount} retries). Escalated for manual review.`;
      } else {
        // Rule 2: Eligible retry
        riskLevel = 'Medium';
        recommendedAction = 'RETRY_ELIGIBLE_PAYMENT';
        priority = 'Medium';
        eligibleForRetry = true;
        reason = `Payment failed due to ${failureReason || 'authentication error'}. Retry attempt ${retryCount + 1}/${MAX_RETRY_LIMIT} eligible.`;
      }
    } 
    // Rule 3: Captured payment safety
    else if (status === 'CAPTURED') {
      if (merchantSettlementStatus === 'PROCESSED') {
        riskType = null;
        riskLevel = 'Low';
        recommendedAction = 'VERIFY_STATUS';
        createCase = false;
        reason = 'Payment captured and settled successfully.';
      } else {
        riskType = 'SETTLEMENT_PENDING';
        riskLevel = 'Medium';
        recommendedAction = 'VERIFY_STATUS';
        priority = 'Medium';
        createCase = true;
        reason = 'Captured payment awaiting settlement verification.';
      }
    } 
    else if (status === 'CANCELLED') {
      riskType = 'CHECKOUT_ABANDONED';
      riskLevel = 'Low';
      recommendedAction = 'SEND_REMINDER';
      priority = 'Low';
      createCase = true;
      reason = 'Checkout cancelled before authorization.';
    }

    return {
      riskType,
      riskLevel,
      recommendedAction,
      priority,
      createCase,
      eligibleForRetry,
      reason
    };
  }
};
