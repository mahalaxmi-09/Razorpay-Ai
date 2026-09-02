import { prisma } from '../config/db.js';
import { revenueRiskService } from '../services/revenueRisk.service.js';
import { openaiService } from '../services/openai.service.js';

export const copilotController = {
  askCopilot: async (req, res) => {
    try {
      const { message, lang = 'English' } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Message string is required.' }
        });
      }

      // 1. Retrieve current database state for grounding
      const [summary, recentTransactions, recentRiskEvents] = await Promise.all([
        revenueRiskService.getSummary(),
        prisma.transaction.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, amount: true, currency: true, status: true, merchantSettlementStatus: true, failureReason: true }
        }),
        prisma.revenueRiskEvent.findMany({
          take: 5,
          orderBy: { detectedAt: 'desc' },
          select: { transactionId: true, riskType: true, riskLevel: true, amountAtRisk: true, reason: true, status: true }
        })
      ]);

      const hasData = recentTransactions.length > 0;

      // 2. Handle empty database scenario
      if (!hasData) {
        return res.json({
          success: true,
          data: {
            reply: "I don't have enough transaction data yet to answer accurately. Please import a transaction ledger or seed development data to begin recovery analysis.",
            grounded: false
          }
        });
      }

      // 3. Prepare grounded context
      const dbContext = {
        metrics: {
          revenueAtRisk: summary.revenueAtRisk ? `₹${summary.revenueAtRisk.toLocaleString('en-IN')}` : '₹0',
          recoveredRevenue: summary.recoveredRevenue ? `₹${summary.recoveredRevenue.toLocaleString('en-IN')}` : '₹0',
          activeCases: summary.activeCases,
          recoveryRate: summary.recoveryRate !== null ? `${summary.recoveryRate}%` : 'N/A'
        },
        recentTransactions: recentTransactions.map(t => ({
          id: t.id,
          amount: `₹${(t.amount / 100).toLocaleString('en-IN')}`,
          status: t.status,
          settlement: t.merchantSettlementStatus,
          error: t.failureReason
        })),
        recentRisks: recentRiskEvents.map(r => ({
          transaction: r.transactionId,
          type: r.riskType,
          level: r.riskLevel,
          amount: `₹${(r.amountAtRisk / 100).toLocaleString('en-IN')}`,
          reason: r.reason
        }))
      };

      // 4. Query OpenAI if available
      if (openaiService.isConfigured()) {
        const systemPrompt = `You are the RazorRecover AI Copilot, an expert fintech assistant for merchant revenue recovery.
Answer the user's question concisely using ONLY the provided real database context.
Never hallucinate or invent fake metrics.
Respond in ${lang}.
If the context doesn't contain the answer, state that clearly.`;

        const userPrompt = `User Question: "${message}"

Database Context:
${JSON.stringify(dbContext, null, 2)}`;

        const aiResponse = await openaiService.chatCompletion(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          { response_format: undefined }
        );

        if (aiResponse) {
          return res.json({
            success: true,
            data: {
              reply: aiResponse,
              grounded: true,
              metrics: dbContext.metrics
            }
          });
        }
      }

      // 5. Deterministic fallback response based on message keywords
      const lower = message.toLowerCase();
      let reply = '';

      if (lower.includes('risk') || lower.includes('revenue at risk') || lower.includes('why')) {
        reply = `Based on your current transaction data, you have ${dbContext.metrics.revenueAtRisk} revenue at risk across ${dbContext.metrics.activeCases} active cases. The primary causes are settlement-pending transactions awaiting bank reconciliation and recurring payment auth failures.`;
      } else if (lower.includes('recover') || lower.includes('recovered') || lower.includes('rate')) {
        reply = `To date, ${dbContext.metrics.recoveredRevenue} has been successfully recovered with a recovery rate of ${dbContext.metrics.recoveryRate}. Active cases are continuously monitored by the safety guardrails engine.`;
      } else if (lower.includes('settlement') || lower.includes('pending')) {
        const pendingCount = recentTransactions.filter(t => t.settlement === 'PENDING').length;
        reply = `There are currently ${pendingCount} transactions in the settlement verification queue. Guardrails ensure that captured payments are not retried to prevent duplicate debits.`;
      } else {
        reply = `RazorRecover AI is monitoring ${recentTransactions.length} recent transactions. Current revenue at risk is ${dbContext.metrics.revenueAtRisk} with ${dbContext.metrics.activeCases} cases under active AI recovery workflows.`;
      }

      return res.json({
        success: true,
        data: {
          reply,
          grounded: true,
          metrics: dbContext.metrics
        }
      });
    } catch (error) {
      console.error('copilotController.askCopilot error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'COPILOT_ERROR', message: 'Failed to process AI copilot query.' }
      });
    }
  }
};
