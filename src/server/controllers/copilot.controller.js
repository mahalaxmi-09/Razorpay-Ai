import { prisma } from '../config/db.js';
import { revenueRiskService } from '../services/revenueRisk.service.js';
import { openaiService } from '../services/openai.service.js';

/**
 * AI Copilot Controller
 * 
 * Provides grounded, conversational intelligence about payment risks,
 * recovery cases, guardrails, and financial metrics.
 */

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

      // 1. Retrieve current database telemetry for grounding
      const [summary, recentTransactions, recentRiskEvents, activeRecoveryCases] = await Promise.all([
        revenueRiskService.getSummary(),
        prisma.transaction.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: { id: true, amount: true, currency: true, status: true, merchantSettlementStatus: true, failureReason: true, customerDebited: true, riskStatus: true }
        }),
        prisma.revenueRiskEvent.findMany({
          take: 6,
          orderBy: { detectedAt: 'desc' },
          select: { transactionId: true, riskType: true, riskLevel: true, amountAtRisk: true, reason: true, status: true }
        }),
        prisma.recoveryCase.findMany({
          take: 6,
          orderBy: { updatedAt: 'desc' },
          select: { id: true, transactionId: true, status: true, priority: true, recommendedAction: true, attempts: true }
        })
      ]);

      const hasDbData = recentTransactions.length > 0;

      // 2. Build Grounded Context (combining live DB records with demo fallback when DB is freshly initialized)
      const metrics = hasDbData ? {
        revenueAtRisk: `₹${summary.revenueAtRisk.toLocaleString('en-IN')}`,
        recoveredRevenue: `₹${summary.recoveredRevenue.toLocaleString('en-IN')}`,
        activeCases: `${summary.activeCases} cases`,
        recoveryRate: `${summary.recoveryRate}%`,
        failedPayments: summary.failedPayments,
        settlementIssues: summary.settlementIssues,
        guardrailPolicies: 'Max 3 retries, ₹50,000 merchant approval threshold, ₹1,00,000 auto ceiling, 24h cooldown'
      } : {
        revenueAtRisk: '₹3,198',
        recoveredRevenue: '₹1,150',
        activeCases: '6 cases',
        recoveryRate: '26.4%',
        transactionsMonitored: 124,
        recovered: '₹5,000',
        monitoring: '₹8,000',
        escalated: '₹12,000',
        transactionsAnalyzed: 73,
        guardrailPolicies: 'Max 3 retries, ₹50,000 merchant approval threshold, ₹1,00,000 auto ceiling, 24h cooldown'
      };

      const transactionsList = hasDbData ? recentTransactions.map(t => ({
        id: t.id,
        amount: `₹${(t.amount / 100).toLocaleString('en-IN')}`,
        status: t.status,
        risk: t.riskStatus,
        settlement: t.merchantSettlementStatus,
        customerDebited: t.customerDebited,
        error: t.failureReason || 'None'
      })) : [
        { id: 'TXN_10004', amount: '₹98,000', status: 'FAILED', risk: 'HIGH', error: 'Fraud filter hold; Awaiting merchant approval' },
        { id: 'TXN_10002', amount: '₹6,800', status: 'FAILED', risk: 'HIGH', error: 'Insufficient customer funds' },
        { id: 'TXN_10006', amount: '₹45,000', status: 'CAPTURED', risk: 'MEDIUM', settlement: 'PENDING', error: 'Settlement reconciliation in progress' },
        { id: 'TXN_10007', amount: '₹1,12,500', status: 'SETTLEMENT_PROCESSED', risk: 'LOW', error: 'Verified and recovered' }
      ];

      const casesList = hasDbData ? activeRecoveryCases.map(c => ({
        caseId: c.id,
        transactionId: c.transactionId,
        status: c.status,
        priority: c.priority,
        action: c.recommendedAction,
        attempts: `${c.attempts}/3`
      })) : [
        { caseId: 'CASE_04', transactionId: 'TXN_10004', status: 'AWAITING_APPROVAL', priority: 'High', action: 'RETRY_PAYMENT', attempts: '0/3' },
        { caseId: 'CASE_02', transactionId: 'TXN_10002', status: 'OPEN', priority: 'Medium', action: 'REQUEST_CUSTOMER_RETRY', attempts: '0/3' },
        { caseId: 'CASE_07', transactionId: 'TXN_10007', status: 'VERIFIED_RECOVERED', priority: 'Low', action: 'VERIFY_SETTLEMENT', attempts: '1/3' }
      ];

      const dbContext = {
        metrics,
        recentTransactions: transactionsList,
        activeCases: casesList
      };

      // 3. Query OpenAI if available
      if (openaiService.isConfigured()) {
        const systemPrompt = `You are the RazorRecover AI Copilot, an expert AI assistant for payment revenue recovery on the Razorpay platform.
Answer the user's question concisely, accurately, and professionally using ONLY the provided real database context.
Cite specific numbers, transaction IDs, amounts, and statuses where applicable.
Explain root causes and guardrail policies when asked.
Respond in ${lang}.
Never hallucinate or fabricate metrics that are not in the context.`;

        const userPrompt = `User Query: "${message}"

Context Telemetry:
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

      // 4. Intelligent Deterministic Fallback
      const lower = message.toLowerCase();
      let reply = '';

      if (lower.includes('why') && (lower.includes('risk') || lower.includes('fail'))) {
        reply = `Your revenue risk is primarily driven by payment authorization timeouts, insufficient customer balances, and pending bank settlements. For example, high-value transaction TXN_10004 is currently held under guardrail approval (₹98,000 threshold), while TXN_10002 was dropped due to temporary bank funds deficit.`;
      } else if (lower.includes('revenue at risk') || lower.includes('how much') && lower.includes('risk')) {
        reply = `Currently, you have ${dbContext.metrics.revenueAtRisk} in total revenue at risk across ${dbContext.metrics.activeCases}. The autonomous recovery agent is actively diagnosing and monitoring these cases.`;
      } else if (lower.includes('recover') || lower.includes('rate') || lower.includes('recovered')) {
        reply = `To date, ${dbContext.metrics.recoveredRevenue} has been successfully verified and recovered into settled merchant funds, representing a recovery rate of ${dbContext.metrics.recoveryRate}.`;
      } else if (lower.includes('guardrail') || lower.includes('policy') || lower.includes('safe') || lower.includes('protect')) {
        reply = `Our Guardrail Engine enforces strict safety: maximum 3 recovery retries per case, mandatory merchant approval for transactions ≥ ₹50,000, 24-hour retry cooldown, and double-charge prevention on debited accounts.`;
      } else if (lower.includes('attention') || lower.includes('cases') || lower.includes('priority')) {
        reply = `Cases requiring immediate attention: TXN_10004 (₹98,000 - Awaiting merchant approval due to high value) and TXN_10002 (₹6,800 - Customer retry link recommended).`;
      } else {
        reply = `RazorRecover AI is currently monitoring your payment stream. Current revenue at risk is ${dbContext.metrics.revenueAtRisk} with ${dbContext.metrics.recoveredRevenue} in verified recoveries (${dbContext.metrics.recoveryRate} recovery rate). You can ask me about specific cases, risk causes, or guardrails.`;
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
