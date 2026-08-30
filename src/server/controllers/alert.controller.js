import { prisma } from '../config/db.js';

export const alertController = {
  getAlerts: async (req, res) => {
    try {
      const alerts = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.json(alerts);
    } catch (error) {
      console.error('alertController.getAlerts error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve notifications.' }
      });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;

      const alert = await prisma.notification.update({
        where: { id },
        data: { read: true }
      });

      return res.json({ success: true, alert });
    } catch (error) {
      console.error('alertController.markAsRead error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to mark notification as read.' }
      });
    }
  }
};
