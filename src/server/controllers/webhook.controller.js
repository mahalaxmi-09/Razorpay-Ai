import { prisma } from '../config/db.js';
import { razorpayService } from '../services/razorpay.service.js';
import { revenueRiskService } from '../services/revenueRisk.service.js';

export const webhookController = {
  handleRazorpayWebhook: async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const rawBody = req.rawBody;

      // 1. Signature Verification
      if (!signature || !rawBody) {
        return res.status(403).json({
          success: false,
          error: { code: 'INVALID_SIGNATURE', message: 'Missing webhook signature or raw body.' }
        });
      }

      const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('🚨 Unauthorized webhook attempt: Signature verification failed.');
        return res.status(403).json({
          success: false,
          error: { code: 'SIGNATURE_VERIFICATION_FAILED', message: 'HMAC signature mismatch.' }
        });
      }

      const payload = req.body;
      const eventType = payload.event;
      const eventId = payload.event_id || req.headers['x-razorpay-event-id'] || `EVT_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // 2. Idempotency Check
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { externalEventId: eventId }
      });

      if (existingEvent && existingEvent.processed) {
        return res.status(200).json({
          success: true,
          message: 'Event already processed (Idempotent).'
        });
      }

      // Save initial Webhook record
      const webhookRecord = await prisma.webhookEvent.upsert({
        where: { externalEventId: eventId },
        update: {},
        create: {
          externalEventId: eventId,
          eventType,
          payload: JSON.stringify(payload),
          signature,
          processed: false
        }
      });

      // 3. Process Event Data
      const entity = payload.payload?.payment?.entity || payload.payload?.settlement?.entity;

      if (entity) {
        let user = await prisma.user.findFirst();
        if (!user) user = await prisma.user.create({ data: { name: 'Merchant', email: 'merchant@razorrecover.ai' } });

        let merchant = await prisma.merchant.findFirst();
        if (!merchant) merchant = await prisma.merchant.create({ data: { userId: user.id, name: 'Store', email: 'merchant@razorrecover.ai' } });

        const normalized = razorpayService.normalizePayment(entity);

        if (normalized) {
          // Upsert customer
          let customer = await prisma.customer.findUnique({ where: { email: normalized.customerEmail } });
          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                name: normalized.customerEmail.split('@')[0],
                email: normalized.customerEmail,
                phone: normalized.customerContact
              }
            });
          }

          const existingTxn = await prisma.transaction.findFirst({
            where: {
              OR: [
                { id: normalized.providerPaymentId },
                { providerPaymentId: normalized.providerPaymentId }
              ]
            }
          });

          let savedTxn;
          if (existingTxn) {
            savedTxn = await prisma.transaction.update({
              where: { id: existingTxn.id },
              data: {
                status: normalized.status,
                captured: normalized.captured,
                customerDebited: normalized.customerDebited,
                merchantSettlementStatus: normalized.merchantSettlementStatus,
                riskStatus: normalized.riskStatus,
                failureReason: normalized.failureReason
              }
            });
          } else {
            savedTxn = await prisma.transaction.create({
              data: {
                id: normalized.providerPaymentId,
                provider: 'RAZORPAY_TEST',
                providerPaymentId: normalized.providerPaymentId,
                providerOrderId: normalized.providerOrderId,
                merchantId: merchant.id,
                customerId: customer.id,
                amount: normalized.amount,
                currency: normalized.currency,
                status: normalized.status,
                paymentMethod: normalized.paymentMethod,
                captured: normalized.captured,
                customerDebited: normalized.customerDebited,
                riskStatus: normalized.riskStatus,
                merchantSettlementStatus: normalized.merchantSettlementStatus,
                failureReason: normalized.failureReason,
                createdAt: normalized.createdAt
              }
            });
          }

          // Trigger Risk Evaluation
          await revenueRiskService.processTransactionRisk(savedTxn);
        }
      }

      // Mark Webhook as Processed
      await prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: { processed: true }
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          merchantId: (await prisma.merchant.findFirst())?.id || 'SYSTEM',
          eventType: 'WEBHOOK_PROCESSED',
          actor: 'SYSTEM',
          description: `Razorpay webhook ${eventType} (${eventId}) processed successfully.`
        }
      });

      return res.status(200).json({
        success: true,
        message: `Webhook ${eventType} processed.`
      });
    } catch (error) {
      console.error('webhookController.handleRazorpayWebhook error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'WEBHOOK_ERROR', message: 'Failed to process webhook.' }
      });
    }
  }
};
