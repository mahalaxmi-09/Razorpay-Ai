import { prisma } from '../config/db.js';
import { revenueRiskService } from '../services/revenueRisk.service.js';

/**
 * Test Controller (Buildathon Demo Dataset & State Management)
 * 
 * Provides controlled dataset seeding and deterministic reset endpoints
 * for repeatable, reliable live demonstrations.
 */

export const testController = {
  // 1. Reset Database to Clean Initial State
  resetData: async (req, res) => {
    try {
      // Clean all operational records in dependency order
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

      // Create base fixtures
      const user = await prisma.user.create({
        data: { name: 'Mounika Merchant', email: 'mounika@razorrecover.ai' }
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

      await prisma.customer.createMany({
        data: [
          { name: 'Karthik Rao', email: 'karthik.rao@gmail.com', phone: '+919988776655' },
          { name: 'Shreya Patel', email: 'shreya.patel@outlook.com', phone: '+919876543210' },
          { name: 'Amit Sharma', email: 'amit.sharma@yahoo.com', phone: '+918877665544' },
          { name: 'Deepa Nair', email: 'deepa.nair@gmail.com', phone: '+917766554433' },
          { name: 'Vikram Mehta', email: 'vikram.mehta@corp.com', phone: '+919123456780' }
        ]
      });

      return res.json({
        success: true,
        message: 'Database reset to clean baseline state.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('testController.resetData error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'RESET_ERROR', message: error.message }
      });
    }
  },

  // 2. Generate 11 Controlled Realistic Test Scenarios
  seedData: async (req, res) => {
    try {
      // First wipe existing data
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

      // 1. Base User, Merchant, Customers
      const user = await prisma.user.create({
        data: { name: 'Mounika Merchant', email: 'mounika@razorrecover.ai' }
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

      const customerA = await prisma.customer.create({ data: { name: 'Karthik Rao', email: 'karthik.rao@gmail.com', phone: '+919988776655' } });
      const customerB = await prisma.customer.create({ data: { name: 'Shreya Patel', email: 'shreya.patel@outlook.com', phone: '+919876543210' } });
      const customerC = await prisma.customer.create({ data: { name: 'Amit Sharma', email: 'amit.sharma@yahoo.com', phone: '+918877665544' } });
      const customerD = await prisma.customer.create({ data: { name: 'Deepa Nair', email: 'deepa.nair@gmail.com', phone: '+917766554433' } });
      const customerE = await prisma.customer.create({ data: { name: 'Vikram Mehta', email: 'vikram.mehta@corp.com', phone: '+919123456780' } });

      let txnCount = 0;
      let riskCount = 0;
      let caseCount = 0;

      // Scenario 1: Standard Successful Captured Payment
      await prisma.transaction.create({
        data: {
          id: 'TXN_10001',
          providerPaymentId: 'pay_TEST10001',
          merchantId: merchant.id,
          customerId: customerA.id,
          amount: 1250000, // ₹12,500
          currency: 'INR',
          status: 'CAPTURED',
          paymentMethod: 'UPI',
          captured: true,
          customerDebited: true,
          riskStatus: 'LOW',
          merchantSettlementStatus: 'PROCESSED',
          createdAt: new Date(Date.now() - 2 * 3600 * 1000)
        }
      });
      txnCount++;

      // Scenario 2: Failed Payment (Eligible for Automated Retry - OPEN)
      const txn2 = await prisma.transaction.create({
        data: {
          id: 'TXN_10002',
          providerPaymentId: 'pay_TEST10002',
          merchantId: merchant.id,
          customerId: customerB.id,
          amount: 680000, // ₹6,800
          currency: 'INR',
          status: 'FAILED',
          paymentMethod: 'CARD',
          captured: false,
          customerDebited: false,
          riskStatus: 'HIGH',
          merchantSettlementStatus: 'UNSETTLED',
          failureReason: 'Insufficient customer funds during bank auth',
          retryCount: 0,
          createdAt: new Date(Date.now() - 3 * 3600 * 1000)
        }
      });
      txnCount++;

      const risk2 = await prisma.revenueRiskEvent.create({
        data: {
          transactionId: txn2.id,
          merchantId: merchant.id,
          riskType: 'PAYMENT_FAILED',
          riskLevel: 'Medium',
          amountAtRisk: 680000,
          reason: 'Payment failed due to insufficient customer funds.',
          status: 'OPEN',
          detectedAt: new Date(Date.now() - 3 * 3600 * 1000)
        }
      });
      riskCount++;

      const case2 = await prisma.recoveryCase.create({
        data: {
          riskEventId: risk2.id,
          transactionId: txn2.id,
          status: 'OPEN',
          priority: 'Medium',
          recommendedAction: 'REQUEST_CUSTOMER_RETRY'
        }
      });
      caseCount++;

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

      // Scenario 3: Repeated Failed Payment (Max Attempts Reached -> STOPPED)
      const txn3 = await prisma.transaction.create({
        data: {
          id: 'TXN_10003',
          providerPaymentId: 'pay_TEST10003',
          merchantId: merchant.id,
          customerId: customerC.id,
          amount: 1500000, // ₹15,000
          currency: 'INR',
          status: 'FAILED',
          paymentMethod: 'CARD',
          captured: false,
          customerDebited: false,
          riskStatus: 'HIGH',
          merchantSettlementStatus: 'UNSETTLED',
          failureReason: '3DS authentication declined repeatedly by issuer bank',
          retryCount: 3,
          createdAt: new Date(Date.now() - 8 * 3600 * 1000)
        }
      });
      txnCount++;

      const risk3 = await prisma.revenueRiskEvent.create({
        data: {
          transactionId: txn3.id,
          merchantId: merchant.id,
          riskType: 'PAYMENT_FAILED',
          riskLevel: 'High',
          amountAtRisk: 1500000,
          reason: 'Maximum 3 retry attempts exceeded.',
          status: 'STOPPED',
          detectedAt: new Date(Date.now() - 8 * 3600 * 1000)
        }
      });
      riskCount++;

      await prisma.recoveryCase.create({
        data: {
          riskEventId: risk3.id,
          transactionId: txn3.id,
          status: 'STOPPED',
          priority: 'High',
          recommendedAction: 'STOP_RECOVERY',
          attempts: 3,
          rejectionReason: 'Maximum 3 retry attempts exceeded.'
        }
      });
      caseCount++;

      // Scenario 4: High-Value Failed Payment (> ₹50,000 -> AWAITING_APPROVAL)
      const txn4 = await prisma.transaction.create({
        data: {
          id: 'TXN_10004',
          providerPaymentId: 'pay_TEST10004',
          merchantId: merchant.id,
          customerId: customerD.id,
          amount: 9800000, // ₹98,000
          currency: 'INR',
          status: 'FAILED',
          paymentMethod: 'CARD',
          captured: false,
          customerDebited: false,
          riskStatus: 'HIGH',
          merchantSettlementStatus: 'UNSETTLED',
          failureReason: 'Fraud risk filter triggered on high-value corporate card',
          retryCount: 0,
          createdAt: new Date(Date.now() - 5 * 3600 * 1000)
        }
      });
      txnCount++;

      const risk4 = await prisma.revenueRiskEvent.create({
        data: {
          transactionId: txn4.id,
          merchantId: merchant.id,
          riskType: 'PAYMENT_FAILED',
          riskLevel: 'High',
          amountAtRisk: 9800000,
          reason: 'High-value transaction failed. Exceeds ₹50,000 merchant approval threshold.',
          status: 'OPEN',
          detectedAt: new Date(Date.now() - 5 * 3600 * 1000)
        }
      });
      riskCount++;

      const case4 = await prisma.recoveryCase.create({
        data: {
          riskEventId: risk4.id,
          transactionId: txn4.id,
          status: 'AWAITING_APPROVAL',
          priority: 'High',
          recommendedAction: 'RETRY_PAYMENT',
          approvalRequired: true
        }
      });
      caseCount++;

      await prisma.aIDecision.create({
        data: {
          recoveryCaseId: case4.id,
          rootCause: 'HIGH_VALUE_HOLD',
          riskLevel: 'HIGH',
          confidence: 0.85,
          recommendedAction: 'RETRY_PAYMENT',
          reasoningSummary: 'High value transaction. Guardrails hold automated charge until explicit merchant sign-off.',
          priority: 'URGENT',
          shouldEscalate: false,
          stopRecovery: false,
          merchantMessage: 'Transaction ₹98,000 requires merchant approval before automated retry.',
          decisionSource: 'RULE_ENGINE',
          model: 'gpt-4o'
        }
      });

      // Scenario 5: Authorized but Uncaptured (Uncertain State -> VERIFY_PAYMENT)
      const txn5 = await prisma.transaction.create({
        data: {
          id: 'TXN_10005',
          providerPaymentId: 'pay_TEST10005',
          merchantId: merchant.id,
          customerId: customerE.id,
          amount: 2200000, // ₹22,000
          currency: 'INR',
          status: 'AUTHORIZED',
          paymentMethod: 'NETBANKING',
          captured: false,
          customerDebited: true,
          riskStatus: 'MEDIUM',
          merchantSettlementStatus: 'PENDING',
          createdAt: new Date(Date.now() - 10 * 3600 * 1000)
        }
      });
      txnCount++;

      const risk5 = await prisma.revenueRiskEvent.create({
        data: {
          transactionId: txn5.id,
          merchantId: merchant.id,
          riskType: 'CHECKOUT_ABANDONED',
          riskLevel: 'Medium',
          amountAtRisk: 2200000,
          reason: 'Customer account authorized but capture callback pending.',
          status: 'OPEN',
          detectedAt: new Date(Date.now() - 9 * 3600 * 1000)
        }
      });
      riskCount++;

      await prisma.recoveryCase.create({
        data: {
          riskEventId: risk5.id,
          transactionId: txn5.id,
          status: 'ACTION_RECOMMENDED',
          priority: 'Medium',
          recommendedAction: 'VERIFY_PAYMENT'
        }
      });
      caseCount++;

      // Scenario 6: Captured but Settlement Pending (VERIFY_SETTLEMENT - MONITORING)
      const txn6 = await prisma.transaction.create({
        data: {
          id: 'TXN_10006',
          providerPaymentId: 'pay_TEST10006',
          merchantId: merchant.id,
          customerId: customerA.id,
          amount: 4500000, // ₹45,000
          currency: 'INR',
          status: 'CAPTURED',
          paymentMethod: 'NETBANKING',
          captured: true,
          customerDebited: true,
          riskStatus: 'MEDIUM',
          merchantSettlementStatus: 'PENDING',
          createdAt: new Date(Date.now() - 18 * 3600 * 1000)
        }
      });
      txnCount++;

      const risk6 = await prisma.revenueRiskEvent.create({
        data: {
          transactionId: txn6.id,
          merchantId: merchant.id,
          riskType: 'SETTLEMENT_PENDING',
          riskLevel: 'Medium',
          amountAtRisk: 4500000,
          reason: 'Payment captured on gateway but merchant settlement is pending bank reconciliation.',
          status: 'MONITORING',
          detectedAt: new Date(Date.now() - 17 * 3600 * 1000)
        }
      });
      riskCount++;

      await prisma.recoveryCase.create({
        data: {
          riskEventId: risk6.id,
          transactionId: txn6.id,
          status: 'MONITORING',
          priority: 'Medium',
          recommendedAction: 'VERIFY_SETTLEMENT'
        }
      });
      caseCount++;

      // Scenario 7: Successfully Verified Recovery (VERIFIED_RECOVERED -> Recovered Revenue)
      const txn7 = await prisma.transaction.create({
        data: {
          id: 'TXN_10007',
          providerPaymentId: 'pay_TEST10007',
          merchantId: merchant.id,
          customerId: customerB.id,
          amount: 11250000, // ₹1,12,500
          currency: 'INR',
          status: 'SETTLEMENT_PROCESSED',
          paymentMethod: 'CARD',
          captured: true,
          customerDebited: true,
          riskStatus: 'LOW',
          merchantSettlementStatus: 'PROCESSED',
          createdAt: new Date(Date.now() - 48 * 3600 * 1000)
        }
      });
      txnCount++;

      const risk7 = await prisma.revenueRiskEvent.create({
        data: {
          transactionId: txn7.id,
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
      riskCount++;

      const case7 = await prisma.recoveryCase.create({
        data: {
          riskEventId: risk7.id,
          transactionId: txn7.id,
          status: 'VERIFIED_RECOVERED',
          priority: 'Low',
          recommendedAction: 'VERIFY_SETTLEMENT'
        }
      });
      caseCount++;

      await prisma.recoveryAction.create({
        data: {
          recoveryCaseId: case7.id,
          paymentId: txn7.providerPaymentId,
          actionType: 'VERIFY_SETTLEMENT',
          status: 'SUCCESS',
          verificationStatus: 'VERIFIED',
          result: 'Settlement confirmed with bank reconciliation.',
          amount: txn7.amount,
          completedAt: new Date(Date.now() - 12 * 3600 * 1000)
        }
      });

      // Scenario 8: Escalated to Human Queue (ESCALATED)
      const txn8 = await prisma.transaction.create({
        data: {
          id: 'TXN_10008',
          providerPaymentId: 'pay_TEST10008',
          merchantId: merchant.id,
          customerId: customerC.id,
          amount: 12000000, // ₹1,20,000
          currency: 'INR',
          status: 'FAILED',
          paymentMethod: 'CARD',
          captured: false,
          customerDebited: false,
          riskStatus: 'CRITICAL',
          merchantSettlementStatus: 'UNSETTLED',
          failureReason: 'Critical compliance & fraud risk flag',
          retryCount: 1,
          createdAt: new Date(Date.now() - 12 * 3600 * 1000)
        }
      });
      txnCount++;

      const risk8 = await prisma.revenueRiskEvent.create({
        data: {
          transactionId: txn8.id,
          merchantId: merchant.id,
          riskType: 'PAYMENT_FAILED',
          riskLevel: 'High',
          amountAtRisk: 12000000,
          reason: 'Severe card security flag. Escalated directly to compliance queue.',
          status: 'ESCALATED',
          detectedAt: new Date(Date.now() - 11 * 3600 * 1000)
        }
      });
      riskCount++;

      await prisma.recoveryCase.create({
        data: {
          riskEventId: risk8.id,
          transactionId: txn8.id,
          status: 'ESCALATED',
          priority: 'High',
          recommendedAction: 'ESCALATE'
        }
      });
      caseCount++;

      // Populate Notifications
      await prisma.notification.createMany({
        data: [
          {
            merchantId: merchant.id,
            type: 'HUMAN_APPROVAL_REQUIRED',
            title: 'Approval Required: ₹98,000 High-Value Recovery',
            message: 'TXN_10004 - ₹98,000 recovery proposed. Awaiting merchant confirmation.',
            severity: 'warning',
            read: false
          },
          {
            merchantId: merchant.id,
            type: 'RECOVERY_COMPLETED',
            title: 'Payment Recovery Verified: ₹1,12,500',
            message: 'TXN_10007 - ₹1,12,500 settlement reconciliation verified and processed.',
            severity: 'success',
            read: true
          },
          {
            merchantId: merchant.id,
            type: 'RECOVERY_ESCALATED',
            title: 'Case Escalated to Compliance Queue',
            message: 'TXN_10008 - Critical fraud risk detected. Routed to merchant compliance review.',
            severity: 'error',
            read: false
          }
        ]
      });

      // Populate Audit Logs
      await prisma.auditLog.createMany({
        data: [
          {
            merchantId: merchant.id,
            transactionId: 'TXN_10001',
            eventType: 'PAYMENT_SYNC_COMPLETED',
            actor: 'SYSTEM',
            description: 'Payment TXN_10001 (₹12,500) synchronized from Razorpay Test Mode.'
          },
          {
            merchantId: merchant.id,
            transactionId: 'TXN_10004',
            eventType: 'APPROVAL_REQUIRED',
            actor: 'SYSTEM',
            description: 'Guardrail hold: TXN_10004 (₹98,000) exceeds ₹50,000 auto threshold. Awaiting approval.'
          },
          {
            merchantId: merchant.id,
            transactionId: 'TXN_10007',
            eventType: 'RECOVERY_VERIFIED',
            actor: 'SYSTEM',
            description: 'Recovery verified successfully for payment TXN_10007. Recovered amount: ₹1,12,500.'
          }
        ]
      });

      const summary = await revenueRiskService.getSummary(merchant.id);

      return res.json({
        success: true,
        transactions_created: txnCount,
        risk_cases_created: riskCount,
        recovery_cases_created: caseCount,
        summary
      });
    } catch (error) {
      console.error('testController.seedData error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'SEED_ERROR', message: error.message }
      });
    }
  }
};
