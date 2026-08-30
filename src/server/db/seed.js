import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Reset database records first to ensure a clean state
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.recoveryAction.deleteMany({});
  await prisma.recoveryCase.deleteMany({});
  await prisma.revenueRiskEvent.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.merchant.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.webhookEvent.deleteMany({});

  console.log('🧹 Existing records cleaned.');

  // 1. Create System User and Merchant
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

  // 2. Create Customers
  const customerA = await prisma.customer.create({
    data: { name: 'Karthik Rao', email: 'karthik@gmail.com', phone: '+919988776655' }
  });
  const customerB = await prisma.customer.create({
    data: { name: 'Shreya Patel', email: 'shreya@outlook.com', phone: '+919876543210' }
  });
  const customerC = await prisma.customer.create({
    data: { name: 'Amit Sharma', email: 'amit@yahoo.com', phone: '+918877665544' }
  });
  const customerD = await prisma.customer.create({
    data: { name: 'Deepa Nair', email: 'deepa@gmail.com', phone: '+917766554433' }
  });

  // --- DEVELOPMENT TEST DATA SCENARIOS ---

  // Scenario 1: Successful captured payment with confirmed settlement
  const txn1 = await prisma.transaction.create({
    data: {
      id: 'TXN_10001',
      externalPaymentId: 'pay_successful_101',
      customerId: customerA.id,
      merchantId: merchant.id,
      amount: 1250000, // ₹12,500 (represented in paise)
      status: 'CAPTURED',
      method: 'card',
      capturedAt: new Date(Date.now() - 4 * 3600 * 1000), // 4 hours ago
      settlementStatus: 'SETTLED'
    }
  });

  // Scenario 2: Failed payment - PAYMENT_FAILED Risk Event & Recovery Case OPEN
  const txn2 = await prisma.transaction.create({
    data: {
      id: 'TXN_10002',
      externalPaymentId: 'pay_failed_102',
      customerId: customerB.id,
      merchantId: merchant.id,
      amount: 680000, // ₹6,800
      status: 'FAILED',
      method: 'upi',
      failureReason: 'Customer bank account insufficient funds',
      settlementStatus: null
    }
  });

  const risk2 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn2.id,
      merchantId: merchant.id,
      riskType: 'PAYMENT_FAILED',
      riskLevel: 'High',
      amountAtRisk: 680000,
      reason: 'Transaction failed due to insufficient customer account funds.',
      status: 'OPEN',
      detectedAt: new Date(Date.now() - 3 * 3600 * 1000)
    }
  });

  await prisma.recoveryCase.create({
    data: {
      riskEventId: risk2.id,
      transactionId: txn2.id,
      status: 'OPEN',
      recommendedAction: 'RETRY_PAYMENT',
      priority: 'High'
    }
  });

  await prisma.notification.create({
    data: {
      merchantId: merchant.id,
      type: 'ACTION_REQUIRED',
      title: 'Payment Ingestion Failure',
      message: 'Transaction TXN_10002 of ₹6,800 failed. Recommended retry.',
      severity: 'error'
    }
  });

  // Scenario 3: Settlement pending - SETTLEMENT_PENDING Risk Event & Case MONITORING
  const txn3 = await prisma.transaction.create({
    data: {
      id: 'TXN_10003',
      externalPaymentId: 'pay_pending_103',
      customerId: customerC.id,
      merchantId: merchant.id,
      amount: 4500000, // ₹45,000
      status: 'CAPTURED',
      method: 'netbanking',
      capturedAt: new Date(Date.now() - 24 * 3600 * 1000), // 24 hours ago
      settlementStatus: 'PENDING'
    }
  });

  const risk3 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn3.id,
      merchantId: merchant.id,
      riskType: 'SETTLEMENT_PENDING',
      riskLevel: 'Medium',
      amountAtRisk: 4500000,
      reason: 'Captured payment did not settle within standard settlement window.',
      status: 'OPEN',
      detectedAt: new Date(Date.now() - 20 * 3600 * 1000)
    }
  });

  await prisma.recoveryCase.create({
    data: {
      riskEventId: risk3.id,
      transactionId: txn3.id,
      status: 'MONITORING',
      recommendedAction: 'VERIFY_SETTLEMENT',
      priority: 'Medium'
    }
  });

  await prisma.notification.create({
    data: {
      merchantId: merchant.id,
      type: 'RECOVERY_PENDING',
      title: 'Settlement Latency Alert',
      message: 'Transaction TXN_10003 of ₹45,000 captured but settlement is pending.',
      severity: 'warning'
    }
  });

  // Scenario 4: Settlement processed / Recovered Revenue
  const txn4 = await prisma.transaction.create({
    data: {
      id: 'TXN_10004',
      externalPaymentId: 'pay_recovered_104',
      customerId: customerD.id,
      merchantId: merchant.id,
      amount: 11250000, // ₹1,12,500
      status: 'CAPTURED',
      method: 'card',
      capturedAt: new Date(Date.now() - 48 * 3600 * 1000),
      settlementStatus: 'SETTLED'
    }
  });

  const risk4 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn4.id,
      merchantId: merchant.id,
      riskType: 'SETTLEMENT_PENDING',
      riskLevel: 'Medium',
      amountAtRisk: 11250000,
      reason: 'Settlement delayed, later recovered successfully.',
      status: 'RESOLVED',
      detectedAt: new Date(Date.now() - 44 * 3600 * 1000),
      resolvedAt: new Date(Date.now() - 12 * 3600 * 1000)
    }
  });

  const case4 = await prisma.recoveryCase.create({
    data: {
      riskEventId: risk4.id,
      transactionId: txn4.id,
      status: 'RECOVERED',
      recommendedAction: 'VERIFY_SETTLEMENT',
      priority: 'Medium'
    }
  });

  await prisma.recoveryAction.create({
    data: {
      recoveryCaseId: case4.id,
      actionType: 'VERIFY_SETTLEMENT',
      status: 'SUCCESS',
      guardrailResult: 'PASSED',
      result: 'Settlement confirmed'
    }
  });

  await prisma.notification.create({
    data: {
      merchantId: merchant.id,
      type: 'RECOVERY_SUCCESS',
      title: 'Revenue Recovered',
      message: 'Successfully recovered ₹1,12,500 for transaction TXN_10004.',
      severity: 'success'
    }
  });

  // Scenario 5: Escalated case
  const txn5 = await prisma.transaction.create({
    data: {
      id: 'TXN_10005',
      externalPaymentId: 'pay_escalated_105',
      customerId: customerA.id,
      merchantId: merchant.id,
      amount: 9800000, // ₹98,000
      status: 'FAILED',
      method: 'card',
      failureReason: 'Card reported lost or stolen',
      settlementStatus: null
    }
  });

  const risk5 = await prisma.revenueRiskEvent.create({
    data: {
      transactionId: txn5.id,
      merchantId: merchant.id,
      riskType: 'PAYMENT_FAILED',
      riskLevel: 'High',
      amountAtRisk: 9800000,
      reason: 'Transaction blocked due to lost card flag.',
      status: 'OPEN',
      detectedAt: new Date(Date.now() - 72 * 3600 * 1000)
    }
  });

  await prisma.recoveryCase.create({
    data: {
      riskEventId: risk5.id,
      transactionId: txn5.id,
      status: 'ESCALATED',
      recommendedAction: 'ESCALATE',
      priority: 'High'
    }
  });

  // Create Audit Logs
  await prisma.auditLog.create({
    data: {
      merchantId: merchant.id,
      transactionId: txn1.id,
      eventType: 'PAYMENT_RECEIVED',
      actor: 'SYSTEM',
      description: 'Captured payment of ₹12,500 processed.'
    }
  });

  await prisma.auditLog.create({
    data: {
      merchantId: merchant.id,
      transactionId: txn2.id,
      eventType: 'RISK_DETECTED',
      actor: 'SYSTEM',
      description: 'High risk PAYMENT_FAILED flagged for customer Shreya Patel.'
    }
  });

  console.log('🌱 Database seeded successfully with DEVELOPMENT TEST DATA.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
