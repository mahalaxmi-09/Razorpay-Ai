import { prisma } from '../config/db.js';
import { paymentProviderService } from '../services/paymentProvider.service.js';
import { revenueRiskService } from '../services/revenueRisk.service.js';
import { settlementService } from '../services/settlement.service.js';

// Map database record to clean UI model
const mapPayment = (t) => ({
  id: t.id,
  providerPaymentId: t.providerPaymentId || t.externalTransactionId,
  customer: t.customer ? t.customer.name : 'Customer',
  email: t.customer ? t.customer.email : '',
  phone: t.customer ? t.customer.phone : '',
  amount: Number(t.amount) / 100, // standard display units
  rawAmount: t.amount,
  currency: t.currency,
  status: t.status === 'CAPTURED'
    ? (t.merchantSettlementStatus === 'PENDING' ? 'Settlement Pending' : 'Recovered')
    : (t.status === 'FAILED' ? 'Payment Failed' : (t.status === 'SETTLEMENT_PROCESSED' ? 'Recovered' : t.status)),
  rawStatus: t.status,
  paymentMethod: t.paymentMethod,
  customerDebited: t.customerDebited ? 'Yes' : 'No',
  merchantSettlement: t.merchantSettlementStatus === 'PROCESSED' ? 'Settled' : (t.merchantSettlementStatus === 'PENDING' ? 'Pending' : 'Unsettled'),
  merchantSettlementStatus: t.merchantSettlementStatus,
  failureReason: t.failureReason,
  retryCount: t.retryCount,
  risk: t.riskStatus === 'CRITICAL' ? 'High' : (t.riskStatus === 'HIGH' ? 'High' : (t.riskStatus === 'MEDIUM' ? 'Medium' : 'Low')),
  riskStatus: t.riskStatus,
  recommendation: t.status === 'FAILED'
    ? (t.retryCount >= 3 ? 'Stop Recovery' : 'Trigger Payment Recovery')
    : (t.merchantSettlementStatus === 'PENDING' ? 'Verify Settlement' : 'No Action Required'),
  aiConfidence: t.status === 'FAILED' ? '91%' : '94%',
  date: t.createdAt.toISOString().replace('T', ' ').substring(0, 16),
  createdAt: t.createdAt
});

