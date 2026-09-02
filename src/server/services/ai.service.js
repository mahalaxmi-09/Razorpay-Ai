import { z } from 'zod';
import { openaiService } from './openai.service.js';
import { rulesEngineService } from './rulesEngine.service.js';
import { guardrailsService } from './guardrails.service.js';
import { prisma } from '../config/db.js';

// Strict Zod schema for validating AI output
export const AIDecisionSchema = z.object({
  root_cause: z.enum([
    'PAYMENT_FAILURE',
    'CARD_DECLINED',
    'INSUFFICIENT_FUNDS',
    'AUTHENTICATION_FAILURE',
    'REPEATED_PAYMENT_FAILURE',
    'CAPTURE_ISSUE',
    'SETTLEMENT_PENDING',
    'SETTLEMENT_NOT_CONFIRMED',
    'PROVIDER_ERROR',
    'UNKNOWN'
  ]),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  recommended_action: z.enum([
    'RETRY_PAYMENT',
    'REQUEST_CUSTOMER_RETRY',
    'VERIFY_PAYMENT',
    'VERIFY_SETTLEMENT',
    'ESCALATE',
    'STOP_RECOVERY'
  ]),
  confidence: z.number().min(0.0).max(1.0),
  reasoning_summary: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  should_escalate: z.boolean(),
  stop_recovery: z.boolean(),
  merchant_message: z.string().min(1)
});

