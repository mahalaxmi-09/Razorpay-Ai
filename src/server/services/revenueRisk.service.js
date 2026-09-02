import { prisma } from '../config/db.js';
import { rulesEngineService } from './rulesEngine.service.js';
import { notificationService } from './notification.service.js';

/**
 * Revenue Risk & Case Processing Service
 * 
 * Ingests transactions, detects revenue-at-risk events, and aggregates dashboard metrics.
 */

export const revenueRiskService = {
  processTransactionRisk: async (transaction) => {
    try {
      const evaluation = rulesEngineService.evaluateRules(transaction);

      if (!evaluation.createCase || !evaluation.riskType) {
        return null;
      }

      // 1. Create or find RevenueRiskEvent
      let riskEvent = await prisma.revenueRiskEvent.findFirst({
        where: { transactionId: transaction.id, status: { in: ['OPEN', 'MONITORING'] } }
      });

      if (!riskEvent) {
        riskEvent = await prisma.revenueRiskEvent.create({
          data: {
            transactionId: transaction.id,
            merchantId: transaction.merchantId,
            riskType: evaluation.riskType,
            riskLevel: evaluation.riskLevel,
            amountAtRisk: transaction.amount,
            reason: evaluation.reason,
            status: evaluation.riskType === 'SETTLEMENT_PENDING' ? 'MONITORING' : 'OPEN'
          }
        });
      }

      // 2. Create RecoveryCase
      let recoveryCase = await prisma.recoveryCase.findFirst({
        where: { transactionId: transaction.id }
      });

      if (!recoveryCase) {
        recoveryCase = await prisma.recoveryCase.create({
          data: {
            riskEventId: riskEvent.id,
            transactionId: transaction.id,
            status: evaluation.riskType === 'SETTLEMENT_PENDING' ? 'MONITORING' : 'OPEN',
            priority: evaluation.priority,
            recommendedAction: evaluation.recommendedAction
          }
        });

        // 3. Create Audit Log
        await prisma.auditLog.create({
          data: {
            merchantId: transaction.merchantId,
            transactionId: transaction.id,
            recoveryCaseId: recoveryCase.id,
            eventType: 'RISK_DETECTED',
            actor: 'SYSTEM',
            description: `Risk event ${evaluation.riskType} detected for transaction ${transaction.id}. Recommended: ${evaluation.recommendedAction}.`
          }
        });

        // 4. Create Notification
        await notificationService.createNotification({
          merchantId: transaction.merchantId,
          type: evaluation.riskType === 'SETTLEMENT_PENDING' ? 'RECOVERY_PENDING' : 'RISK_DETECTED',
          title: evaluation.riskType === 'SETTLEMENT_PENDING' ? 'Settlement Pending' : 'Revenue Risk Detected',
          message: `Transaction ${transaction.id} (${transaction.amount / 100} ${transaction.currency}): ${evaluation.reason}`,
          severity: evaluation.riskLevel === 'High' ? 'error' : 'warning'
        });
      }

      return { riskEvent, recoveryCase };
    } catch (error) {
      console.error('revenueRiskService.processTransactionRisk error:', error.message);
      return null;
    }
  },

  getSummary: async (merchantId = null) => {
    try {
      const whereFilter = merchantId ? { merchantId } : {};

      // 1. Calculate Revenue at Risk (sum of OPEN & MONITORING risk events)
      const riskSum = await prisma.revenueRiskEvent.aggregate({
        _sum: { amountAtRisk: true },
        where: {
          ...whereFilter,
          status: { in: ['OPEN', 'MONITORING', 'ESCALATED'] }
        }
      });
      const revenueAtRisk = riskSum._sum.amountAtRisk !== null ? riskSum._sum.amountAtRisk / 100 : null;

      // 2. Calculate Recovered Revenue (sum of RESOLVED risk events)
      const recoveredSum = await prisma.revenueRiskEvent.aggregate({
        _sum: { amountAtRisk: true },
        where: {
          ...whereFilter,
          status: 'RESOLVED'
        }
      });
      const recoveredRevenue = recoveredSum._sum.amountAtRisk !== null ? recoveredSum._sum.amountAtRisk / 100 : null;

      // 3. Count Active Cases
      const activeCasesCount = await prisma.recoveryCase.count({
        where: {
          status: { in: ['OPEN', 'MONITORING', 'ESCALATED'] }
        }
      });

      // 4. Case Breakdowns
      const pendingCasesCount = await prisma.recoveryCase.count({
        where: { status: 'OPEN' }
      });

      const escalatedCasesCount = await prisma.recoveryCase.count({
        where: { status: 'ESCALATED' }
      });

      // 5. Recovery Rate Calculation
      let recoveryRate = null;
      const atRiskVal = revenueAtRisk || 0;
      const recoveredVal = recoveredRevenue || 0;
      const total = atRiskVal + recoveredVal;
      if (total > 0) {
        recoveryRate = parseFloat(((recoveredVal / total) * 100).toFixed(1));
      }

      return {
        revenueAtRisk,
        recoveredRevenue,
        activeCases: activeCasesCount,
        recoveryRate,
        pendingCases: pendingCasesCount,
        escalatedCases: escalatedCasesCount
      };
    } catch (error) {
      console.error('revenueRiskService.getSummary error:', error.message);
      return {
        revenueAtRisk: null,
        recoveredRevenue: null,
        activeCases: 0,
        recoveryRate: null,
        pendingCases: 0,
        escalatedCases: 0
      };
    }
  }
};
