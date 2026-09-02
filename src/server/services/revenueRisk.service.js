import { prisma } from '../config/db.js';
import { rulesEngineService } from './rulesEngine.service.js';
import { notificationService } from './notification.service.js';

/**
 * Revenue Risk & Case Processing Service
 * 
 * Ingests transactions, detects revenue-at-risk events, and aggregates dashboard metrics.
 * The database is the single source of truth.
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

      // 1. Total Ingested Transactions
      const totalTransactions = await prisma.transaction.count({ where: whereFilter });

      // 2. Revenue at Risk (SUM of unresolved risk events: OPEN, MONITORING, ESCALATED)
      const riskSum = await prisma.revenueRiskEvent.aggregate({
        _sum: { amountAtRisk: true },
        where: {
          ...whereFilter,
          status: { in: ['OPEN', 'MONITORING', 'ESCALATED'] }
        }
      });
      const revenueAtRisk = riskSum._sum.amountAtRisk !== null ? riskSum._sum.amountAtRisk / 100 : 0;

      // 3. Recovered Revenue (SUM of verified recovered amounts from confirmed RESOLVED risk events)
      const recoveredSum = await prisma.revenueRiskEvent.aggregate({
        _sum: { amountAtRisk: true },
        where: {
          ...whereFilter,
          status: 'RESOLVED'
        }
      });
      const recoveredRevenue = recoveredSum._sum.amountAtRisk !== null ? recoveredSum._sum.amountAtRisk / 100 : 0;

      // 4. Active Cases Count (unresolved recovery cases)
      const activeCasesCount = await prisma.recoveryCase.count({
        where: {
          status: { in: ['OPEN', 'MONITORING', 'ESCALATED'] }
        }
      });

      // 5. Verified Recovered Cases Count
      const verifiedCasesCount = await prisma.recoveryCase.count({
        where: {
          status: { in: ['VERIFIED_RECOVERED', 'RECOVERED'] }
        }
      });

      // 6. Total Cases
      const totalCasesCount = await prisma.recoveryCase.count();

      // 7. Recovery Rate: (Verified Recovered Cases / Total Cases) * 100
      let recoveryRate = 0;
      if (totalCasesCount > 0) {
        recoveryRate = parseFloat(((verifiedCasesCount / totalCasesCount) * 100).toFixed(1));
      }

      // 8. Breakdown categories
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

      return {
        totalTransactions,
        revenueAtRisk,
        recoveredRevenue,
        activeCases: activeCasesCount,
        activeRecoveryCases: activeCasesCount,
        verifiedCases: verifiedCasesCount,
        totalCases: totalCasesCount,
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
        verifiedCases: 0,
        totalCases: 0,
        recoveryRate: 0,
        pendingCases: 0,
        escalatedCases: 0,
        settlementIssues: 0,
        failedPayments: 0
      };
    }
  }
};