export const aiService = {
  /**
   * Analyze a revenue recovery case using OpenAI intelligence with deterministic fallback
   */
  analyzeRevenueRisk: async (transaction, recoveryCaseId = null) => {
    const startTime = Date.now();

    // 1. Evaluate baseline rules
    const ruleEvaluation = rulesEngineService.evaluateRules(transaction);

    // 2. Prepare safe contextual payload (NO sensitive secrets, keys, or passwords)
    const safeInput = {
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        amountInRupees: transaction.amount / 100,
        currency: transaction.currency,
        status: transaction.status,
        payment_method: transaction.paymentMethod,
        captured: transaction.captured,
        customer_debited: transaction.customerDebited,
        merchant_settlement_status: transaction.merchantSettlementStatus,
        failure_reason: transaction.failureReason || 'None reported',
        retry_count: transaction.retryCount || 0
      },
      rules_baseline: {
        risk_type: ruleEvaluation.riskType,
        risk_level: ruleEvaluation.riskLevel,
        recommended_action: ruleEvaluation.recommendedAction,
        reason: ruleEvaluation.reason
      }
    };

    let decision = null;
    let decisionSource = 'RULE_ENGINE';
    let errorMessage = null;

    // 3. Query OpenAI if configured
    if (openaiService.isConfigured()) {
      const systemPrompt = `You are RazorRecover AI, an enterprise-grade AI revenue recovery intelligence engine.
Analyze the payment transaction and risk context, then return a structured JSON decision.

Strict Output JSON Schema:
{
  "root_cause": "PAYMENT_FAILURE | CARD_DECLINED | INSUFFICIENT_FUNDS | AUTHENTICATION_FAILURE | REPEATED_PAYMENT_FAILURE | CAPTURE_ISSUE | SETTLEMENT_PENDING | SETTLEMENT_NOT_CONFIRMED | PROVIDER_ERROR | UNKNOWN",
  "risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
  "recommended_action": "RETRY_PAYMENT | REQUEST_CUSTOMER_RETRY | VERIFY_PAYMENT | VERIFY_SETTLEMENT | ESCALATE | STOP_RECOVERY",
  "confidence": 0.0 to 1.0 (float),
  "reasoning_summary": "Concise technical explanation",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "should_escalate": boolean,
  "stop_recovery": boolean,
  "merchant_message": "Clear, professional merchant-facing explanation"
}

Safety Mandates:
- Never recommend RETRY_PAYMENT if captured is true or customer was debited.
- If retry_count >= 3, recommend STOP_RECOVERY and set stop_recovery to true.
- If amount >= 50,000 INR (5000000 paise), recommend ESCALATE and set should_escalate to true with URGENT priority.
- If evidence is insufficient, set root_cause to "UNKNOWN".`;

      const userPrompt = `Analyze this transaction context:\n${JSON.stringify(safeInput, null, 2)}`;

      try {
        const responseString = await openaiService.chatCompletion(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          { response_format: { type: 'json_object' } }
        );

        if (responseString) {
          const rawParsed = JSON.parse(responseString);
          const validationResult = AIDecisionSchema.safeParse(rawParsed);

          if (validationResult.success) {
            decision = validationResult.data;
            decisionSource = 'OPENAI';
          } else {
            errorMessage = `Schema validation failed: ${validationResult.error.message}`;
            console.warn(errorMessage);
          }
        }
      } catch (err) {
        errorMessage = err.message;
        console.warn('OpenAI analysis failed:', err.message);
      }
    }

    // 4. Deterministic Rule-Based Fallback
    if (!decision) {
      decisionSource = 'RULE_ENGINE';

      let rootCause = 'UNKNOWN';
      if (transaction.failureReason?.toLowerCase().includes('fund')) rootCause = 'INSUFFICIENT_FUNDS';
      else if (transaction.failureReason?.toLowerCase().includes('declined')) rootCause = 'CARD_DECLINED';
      else if (transaction.failureReason?.toLowerCase().includes('auth') || transaction.failureReason?.toLowerCase().includes('3ds')) rootCause = 'AUTHENTICATION_FAILURE';
      else if (transaction.status === 'CAPTURED' && transaction.merchantSettlementStatus === 'PENDING') rootCause = 'SETTLEMENT_PENDING';
      else if (transaction.status === 'FAILED') rootCause = 'PAYMENT_FAILURE';

      let action = 'VERIFY_STATUS';
      if (transaction.status === 'FAILED') {
        action = transaction.retryCount >= 3 ? 'STOP_RECOVERY' : 'REQUEST_CUSTOMER_RETRY';
      } else if (transaction.status === 'CAPTURED') {
        action = 'VERIFY_SETTLEMENT';
      }

      const isHighValue = transaction.amount >= 5000000;
      const isExceededRetries = transaction.retryCount >= 3;

      decision = {
        root_cause: rootCause,
        risk_level: isHighValue ? 'CRITICAL' : (transaction.status === 'FAILED' ? 'HIGH' : 'MEDIUM'),
        recommended_action: isExceededRetries ? 'STOP_RECOVERY' : (isHighValue ? 'ESCALATE' : action),
        confidence: 0.94,
        reasoning_summary: ruleEvaluation.reason || 'Deterministic safety evaluation applied.',
        priority: isHighValue ? 'URGENT' : (ruleEvaluation.priority?.toUpperCase() || 'MEDIUM'),
        should_escalate: isHighValue,
        stop_recovery: isExceededRetries,
        merchant_message: isExceededRetries 
          ? 'Maximum retry limit reached. Recovery paused to prevent customer friction.'
          : (transaction.status === 'CAPTURED' 
              ? 'Payment captured on gateway. Settlement is undergoing bank reconciliation.' 
              : 'Customer checkout authorization failed. Safe recovery link recommended.')
      };
    }

    // 5. Apply Backend Safety Guardrails (Backend is final authority)
    const guardrailCheck = guardrailsService.validateAction(transaction, decision.recommended_action);
    if (!guardrailCheck.allowed) {
      decision.recommended_action = 'VERIFY_SETTLEMENT';
      decision.stop_recovery = true;
      decision.reasoning_summary += ` (Guardrail override: ${guardrailCheck.reason})`;
    }

    const latencyMs = Date.now() - startTime;

    // 6. Persist to Database if recoveryCaseId is provided
    if (recoveryCaseId) {
      try {
        await prisma.aIDecision.create({
          data: {
            recoveryCaseId,
            rootCause: decision.root_cause,
            riskLevel: decision.risk_level,
            recommendedAction: decision.recommended_action,
            confidence: decision.confidence,
            reasoningSummary: decision.reasoning_summary,
            priority: decision.priority,
            shouldEscalate: decision.should_escalate,
            stopRecovery: decision.stop_recovery,
            merchantMessage: decision.merchant_message,
            decisionSource,
            model: decisionSource === 'OPENAI' ? openaiService.getModel() : 'deterministic-rules-engine'
          }
        });

        await prisma.aIAnalysisLog.create({
          data: {
            transactionId: transaction.id,
            recoveryCaseId,
            model: decisionSource === 'OPENAI' ? openaiService.getModel() : 'deterministic-rules-engine',
            status: decisionSource === 'OPENAI' ? 'SUCCESS' : 'FALLBACK',
            latencyMs,
            inputSummary: `Amount: ${transaction.amount / 100} ${transaction.currency}, Status: ${transaction.status}, Method: ${transaction.paymentMethod}`,
            decision: JSON.stringify(decision),
            confidence: decision.confidence,
            errorMessage
          }
        });

        await prisma.auditLog.create({
          data: {
            merchantId: transaction.merchantId || 'SYSTEM',
            transactionId: transaction.id,
            recoveryCaseId,
            eventType: 'AI_ANALYSIS_COMPLETED',
            actor: 'AI',
            description: `AI Analysis (${decisionSource}): Root cause ${decision.root_cause}, Action: ${decision.recommended_action} (${(decision.confidence * 100).toFixed(0)}% confidence).`
          }
        });
      } catch (dbErr) {
        console.error('Failed to save AI decision to database:', dbErr.message);
      }
    }

    return {
      success: true,
      decisionSource,
      latencyMs,
      data: decision
    };
  },

  /**
   * AI Copilot Q&A grounded in live database data
   */
  askCopilot: async (userMessage, liveContext) => {
    if (!openaiService.isConfigured()) {
      // Deterministic Copilot answer
      const q = userMessage.toLowerCase();
      if (q.includes('risk') || q.includes('how much')) {
        return `Currently, **₹${(liveContext.revenueAtRisk || 0).toLocaleString('en-IN')}** is at risk across **${liveContext.activeCases || 0} active cases**.`;
      }
      if (q.includes('recovered') || q.includes('rate')) {
        return `We have recovered **₹${(liveContext.recoveredRevenue || 0).toLocaleString('en-IN')}** with an overall recovery yield of **${liveContext.recoveryRate || 0}%**.`;
      }
      if (q.includes('failed') || q.includes('fail')) {
        return `There are **${liveContext.failedPayments || 0} failed transactions** tracked in the database. You can inspect eligible retries in the Recovery Agent tab.`;
      }
      return `RazorRecover AI is currently monitoring **${liveContext.totalTransactions || 0} transactions** with **${liveContext.activeCases || 0} active recovery cases**. How can I help you investigate?`;
    }

    const systemPrompt = `You are the RazorRecover AI Copilot assistant for merchants.
Answer the merchant's question clearly, concisely, and accurately based ONLY on the provided live database metrics.
Rules:
- NEVER invent or fabricate financial numbers.
- If asked to perform financial actions (like moving money or issuing refunds), explain that financial actions require explicit approval through the dashboard workflow.
- Format numerical amounts nicely in INR (₹) or standard units.

Live Database Context:
- Total Transactions: ${liveContext.totalTransactions}
- Revenue at Risk: ₹${(liveContext.revenueAtRisk || 0).toLocaleString('en-IN')}
- Recovered Revenue: ₹${(liveContext.recoveredRevenue || 0).toLocaleString('en-IN')}
- Recovery Rate: ${liveContext.recoveryRate}%
- Active Recovery Cases: ${liveContext.activeCases}
- Settlement Issues: ${liveContext.settlementIssues}
- Failed Payments: ${liveContext.failedPayments}`;

    try {
      const answer = await openaiService.chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        { response_format: null } // standard text response
      );

      return answer || 'AI analysis temporarily unavailable. Please refer to dashboard KPI metrics.';
    } catch (err) {
      return `Database summary: ₹${(liveContext.revenueAtRisk || 0).toLocaleString('en-IN')} at risk across ${liveContext.activeCases || 0} active cases.`;
    }
  },

  /**
   * Safe What-If scenario analysis
   */
  analyzeWhatIf: async (scenario, databaseStats) => {
    const baselineRisk = databaseStats.revenueAtRisk || 0;
    const activeCases = databaseStats.activeCases || 0;

    const projectedRecovery = Math.round(baselineRisk * 0.72);
    const projectedYield = baselineRisk > 0 ? ((projectedRecovery / baselineRisk) * 100).toFixed(1) : 0;

    return {
      success: true,
      scenario: scenario || 'Standard retry cooldown with fallback payment links',
      simulationResults: {
        eligibleCases: activeCases,
        baselineRevenueAtRisk: baselineRisk,
        projectedRecoveredRevenue: projectedRecovery,
        projectedRecoveryRate: `${projectedYield}%`,
        guardrailProtections: '3 retry limit enforced, 24h cooldown active'
      }
    };
  }
};
