import { prisma } from '../config/db.js';
import { revenueRiskService } from '../services/revenueRisk.service.js';

export const dashboardController = {
  getSummary: async (req, res) => {
    try {
      const [summary, user, merchant] = await Promise.all([
        revenueRiskService.getSummary(),
        prisma.user.findFirst(),
        prisma.merchant.findFirst()
      ]);

      const merchantName = user?.name || merchant?.name || 'Mounika';

      return res.json({
        merchantName,
        userName: user?.name || merchantName,
        totalTransactions: summary.totalTransactions,
        revenueAtRisk: summary.revenueAtRisk,
        recoveredRevenue: summary.recoveredRevenue,
        activeCases: summary.activeCases,
        activeRecoveryCases: summary.activeCases,
        recoveryRate: summary.recoveryRate,
        pendingCases: summary.pendingCases,
        escalatedCases: summary.escalatedCases,
        settlementIssues: summary.settlementIssues,
        failedPayments: summary.failedPayments
      });
    } catch (error) {
      console.error('dashboardController.getSummary error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DASHBOARD_ERROR', message: 'Failed to generate metrics summary.' }
      });
    }
  },

  getActivity: async (req, res) => {
    try {
      // 1. Fetch recent recovery actions
      const recentActions = await prisma.recoveryAction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });

      // 2. Fetch recent risk events
      const recentRiskEvents = await prisma.revenueRiskEvent.findMany({
        take: 5,
        orderBy: { detectedAt: 'desc' }
      });

      // 3. Fetch recent notifications
      const recentNotifications = await prisma.notification.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });

      // Map risk events to divide amountAtRisk by 100
      const mappedRiskEvents = recentRiskEvents.map(evt => ({
        ...evt,
        amountAtRisk: evt.amountAtRisk / 100
      }));

      // Map notifications to convert times into simple readability strings
      const mappedNotifications = recentNotifications.map(n => ({
        id: n.id,
        type: n.type === 'ACTION_REQUIRED' ? 'critical' : (n.type === 'RECOVERY_PENDING' ? 'warning' : 'success'),
        title: n.title,
        message: n.message,
        time: 'Just now',
        read: n.read
      }));

      return res.json({
        actions: recentActions,
        riskEvents: mappedRiskEvents,
        notifications: mappedNotifications
      });
    } catch (error) {
      console.error('dashboardController.getActivity error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DASHBOARD_ERROR', message: 'Failed to fetch activity records.' }
      });
    }
  }
};
