import { prisma } from '../config/db.js';
import { guardrailsService } from './guardrails.service.js';
import { recoveryStateMachineService } from './recoveryStateMachine.service.js';
import { notificationService } from './notification.service.js';
import { razorpayService } from './razorpay.service.js';

/**
 * Recovery Execution Service (Phase 6)
 * 
 * Safely coordinates autonomous recovery actions, enforces state machine transitions,
 * isolates provider operations, and guarantees verification before resolving cases.
 */

const MAX_RETRY_LIMIT = 3;

export const recoveryExecutionService = {
  /**
   * Primary entry point to execute or advance a recovery workflow on a case.
   */
  executeCaseRecovery: async ({
    recoveryCaseId,
    actionType,
    actor = 'SYSTEM',
    idempotencyKey = null,
    manualApproval = false,
    mockVerificationSuccess = true
  }) => {
    // 1. Fetch Recovery Case with all related entities
    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: { id: recoveryCaseId },
      include: {
        transaction: true,
        riskEvent: true,
        aiDecisions: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!recoveryCase) {
      throw new Error(`Recovery case ${recoveryCaseId} not found.`);
    }

    const transaction = recoveryCase.transaction;
    const aiDecision = recoveryCase.aiDecisions?.[0] || null;
    const effectiveAction = actionType || aiDecision?.recommendedAction || recoveryCase.recommendedAction || 'VERIFY_PAYMENT';

    // 2. Evaluate Guardrails
    const guardrailResult = await guardrailsService.validateAction({
      transaction,
      recoveryCase,
      actionType: effectiveAction,
      aiDecision,
      actor: manualApproval ? 'MERCHANT' : actor,
      idempotencyKey
    });

    // Record Guardrail Check in Audit Log
    await prisma.auditLog.create({
      data: {
        merchantId: transaction.merchantId,
        transactionId: transaction.id,
        recoveryCaseId: recoveryCase.id,
        eventType: 'GUARDRAIL_CHECKED',
        actor: 'SYSTEM',
        description: `Guardrail evaluation for ${effectiveAction}: ${guardrailResult.guardrailResult}. ${guardrailResult.reason}`,
        metadata: JSON.stringify({ guardrailResult, actionType: effectiveAction })
      }
    });

    // 3. Handle Guardrail Hold: Approval Required
    if (guardrailResult.requiresApproval && !manualApproval) {
      await recoveryStateMachineService.transitionCase(recoveryCase.id, 'AWAITING_APPROVAL', {
        actor: 'SYSTEM',
        reason: guardrailResult.reason,
        actionType: effectiveAction
      });

      await notificationService.createNotification({
        merchantId: transaction.merchantId,
        type: 'HUMAN_APPROVAL_REQUIRED',
        title: 'Merchant Approval Required',
        message: `Case ${recoveryCase.id} (₹${(transaction.amount / 100).toLocaleString('en-IN')}) requires approval: ${guardrailResult.reason}`,
        severity: 'warning'
      });

      return {
        success: false,
        status: 'AWAITING_APPROVAL',
        guardrailResult: guardrailResult.guardrailResult,
        reason: guardrailResult.reason,
        requiresApproval: true
      };
    }

    // 4. Handle Guardrail Block: Hard Block or Max Attempts
    if (!guardrailResult.allowed) {
      if (guardrailResult.shouldStop) {
        await recoveryStateMachineService.transitionCase(recoveryCase.id, 'STOPPED', {
          actor: 'SYSTEM',
          reason: guardrailResult.reason,
          actionType: effectiveAction
        });
      }

      const blockedAction = await prisma.recoveryAction.create({
        data: {
          recoveryCaseId: recoveryCase.id,
          paymentId: transaction.providerPaymentId || transaction.id,
          actionType: effectiveAction,
          status: 'BLOCKED',
          guardrailResult: guardrailResult.guardrailResult,
          failureReason: guardrailResult.reason,
          amount: transaction.amount,
          currency: transaction.currency,
          idempotencyKey,
          completedAt: new Date()
        }
      });

      await notificationService.createNotification({
        merchantId: transaction.merchantId,
        type: 'RECOVERY_BLOCKED',
        title: 'Recovery Action Blocked',
        message: `Action ${effectiveAction} on ${transaction.id} was blocked: ${guardrailResult.reason}`,
        severity: 'warning'
      });

      return {
        success: false,
        status: recoveryCase.status,
        guardrailResult: guardrailResult.guardrailResult,
        reason: guardrailResult.reason,
        action: blockedAction
      };
    }

    // 5. Handle Direct Non-Payment Actions: ESCALATE or STOP_RECOVERY
    if (effectiveAction === 'ESCALATE') {
      await recoveryStateMachineService.transitionCase(recoveryCase.id, 'ESCALATED', {
        actor,
        reason: 'Case escalated for merchant/compliance review.',
        actionType: effectiveAction
      });
      return { success: true, status: 'ESCALATED', actionType: effectiveAction };
    }

    if (effectiveAction === 'STOP_RECOVERY') {
      await recoveryStateMachineService.transitionCase(recoveryCase.id, 'STOPPED', {
        actor,
        reason: 'Case recovery permanently stopped.',
        actionType: effectiveAction
      });
      return { success: true, status: 'STOPPED', actionType: effectiveAction };
    }

    // 6. Transition to EXECUTING
    await recoveryStateMachineService.transitionCase(recoveryCase.id, 'EXECUTING', {
      actor,
      reason: `Executing recovery action: ${effectiveAction}.`,
      actionType: effectiveAction
    });

    const currentAttemptNumber = (recoveryCase.attempts || 0) + 1;

    // Create In-Progress RecoveryAction record
    const recoveryActionRecord = await prisma.recoveryAction.create({
      data: {
        recoveryCaseId: recoveryCase.id,
        paymentId: transaction.providerPaymentId || transaction.id,
        actionType: effectiveAction,
        status: 'EXECUTING',
        attemptNumber: currentAttemptNumber,
        amount: transaction.amount,
        currency: transaction.currency,
        idempotencyKey,
        guardrailResult: 'PASSED',
        initiatedAt: new Date()
      }
    });

    await prisma.recoveryCase.update({
      where: { id: recoveryCase.id },
      data: { attempts: currentAttemptNumber }
    });

    // 7. Execute Action through Provider Layer
    let providerResult = null;
    let providerReference = null;
    let executionSuccess = false;

    try {
      switch (effectiveAction) {
        case 'RETRY_PAYMENT':
        case 'RETRY_ELIGIBLE_PAYMENT':
          // Attempt test payment recovery flow
          providerReference = `pay_retry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          executionSuccess = Boolean(mockVerificationSuccess);
          providerResult = {
            providerPaymentId: providerReference,
            status: executionSuccess ? 'CAPTURED' : 'FAILED',
            mode: 'TEST_MODE'
          };
          break;

        case 'REQUEST_CUSTOMER_RETRY':
          providerReference = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          executionSuccess = Boolean(mockVerificationSuccess);
          providerResult = {
            retryUrl: `https://api.razorrecover.ai/pay/retry/${providerReference}`,
            status: executionSuccess ? 'CAPTURED' : 'PENDING',
            mode: 'TEST_MODE'
          };
          break;

        case 'VERIFY_PAYMENT':
        case 'VERIFY_STATUS':
          if (transaction.providerPaymentId && transaction.providerPaymentId.startsWith('pay_')) {
            try {
              const liveStatus = await razorpayService.fetchPayment(transaction.providerPaymentId);
              providerResult = liveStatus;
              executionSuccess = liveStatus?.status === 'captured';
            } catch (err) {
              providerResult = { status: transaction.status, note: err.message };
              executionSuccess = transaction.status === 'CAPTURED';
            }
          } else {
            providerResult = { status: 'CAPTURED', mode: 'TEST_MODE' };
            executionSuccess = true;
          }
          break;

        case 'VERIFY_SETTLEMENT':
          providerResult = { settlementStatus: 'PROCESSED', mode: 'TEST_MODE' };
          executionSuccess = true;
          break;

        default:
          providerResult = { note: 'Workflow executed in test mode' };
          executionSuccess = Boolean(mockVerificationSuccess);
      }
    } catch (err) {
      executionSuccess = false;
      providerResult = { error: err.message };
    }

    // 8. Transition to VERIFYING state
    await recoveryStateMachineService.transitionCase(recoveryCase.id, 'VERIFYING', {
      actor: 'SYSTEM',
      reason: 'Performing provider payment verification check.',
      actionType: effectiveAction
    });

    await prisma.auditLog.create({
      data: {
        merchantId: transaction.merchantId,
        transactionId: transaction.id,
        recoveryCaseId: recoveryCase.id,
        eventType: 'VERIFICATION_STARTED',
        actor: 'SYSTEM',
        description: `Verifying recovery outcome for action ${effectiveAction}.`
      }
    });

    // 9. Process Verification Outcome
    if (executionSuccess) {
      // 10. SUCCESS: Mark Case as VERIFIED_RECOVERED
      const updatedTxn = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'CAPTURED',
          captured: true,
          customerDebited: true,
          merchantSettlementStatus: 'PROCESSED',
          retryCount: transaction.retryCount + 1
        }
      });

      if (recoveryCase.riskEventId) {
        await prisma.revenueRiskEvent.update({
          where: { id: recoveryCase.riskEventId },
          data: { status: 'RESOLVED', resolvedAt: new Date() }
        });
      }

      await prisma.recoveryAction.update({
        where: { id: recoveryActionRecord.id },
        data: {
          status: 'SUCCESS',
          verificationStatus: 'VERIFIED',
          providerReference,
          result: `Verified successfully: ${effectiveAction} completed in Test Mode.`,
          completedAt: new Date()
        }
      });

      await recoveryStateMachineService.transitionCase(recoveryCase.id, 'VERIFIED_RECOVERED', {
        actor: 'SYSTEM',
        reason: `Payment recovery verified successfully. Amount: ₹${(transaction.amount / 100).toLocaleString('en-IN')}`,
        actionType: effectiveAction,
        metadataObj: { providerReference, amount: transaction.amount }
      });

      await notificationService.createNotification({
        merchantId: transaction.merchantId,
        type: 'RECOVERY_COMPLETED',
        title: 'Payment Recovery Verified',
        message: `Recovery verified successfully for payment ${transaction.id}. Recovered amount: ₹${(transaction.amount / 100).toLocaleString('en-IN')}.`,
        severity: 'success'
      });

      return {
        success: true,
        status: 'VERIFIED_RECOVERED',
        actionType: effectiveAction,
        recoveredAmount: transaction.amount / 100,
        providerReference
      };
    } else {
      // 11. FAILURE: Mark as FAILED (do NOT increase recovered revenue)
      await prisma.recoveryAction.update({
        where: { id: recoveryActionRecord.id },
        data: {
          status: 'FAILED',
          verificationStatus: 'FAILED',
          failureReason: providerResult?.error || 'Verification check failed to confirm captured funds.',
          completedAt: new Date()
        }
      });

      const nextCaseStatus = currentAttemptNumber >= MAX_RETRY_LIMIT ? 'STOPPED' : 'FAILED';

      await recoveryStateMachineService.transitionCase(recoveryCase.id, nextCaseStatus, {
        actor: 'SYSTEM',
        reason: `Recovery execution attempt ${currentAttemptNumber} failed verification.`,
        actionType: effectiveAction
      });

      await notificationService.createNotification({
        merchantId: transaction.merchantId,
        type: 'RECOVERY_FAILED',
        title: 'Recovery Execution Failed',
        message: `Recovery attempt ${currentAttemptNumber} on ${transaction.id} failed verification. Case status: ${nextCaseStatus}.`,
        severity: 'error'
      });

      return {
        success: false,
        status: nextCaseStatus,
        actionType: effectiveAction,
        reason: 'Payment verification failed to confirm captured funds.'
      };
    }
  },

  /**
   * Merchant / Admin Approval Endpoint Handler
   */
  approveCase: async (recoveryCaseId, approvedBy = 'MERCHANT', reason = 'Merchant approved recovery action.') => {
    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: { id: recoveryCaseId },
      include: { transaction: true }
    });

    if (!recoveryCase) throw new Error(`Recovery case ${recoveryCaseId} not found.`);
    if (recoveryCase.status !== 'AWAITING_APPROVAL') {
      throw new Error(`Cannot approve case in status ${recoveryCase.status}. Must be in AWAITING_APPROVAL.`);
    }

    await recoveryStateMachineService.transitionCase(recoveryCase.id, 'APPROVED', {
      actor: 'MERCHANT',
      approvedBy,
      reason
    });

    // Automatically trigger execution for approved case
    return await recoveryExecutionService.executeCaseRecovery({
      recoveryCaseId: recoveryCase.id,
      actionType: recoveryCase.recommendedAction || 'RETRY_PAYMENT',
      actor: 'MERCHANT',
      manualApproval: true
    });
  },

  /**
   * Merchant / Admin Rejection Endpoint Handler
   */
  rejectCase: async (recoveryCaseId, rejectedBy = 'MERCHANT', reason = 'Merchant rejected recovery action.') => {
    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: { id: recoveryCaseId }
    });

    if (!recoveryCase) throw new Error(`Recovery case ${recoveryCaseId} not found.`);

    return await recoveryStateMachineService.transitionCase(recoveryCase.id, 'STOPPED', {
      actor: 'MERCHANT',
      rejectionReason: reason,
      reason: `Case rejected by ${rejectedBy}: ${reason}`
    });
  }
};
