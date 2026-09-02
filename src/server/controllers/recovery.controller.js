import { prisma } from '../config/db.js';
import { aiService } from '../services/ai.service.js';
import { recoveryExecutionService } from '../services/recoveryExecution.service.js';
import { recoveryStateMachineService } from '../services/recoveryStateMachine.service.js';

/**
 * Recovery Controller (Phase 6 Autonomous Recovery Agent)
 */

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
          recoveryActions: { orderBy: { createdAt: 'desc' } },
          auditLogs: { orderBy: { createdAt: 'desc' } }
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

  // 3. Analyze Case (AI Decision + Structured Validation)
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

      // Transition to ANALYZING state
      if (recoveryCase.status === 'OPEN') {
        await recoveryStateMachineService.transitionCase(id, 'ANALYZING', {
          actor: 'AI',
          reason: 'AI revenue recovery analysis started.'
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

      // Transition to ACTION_RECOMMENDED or AWAITING_APPROVAL based on decision
      const aiDecision = result.data;
      let nextStatus = 'ACTION_RECOMMENDED';
      if (aiDecision.should_escalate) nextStatus = 'ESCALATED';
      else if (aiDecision.stop_recovery) nextStatus = 'STOPPED';

      await recoveryStateMachineService.transitionCase(id, nextStatus, {
        actor: 'AI',
        reason: `AI Recommended: ${aiDecision.recommended_action} (Confidence: ${(aiDecision.confidence * 100).toFixed(0)}%)`,
        actionType: aiDecision.recommended_action
      });

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

  // 4. Approve Case (Merchant/Admin approval)
  approveCase: async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy, reason } = req.body;

      const result = await recoveryExecutionService.approveCase(id, approvedBy || 'MERCHANT', reason);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('recoveryController.approveCase error:', error.message);
      return res.status(400).json({
        success: false,
        error: { code: 'APPROVAL_ERROR', message: error.message }
      });
    }
  },

  // 5. Reject Case (Merchant rejection -> STOPPED)
  rejectCase: async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectedBy, reason } = req.body;

      const result = await recoveryExecutionService.rejectCase(id, rejectedBy || 'MERCHANT', reason);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('recoveryController.rejectCase error:', error.message);
      return res.status(400).json({
        success: false,
        error: { code: 'REJECTION_ERROR', message: error.message }
      });
    }
  },

  // 6. Execute Recovery Action
  executeAction: async (req, res) => {
    try {
      const { id } = req.params;
      const { actionType, idempotencyKey } = req.body;

      const result = await recoveryExecutionService.executeCaseRecovery({
        recoveryCaseId: id,
        actionType,
        actor: 'MERCHANT',
        idempotencyKey
      });

      return res.json({
        success: result.success,
        data: result
      });
    } catch (error) {
      console.error('recoveryController.executeAction error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'EXECUTION_ERROR', message: error.message }
      });
    }
  },

  // 7. Verify Recovery Outcome
  verifyCase: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await recoveryExecutionService.executeCaseRecovery({
        recoveryCaseId: id,
        actionType: 'VERIFY_PAYMENT',
        actor: 'SYSTEM'
      });

      return res.json({
        success: result.success,
        data: result
      });
    } catch (error) {
      console.error('recoveryController.verifyCase error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'VERIFICATION_ERROR', message: error.message }
      });
    }
  },

  // 8. Escalate Case to Human Queue
  escalateCase: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await recoveryStateMachineService.transitionCase(id, 'ESCALATED', {
        actor: 'MERCHANT',
        reason: reason || 'Case escalated for merchant compliance review.'
      });

      return res.json({ success: true, data: result.updatedCase });
    } catch (error) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  },

  // 9. Stop Case Recovery
  stopCase: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await recoveryStateMachineService.transitionCase(id, 'STOPPED', {
        actor: 'MERCHANT',
        reason: reason || 'Case permanently halted by merchant.'
      });

      return res.json({ success: true, data: result.updatedCase });
    } catch (error) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
};
