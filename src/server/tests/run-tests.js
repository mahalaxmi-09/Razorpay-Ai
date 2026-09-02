import dotenv from 'dotenv';
dotenv.config();

import { razorpayService } from '../services/razorpay.service.js';
import { paymentProviderService } from '../services/paymentProvider.service.js';
import { rulesEngineService } from '../services/rulesEngine.service.js';
import { guardrailsService } from '../services/guardrails.service.js';
import { settlementService } from '../services/settlement.service.js';
import { aiService } from '../services/ai.service.js';
import { prisma } from '../config/db.js';
import crypto from 'crypto';

async function runTests() {
  console.log('🧪 Starting RazorRecover Phase 2 (Razorpay Test Mode) Unit & Integration Tests...');
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
    assert(razorpayService.isConfigured(), 'Razorpay TEST SDK client initialized successfully with test credentials');
    
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
    assert(normalized.customerDebited === true, 'Normalized captured payment flags customerDebited as true');
    assert(normalized.amount === 450000, 'Normalized amount preserved in paise integer');

    // 3. Webhook Signature Verification Test
    const secret = 'rzp_webhook_secret_test_123';
    const testPayload = JSON.stringify({ event: 'payment.captured', entity: mockRazorpayCaptured });
    const validSignature = crypto.createHmac('sha256', secret).update(testPayload).digest('hex');

    const signaturePass = razorpayService.verifyWebhookSignature(testPayload, validSignature, secret);
    assert(signaturePass === true, 'Webhook HMAC SHA256 signature verification passes for valid hash');

    const signatureFail = razorpayService.verifyWebhookSignature(testPayload, 'invalid_signature_hash', secret);
    assert(signatureFail === false, 'Webhook HMAC signature verification rejects invalid hash with 403 Forbidden');

    // 4. Deterministic Rules Engine Tests
    const failedTxn = {
      amount: 680000,
      status: 'FAILED',
      retryCount: 1,
      failureReason: 'Customer bank timeout'
    };
    const failedEval = rulesEngineService.evaluateRules(failedTxn);
    assert(failedEval.riskType === 'PAYMENT_FAILED', 'Failed payment evaluates to PAYMENT_FAILED');
    assert(failedEval.recommendedAction === 'RETRY_ELIGIBLE_PAYMENT', 'Failed payment under retry limit recommends RETRY_ELIGIBLE_PAYMENT');

    const capturedPendingTxn = {
      amount: 4500000,
      status: 'CAPTURED',
      customerDebited: true,
      merchantSettlementStatus: 'PENDING'
    };
    const capturedEval = rulesEngineService.evaluateRules(capturedPendingTxn);
    assert(capturedEval.riskType === 'SETTLEMENT_PENDING', 'Captured payment with pending settlement evaluates to SETTLEMENT_PENDING');
    assert(capturedEval.recommendedAction === 'VERIFY_STATUS', 'Captured payment strictly recommends VERIFY_STATUS (never retry)');

    // 5. Safety Guardrails Tests
    const blockRetryCheck = guardrailsService.validateAction(capturedPendingTxn, 'RETRY_ELIGIBLE_PAYMENT');
    assert(!blockRetryCheck.allowed && blockRetryCheck.guardrailResult === 'BLOCKED', 'Guardrail blocks retry on captured payment to prevent duplicate debits');

    const allowRetryCheck = guardrailsService.validateAction(failedTxn, 'RETRY_ELIGIBLE_PAYMENT');
    assert(allowRetryCheck.allowed && allowRetryCheck.guardrailResult === 'PASSED', 'Guardrail allows retry on eligible failed payment');

    const highValueTxn = {
      amount: 9800000, // ₹98,000
      status: 'FAILED',
      retryCount: 1
    };
    const highValGuardrail = guardrailsService.validateAction(highValueTxn, 'RETRY_ELIGIBLE_PAYMENT');
    assert(highValGuardrail.guardrailResult === 'HUMAN_APPROVAL_REQUIRED', 'Guardrail flags high-value transaction as HUMAN_APPROVAL_REQUIRED');

    // 6. AI Structured Decision Test
    const aiAnalysis = await aiService.analyzeRevenueRisk(failedTxn);
    assert(aiAnalysis && aiAnalysis.recommendedAction && aiAnalysis.confidence > 0, 'AI Service returns structured advice and confidence');

    // 7. Prisma Database Connectivity Test
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
    console.error('Fatal error during test suite execution:', err);
    process.exit(1);
  }
}

runTests();
