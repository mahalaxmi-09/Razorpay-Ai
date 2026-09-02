import dotenv from 'dotenv';
dotenv.config();

import { razorpayService } from '../services/razorpay.service.js';
import { paymentProviderService } from '../services/paymentProvider.service.js';
import { rulesEngineService } from '../services/rulesEngine.service.js';
import { guardrailsService } from '../services/guardrails.service.js';
import { settlementService } from '../services/settlement.service.js';
import { openaiService } from '../services/openai.service.js';
import { aiService, AIDecisionSchema } from '../services/ai.service.js';
import { prisma } from '../config/db.js';
import crypto from 'crypto';

async function runTests() {
  console.log('🧪 Starting RazorRecover Phase 4 (OpenAI AI Engine & Safety) Test Suite...');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${message}`);
    } else {
      failed++;
      console.error(`❌ [FAIL] ${message}`);
    }
  };

  try {
    // 1. Razorpay Service Test
    assert(razorpayService.isConfigured(), 'Razorpay TEST SDK client initialized successfully');
    
    // 2. Razorpay Payment Normalization Test
    const mockRazorpayCaptured = {
      id: 'pay_TEST1234567890',
      order_id: 'order_TEST123',
      amount: 450000,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
      captured: true,
      email: 'merchant_test@example.com',
      contact: '+919988776655',
      created_at: 1725270000
    };
    const normalized = razorpayService.normalizePayment(mockRazorpayCaptured);
    assert(normalized.providerPaymentId === 'pay_TEST1234567890', 'Normalized providerPaymentId matches pay_ID');
    assert(normalized.status === 'CAPTURED', 'Normalized status is CAPTURED');

    // 3. Webhook Signature Verification Test
    const secret = 'rzp_webhook_secret_test_123';
    const testPayload = JSON.stringify({ event: 'payment.captured', entity: mockRazorpayCaptured });
    const validSignature = crypto.createHmac('sha256', secret).update(testPayload).digest('hex');
    const signaturePass = razorpayService.verifyWebhookSignature(testPayload, validSignature, secret);
    assert(signaturePass === true, 'Webhook HMAC signature verification passes');

    // 4. OpenAI Service Configuration Safety
    assert(typeof openaiService.isConfigured === 'function', 'OpenAI service configuration check is available');
    assert(openaiService.getModel() === 'gpt-4o', 'OpenAI model configured correctly');

    // 5. Strict Zod AI Schema Validation (Valid payload)
    const validAIDecision = {
      root_cause: 'INSUFFICIENT_FUNDS',
      risk_level: 'MEDIUM',
      recommended_action: 'REQUEST_CUSTOMER_RETRY',
      confidence: 0.88,
      reasoning_summary: 'Customer bank rejected initial charge due to low balance. Fallback link advised.',
      priority: 'MEDIUM',
      should_escalate: false,
      stop_recovery: false,
      merchant_message: 'Customer experienced a balance issue. Recovery link sent.'
    };
    const schemaValidation = AIDecisionSchema.safeParse(validAIDecision);
    assert(schemaValidation.success === true, 'Zod AIDecisionSchema passes for compliant structured output');

    // 6. Strict Zod AI Schema Validation (Invalid payload rejection)
    const invalidAIDecision = {
      root_cause: 'INVALID_ENUM',
      confidence: 1.5, // invalid confidence > 1
      recommended_action: 'CHARGE_ARBITRARY_CARD' // disallowed
    };
    const invalidValidation = AIDecisionSchema.safeParse(invalidAIDecision);
    assert(invalidValidation.success === false, 'Zod AIDecisionSchema rejects non-compliant or malicious AI output');

    // 7. Deterministic Rules Engine Evaluation
    const failedTxn = {
      id: 'TXN_TEST_FAIL',
      amount: 680000,
      status: 'FAILED',
      paymentMethod: 'CARD',
      retryCount: 1,
      failureReason: 'Insufficient customer funds during bank auth',
      customerDebited: false,
      merchantSettlementStatus: 'UNSETTLED'
    };
    const failedEval = rulesEngineService.evaluateRules(failedTxn);
    assert(failedEval.riskType === 'PAYMENT_FAILED', 'Failed payment evaluates to PAYMENT_FAILED');

    // 8. AI Analysis with Deterministic Fallback Mode
    const aiAnalysisResult = await aiService.analyzeRevenueRisk(failedTxn);
    assert(aiAnalysisResult.success === true, 'AI Service analysis returns success: true');
    assert(aiAnalysisResult.data.root_cause === 'INSUFFICIENT_FUNDS', 'AI Analysis classifies root cause as INSUFFICIENT_FUNDS');
    assert(aiAnalysisResult.data.confidence >= 0 && aiAnalysisResult.data.confidence <= 1, 'AI Analysis confidence is between 0 and 1');

    // 9. Safety Guardrails - Preventing Retry on Captured Funds
    const capturedPendingTxn = {
      id: 'TXN_TEST_CAPTURED',
      amount: 4500000,
      status: 'CAPTURED',
      paymentMethod: 'NETBANKING',
      customerDebited: true,
      merchantSettlementStatus: 'PENDING'
    };
    const capturedAnalysis = await aiService.analyzeRevenueRisk(capturedPendingTxn);
    assert(capturedAnalysis.data.recommended_action === 'VERIFY_SETTLEMENT', 'AI Analysis strictly recommends VERIFY_SETTLEMENT on captured funds (never retry)');

    // 10. Safety Guardrails - Enforcing Retry Ceiling
    const exceededRetriesTxn = {
      id: 'TXN_TEST_EXCEEDED',
      amount: 1500000,
      status: 'FAILED',
      paymentMethod: 'CARD',
      retryCount: 3,
      failureReason: '3DS authentication declined repeatedly'
    };
    const exceededAnalysis = await aiService.analyzeRevenueRisk(exceededRetriesTxn);
    assert(exceededAnalysis.data.recommended_action === 'STOP_RECOVERY', 'AI Analysis enforces STOP_RECOVERY when retry limit is reached');
    assert(exceededAnalysis.data.stop_recovery === true, 'AI Analysis sets stop_recovery to true');

    // 11. Safety Guardrails - High Value Human Escalation
    const highValueTxn = {
      id: 'TXN_TEST_HIGH_VAL',
      amount: 9800000, // ₹98,000 (> ₹50,000 threshold)
      status: 'FAILED',
      paymentMethod: 'CARD',
      retryCount: 1,
      failureReason: 'Fraud risk filter triggered'
    };
    const highValAnalysis = await aiService.analyzeRevenueRisk(highValueTxn);
    assert(highValAnalysis.data.recommended_action === 'ESCALATE', 'AI Analysis flags high-value transaction as ESCALATE');
    assert(highValAnalysis.data.should_escalate === true, 'AI Analysis sets should_escalate to true for high-value risk');
    assert(highValAnalysis.data.priority === 'URGENT', 'AI Analysis marks high-value case priority as URGENT');

    // 12. AI Copilot Grounded Q&A
    const liveContext = {
      totalTransactions: 10,
      revenueAtRisk: 319800,
      recoveredRevenue: 115000,
      recoveryRate: 26.4,
      activeCases: 6,
      settlementIssues: 3,
      failedPayments: 5
    };
    const copilotAnswer = await aiService.askCopilot('How much revenue is at risk?', liveContext);
    assert(copilotAnswer.includes('3,19,800') || copilotAnswer.includes('319800'), 'AI Copilot accurately cites live database revenue at risk without fabrication');

    // 13. What-If Scenario Analysis
    const whatIfResult = await aiService.analyzeWhatIf('Retry optimization', liveContext);
    assert(whatIfResult.success === true && whatIfResult.simulationResults.projectedRecoveredRevenue > 0, 'What-if scenario analysis completes safely');

    // 14. Prisma Database Persistence Test
    const testCase = await prisma.recoveryCase.findFirst({
      include: { transaction: true }
    });
    if (testCase) {
      const persistedAnalysis = await aiService.analyzeRevenueRisk(testCase.transaction, testCase.id);
      const savedDecision = await prisma.aIDecision.findFirst({
        where: { recoveryCaseId: testCase.id },
        orderBy: { createdAt: 'desc' }
      });
      assert(savedDecision !== null, 'AI Decision successfully saved to PostgreSQL/SQLite database');
      assert(savedDecision.recommendedAction !== undefined, 'Persisted decision contains valid recommendedAction');
      
      const savedAudit = await prisma.auditLog.findFirst({
        where: { recoveryCaseId: testCase.id, eventType: 'AI_ANALYSIS_COMPLETED' }
      });
      assert(savedAudit !== null, 'AI_ANALYSIS_COMPLETED audit trail event created');
    }

    console.log(`\n🏁 Test Report: ${passed} passed, ${failed} failed.`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during test suite execution:', err);
    process.exit(1);
  }
}

runTests();
