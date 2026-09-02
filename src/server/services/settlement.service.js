import { prisma } from '../config/db.js';
import { paymentProviderService } from './paymentProvider.service.js';

/**
 * Settlement Verification Service
 * 
 * Verifies gateway settlement states against internal records.
 * Uses accurate status designations without claiming premature bank credit.
 */

export const settlementService = {
  verifySettlement: async (transactionId) => {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found.`);
      }

      let verificationStatus = 'SETTLEMENT_PENDING';
      let message = 'Payment captured, settlement not yet confirmed by gateway.';

      if (transaction.status === 'FAILED') {
        verificationStatus = 'PAYMENT_FAILED';
        message = 'Payment authorization failed. No settlement scheduled.';
      } else if (transaction.merchantSettlementStatus === 'PROCESSED') {
        verificationStatus = 'SETTLEMENT_PROCESSED';
        message = 'Settlement processed according to provider data.';
      } else if (transaction.status === 'CAPTURED' && transaction.merchantSettlementStatus === 'PENDING') {
        // Query provider if providerPaymentId is present
        if (transaction.providerPaymentId) {
          try {
            const providerData = await paymentProviderService.fetchPayment(transaction.providerPaymentId);
            if (providerData && providerData.merchantSettlementStatus === 'PROCESSED') {
              verificationStatus = 'SETTLEMENT_PROCESSED';
              message = 'Settlement processed according to provider data.';

              await prisma.transaction.update({
                where: { id: transaction.id },
                data: { merchantSettlementStatus: 'PROCESSED' }
              });
            }
          } catch (e) {
            verificationStatus = 'SETTLEMENT_NOT_CONFIRMED';
            message = 'Gateway reconciliation query returned unconfirmed settlement status.';
          }
        }
      }

      // Record audit log
      await prisma.auditLog.create({
        data: {
          merchantId: transaction.merchantId,
          transactionId: transaction.id,
          eventType: 'SETTLEMENT_VERIFIED',
          actor: 'SYSTEM',
          description: `Settlement check on ${transaction.id}: ${verificationStatus}. ${message}`
        }
      });

      return {
        transactionId: transaction.id,
        verificationStatus,
        message,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('settlementService.verifySettlement error:', error.message);
      throw error;
    }
  }
};
