import { prisma } from '../config/db.js';
import { aiService } from '../services/ai.service.js';
import { recoverySimulatorService } from '../services/recoverySimulator.service.js';

export const recoveryController = {
  // 1. List Recovery Cases
  getCases: async (req, res) => {
    try {
      const { status, priority } = req.query;
      const where = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const cases = await prisma.recoveryCase.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          transaction: {
            include: { customer: true }
          },
          riskEvent: true,
          aiDecisions: { orderBy: { createdAt: 'desc' }, take: 1 },
          recoveryActions: { orderBy: { createdAt: 'desc' } }
        }
      });

      return res.json({
        success: true,
        data: cases
      });
    } catch (error) {
      console.error('recoveryController.getCases error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve recovery cases.' }
      });
    }
  },

  // 2. Get Single Case Details
  getCaseById: async (req, res) => {
    try {
      const { id } = req.params;
      const recoveryCase = await prisma.recoveryCase.findUnique({
        where: { id },
        include: {
          transaction: { include: { customer: true } },
          riskEvent: true,
          aiDecisions: { orderBy: { createdAt: 'desc' } },
          recoveryActions: { orderBy: { createdAt: 'desc' } }
        }
      });

      if (!recoveryCase) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Recovery case ${id} not found.` }
        });
      }

      return res.json({
        success: true,
        data: recoveryCase
      });
    } catch (error) {
      console.error('recoveryController.getCaseById error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch recovery case.' }
      });
    }
  },

  // 3. Analyze Case (OpenAI + Rules Engine Fallback)
  analyzeCase: async (req, res) => {
    try {
      const { id } = req.params;
      const recoveryCase = await prisma.recoveryCase.findUnique({
        where: { id },
        include: { transaction: true, riskEvent: true }
      });

      if (!recoveryCase) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Recovery case ${id} not found.` }
        });
      }

      await prisma.auditLog.create({
        data: {
          merchantId: recoveryCase.transaction.merchantId || 'SYSTEM',
          transactionId: recoveryCase.transactionId,
          recoveryCaseId: recoveryCase.id,
          eventType: 'AI_ANALYSIS_STARTED',
          actor: 'AI',
          description: `AI revenue recovery analysis started for case ${recoveryCase.id}.`
        }
      });

      const result = await aiService.analyzeRevenueRisk(recoveryCase.transaction, recoveryCase.id);

      return res.json({
        success: true,
        data: result.data,
        decisionSource: result.decisionSource,
        latencyMs: result.latencyMs
      });
    } catch (error) {
      console.error('recoveryController.analyzeCase error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'ANALYSIS_ERROR', message: 'Failed to complete AI case analysis.' }
      });
    }
  },

  // 4. Simulate Recovery Action
  simulateAction: async (req, res) => {
    try {
      const { id } = req.params;
      const { actionType } = req.body;

      const result = await recoverySimulatorService.simulateRecovery(id, actionType);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'GUARDRAIL_BLOCKED', message: result.reason }
        });
      }

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('recoveryController.simulateAction error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'SIMULATION_ERROR', message: error.message }
      });
    }
  },

  // 5. Escalate Case to Human Queue
  escalateCase: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedCase = await prisma.recoveryCase.update({
        where: { id },
        data: { status: 'ESCALATED', priority: 'High' }
      });

      await prisma.auditLog.create({
        data: {
          merchantId: 'SYSTEM',
          recoveryCaseId: id,
          eventType: 'RECOVERY_ESCALATED',
          actor: 'MERCHANT',
          description: `Recovery case ${id} escalated for human compliance review.`
        }
      });

      return res.json({ success: true, data: updatedCase });
    } catch (error) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  },

  // 6. Stop Case Recovery
  stopCase: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedCase = await prisma.recoveryCase.update({
        where: { id },
        data: { status: 'STOPPED' }
      });

      await prisma.auditLog.create({
        data: {
          merchantId: 'SYSTEM',
          recoveryCaseId: id,
          eventType: 'RECOVERY_STOPPED',
          actor: 'MERCHANT',
          description: `Recovery case ${id} permanently halted.`
        }
      });

      return res.json({ success: true, data: updatedCase });
    } catch (error) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
};
