import { prisma } from '../config/db.js';
import { razorpayService } from '../services/razorpay.service.js';

export const healthController = {
  getHealth: async (req, res) => {
    let dbStatus = 'disconnected';
    try {
      await prisma.user.findFirst();
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'disconnected';
    }

    const rzpStatus = razorpayService.isConfigured() ? 'configured' : 'not_configured';

    return res.json({
      success: true,
      backend: 'connected',
      database: dbStatus,
      razorpay: rzpStatus,
      environment: 'test',
      timestamp: new Date().toISOString()
    });
  },

  testRazorpayConnection: async (req, res) => {
    try {
      if (!razorpayService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NOT_CONFIGURED',
            message: 'Razorpay TEST credentials not configured in environment.'
          }
        });
      }

      // Safe test ping using payments.all with count=1
      const pingResult = await razorpayService.fetchPayments({ count: 1 });

      return res.json({
        success: true,
        provider: 'razorpay',
        mode: 'test',
        authenticated: true,
        items_count: pingResult?.items?.length || 0
      });
    } catch (error) {
      console.error('Razorpay test connection failure:', error.message);
      return res.status(502).json({
        success: false,
        provider: 'razorpay',
        mode: 'test',
        authenticated: false,
        error: {
          code: 'AUTH_FAILED',
          message: error.message || 'Razorpay authentication failed.'
        }
      });
    }
  }
};
