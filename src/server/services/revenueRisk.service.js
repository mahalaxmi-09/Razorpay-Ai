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
            eventType: 'PAYMENT_RISK_DETECTED',
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

      // 1. Total Transactions Count
      const totalTransactions = await prisma.transaction.count({ where: whereFilter });

      // 2. Calculate Revenue at Risk (sum of OPEN, MONITORING, ESCALATED risk events)
      const riskSum = await prisma.revenueRiskEvent.aggregate({
        _sum: { amountAtRisk: true },
        where: {
          ...whereFilter,
          status: { in: ['OPEN', 'MONITORING', 'ESCALATED'] }
        }
      });
      const revenueAtRisk = riskSum._sum.amountAtRisk !== null ? riskSum._sum.amountAtRisk / 100 : 0;

      // 3. Calculate Recovered Revenue (sum of RESOLVED risk events)
      const recoveredSum = await prisma.revenueRiskEvent.aggregate({
        _sum: { amountAtRisk: true },
        where: {
          ...whereFilter,
          status: 'RESOLVED'
        }
      });
      const recoveredRevenue = recoveredSum._sum.amountAtRisk !== null ? recoveredSum._sum.amountAtRisk / 100 : 0;

      // 4. Count Active Cases
      const activeCasesCount = await prisma.recoveryCase.count({
        where: {
          status: { in: ['OPEN', 'MONITORING', 'ESCALATED'] }
        }
      });

      // 5. Settlement Issues & Failed Payments Counts
      const settlementIssues = await prisma.transaction.count({
        where: {
          ...whereFilter,
          OR: [
            { merchantSettlementStatus: 'PENDING' },
            { merchantSettlementStatus: 'UNSETTLED' }
          ]
        }
      });

      const failedPayments = await prisma.transaction.count({
        where: {
          ...whereFilter,
          status: 'FAILED'
        }
      });

      const pendingCasesCount = await prisma.recoveryCase.count({
        where: { status: 'OPEN' }
      });

      const escalatedCasesCount = await prisma.recoveryCase.count({
        where: { status: 'ESCALATED' }
      });

      // 6. Recovery Rate Calculation
      let recoveryRate = 0;
      const atRiskVal = revenueAtRisk || 0;
      const recoveredVal = recoveredRevenue || 0;
      const total = atRiskVal + recoveredVal;
      if (total > 0) {
        recoveryRate = parseFloat(((recoveredVal / total) * 100).toFixed(1));
      }

      return {
        totalTransactions,
        revenueAtRisk,
        recoveredRevenue,
        activeCases: activeCasesCount,
        activeRecoveryCases: activeCasesCount,
        recoveryRate,
        pendingCases: pendingCasesCount,
        escalatedCases: escalatedCasesCount,
        settlementIssues,
        failedPayments
      };
    } catch (error) {
      console.error('revenueRiskService.getSummary error:', error.message);
      return {
        totalTransactions: 0,
        revenueAtRisk: 0,
        recoveredRevenue: 0,
        activeCases: 0,
        activeRecoveryCases: 0,
        recoveryRate: 0,
        pendingCases: 0,
        escalatedCases: 0,
        settlementIssues: 0,
        failedPayments: 0
      };
    }
  }
};
