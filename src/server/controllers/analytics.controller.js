import { prisma } from '../config/db.js';

export const analyticsController = {
  getRecoveryAnalytics: async (req, res) => {
    try {
      const riskEvents = await prisma.revenueRiskEvent.findMany({
        orderBy: { detectedAt: 'asc' }
      });

      const dateAggregates = {};

      riskEvents.forEach(event => {
        const dateStr = event.detectedAt.toISOString().split('T')[0];
        if (!dateAggregates[dateStr]) {
          dateAggregates[dateStr] = {
            date: dateStr,
            revenueAtRisk: 0,
            recoveredRevenue: 0
          };
        }
        if (['OPEN', 'MONITORING', 'ESCALATED'].includes(event.status)) {
          dateAggregates[dateStr].revenueAtRisk += event.amountAtRisk / 100;
        } else if (event.status === 'RESOLVED') {
          dateAggregates[dateStr].recoveredRevenue += event.amountAtRisk / 100;
        }
      });

      const chartData = Object.values(dateAggregates);
      return res.json(chartData);
    } catch (error) {
      console.error('analyticsController.getRecoveryAnalytics error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'ANALYTICS_ERROR', message: 'Failed to aggregate recovery statistics.' }
      });
    }
  }
};
