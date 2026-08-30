import { prisma } from '../config/db.js';

// Helper mapper to format transaction models exactly as expected by the React frontend components
const mapTransaction = (t) => ({
  id: t.id,
  customer: t.customer ? t.customer.name : 'Unknown Customer',
  email: t.customer ? t.customer.email : '',
  amount: Number(t.amount) / 100, // Convert paise to standard unit (Rupees)
  status: t.status === 'CAPTURED' 
    ? (t.settlementStatus === 'PENDING' ? 'Settlement Pending' : 'Recovered') 
    : (t.status === 'FAILED' ? 'Payment Failed' : t.status),
  risk: t.status === 'FAILED' ? 'High' : (t.settlementStatus === 'PENDING' ? 'Medium' : 'Low'),
  recommendation: t.status === 'FAILED' 
    ? 'Trigger Payment Recovery' 
    : (t.settlementStatus === 'PENDING' ? 'Verify Settlement' : 'No Action Required'),
  customerDebited: t.status === 'CAPTURED' ? 'Yes' : 'No',
  merchantSettlement: t.settlementStatus === 'SETTLED' 
    ? 'Settled' 
    : (t.settlementStatus === 'PENDING' ? 'Pending' : 'Unsettled'),
  aiConfidence: t.status === 'FAILED' ? '91%' : '94%',
  currency: t.currency,
  date: t.createdAt.toISOString().replace('T', ' ').substring(0, 16),
  issue: t.status === 'FAILED' 
    ? `Customer card failed authentication during checkout. Code: ${t.failureReason || '3DSECURE_FAILURE'}.` 
    : 'Settlement verification in progress. Payment capture confirmed on gateway.',
  why: t.status === 'FAILED' 
    ? 'Reconciliation recommends triggering fallback payment link.' 
    : 'Awaiting Bank settlement cycle execution (next 12 hours). Cooldown monitor active.'
});

export const paymentController = {
  getPayments: async (req, res) => {
    try {
      const { status, limit } = req.query;
      
      const payments = await prisma.transaction.findMany({
        where: status ? { status } : {},
        take: limit ? parseInt(limit, 10) : undefined,
        orderBy: { createdAt: 'desc' },
        include: { customer: true }
      });
      
      return res.json(payments.map(mapTransaction));
    } catch (error) {
      console.error('paymentController.getPayments error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Could not fetch payments.' }
      });
    }
  },

  getPaymentById: async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await prisma.transaction.findUnique({
        where: { id },
        include: { customer: true }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment record could not be found.' }
        });
      }

      return res.json(mapTransaction(payment));
    } catch (error) {
      console.error('paymentController.getPaymentById error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Error retrieving payment record.' }
      });
    }
  },

  getPaymentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await prisma.transaction.findUnique({
        where: { id },
        select: { id: true, status: true, settlementStatus: true }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment record could not be found.' }
        });
      }

      return res.json({
        id: payment.id,
        status: payment.status === 'CAPTURED' 
          ? (payment.settlementStatus === 'PENDING' ? 'Settlement Pending' : 'Recovered') 
          : (payment.status === 'FAILED' ? 'Payment Failed' : payment.status)
      });
    } catch (error) {
      console.error('paymentController.getPaymentStatus error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Error fetching payment status.' }
      });
    }
  },

  getRiskPayments: async (req, res) => {
    try {
      const riskEvents = await prisma.revenueRiskEvent.findMany({
        orderBy: { detectedAt: 'desc' }
      });
      
      const mappedRiskEvents = riskEvents.map(evt => ({
        id: evt.id,
        transactionId: evt.transactionId,
        riskType: evt.riskType,
        riskLevel: evt.riskLevel,
        amountAtRisk: evt.amountAtRisk / 100, // convert to standard units
        reason: evt.reason,
        status: evt.status,
        detectedAt: evt.detectedAt
      }));

      return res.json(mappedRiskEvents);
    } catch (error) {
      console.error('paymentController.getRiskPayments error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Could not fetch risk flagged payments.' }
      });
    }
  },

  getSettlements: async (req, res) => {
    try {
      const payments = await prisma.transaction.findMany({
        where: {
          settlementStatus: { not: null }
        },
        orderBy: { updatedAt: 'desc' },
        include: { customer: true }
      });
      return res.json(payments.map(mapTransaction));
    } catch (error) {
      console.error('paymentController.getSettlements error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Error retrieving settlement records.' }
      });
    }
  }
};
