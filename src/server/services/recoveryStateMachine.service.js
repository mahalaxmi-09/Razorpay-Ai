import { prisma } from '../config/db.js';

/**
 * Recovery State Machine Service
 * 
 * Enforces valid state transitions for RecoveryCase models and maintains immutable audit logs.
 * Prevents invalid or out-of-order state mutations.
 */

export const RECOVERY_STATES = {
  OPEN: 'OPEN',
  ANALYZING: 'ANALYZING',
  ACTION_RECOMMENDED: 'ACTION_RECOMMENDED',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  APPROVED: 'APPROVED',
  EXECUTING: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  VERIFIED_RECOVERED: 'VERIFIED_RECOVERED',
  FAILED: 'FAILED',
  ESCALATED: 'ESCALATED',
  STOPPED: 'STOPPED'
};

const VALID_TRANSITIONS = {
  OPEN: ['ANALYZING', 'ACTION_RECOMMENDED', 'AWAITING_APPROVAL', 'EXECUTING', 'ESCALATED', 'STOPPED'],
  ANALYZING: ['ACTION_RECOMMENDED', 'AWAITING_APPROVAL', 'EXECUTING', 'ESCALATED', 'STOPPED'],
  ACTION_RECOMMENDED: ['AWAITING_APPROVAL', 'APPROVED', 'EXECUTING', 'ESCALATED', 'STOPPED'],
  AWAITING_APPROVAL: ['APPROVED', 'STOPPED', 'ESCALATED'],
  APPROVED: ['EXECUTING', 'STOPPED', 'ESCALATED'],
  EXECUTING: ['VERIFYING', 'FAILED', 'STOPPED', 'ESCALATED', 'VERIFIED_RECOVERED'],
  VERIFYING: ['VERIFIED_RECOVERED', 'FAILED', 'STOPPED', 'ESCALATED'],
  FAILED: ['OPEN', 'ANALYZING', 'EXECUTING', 'ESCALATED', 'STOPPED'],
  ESCALATED: ['OPEN', 'AWAITING_APPROVAL', 'APPROVED', 'STOPPED'],
  VERIFIED_RECOVERED: [], // Terminal state
  STOPPED: ['OPEN'] // Re-openable by admin
};

export const recoveryStateMachineService = {
  isValidTransition: (currentStatus, targetStatus) => {
    if (currentStatus === targetStatus) return true;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  },

  transitionCase: async (recoveryCaseId, targetStatus, metadata = {}) => {
    const {
      actor = 'SYSTEM',
      reason = '',
      actionType = null,
      approvedBy = null,
      rejectionReason = null,
      metadataObj = {}
    } = metadata;

    const currentCase = await prisma.recoveryCase.findUnique({
      where: { id: recoveryCaseId },
      include: { transaction: true, riskEvent: true }
    });

    if (!currentCase) {
      throw new Error(`Recovery case ${recoveryCaseId} not found.`);
    }

    if (!recoveryStateMachineService.isValidTransition(currentCase.status, targetStatus)) {
      throw new Error(
        `Invalid state transition: Cannot transition RecoveryCase ${recoveryCaseId} from ${currentCase.status} to ${targetStatus}.`
      );
    }

    const updateData = {
      status: targetStatus,
      updatedAt: new Date()
    };

    if (actionType) updateData.currentAction = actionType;
    if (targetStatus === 'AWAITING_APPROVAL') updateData.approvalRequired = true;
    if (targetStatus === 'APPROVED') {
      updateData.approvalRequired = false;
      updateData.approvedBy = approvedBy || actor;
      updateData.approvedAt = new Date();
    }
    if (targetStatus === 'STOPPED' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    // Use transaction to ensure consistency
    const [updatedCase, auditEntry] = await prisma.$transaction([
      prisma.recoveryCase.update({
        where: { id: recoveryCaseId },
        data: updateData,
        include: { transaction: true, riskEvent: true, aiDecisions: true }
      }),
      prisma.auditLog.create({
        data: {
          merchantId: currentCase.transaction?.merchantId || 'SYSTEM',
          transactionId: currentCase.transactionId,
          recoveryCaseId: currentCase.id,
          eventType: `RECOVERY_${targetStatus}`,
          actor,
          description: reason || `Recovery case transitioned from ${currentCase.status} to ${targetStatus}.`,
          metadata: JSON.stringify({
            previousStatus: currentCase.status,
            newStatus: targetStatus,
            actionType,
            ...metadataObj
          })
        }
      })
    ]);

    return { updatedCase, auditEntry };
  }
};
