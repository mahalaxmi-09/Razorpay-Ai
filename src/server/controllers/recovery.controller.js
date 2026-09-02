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

  // 3. Analyze Case (Rules Engine + Optional OpenAI)
  analyzeCase: async (req, res) => {
    try {
      const { id } = req.params;
      const recoveryCase = await prisma.recoveryCase.findUnique({
        where: { id },
        include: { transaction: true }
      });

      if (!recoveryCase) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Recovery case ${id} not found.` }
        });
      }

      const decision = await aiService.analyzeRevenueRisk(recoveryCase.transaction, recoveryCase.id);

      return res.json({
        success: true,
        data: decision
      });
    } catch (error) {
      console.error('recoveryController.analyzeCase error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'ANALYSIS_ERROR', message: 'Failed to complete AI case analysis.' }
      });
    }
  },

  // 4. Simulate Action
  simulateAction: async (req, res) => {
    try {
      const { id } = req.params;
      const { actionType } = req.body;

      if (!actionType) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'actionType is required.' }
        });
      }

      const result = await recoverySimulatorService.simulateAction(id, actionType);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('recoveryController.simulateAction error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'SIMULATION_ERROR', message: error.message || 'Simulation execution failed.' }
      });
    }
  },

  // 5. Escalate Case
  escalateCase: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await recoverySimulatorService.simulateAction(id, 'ESCALATE_TO_HUMAN');
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('recoveryController.escalateCase error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'ESCALATION_ERROR', message: 'Failed to escalate case.' }
      });
    }
  },

  // 6. Stop Recovery
  stopCase: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await recoverySimulatorService.simulateAction(id, 'STOP_RECOVERY');
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('recoveryController.stopCase error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'STOP_ERROR', message: 'Failed to stop recovery.' }
      });
    }
  }
};
