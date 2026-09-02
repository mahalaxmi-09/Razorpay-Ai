import { openaiService } from './openai.service.js';
import { rulesEngineService } from './rulesEngine.service.js';
import { prisma } from '../config/db.js';

/**
 * AI Advisory & Revenue Risk Intelligence Service
 * 
 * Provides structured risk assessments and recommended actions.
 * Integrates with OpenAI when configured, or executes deterministic rule-based analysis.
 */

export const aiService = {
  analyzeRevenueRisk: async (transaction, recoveryCaseId = null) => {
    // 1. Run deterministic baseline rules
    const ruleEvaluation = rulesEngineService.evaluateRules(transaction);

    // 2. Prepare transaction context (never send sensitive credentials)
    const context = {
      transactionId: transaction.id,
      amount: transaction.amount,
      amountInINR: transaction.amount / 100,
      currency: transaction.currency,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      customerDebited: transaction.customerDebited,
      merchantSettlementStatus: transaction.merchantSettlementStatus,
      failureReason: transaction.failureReason,
      retryCount: transaction.retryCount
    };

    let aiResult = null;

    if (openaiService.isConfigured()) {
      const systemPrompt = `You are RazorRecover AI, an enterprise-grade revenue recovery intelligence engine.
Analyze the following payment/transaction data and produce a structured JSON object with recovery advice.
Return ONLY valid JSON with this exact structure:
{
  "issue": "concise description of friction point",
  "riskLevel": "High" | "Medium" | "Low",
  "confidence": 0.0 to 1.0 (float),
  "recommendedAction": "VERIFY_STATUS" | "RETRY_ELIGIBLE_PAYMENT" | "SEND_REMINDER" | "SCHEDULE_RETRY" | "ESCALATE_TO_HUMAN" | "STOP_RECOVERY",
  "reason": "Technical reason for recommendation",
  "merchantExplanation": "Clear merchant-friendly explanation"
}

Safety Rules:
- If payment is CAPTURED or customer was debited, NEVER recommend RETRY_ELIGIBLE_PAYMENT.
- If retryCount >= 3, recommend STOP_RECOVERY or ESCALATE_TO_HUMAN.
- If amount >= 5000000 (50,000 INR), recommend ESCALATE_TO_HUMAN.`;

      const userPrompt = `Transaction Data Context:
${JSON.stringify(context, null, 2)}`;

      const responseString = await openaiService.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      if (responseString) {
        try {
          const parsed = JSON.parse(responseString);
          if (parsed.issue && parsed.recommendedAction && typeof parsed.confidence === 'number') {
            aiResult = {
              ...parsed,
              model: openaiService.getModel(),
              source: 'OPENAI'
            };
          }
        } catch (e) {
          console.warn('AI JSON parsing failed, falling back to rule engine:', e.message);
        }
      }
    }

    // 3. Fallback to Rule-based Structured Output if AI is unavailable or failed
    if (!aiResult) {
      aiResult = {
        issue: ruleEvaluation.reason || 'Transaction friction requiring verification',
        riskLevel: ruleEvaluation.riskLevel,
        confidence: 0.94,
        recommendedAction: ruleEvaluation.recommendedAction,
        reason: ruleEvaluation.reason,
        merchantExplanation: 'AI analysis unavailable — using rule-based analysis.',
        model: 'Deterministic-Rules-Engine-v2',
        source: 'RULE_ENGINE'
      };
    }

    // 4. Record to Database if recoveryCaseId is provided
    if (recoveryCaseId) {
      try {
        await prisma.aIDecision.create({
          data: {
            recoveryCaseId,
            issue: aiResult.issue,
            riskLevel: aiResult.riskLevel,
            confidence: aiResult.confidence,
            recommendedAction: aiResult.recommendedAction,
            reason: aiResult.reason
          }
        });

        await prisma.aIAnalysisLog.create({
          data: {
            transactionId: transaction.id,
            recoveryCaseId,
            model: aiResult.model,
            inputReference: JSON.stringify(context),
            decision: JSON.stringify(aiResult),
            confidence: aiResult.confidence
          }
        });
      } catch (err) {
        console.error('Failed to log AI decision in database:', err.message);
      }
    }

    return aiResult;
  }
};
