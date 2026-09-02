import { prisma } from '../config/db.js';
import { openaiService } from '../services/openai.service.js';

export const healthController = {
  getHealth: async (req, res) => {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'disconnected';
    }

    const aiStatus = openaiService.isConfigured() ? 'available' : 'unavailable';

    return res.json({
      status: 'ok',
      database: dbStatus,
      ai: aiStatus,
      timestamp: new Date().toISOString()
    });
  }
};
