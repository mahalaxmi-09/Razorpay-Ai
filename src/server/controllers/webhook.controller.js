import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { riskRulesService } from '../services/risk-rules.service.js';

export const webhookController = {
  handleRazorpayWebhook: async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      // 1. Signature validation using the raw body buffer
      if (!signature) {
        return res.status(401).json({ success: false, error: 'Signature header is missing.' });
      }

      if (!req.rawBody) {
        return res.status(400).json({ success: false, error: 'Raw request body is missing.' });
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('Webhook signature check failed.');
        return res.status(403).json({ success: false, error: 'Webhook signature is invalid.' });
      }

      // 2. Idempotency Check using Razorpay event ID
      const eventId = req.body.id;
      if (!eventId) {
        return res.status(400).json({ success: false, error: 'Event identifier is missing.' });
      }

      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { externalEventId: eventId }
      });

      if (existingEvent) {
        console.info(`Duplicate webhook event ignored: ${eventId}`);
        return res.status(200).json({ success: true, message: 'Event already processed.' });
      }

      // 3. Store event with RECEIVED status
      const payloadHash = crypto.createHash('md5').update(req.rawBody).digest('hex');
      const webhookEventRecord = await prisma.webhookEvent.create({
        data: {
          externalEventId: eventId,
          eventType: req.body.event,
          payloadHash,
          status: 'RECEIVED'
        }
      });

      // 4. Respond immediately with success
      res.status(200).json({ success: true, message: 'Event received, processing queued.' });

      // 5. Asynchronous background execution
      // Fire-and-forget style to prevent network timeout
      processWebhookEventAsync(webhookEventRecord.id, req.body).catch(err => {
        console.error('Error in background webhook processing:', err);
      });

    } catch (error) {
      console.error('webhookController.handleRazorpayWebhook error:', error.message);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, error: 'Internal server error processing webhook.' });
      }
    }
  }
};

// Asynchronous worker function
async function processWebhookEventAsync(dbEventId, payload) {
  try {
    const eventType = payload.event;
    const paymentData = payload.payload?.payment?.entity;
    
    if (!paymentData) {
      await prisma.webhookEvent.update({
        where: { id: dbEventId },
        data: { status: 'PROCESSED', processedAt: new Date() }
      });
      return;
    }

    const externalPaymentId = paymentData.id;
    const amountInPaise = paymentData.amount; // Razorpay sends values in smallest unit (e.g. paise)
    const currency = paymentData.currency || 'INR';
    const email = paymentData.email || 'unknown@customer.com';
    const name = email.split('@')[0];
    const phone = paymentData.contact || null;
    const externalOrderId = paymentData.order_id || null;
    const method = paymentData.method || null;
    const failureReason = paymentData.error_description || null;

    // 1. Find or create User and Customer (mock/sandbox default context)
    // Create Default User if not exists
    let systemUser = await prisma.user.findFirst();
    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          name: 'Mounika Merchant',
          email: 'mounika@razorrecover.ai'
        }
      });
    }

    // Create Default Merchant if not exists
    let merchant = await prisma.merchant.findFirst();
    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          userId: systemUser.id,
          name: 'RazorRecover Merchant Store',
          email: 'store@razorrecover.ai'
        }
      });
    }

    // Upsert Customer
    let customer = await prisma.customer.findUnique({
      where: { email }
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name, email, phone }
      });
    }

    // 2. Map Payment Statuses
    let status = 'PENDING';
    let settlementStatus = null;
    
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      status = 'CAPTURED';
      settlementStatus = 'PENDING'; // Default captured state requires verification
    } else if (eventType === 'payment.failed') {
      status = 'FAILED';
    }

    // Upsert Transaction
    // Generate internal custom ID or use the external payment ID
    const txnId = `TXN_${Date.now()}`;
    const transaction = await prisma.transaction.create({
      data: {
        id: txnId,
        externalPaymentId,
        externalOrderId,
        customerId: customer.id,
        merchantId: merchant.id,
        amount: amountInPaise,
        currency,
        status,
        method,
        capturedAt: status === 'CAPTURED' ? new Date() : null,
        failureReason,
        settlementStatus,
        rawEventReference: JSON.stringify(payload)
      }
    });

    // Write audit log for payment ingestion
    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        transactionId: transaction.id,
        eventType: 'PAYMENT_RECEIVED',
        actor: 'SYSTEM',
        description: `Payment ${externalPaymentId} of ${currency} ${(amountInPaise / 100).toFixed(2)} received with status ${status}.`
      }
    });

    // 3. Evaluate risk rules dynamically
    const evaluation = riskRulesService.evaluateTransaction(transaction);

    if (evaluation.createCase && evaluation.riskType) {
      // Create RevenueRiskEvent
      const riskEvent = await prisma.revenueRiskEvent.create({
        data: {
          transactionId: transaction.id,
          merchantId: merchant.id,
          riskType: evaluation.riskType,
          riskLevel: evaluation.riskLevel,
          amountAtRisk: amountInPaise,
          reason: evaluation.reason,
          status: 'OPEN'
        }
      });

      // Create RecoveryCase
      const recoveryCase = await prisma.recoveryCase.create({
        data: {
          riskEventId: riskEvent.id,
          transactionId: transaction.id,
          status: evaluation.riskType === 'SETTLEMENT_PENDING' ? 'MONITORING' : 'OPEN',
          recommendedAction: evaluation.recommendedAction,
          priority: evaluation.priority
        }
      });

      // Write audit log for risk detection
      await prisma.auditLog.create({
        data: {
          merchantId: merchant.id,
          transactionId: transaction.id,
          recoveryCaseId: recoveryCase.id,
          eventType: 'RISK_DETECTED',
          actor: 'SYSTEM',
          description: `Risk event ${evaluation.riskType} detected. Priority: ${evaluation.priority}. Recommended Action: ${evaluation.recommendedAction}.`
        }
      });

      // Create Notification alert
      await prisma.notification.create({
        data: {
          merchantId: merchant.id,
          type: evaluation.riskType === 'SETTLEMENT_PENDING' ? 'RECOVERY_PENDING' : 'ACTION_REQUIRED',
          title: evaluation.riskType === 'SETTLEMENT_PENDING' ? 'Settlement Verification Pending' : 'Payment Recovery Required',
          message: `Case created for transaction ${transaction.id}. Recommended: ${evaluation.recommendedAction}.`,
          severity: evaluation.riskLevel === 'High' ? 'error' : 'warning'
        }
      });
    }

    // 4. Mark WebhookEvent as processed successfully
    await prisma.webhookEvent.update({
      where: { id: dbEventId },
      data: { status: 'PROCESSED', processedAt: new Date() }
    });

  } catch (error) {
    console.error(`Error processing webhook event in background (Event DB ID: ${dbEventId}):`, error);
    await prisma.webhookEvent.update({
      where: { id: dbEventId },
      data: { status: 'ERROR' }
    });
  }
}
