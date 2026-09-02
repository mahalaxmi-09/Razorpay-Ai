import { prisma } from '../config/db.js';

/**
 * Notification Engine Service
 * 
 * Creates and logs alerts for risk events, guardrail blocks, escalations, and successful recovery workflows.
 */

export const notificationService = {
  createNotification: async ({
    merchantId,
    type,
    title,
    message,
    severity = 'info'
  }) => {
    try {
      let targetMerchantId = merchantId;

      if (!targetMerchantId) {
        const defaultMerchant = await prisma.merchant.findFirst();
        if (defaultMerchant) {
          targetMerchantId = defaultMerchant.id;
        } else {
          return null;
        }
      }

      return await prisma.notification.create({
        data: {
          merchantId: targetMerchantId,
          type,
          title,
          message,
          severity,
          read: false
        }
      });
    } catch (error) {
      console.error('notificationService.createNotification error:', error.message);
      return null;
    }
  }
};
