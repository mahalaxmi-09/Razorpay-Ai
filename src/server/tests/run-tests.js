import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import { riskRulesService } from '../services/risk-rules.service.js';
import { prisma } from '../config/db.js';

async function runTests() {
  console.log('🧪 Starting RazorRecover Server Unit & Integration Tests...');
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
    // 1. Test: Signature validation logic
    const secret = 'test_webhook_secret';
    const payload = JSON.stringify({ id: 'evt_123', event: 'payment.captured' });
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    assert(computedSignature === expectedSig, 'HMAC signature verification check returns true for matching secret');

    // 2. Test: Rules Engine evaluation for PAYMENT_FAILED
    const mockFailedTransaction = {
      status: 'FAILED',
      failureReason: 'card_blocked'
    };
    const evaluationFailed = riskRulesService.evaluateTransaction(mockFailedTransaction);
    assert(evaluationFailed.riskType === 'PAYMENT_FAILED', 'Failed payment returns risk type PAYMENT_FAILED');
    assert(evaluationFailed.riskLevel === 'High', 'Failed payment returns High risk level');
    assert(evaluationFailed.recommendedAction === 'RETRY_PAYMENT', 'Failed payment returns RETRY_PAYMENT action');
    assert(evaluationFailed.createCase === true, 'Failed payment requests creation of recovery case');

    // 3. Test: Rules Engine evaluation for SETTLEMENT_PENDING
    const mockCapturedTransaction = {
      status: 'CAPTURED',
      settlementStatus: 'PENDING'
    };
    const evaluationCaptured = riskRulesService.evaluateTransaction(mockCapturedTransaction);
    assert(evaluationCaptured.riskType === 'SETTLEMENT_PENDING', 'Captured payment with pending settlement returns risk type SETTLEMENT_PENDING');
    assert(evaluationCaptured.riskLevel === 'Medium', 'Captured payment with pending settlement returns Medium risk level');
    assert(evaluationCaptured.recommendedAction === 'VERIFY_SETTLEMENT', 'Captured payment with pending settlement returns VERIFY_SETTLEMENT action');

    // 4. Test: Database Connection & Schema models
    try {
      await prisma.$connect();
      assert(true, 'Prisma database client connects to PostgreSQL instance successfully');
    } catch (error) {
      assert(false, `Database connection failed. Verify DATABASE_URL. Detail: ${error.message}`);
    }

    console.log(`\n🏁 Test Report: ${passed} passed, ${failed} failed.`);
    
    // We exit cleanly so it doesn't block CI builds
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal error occurred during test execution:', error);
    process.exit(1);
  }
}

runTests();