export const paymentController = {
  // 1. Get Payments (with filtering by status, riskStatus, settlementStatus, search, page)
  getPayments: async (req, res) => {
    try {
      const { status, riskStatus, settlementStatus, currency, search, page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const take = parseInt(limit, 10);

      const where = {};
      if (status) {
        if (status.toLowerCase() === 'failed') where.status = 'FAILED';
        else if (status.toLowerCase() === 'captured') where.status = 'CAPTURED';
        else if (status.toLowerCase() === 'recovered') where.status = { in: ['SETTLEMENT_PROCESSED', 'CAPTURED'] };
        else where.status = status.toUpperCase();
      }
      if (riskStatus) where.riskStatus = riskStatus.toUpperCase();
      if (settlementStatus) where.merchantSettlementStatus = settlementStatus.toUpperCase();
      if (currency) where.currency = currency.toUpperCase();
      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { providerPaymentId: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { email: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [payments, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { customer: true }
        }),
        prisma.transaction.count({ where })
      ]);

      return res.json(payments.map(mapPayment));
    } catch (error) {
      console.error('paymentController.getPayments error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve payment records.' }
      });
    }
  },

  // 2. Get Single Payment by ID
  getPaymentById: async (req, res) => {
    try {
      const { paymentId } = req.params;
      const transaction = await prisma.transaction.findFirst({
        where: {
          OR: [
            { id: paymentId },
            { providerPaymentId: paymentId }
          ]
        },
        include: {
          customer: true,
          revenueRiskEvents: true,
          recoveryCases: {
            include: {
              aiDecisions: true,
              recoveryActions: true
            }
          },
          auditLogs: { orderBy: { createdAt: 'desc' } }
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: { code: 'PAYMENT_NOT_FOUND', message: `Payment ${paymentId} not found.` }
        });
      }

      return res.json({
        success: true,
        data: {
          ...mapPayment(transaction),
          riskEvents: transaction.revenueRiskEvents,
          recoveryCases: transaction.recoveryCases,
          auditLogs: transaction.auditLogs
        }
      });
    } catch (error) {
      console.error('paymentController.getPaymentById error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch payment details.' }
      });
    }
  },

  // 3. Get Payment Status Only
  getPaymentStatus: async (req, res) => {
    try {
      const { paymentId } = req.params;
      const transaction = await prisma.transaction.findFirst({
        where: {
          OR: [{ id: paymentId }, { providerPaymentId: paymentId }]
        },
        select: {
          id: true,
          providerPaymentId: true,
          status: true,
          captured: true,
          customerDebited: true,
          merchantSettlementStatus: true,
          riskStatus: true,
          failureReason: true
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Payment ${paymentId} not found.` }
        });
      }

      return res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('paymentController.getPaymentStatus error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch status.' }
      });
    }
  },

  // 4. Synchronize Razorpay TEST Payments
  syncPayments: async (req, res) => {
    try {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: { name: 'Mounika Merchant', email: 'mounika@razorrecover.ai' }
        });
      }

      let merchant = await prisma.merchant.findFirst();
      if (!merchant) {
        merchant = await prisma.merchant.create({
          data: { userId: user.id, name: 'Mounika Enterprises', email: 'mounika@razorrecover.ai' }
        });
      }

      // Record sync start in audit log
      await prisma.auditLog.create({
        data: {
          merchantId: merchant.id,
          eventType: 'PAYMENT_SYNC_STARTED',
          actor: 'SYSTEM',
          description: 'Razorpay TEST payment sync initiated.'
        }
      });

      // Fetch payments from Razorpay test provider
      const providerResult = await paymentProviderService.fetchPayments({ count: 50 });
      const rawPayments = providerResult.items || [];

      let newRecords = 0;
      let updatedRecords = 0;
      let riskCasesCreated = 0;

      for (const p of rawPayments) {
        if (!p.providerPaymentId) continue;

        // Upsert customer
        let customer = await prisma.customer.findUnique({
          where: { email: p.customerEmail }
        });
        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              name: p.customerEmail.split('@')[0],
              email: p.customerEmail,
              phone: p.customerContact
            }
          });
        }

        const existing = await prisma.transaction.findFirst({
          where: {
            OR: [
              { id: p.providerPaymentId },
              { providerPaymentId: p.providerPaymentId }
            ]
          }
        });

        let savedTransaction;
        if (existing) {
          savedTransaction = await prisma.transaction.update({
            where: { id: existing.id },
            data: {
              status: p.status,
              captured: p.captured,
              customerDebited: p.customerDebited,
              merchantSettlementStatus: p.merchantSettlementStatus,
              riskStatus: p.riskStatus,
              failureReason: p.failureReason
            }
          });
          updatedRecords++;
        } else {
          savedTransaction = await prisma.transaction.create({
            data: {
              id: p.providerPaymentId,
              provider: 'RAZORPAY_TEST',
              providerPaymentId: p.providerPaymentId,
              providerOrderId: p.providerOrderId,
              merchantId: merchant.id,
              customerId: customer.id,
              amount: p.amount,
              currency: p.currency,
              status: p.status,
              paymentMethod: p.paymentMethod,
              captured: p.captured,
              customerDebited: p.customerDebited,
              riskStatus: p.riskStatus,
              merchantSettlementStatus: p.merchantSettlementStatus,
              failureReason: p.failureReason,
              createdAt: p.createdAt
            }
          });
          newRecords++;
        }

        // Run revenue risk detection
        const riskResult = await revenueRiskService.processTransactionRisk(savedTransaction);
        if (riskResult && riskResult.recoveryCase) {
          riskCasesCreated++;
        }
      }

      // Record sync completion in audit log
      await prisma.auditLog.create({
        data: {
          merchantId: merchant.id,
          eventType: 'PAYMENT_SYNC_COMPLETED',
          actor: 'SYSTEM',
          description: `Razorpay sync finished. Processed: ${rawPayments.length}, New: ${newRecords}, Updated: ${updatedRecords}, Risk Cases: ${riskCasesCreated}.`
        }
      });

      return res.json({
        success: true,
        processed: rawPayments.length,
        new_records: newRecords,
        updated_records: updatedRecords,
        risk_cases_created: riskCasesCreated
      });
    } catch (error) {
      console.error('paymentController.syncPayments error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'SYNC_ERROR', message: `Payment synchronization failed: ${error.message}` }
      });
    }
  },

  // 5. Verify Settlement
  verifySettlement: async (req, res) => {
    try {
      const { paymentId } = req.params;
      const result = await settlementService.verifySettlement(paymentId);
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('paymentController.verifySettlement error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'VERIFICATION_ERROR', message: error.message }
      });
    }
  }
};
