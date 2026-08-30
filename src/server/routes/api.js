import express from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { analyticsController } from '../controllers/analytics.controller.js';
import { alertController } from '../controllers/alert.controller.js';
import { auditController } from '../controllers/audit.controller.js';
import { webhookController } from '../controllers/webhook.controller.js';

const router = express.Router();

// Dashboard Endpoints
router.get('/dashboard/summary', dashboardController.getSummary);
router.get('/dashboard/activity', dashboardController.getActivity);

// Payments Endpoints
router.get('/payments', paymentController.getPayments);
router.get('/payments/risk', paymentController.getRiskPayments);
router.get('/payments/settlements', paymentController.getSettlements);
router.get('/payments/:id', paymentController.getPaymentById);
router.get('/payments/:id/status', paymentController.getPaymentStatus);

// Analytics Endpoints
router.get('/analytics/recovery', analyticsController.getRecoveryAnalytics);

// Notification Alerts Endpoints
router.get('/alerts', alertController.getAlerts);
router.post('/alerts/:id/read', alertController.markAsRead);

// System Audit Logs Endpoints
router.get('/audit-logs', auditController.getAuditLogs);

// Razorpay Webhook Ingestion Endpoint
router.post('/webhooks/razorpay', webhookController.handleRazorpayWebhook);

export default router;
```
