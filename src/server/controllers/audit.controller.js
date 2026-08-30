import { prisma } from '../config/db.js';

const mapAuditLog = (log) => {
  let meta = {};
  try {
    if (log.metadata) {
      meta = JSON.parse(log.metadata);
    }
  } catch (e) {
    // safe fallback
  }

  // Format date to local time string, e.g. "10:34 AM"
  const dateObj = new Date(log.createdAt);
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return {
    timestamp: timeStr,
    transaction: log.transactionId || 'SYSTEM',
    decision: meta.decision || (log.eventType === 'RISK_DETECTED' ? 'VERIFY_SETTLEMENT' : 'AUTO_RESOLVE'),
    reason: log.description,
    guardrail: meta.guardrail || 'PASSED',
    action: meta.action || (log.eventType === 'RISK_DETECTED' ? 'Guardrail Check' : 'Reconciliation'),
    outcome: meta.outcome || (log.eventType === 'RISK_DETECTED' ? 'Monitoring' : 'Processed'),
    amount: meta.amount || '₹0'
  };
};

export const auditController = {
  getAuditLogs: async (req, res) => {
    try {
      const { transactionId, eventType } = req.query;

      const filters = {};
      if (transactionId) {
        filters.transactionId = { contains: transactionId, mode: 'insensitive' };
      }
      if (eventType) {
        filters.eventType = eventType;
      }

      const logs = await prisma.auditLog.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' }
      });

      return res.json(logs.map(mapAuditLog));
    } catch (error) {
      console.error('auditController.getAuditLogs error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch system audit logs.' }
      });
    }
  }
};
