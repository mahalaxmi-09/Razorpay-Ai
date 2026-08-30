import { prisma } from '../config/db.js';

export const revenueRiskService = {
  getSummary: async (merchantId) => {
    try {
      // 1. Calculate Revenue at Risk (sum of amountAtRisk for OPEN events)
      const riskSum = await prisma.revenueRiskEvent.aggregate({
        _sum: {
          amountAtRisk: true
        },
        where: {
          status: 'OPEN'
        }
      });
      const revenueAtRisk = riskSum._sum.amountAtRisk !== null ? riskSum._sum.amountAtRisk : null;

      // 2. Calculate Recovered Revenue (sum of amountAtRisk for RESOLVED events)
      const recoveredSum = await prisma.revenueRiskEvent.aggregate({
        _sum: {
          amountAtRisk: true
        },
        where: {
          status: 'RESOLVED'
        }
      });
      const recoveredRevenue = recoveredSum._sum.amountAtRisk !== null ? recoveredSum._sum.amountAtRisk : null;

      // 3. Count Active Cases (OPEN, MONITORING, or ESCALATED)
      const activeCasesCount = await prisma.recoveryCase.count({
        where: {
          status: {
            in: ['OPEN', 'MONITORING', 'ESCALATED']
          }
        }
      });

      // 4. Counts for Dashboard status items
      const pendingCasesCount = await prisma.recoveryCase.count({
        where: {
          status: 'OPEN'
        }
      });

      const escalatedCasesCount = await prisma.recoveryCase.count({
        where: {
          status: 'ESCALATED'
        }
      });

      // 5. Calculate Recovery Rate: Recovered / (Recovered + At Risk) * 100
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
      throw error;
    }
  }
};
