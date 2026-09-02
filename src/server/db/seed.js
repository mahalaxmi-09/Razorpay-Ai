import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with DEVELOPMENT TEST DATA (10 Scenarios)...');

  // Reset database records for a clean development state
  await prisma.aIAnalysisLog.deleteMany({});
  await prisma.aIDecision.deleteMany({});
  await prisma.recoveryAction.deleteMany({});
  await prisma.recoveryCase.deleteMany({});
  await prisma.revenueRiskEvent.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.merchant.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned previous development records.');

  // 1. Setup Base User & Merchant
  const user = await prisma.user.create({
    data: {
      name: 'Mounika Merchant',
      email: 'mounika@razorrecover.ai'
    }
  });

  const merchant = await prisma.merchant.create({
    data: {
      userId: user.id,
      name: 'Mounika Enterprises',
      email: 'mounika@razorrecover.ai',
      defaultCurrency: 'INR',
      defaultLanguage: 'English'
    }
  });

  // 2. Setup Customers
  const customerA = await prisma.customer.create({
    data: { name: 'Karthik Rao', email: 'karthik.rao@gmail.com', phone: '+919988776655' }
  });
  const customerB = await prisma.customer.create({
    data: { name: 'Shreya Patel', email: 'shreya.patel@outlook.com', phone: '+919876543210' }
  });
  const customerC = await prisma.customer.create({
    data: { name: 'Amit Sharma', email: 'amit.sharma@yahoo.com', phone: '+918877665544' }
  });
  const customerD = await prisma.customer.create({
    data: { name: 'Deepa Nair', email: 'deepa.nair@gmail.com', phone: '+917766554433' }
  });
  const customerE = await prisma.customer.create({
    data: { name: 'Vikram Mehta', email: 'vikram.mehta@corp.com', phone: '+919123456780' }
  });

  // ==========================================
  // SCENARIO 1: Successful Payment
  // ==========================================
  await prisma.transaction.create({
    data: {
      id: 'TXN_10001',
      externalTransactionId: 'EXT_TXN_10001',
      merchantId: merchant.id,
      customerId: customerA.id,
      amount: 1250000, // ₹12,500
      currency: 'INR',
      status: 'CAPTURED',
      paymentMethod: 'UPI',
      customerDebited: true,
      merchantSettlementStatus: 'PROCESSED',
      retryCount: 0,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000)
    }
  });

  // ==========================================
  // SCENARIO 2: Failed Payment (Eligible Retry)
  // ==========================================
  const txn2 = await prisma.transaction.create({
    data: {
      id: 'TXN_10002',
      externalTransactionId: 'EXT_TXN_10002',
      merchantId: merchant.id,
      customerId: customerB.id,
      amount: 680000, // ₹6,800
      currency: 'INR',
      status: 'FAILED',
      paymentMethod: 'CARD',
      customerDebited: false,
      merchantSettlementStatus: 'UNSETTLED',
      failureReason: 'Insufficient customer funds during bank auth',
      retryCount: 1,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000)
    }
  });

  const risk2 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn2.id,
      merchantId: merchant.id,
      riskType: 'PAYMENT_FAILED',
      riskLevel: 'Medium',
      amountAtRisk: 680000,
      reason: 'Payment failed due to insufficient funds. 1/3 retry attempts used.',
      status: 'OPEN',
      detectedAt: new Date(Date.now() - 3 * 3600 * 1000)
    }
  });

  const case2 = await prisma.recoveryCase.create({
    data: {
      riskEventId: risk2.id,
      transactionId: txn2.id,
      status: 'OPEN',
      priority: 'Medium',
      recommendedAction: 'RETRY_ELIGIBLE_PAYMENT'
    }
  });

  await prisma.aIDecision.create({
    data: {
      recoveryCaseId: case2.id,
      rootCause: 'INSUFFICIENT_FUNDS',
      riskLevel: 'MEDIUM',
      confidence: 0.92,
      recommendedAction: 'REQUEST_CUSTOMER_RETRY',
      reasoningSummary: 'Customer bank reported temporary fund deficit. Fallback link recommended.',
      priority: 'MEDIUM',
      shouldEscalate: false,
      stopRecovery: false,
      merchantMessage: 'Your customer experienced a temporary bank balance issue. An automated retry link was provided.',
      decisionSource: 'RULE_ENGINE',
      model: 'gpt-4o'
    }
  });

  // ==========================================
  // SCENARIO 3: Captured Payment (Settlement Pending)
  // ==========================================
  const txn3 = await prisma.transaction.create({
    data: {
      id: 'TXN_10003',
      externalTransactionId: 'EXT_TXN_10003',
      merchantId: merchant.id,
      customerId: customerC.id,
      amount: 4500000, // ₹45,000
      currency: 'INR',
      status: 'CAPTURED',
      paymentMethod: 'NETBANKING',
      customerDebited: true,
      merchantSettlementStatus: 'PENDING',
      retryCount: 0,
      createdAt: new Date(Date.now() - 18 * 3600 * 1000)
    }
  });

  const risk3 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn3.id,
      merchantId: merchant.id,
      riskType: 'SETTLEMENT_PENDING',
      riskLevel: 'Medium',
      amountAtRisk: 4500000,
      reason: 'Payment captured on gateway but merchant settlement is pending bank reconciliation.',
      status: 'MONITORING',
      detectedAt: new Date(Date.now() - 17 * 3600 * 1000)
    }
  });

  await prisma.recoveryCase.create({
    data: {
      riskEventId: risk3.id,
      transactionId: txn3.id,
      status: 'MONITORING',
      priority: 'Medium',
      recommendedAction: 'VERIFY_STATUS'
    }
  });

  // ==========================================
  // SCENARIO 4: Captured + Settlement Pending (Monitoring)
  // ==========================================
  const txn4 = await prisma.transaction.create({
    data: {
      id: 'TXN_10004',
      externalTransactionId: 'EXT_TXN_10004',
      merchantId: merchant.id,
      customerId: customerD.id,
      amount: 1800000, // ₹18,000
      currency: 'INR',
      status: 'CAPTURED',
      paymentMethod: 'UPI',
      customerDebited: true,
      merchantSettlementStatus: 'PENDING',
      retryCount: 0,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000)
    }
  });

  const risk4 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn4.id,
      merchantId: merchant.id,
      riskType: 'SETTLEMENT_PENDING',
      riskLevel: 'Medium',
      amountAtRisk: 1800000,
      reason: 'Settlement verification in progress under 24-hour cycle.',
      status: 'MONITORING',
      detectedAt: new Date(Date.now() - 22 * 3600 * 1000)
    }
  });

  await prisma.recoveryCase.create({
    data: {
      riskEventId: risk4.id,
      transactionId: txn4.id,
      status: 'MONITORING',
      priority: 'Medium',
      recommendedAction: 'VERIFY_STATUS'
    }
  });

  // ==========================================
  // SCENARIO 5: Captured + Settlement Processed (Recovered)
  // ==========================================
  const txn5 = await prisma.transaction.create({
    data: {
      id: 'TXN_10005',
      externalTransactionId: 'EXT_TXN_10005',
      merchantId: merchant.id,
      customerId: customerE.id,
      amount: 11250000, // ₹1,12,500
      currency: 'INR',
      status: 'SETTLEMENT_PROCESSED',
      paymentMethod: 'CARD',
      customerDebited: true,
      merchantSettlementStatus: 'PROCESSED',
      retryCount: 0,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000)
    }
  });

  await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn5.id,
      merchantId: merchant.id,
      riskType: 'SETTLEMENT_PENDING',
      riskLevel: 'Medium',
      amountAtRisk: 11250000,
      reason: 'Settlement reconciliation verified and resolved.',
      status: 'RESOLVED',
      detectedAt: new Date(Date.now() - 44 * 3600 * 1000),
      resolvedAt: new Date(Date.now() - 12 * 3600 * 1000)
    }
  });

  // ==========================================
  // SCENARIO 6: Customer Debited + Merchant Settlement Missing (High Risk)
  // ==========================================
  const txn6 = await prisma.transaction.create({
    data: {
      id: 'TXN_10006',
      externalTransactionId: 'EXT_TXN_10006',
      merchantId: merchant.id,
      customerId: customerA.id,
      amount: 3200000, // ₹32,000
      currency: 'INR',
      status: 'SETTLEMENT_PENDING',
      paymentMethod: 'NETBANKING',
      customerDebited: true,
      merchantSettlementStatus: 'UNSETTLED',
      failureReason: 'Missing gateway UTR reference code',
      retryCount: 0,
      createdAt: new Date(Date.now() - 8 * 3600 * 1000)
    }
  });

  const risk6 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn6.id,
      merchantId: merchant.id,
      riskType: 'CUSTOMER_DEBITED_NOT_SETTLED',
      riskLevel: 'High',
      amountAtRisk: 3200000,
      reason: 'Customer debited according to transaction data, but merchant settlement not confirmed.',
      status: 'OPEN',
      detectedAt: new Date(Date.now() - 7 * 3600 * 1000)
    }
  });

  await prisma.recoveryCase.create({
    data: {
      riskEventId: risk6.id,
      transactionId: txn6.id,
      status: 'OPEN',
      priority: 'High',
      recommendedAction: 'VERIFY_STATUS'
    }
  });

  // ==========================================
  // SCENARIO 7: Repeated Payment Failures (Retry Limit Exceeded)
  // ==========================================
  const txn7 = await prisma.transaction.create({
    data: {
      id: 'TXN_10007',
      externalTransactionId: 'EXT_TXN_10007',
      merchantId: merchant.id,
      customerId: customerB.id,
      amount: 1500000, // ₹15,000
      currency: 'INR',
      status: 'FAILED',
      paymentMethod: 'CARD',
      customerDebited: false,
      merchantSettlementStatus: 'UNSETTLED',
      failureReason: '3DS authentication declined repeatedly by issuing bank',
      retryCount: 3,
      createdAt: new Date(Date.now() - 36 * 3600 * 1000)
    }
  });

  const risk7 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn7.id,
      merchantId: merchant.id,
      riskType: 'PAYMENT_FAILED',
      riskLevel: 'High',
      amountAtRisk: 1500000,
      reason: 'Retry limit of 3 attempts exceeded. Recovery halted to prevent customer friction.',
      status: 'STOPPED',
      detectedAt: new Date(Date.now() - 35 * 3600 * 1000)
    }
  });

  await prisma.recoveryCase.create({
    data: {
      riskEventId: risk7.id,
      transactionId: txn7.id,
      status: 'STOPPED',
      priority: 'Medium',
      recommendedAction: 'STOP_RECOVERY'
    }
  });

  // ==========================================
  // SCENARIO 8: High-Value Transaction Requiring Review
  // ==========================================
  const txn8 = await prisma.transaction.create({
    data: {
      id: 'TXN_10008',
      externalTransactionId: 'EXT_TXN_10008',
      merchantId: merchant.id,
      customerId: customerC.id,
      amount: 9800000, // ₹98,000 (exceeds ₹50,000 threshold)
      currency: 'INR',
      status: 'FAILED',
      paymentMethod: 'CARD',
      customerDebited: false,
      merchantSettlementStatus: 'UNSETTLED',
      failureReason: 'Fraud risk filter triggered by issuer',
      retryCount: 1,
      createdAt: new Date(Date.now() - 10 * 3600 * 1000)
    }
  });

  const risk8 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn8.id,
      merchantId: merchant.id,
      riskType: 'PAYMENT_FAILED',
      riskLevel: 'High',
      amountAtRisk: 9800000,
      reason: 'High-value failed transaction (₹98,000). Human approval required.',
      status: 'ESCALATED',
      detectedAt: new Date(Date.now() - 9 * 3600 * 1000)
    }
  });

  await prisma.recoveryCase.create({
    data: {
      riskEventId: risk8.id,
      transactionId: txn8.id,
      status: 'ESCALATED',
      priority: 'High',
      recommendedAction: 'ESCALATE_TO_HUMAN'
    }
  });

  // ==========================================
  // SCENARIO 9: Recovery Successfully Simulated
  // ==========================================
  const txn9 = await prisma.transaction.create({
    data: {
      id: 'TXN_10009',
      externalTransactionId: 'EXT_TXN_10009',
      merchantId: merchant.id,
      customerId: customerD.id,
      amount: 250000, // ₹2,500
      currency: 'INR',
      status: 'CAPTURED',
      paymentMethod: 'UPI',
      customerDebited: true,
      merchantSettlementStatus: 'PROCESSED',
      retryCount: 1,
      createdAt: new Date(Date.now() - 50 * 3600 * 1000)
    }
  });

  const risk9 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn9.id,
      merchantId: merchant.id,
      riskType: 'PAYMENT_FAILED',
      riskLevel: 'Low',
      amountAtRisk: 250000,
      reason: 'Initial card drop recovered via fallback UPI payment link.',
      status: 'RESOLVED',
      detectedAt: new Date(Date.now() - 49 * 3600 * 1000),
      resolvedAt: new Date(Date.now() - 20 * 3600 * 1000)
    }
  });

  const case9 = await prisma.recoveryCase.create({
    data: {
      riskEventId: risk9.id,
      transactionId: txn9.id,
      status: 'RECOVERED',
      priority: 'Low',
      recommendedAction: 'RETRY_ELIGIBLE_PAYMENT'
    }
  });

  await prisma.recoveryAction.create({
    data: {
      recoveryCaseId: case9.id,
      actionType: 'RETRY_ELIGIBLE_PAYMENT',
      status: 'SUCCESS',
      guardrailResult: 'PASSED',
      result: 'Simulated fallback link retry processed successfully. Customer auth confirmed.',
      executedAt: new Date(Date.now() - 20 * 3600 * 1000),
      completedAt: new Date(Date.now() - 20 * 3600 * 1000)
    }
  });

  // ==========================================
  // SCENARIO 10: Recovery Escalated to Human (Stolen Card Alert)
  // ==========================================
  const txn10 = await prisma.transaction.create({
    data: {
      id: 'TXN_10010',
      externalTransactionId: 'EXT_TXN_10010',
      merchantId: merchant.id,
      customerId: customerE.id,
      amount: 12000000, // ₹1,20,000
      currency: 'INR',
      status: 'FAILED',
      paymentMethod: 'CARD',
      customerDebited: false,
      merchantSettlementStatus: 'UNSETTLED',
      failureReason: 'Card reported lost/stolen (Pick-up card code 04)',
      retryCount: 2,
      createdAt: new Date(Date.now() - 12 * 3600 * 1000)
    }
  });

  const risk10 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn10.id,
      merchantId: merchant.id,
      riskType: 'PAYMENT_FAILED',
      riskLevel: 'High',
      amountAtRisk: 12000000,
      reason: 'Severe card security flag. Escalated directly to compliance queue.',
      status: 'ESCALATED',
      detectedAt: new Date(Date.now() - 11 * 3600 * 1000)
    }
  });

  await prisma.recoveryCase.create({
    data: {
      riskEventId: risk10.id,
      transactionId: txn10.id,
      status: 'ESCALATED',
      priority: 'High',
      recommendedAction: 'ESCALATE_TO_HUMAN'
    }
  });

  // 3. Populate Notifications
  await prisma.notification.createMany({
    data: [
      {
        merchantId: merchant.id,
        type: 'RISK_DETECTED',
        title: 'High Risk Alert: ₹98,000 at risk',
        message: 'TXN_10008 - Fraud filter triggered on high-value transaction. Escalated to human review.',
        severity: 'error',
        read: false
      },
      {
        merchantId: merchant.id,
        type: 'RECOVERY_PENDING',
        title: 'Settlement Pending: ₹45,000',
        message: 'TXN_10003 - Payment captured on gateway, awaiting bank settlement confirmation.',
        severity: 'warning',
        read: false
      },
      {
        merchantId: merchant.id,
        type: 'RECOVERY_COMPLETED',
        title: 'Revenue Recovered Successfully',
        message: 'TXN_10005 - ₹1,12,500 settlement reconciliation verified and processed.',
        severity: 'success',
        read: true
      }
    ]
  });

  // 4. Populate Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        merchantId: merchant.id,
        transactionId: 'TXN_10001',
        eventType: 'TRANSACTION_INGESTED',
        actor: 'SYSTEM',
        description: 'Payment TXN_10001 of ₹12,500 captured and settled.'
      },
      {
        merchantId: merchant.id,
        transactionId: 'TXN_10003',
        eventType: 'RISK_DETECTED',
        actor: 'SYSTEM',
        description: 'Settlement pending risk detected on TXN_10003 (₹45,000). Action: VERIFY_STATUS.'
      },
      {
        merchantId: merchant.id,
        transactionId: 'TXN_10009',
        eventType: 'RECOVERY_ACTION',
        actor: 'MERCHANT',
        description: 'Simulated fallback retry executed on TXN_10009. Revenue recovered.'
      }
    ]
  });

  console.log('✅ Successfully seeded 10 development scenarios into PostgreSQL.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
