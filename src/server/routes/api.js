import express from 'express';
import multer from 'multer';

import { paymentController } from '../controllers/payment.controller.js';
import { transactionController } from '../controllers/transaction.controller.js';
import { webhookController } from '../controllers/webhook.controller.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { analyticsController } from '../controllers/analytics.controller.js';
import { alertController } from '../controllers/alert.controller.js';
import { auditController } from '../controllers/audit.controller.js';
import { recoveryController } from '../controllers/recovery.controller.js';
import { copilotController } from '../controllers/copilot.controller.js';
import { healthController } from '../controllers/health.controller.js';
import { testController } from '../controllers/test.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// 1. Health & Connection Checks
router.get('/health', healthController.getHealth);
router.get('/razorpay/test-connection', healthController.testRazorpayConnection);

// 2. Development Test Data Seed
router.post('/test/seed', testController.seedData);

// 3. Razorpay TEST Mode Payments Ingestion & Sync
router.get('/payments', paymentController.getPayments);
router.get('/payments/:paymentId', paymentController.getPaymentById);
router.get('/payments/:paymentId/status', paymentController.getPaymentStatus);
router.post('/payments/sync', paymentController.syncPayments);
router.post('/payments/verify-settlement/:paymentId', paymentController.verifySettlement);

// 4. Webhooks (Razorpay TEST Mode)
router.post('/webhooks/razorpay', webhookController.handleRazorpayWebhook);

// 5. REST Transactions & CSV Upload
router.post('/transactions', transactionController.createTransaction);
router.post('/transactions/import', upload.single('file'), transactionController.importCsv);
router.get('/transactions', paymentController.getPayments);
router.get('/transactions/:id', paymentController.getPaymentById);

// 6. Recovery Workflows & Simulation
router.get('/recovery/cases', recoveryController.getCases);
router.get('/recovery/cases/:id', recoveryController.getCaseById);
router.post('/recovery/cases/:id/analyze', recoveryController.analyzeCase);
router.post('/recovery/cases/:id/simulate', recoveryController.simulateAction);
router.post('/recovery/cases/:id/execute', recoveryController.simulateAction);
router.post('/recovery/cases/:id/verify', paymentController.verifySettlement);
router.post('/recovery/cases/:id/escalate', recoveryController.escalateCase);
router.post('/recovery/cases/:id/stop', recoveryController.stopCase);

// 7. Dashboard Endpoints
router.get('/dashboard/summary', dashboardController.getSummary);
router.get('/dashboard/activity', dashboardController.getActivity);

// 8. Analytics Endpoints
router.get('/analytics/recovery', analyticsController.getRecoveryAnalytics);
router.get('/analytics/performance', analyticsController.getRecoveryAnalytics);
router.post('/analytics/what-if', analyticsController.analyzeWhatIf);

// 9. Notifications / Alerts
router.get('/alerts', alertController.getAlerts);
router.post('/alerts/:id/read', alertController.markAsRead);

// 10. System Audit Logs
router.get('/audit-logs', auditController.getAuditLogs);

// 11. AI Copilot
router.post('/copilot', copilotController.askCopilot);

export default router;
