import dotenv from 'dotenv';
dotenv.config();

import { razorpayService } from '../services/razorpay.service.js';
import { paymentProviderService } from '../services/paymentProvider.service.js';
import { rulesEngineService } from '../services/rulesEngine.service.js';
import { guardrailsService } from '../services/guardrails.service.js';
import { recoveryStateMachineService, RECOVERY_STATES } from '../services/recoveryStateMachine.service.js';
import { recoveryExecutionService } from '../services/recoveryExecution.service.js';
import { revenueRiskService } from '../services/revenueRisk.service.js';
import { openaiService } from '../services/openai.service.js';
import { aiService, AIDecisionSchema } from '../services/ai.service.js';
import { prisma } from '../config/db.js';
import crypto from 'crypto';

async function runTests() {
  console.log('🧪 Starting RazorRecover Phase 6 (Autonomous Recovery Agent & Safety) Test Suite...\n');
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
    // -------------------------------------------------------------
    // Core Services & Configuration Checks
    // -------------------------------------------------------------
    assert(razorpayService.isConfigured(), 'Razorpay TEST SDK client initialized successfully');
    
    // Normalization check
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

    // Webhook HMAC signature verification
    const secret = 'rzp_webhook_secret_test_123';
    const testPayload = JSON.stringify({ event: 'payment.captured', entity: mockRazorpayCaptured });
    const validSignature = crypto.createHmac('sha256', secret).update(testPayload).digest('hex');
    const signaturePass = razorpayService.verifyWebhookSignature(testPayload, validSignature, secret);
    assert(signaturePass === true, 'Webhook HMAC signature verification passes');

    // OpenAI configuration & Zod Schema Validation
    assert(typeof openaiService.isConfigured === 'function', 'OpenAI service configuration check is available');
    assert(openaiService.getModel() === 'gpt-4o', 'OpenAI model configured correctly');

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
    assert(AIDecisionSchema.safeParse(validAIDecision).success === true, 'Zod AIDecisionSchema passes for compliant structured output');
    assert(AIDecisionSchema.safeParse({ root_cause: 'INVALID', confidence: 2.0 }).success === false, 'Zod AIDecisionSchema rejects non-compliant AI output');

    // -------------------------------------------------------------
    // PHASE 6 SPECIFIC TEST SCENARIOS (11 Core Tests)
    // -------------------------------------------------------------
    
    // Ensure test merchant and customer exist
    const testUser = await prisma.user.upsert({
      where: { email: 'test_admin@razorrecover.ai' },
      update: {},
      create: {
        id: 'usr_test_1',
        name: 'Test Admin',
        email: 'test_admin@razorrecover.ai'
      }
    });

    const testMerchant = await prisma.merchant.upsert({
      where: { id: 'test_merchant_1' },
      update: {},
      create: {
        id: 'test_merchant_1',
        userId: testUser.id,
        name: 'Acme Test Merchant',
        email: 'merchant_test@acme.com',
        defaultCurrency: 'INR'
      }
    });

    const testCustomer = await prisma.customer.upsert({
      where: { email: 'customer_test@example.com' },
      update: {},
      create: {
        id: 'cust_test_1',
        name: 'Test Customer',
        email: 'customer_test@example.com',
        phone: '+919988776655'
      }
    });
    const testTxn1 = await prisma.transaction.create({
      data: {
        id: `TXN_T1_${Date.now()}`,
        amount: 250000, // ₹2,500
        currency: 'INR',
        status: 'FAILED',
        paymentMethod: 'UPI',
        merchantSettlementStatus: 'UNSETTLED',
        merchantId: 'test_merchant_1',
        customerId: 'cust_test_1'
      }
    });
    const riskEvent1 = await prisma.revenueRiskEvent.create({
      data: {
        transactionId: testTxn1.id,
        merchantId: 'test_merchant_1',
        riskType: 'PAYMENT_FAILED',
        riskLevel: 'Medium',
        amountAtRisk: 250000,
        reason: 'Payment failed at gateway',
        status: 'OPEN'
      }
    });
    const testCase1 = await prisma.recoveryCase.create({
      data: {
        riskEventId: riskEvent1.id,
        transactionId: testTxn1.id,
        status: 'OPEN',
        priority: 'Medium',
        recommendedAction: 'RETRY_PAYMENT'
      }
    });

    const execResult1 = await recoveryExecutionService.executeCaseRecovery({
      recoveryCaseId: testCase1.id,
      actionType: 'RETRY_PAYMENT',
      mockVerificationSuccess: true
    });
    assert(execResult1.success === true && execResult1.status === 'VERIFIED_RECOVERED', 'TEST 1: Failed payment executes and verifies to VERIFIED_RECOVERED');
    const updatedCase1 = await prisma.recoveryCase.findUnique({ where: { id: testCase1.id } });
    assert(updatedCase1.status === 'VERIFIED_RECOVERED', 'TEST 1: RecoveryCase.status in DB is strictly VERIFIED_RECOVERED');

    // TEST 2: Failed payment -> retry attempted -> retry fails -> Recovered Revenue remains unaffected
    const testTxn2 = await prisma.transaction.create({
      data: {
        id: `TXN_T2_${Date.now()}`,
        amount: 150000, // ₹1,500
        currency: 'INR',
        status: 'FAILED',
        paymentMethod: 'CARD',
        merchantSettlementStatus: 'UNSETTLED',
        merchantId: 'test_merchant_1',
        customerId: 'cust_test_1'
      }
    });
    const riskEvent2 = await prisma.revenueRiskEvent.create({
      data: {
        transactionId: testTxn2.id,
        merchantId: 'test_merchant_1',
        riskType: 'PAYMENT_FAILED',
        riskLevel: 'Medium',
        amountAtRisk: 150000,
        reason: 'Card decline',
        status: 'OPEN'
      }
    });
    const testCase2 = await prisma.recoveryCase.create({
      data: {
        riskEventId: riskEvent2.id,
        transactionId: testTxn2.id,
        status: 'OPEN',
        priority: 'Medium',
        recommendedAction: 'RETRY_PAYMENT'
      }
    });

    const execResult2 = await recoveryExecutionService.executeCaseRecovery({
      recoveryCaseId: testCase2.id,
      actionType: 'RETRY_PAYMENT',
      mockVerificationSuccess: false
    });
    assert(execResult2.success === false && execResult2.status === 'FAILED', 'TEST 2: Failed retry transitions to FAILED without marking recovered');

    // TEST 3: Payment state uncertain -> VERIFY_PAYMENT, NOT RETRY_PAYMENT
    const uncertainTxn = {
      id: 'TXN_UNCERTAIN',
      amount: 300000,
      status: 'PENDING', // uncertain state
      customerDebited: false
    };
    const guardrailUncertain = await guardrailsService.validateAction({
      transaction: uncertainTxn,
      recoveryCase: { status: 'OPEN', attempts: 0 },
      actionType: 'RETRY_PAYMENT'
    });
    assert(guardrailUncertain.allowed === false && guardrailUncertain.recommendedAlternative === 'VERIFY_PAYMENT', 'TEST 3: Uncertain payment blocks retry and enforces VERIFY_PAYMENT');

    // TEST 4: Payment already captured -> No duplicate retry/charge (BLOCKED)
    const capturedTxn = {
      id: 'TXN_CAPTURED_ALREADY',
      amount: 400000,
      status: 'CAPTURED',
      customerDebited: true
    };
    const guardrailCaptured = await guardrailsService.validateAction({
      transaction: capturedTxn,
      recoveryCase: { status: 'OPEN', attempts: 0 },
      actionType: 'RETRY_PAYMENT'
    });
    assert(guardrailCaptured.allowed === false && guardrailCaptured.guardrailResult === 'BLOCKED', 'TEST 4: Already captured payment strictly blocks duplicate retry/charge');

    // TEST 5: Attempt count reaches 3 -> STOP_RECOVERY
    const maxAttemptTxn = {
      id: 'TXN_MAX_ATTEMPTS',
      amount: 200000,
      status: 'FAILED',
      retryCount: 3
    };
    const guardrailMax = await guardrailsService.validateAction({
      transaction: maxAttemptTxn,
      recoveryCase: { status: 'OPEN', attempts: 3 },
      actionType: 'RETRY_PAYMENT'
    });
    assert(guardrailMax.allowed === false && guardrailMax.shouldStop === true, 'TEST 5: Max 3 attempts reached enforces STOP_RECOVERY');

    // TEST 6: AI confidence = 0.55 -> No automatic execution (Approval required)
    const lowConfAI = {
      riskLevel: 'MEDIUM',
      confidence: 0.55 // < 0.70 threshold
    };
    const guardrailLowConf = await guardrailsService.validateAction({
      transaction: { amount: 100000, status: 'FAILED', retryCount: 0 },
      recoveryCase: { status: 'OPEN', attempts: 0 },
      actionType: 'RETRY_PAYMENT',
      aiDecision: lowConfAI,
      actor: 'AI'
    });
    assert(guardrailLowConf.allowed === false && guardrailLowConf.requiresApproval === true, 'TEST 6: AI confidence < 0.70 prevents automatic execution and requires approval');

    // TEST 7: Amount = ₹60,000 (> ₹50,000 threshold) -> Merchant approval required
    const highValueTxn = {
      amount: 6000000, // ₹60,000 in paise
      status: 'FAILED',
      retryCount: 0
    };
    const guardrailHighVal = await guardrailsService.validateAction({
      transaction: highValueTxn,
      recoveryCase: { status: 'OPEN', attempts: 0 },
      actionType: 'RETRY_PAYMENT',
      actor: 'AI'
    });
    assert(guardrailHighVal.allowed === false && guardrailHighVal.requiresApproval === true, 'TEST 7: ₹60,000 transaction requires explicit merchant approval');

    // TEST 8: CRITICAL risk -> No automatic execution
    const criticalRiskTxn = {
      amount: 150000,
      status: 'FAILED',
      riskStatus: 'CRITICAL',
      retryCount: 0
    };
    const guardrailCrit = await guardrailsService.validateAction({
      transaction: criticalRiskTxn,
      recoveryCase: { status: 'OPEN', attempts: 0 },
      actionType: 'RETRY_PAYMENT',
      actor: 'SYSTEM'
    });
    assert(guardrailCrit.allowed === false && guardrailCrit.requiresApproval === true, 'TEST 8: CRITICAL risk prevents automatic execution');

    // TEST 9: Duplicate execution request / Idempotency -> Only one recovery action executes
    const idempotencyKey = `idem_${Date.now()}`;
    await prisma.recoveryAction.create({
      data: {
        recoveryCaseId: testCase1.id,
        actionType: 'RETRY_PAYMENT',
        status: 'SUCCESS',
        idempotencyKey
      }
    });
    const guardrailDuplicate = await guardrailsService.validateAction({
      transaction: { amount: 100000, status: 'FAILED' },
      recoveryCase: { id: testCase1.id, status: 'OPEN' },
      actionType: 'RETRY_PAYMENT',
      idempotencyKey
    });
    assert(guardrailDuplicate.allowed === false && guardrailDuplicate.guardrailResult === 'DUPLICATE_IDEMPOTENCY', 'TEST 9: Duplicate idempotency key prevents duplicate recovery execution');

    // TEST 10: Recovery succeeds but verification fails -> Do NOT mark VERIFIED_RECOVERED
    const testTxn10 = await prisma.transaction.create({
      data: {
        id: `TXN_T10_${Date.now()}`,
        amount: 350000,
        currency: 'INR',
        status: 'FAILED',
        paymentMethod: 'UPI',
        merchantSettlementStatus: 'UNSETTLED',
        merchantId: 'test_merchant_1',
        customerId: 'cust_test_1'
      }
    });
    const riskEvent10 = await prisma.revenueRiskEvent.create({
      data: {
        transactionId: testTxn10.id,
        merchantId: 'test_merchant_1',
        riskType: 'PAYMENT_FAILED',
        riskLevel: 'Medium',
        amountAtRisk: 350000,
        reason: 'Payment failed',
        status: 'OPEN'
      }
    });
    const testCase10 = await prisma.recoveryCase.create({
      data: {
        riskEventId: riskEvent10.id,
        transactionId: testTxn10.id,
        status: 'OPEN',
        priority: 'Medium',
        recommendedAction: 'RETRY_PAYMENT'
      }
    });
    const execResult10 = await recoveryExecutionService.executeCaseRecovery({
      recoveryCaseId: testCase10.id,
      actionType: 'RETRY_PAYMENT',
      mockVerificationSuccess: false
    });
    assert(execResult10.status !== 'VERIFIED_RECOVERED', 'TEST 10: Unconfirmed verification NEVER marks case as VERIFIED_RECOVERED');

    // TEST 11: Verification confirms successful recovery -> RecoveryCase = VERIFIED_RECOVERED and DB summary updates
    const summaryBefore = await revenueRiskService.getSummary('test_merchant_1');
    const testTxn11 = await prisma.transaction.create({
      data: {
        id: `TXN_T11_${Date.now()}`,
        amount: 500000, // ₹5,000
        currency: 'INR',
        status: 'FAILED',
        paymentMethod: 'UPI',
        merchantSettlementStatus: 'UNSETTLED',
        merchantId: 'test_merchant_1',
        customerId: 'cust_test_1'
      }
    });
    const riskEvent11 = await prisma.revenueRiskEvent.create({
      data: {
        transactionId: testTxn11.id,
        merchantId: 'test_merchant_1',
        riskType: 'PAYMENT_FAILED',
        riskLevel: 'Medium',
        amountAtRisk: 500000,
        reason: 'Payment failed at bank',
        status: 'OPEN'
      }
    });
    const testCase11 = await prisma.recoveryCase.create({
      data: {
        riskEventId: riskEvent11.id,
        transactionId: testTxn11.id,
        status: 'OPEN',
        priority: 'Medium',
        recommendedAction: 'RETRY_PAYMENT'
      }
    });

    const execResult11 = await recoveryExecutionService.executeCaseRecovery({
      recoveryCaseId: testCase11.id,
      actionType: 'RETRY_PAYMENT',
      mockVerificationSuccess: true
    });
    assert(execResult11.status === 'VERIFIED_RECOVERED', 'TEST 11: Case successfully confirmed as VERIFIED_RECOVERED');
    
    const summaryAfter = await revenueRiskService.getSummary('test_merchant_1');
    assert(summaryAfter.recoveredRevenue >= summaryBefore.recoveredRevenue + 5000, 'TEST 11: Dashboard Recovered Revenue reflects verified DB calculation (+₹5,000)');

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
