import { prisma } from '../config/db.js';

/**
 * Centralized Recovery Guardrail Service (Phase 6)
 * 
 * Enforces safety guardrails before ANY recovery action or execution is attempted.
 * AI recommendations NEVER directly execute money movements without passing these safety checks.
 */

const MAX_RETRY_LIMIT = 3;
const HUMAN_APPROVAL_THRESHOLD = 5000000; // ₹50,000 in paise
const ABSOLUTE_AUTO_MAX_THRESHOLD = 10000000; // ₹1,00,000 in paise
const MIN_AI_CONFIDENCE_THRESHOLD = 0.70;
const COOLDOWN_HOURS = 24;

export const guardrailsService = {
  /**
   * Evaluates proposed recovery action against all safety rules.
   * 
   * @param {Object} params
   * @param {Object} params.transaction - The transaction record
   * @param {Object} params.recoveryCase - The recovery case record
   * @param {string} params.actionType - Action to be performed
   * @param {Object} [params.aiDecision] - Optional AI decision object with confidence/riskLevel
   * @param {string} [params.actor] - 'AI' | 'MERCHANT' | 'SYSTEM'
   * @param {string} [params.idempotencyKey] - Unique request idempotency key
   */
  validateAction: async ({
    transaction,
    recoveryCase,
    actionType,
    aiDecision = null,
    actor = 'SYSTEM',
    idempotencyKey = null
  }) => {
    const amount = transaction?.amount || 0;
    const status = transaction?.status || 'UNKNOWN';
    const customerDebited = Boolean(transaction?.customerDebited);
    const retryCount = (transaction?.retryCount || 0) + (recoveryCase?.attempts || 0);

    // Rule I: Idempotency Check
    if (idempotencyKey) {
      const existingAction = await prisma.recoveryAction.findUnique({
        where: { idempotencyKey }
      });
      if (existingAction) {
        return {
          allowed: false,
          guardrailResult: 'DUPLICATE_IDEMPOTENCY',
          reason: `Action with idempotency key ${idempotencyKey} has already been processed.`,
          existingAction
        };
      }
    }

    // Rule G: Duplicate Execution & Active Case Lock Check
    if (recoveryCase && (recoveryCase.status === 'EXECUTING' || recoveryCase.status === 'VERIFYING')) {
      return {
        allowed: false,
        guardrailResult: 'CONCURRENT_EXECUTION_BLOCKED',
        reason: `Recovery case ${recoveryCase.id} is already in state ${recoveryCase.status}. Concurrent execution prevented.`
      };
    }

    // Rule H: Payment State & Double-Charging Prevention
    // If payment is already captured/paid, NEVER retry
    if (
      (status === 'CAPTURED' || status === 'SETTLEMENT_PROCESSED' || (customerDebited && status !== 'FAILED')) &&
      (actionType === 'RETRY_PAYMENT' || actionType === 'REQUEST_CUSTOMER_RETRY' || actionType === 'RETRY_ELIGIBLE_PAYMENT')
    ) {
      return {
        allowed: false,
        guardrailResult: 'BLOCKED',
        reason: 'Payment has already been captured or customer was debited. Automatic retry is strictly blocked to prevent duplicate charging.',
        recommendedAlternative: 'VERIFY_SETTLEMENT'
      };
    }

    // Uncertain Payment State Check
    if (
      (status === 'PENDING' || status === 'AUTHORIZED' || status === 'SETTLEMENT_PENDING') &&
      (actionType === 'RETRY_PAYMENT' || actionType === 'REQUEST_CUSTOMER_RETRY')
    ) {
      return {
        allowed: false,
        guardrailResult: 'UNCERTAIN_STATE_VERIFY_REQUIRED',
        reason: 'Payment status is currently uncertain. You must verify payment with the gateway before attempting a retry.',
        recommendedAlternative: 'VERIFY_PAYMENT'
      };
    }

    // Rule A: Maximum Attempts Limit (Max 3)
    if (retryCount >= MAX_RETRY_LIMIT && (actionType === 'RETRY_PAYMENT' || actionType === 'REQUEST_CUSTOMER_RETRY' || actionType === 'RETRY_ELIGIBLE_PAYMENT')) {
      return {
        allowed: false,
        guardrailResult: 'MAX_ATTEMPTS_EXCEEDED',
        reason: `Maximum retry limit of ${MAX_RETRY_LIMIT} attempts reached. Recovery must be halted.`,
        recommendedAlternative: 'STOP_RECOVERY',
        shouldStop: true
      };
    }

    // Rule B: Cooldown Period (24h cooldown for automatic retries)
    if (recoveryCase?.id && (actor === 'AI' || actor === 'SYSTEM')) {
      const lastAction = await prisma.recoveryAction.findFirst({
        where: {
          recoveryCaseId: recoveryCase.id,
          actionType: { in: ['RETRY_PAYMENT', 'REQUEST_CUSTOMER_RETRY', 'RETRY_ELIGIBLE_PAYMENT'] }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (lastAction) {
        const hoursSinceLastAction = (Date.now() - new Date(lastAction.createdAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastAction < COOLDOWN_HOURS) {
          return {
            allowed: false,
            guardrailResult: 'COOLDOWN_ACTIVE',
            reason: `Automatic recovery is in cooldown. Last attempt was ${hoursSinceLastAction.toFixed(1)}h ago (cooldown is ${COOLDOWN_HOURS}h).`,
            remainingHours: COOLDOWN_HOURS - hoursSinceLastAction
          };
        }
      }
    }

    // Rule D: Absolute Automatic Recovery Amount Ceiling (₹1,00,000)
    if (amount > ABSOLUTE_AUTO_MAX_THRESHOLD && (actor === 'AI' || actor === 'SYSTEM')) {
      return {
        allowed: false,
        guardrailResult: 'ABOVE_MAX_AUTO_THRESHOLD',
        reason: `Transaction amount (₹${(amount / 100).toLocaleString('en-IN')}) exceeds maximum automated recovery threshold (₹1,00,000). Manual escalation required.`,
        recommendedAlternative: 'ESCALATE',
        requiresApproval: true
      };
    }

    // Rule C: High-Value Transactions (₹50,000 threshold)
    if (amount >= HUMAN_APPROVAL_THRESHOLD && (actor === 'AI' || actor === 'SYSTEM')) {
      return {
        allowed: false,
        guardrailResult: 'HUMAN_APPROVAL_REQUIRED',
        reason: `Transaction amount (₹${(amount / 100).toLocaleString('en-IN')}) exceeds ₹50,000 threshold. Explicit merchant approval required before execution.`,
        requiresApproval: true
      };
    }

    // Rule E: Low AI Confidence Threshold (< 0.70)
    if (aiDecision && typeof aiDecision.confidence === 'number' && aiDecision.confidence < MIN_AI_CONFIDENCE_THRESHOLD) {
      return {
        allowed: false,
        guardrailResult: 'LOW_CONFIDENCE_APPROVAL_REQUIRED',
        reason: `AI confidence (${(aiDecision.confidence * 100).toFixed(0)}%) is below safety threshold of ${(MIN_AI_CONFIDENCE_THRESHOLD * 100)}%. Requires merchant approval or escalation.`,
        requiresApproval: true
      };
    }

    // Rule F: Critical Risk Classification
    const riskLevel = aiDecision?.riskLevel || transaction?.riskStatus || 'LOW';
    if (riskLevel.toUpperCase() === 'CRITICAL' && (actor === 'AI' || actor === 'SYSTEM')) {
      return {
        allowed: false,
        guardrailResult: 'CRITICAL_RISK_HOLD',
        reason: 'Transaction is classified as CRITICAL risk. Automated execution is held for human escalation.',
        requiresApproval: true,
        recommendedAlternative: 'ESCALATE'
      };
    }

    // All safety guardrails passed
    return {
      allowed: true,
      guardrailResult: 'PASSED',
      reason: 'All safety guardrails verified successfully. Cleared for execution.'
    };
  }
};
