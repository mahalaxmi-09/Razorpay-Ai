import { prisma } from '../config/db.js';
import { guardrailsService } from './guardrails.service.js';
import { notificationService } from './notification.service.js';

/**
 * Recovery Simulator Service
 * 
 * Safely executes simulated recovery workflows, verifies guardrails,
 * records recovery actions, and updates case and transaction statuses.
 * NEVER moves real money.
 */

export const recoverySimulatorService = {
  simulateAction: async (recoveryCaseId, actionType, actor = 'MERCHANT') => {
    try {
      // 1. Fetch RecoveryCase and associated Transaction
      const recoveryCase = await prisma.recoveryCase.findUnique({
        where: { id: recoveryCaseId },
        include: {
          transaction: true,
          riskEvent: true
        }
      });

      if (!recoveryCase) {
        throw new Error('Recovery case not found.');
      }

      const transaction = recoveryCase.transaction;
      const riskEvent = recoveryCase.riskEvent;

      // 2. Validate Action against Guardrails
      const guardrailCheck = guardrailsService.validateAction(transaction, actionType);

      // 3. Record Audit Log for Guardrail Check
      await prisma.auditLog.create({
        data: {
          merchantId: transaction.merchantId,
          transactionId: transaction.id,
          recoveryCaseId: recoveryCase.id,
          eventType: 'GUARDRAIL_CHECK',
          actor: 'SYSTEM',
          description: `Guardrail verification for ${actionType}: ${guardrailCheck.guardrailResult}. ${guardrailCheck.reason}`
        }
      });

      if (!guardrailCheck.allowed) {
        // Record blocked RecoveryAction
        const blockedAction = await prisma.recoveryAction.create({
          data: {
            recoveryCaseId: recoveryCase.id,
            actionType,
            status: 'BLOCKED',
            guardrailResult: guardrailCheck.guardrailResult,
            result: `Simulation blocked: ${guardrailCheck.reason}`,
            executedAt: new Date(),
            completedAt: new Date()
          }
        });

        await notificationService.createNotification({
          merchantId: transaction.merchantId,
          type: 'RECOVERY_BLOCKED',
          title: 'Recovery Action Blocked',
          message: `Action ${actionType} on ${transaction.id} was blocked by guardrails: ${guardrailCheck.reason}`,
          severity: 'warning'
        });

        return {
          success: false,
          guardrailResult: guardrailCheck.guardrailResult,
          reason: guardrailCheck.reason,
          action: blockedAction
        };
      }

      // 4. Execute Simulated Workflow
      let simulationResult = '';
      let newCaseStatus = recoveryCase.status;
      let newRiskEventStatus = riskEvent ? riskEvent.status : 'OPEN';
      let updateTxnData = {};

      switch (actionType) {
        case 'VERIFY_STATUS':
          simulationResult = 'Simulated settlement verification completed. Gateway confirmed settlement dispatch.';
          newCaseStatus = 'RECOVERED';
          newRiskEventStatus = 'RESOLVED';
          updateTxnData = {
            merchantSettlementStatus: 'PROCESSED',
            status: 'SETTLEMENT_PROCESSED'
          };
          break;

        case 'RETRY_ELIGIBLE_PAYMENT':
          simulationResult = 'Simulated fallback link retry processed successfully. Customer auth confirmed.';
          newCaseStatus = 'RECOVERED';
          newRiskEventStatus = 'RESOLVED';
          updateTxnData = {
            status: 'CAPTURED',
            customerDebited: true,
            merchantSettlementStatus: 'PROCESSED',
            retryCount: transaction.retryCount + 1
          };
          break;

        case 'SEND_REMINDER':
          simulationResult = 'Simulated automated payment reminder dispatched to customer via Email/SMS.';
          newCaseStatus = 'MONITORING';
          break;

        case 'SCHEDULE_RETRY':
          simulationResult = 'Simulated retry scheduled for next optimal banking window (24h cooldown).';
          newCaseStatus = 'MONITORING';
          break;

        case 'ESCALATE_TO_HUMAN':
          simulationResult = 'Case escalated to manual fintech operations queue for human investigation.';
          newCaseStatus = 'ESCALATED';
          newRiskEventStatus = 'ESCALATED';
          break;

        case 'STOP_RECOVERY':
          simulationResult = 'Recovery stopped. Transaction flagged as uncollectable/halted.';
          newCaseStatus = 'STOPPED';
          newRiskEventStatus = 'STOPPED';
          break;

        default:
          simulationResult = `Action ${actionType} executed in simulation mode.`;
      }

      // 5. Update Database Records
      const recoveryAction = await prisma.recoveryAction.create({
        data: {
          recoveryCaseId: recoveryCase.id,
          actionType,
          status: 'SUCCESS',
          guardrailResult: 'PASSED',
          result: simulationResult,
          executedAt: new Date(),
          completedAt: new Date()
        }
      });

      await prisma.recoveryCase.update({
        where: { id: recoveryCase.id },
        data: {
          status: newCaseStatus,
          recommendedAction: actionType
        }
      });

      if (riskEvent) {
        await prisma.revenueRiskEvent.update({
          where: { id: riskEvent.id },
          data: {
            status: newRiskEventStatus,
            resolvedAt: newRiskEventStatus === 'RESOLVED' ? new Date() : null
          }
        });
      }

      if (Object.keys(updateTxnData).length > 0) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: updateTxnData
        });
      }

      // 6. Record Audit Log & Notification
      await prisma.auditLog.create({
        data: {
          merchantId: transaction.merchantId,
          transactionId: transaction.id,
          recoveryCaseId: recoveryCase.id,
          eventType: 'RECOVERY_ACTION',
          actor,
          description: `Simulated action ${actionType} executed. Result: ${simulationResult}`
        }
      });

      if (newCaseStatus === 'RECOVERED') {
        await notificationService.createNotification({
          merchantId: transaction.merchantId,
          type: 'RECOVERY_COMPLETED',
          title: 'Revenue Recovered (Simulation)',
          message: `Successfully recovered ${(transaction.amount / 100).toLocaleString()} ${transaction.currency} for transaction ${transaction.id}.`,
          severity: 'success'
        });
      }

      return {
        success: true,
        guardrailResult: 'PASSED',
        simulationResult,
        caseStatus: newCaseStatus,
        action: recoveryAction
      };
    } catch (error) {
      console.error('recoverySimulatorService.simulateAction error:', error.message);
      throw error;
    }
  },
  simulateRecovery: async function(recoveryCaseId, actionType, actor = 'MERCHANT') {
    return this.simulateAction(recoveryCaseId, actionType, actor);
  }
};
