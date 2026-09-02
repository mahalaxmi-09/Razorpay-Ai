import dotenv from 'dotenv';
dotenv.config();

import { rulesEngineService } from '../services/rulesEngine.service.js';
import { guardrailsService } from '../services/guardrails.service.js';
import { transactionInputSchema } from '../controllers/transaction.controller.js';
import { aiService } from '../services/ai.service.js';
import { prisma } from '../config/db.js';

async function runTests() {
  console.log('🧪 Starting RazorRecover Independent Backend Unit & Integration Tests...');
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
    // 1. Zod Schema Validation Tests
    const validPayload = {
      amount: 500000,
      currency: 'INR',
      status: 'CAPTURED',
      paymentMethod: 'UPI',
      customerDebited: true,
      merchantSettlementStatus: 'PENDING'
    };
    const validCheck = transactionInputSchema.safeParse(validPayload);
    assert(validCheck.success, 'Zod validates valid transaction payload');

    const invalidPayload = {
      amount: -500, // Invalid negative amount
      status: 'INVALID_STATUS'
    };
    const invalidCheck = transactionInputSchema.safeParse(invalidPayload);
    assert(!invalidCheck.success, 'Zod rejects invalid negative amount and invalid status');

    // 2. Rules Engine Tests
    // Test: Failed payment with eligible retry
    const failedTxn = {
      amount: 680000,
      status: 'FAILED',
      retryCount: 1,
      failureReason: 'insufficient_funds'
    };
    const failedEval = rulesEngineService.evaluateRules(failedTxn);
    assert(failedEval.riskType === 'PAYMENT_FAILED', 'Failed payment evaluates to PAYMENT_FAILED');
    assert(failedEval.recommendedAction === 'RETRY_ELIGIBLE_PAYMENT', 'Failed payment with low retry count recommends RETRY_ELIGIBLE_PAYMENT');

    // Test: Retry Limit Exceeded
    const maxRetryTxn = {
      amount: 680000,
      status: 'FAILED',
      retryCount: 3
    };
    const maxRetryEval = rulesEngineService.evaluateRules(maxRetryTxn);
    assert(maxRetryEval.recommendedAction === 'STOP_RECOVERY', 'Max retry limit reached recommends STOP_RECOVERY');

    // Test: High-Value Failed Transaction
    const highValueTxn = {
      amount: 9800000, // ₹98,000
      status: 'FAILED',
      retryCount: 1
    };
    const highValueEval = rulesEngineService.evaluateRules(highValueTxn);
    assert(highValueEval.recommendedAction === 'ESCALATE_TO_HUMAN', 'High-value transaction failure recommends ESCALATE_TO_HUMAN');

    // Test: Captured payment with pending settlement
    const capturedTxn = {
      amount: 4500000,
      status: 'CAPTURED',
      customerDebited: true,
      merchantSettlementStatus: 'PENDING'
    };
    const capturedEval = rulesEngineService.evaluateRules(capturedTxn);
    assert(capturedEval.riskType === 'SETTLEMENT_PENDING', 'Captured payment with pending settlement evaluates to SETTLEMENT_PENDING');
    assert(capturedEval.recommendedAction === 'VERIFY_STATUS', 'Captured payment recommends VERIFY_STATUS (never retry)');

    // 3. Safety Guardrails Tests
    // Guardrail: Block retry on captured / debited transaction
    const blockRetryCheck = guardrailsService.validateAction(capturedTxn, 'RETRY_ELIGIBLE_PAYMENT');
    assert(!blockRetryCheck.allowed && blockRetryCheck.guardrailResult === 'BLOCKED', 'Guardrail strictly blocks retry on captured payment to prevent duplicate charges');

    // Guardrail: Allow retry on eligible failed payment
    const allowRetryCheck = guardrailsService.validateAction(failedTxn, 'RETRY_ELIGIBLE_PAYMENT');
    assert(allowRetryCheck.allowed && allowRetryCheck.guardrailResult === 'PASSED', 'Guardrail allows retry on eligible failed payment');

    // Guardrail: High value threshold check
    const highValGuardrail = guardrailsService.validateAction(highValueTxn, 'RETRY_ELIGIBLE_PAYMENT');
    assert(highValGuardrail.guardrailResult === 'HUMAN_APPROVAL_REQUIRED', 'Guardrail flags high-value retry as HUMAN_APPROVAL_REQUIRED');

    // 4. AI Service Fallback Test
    const aiAnalysis = await aiService.analyzeRevenueRisk(failedTxn);
    assert(aiAnalysis && aiAnalysis.recommendedAction && aiAnalysis.confidence > 0, 'AI Service returns structured advice with confidence score');

    // 5. Database Connection Test (if Postgres is active)
    try {
      await prisma.$connect();
      assert(true, 'Prisma database client connects to PostgreSQL instance');
    } catch (e) {
      console.log('ℹ️  PostgreSQL server is not currently reachable on localhost:5432. Connect DB to run live queries.');
    }

    console.log(`\n🏁 Test Report: ${passed} passed, ${failed} failed.`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runTests();
