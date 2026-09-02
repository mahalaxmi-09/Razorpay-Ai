import express from 'express';
import multer from 'multer';

import { transactionController } from '../controllers/transaction.controller.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { analyticsController } from '../controllers/analytics.controller.js';
import { alertController } from '../controllers/alert.controller.js';
import { auditController } from '../controllers/audit.controller.js';
import { recoveryController } from '../controllers/recovery.controller.js';
import { copilotController } from '../controllers/copilot.controller.js';
import { healthController } from '../controllers/health.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max CSV

// 1. Health Endpoint
router.get('/health', healthController.getHealth);

// 2. Transaction Ingestion & Queries
router.post('/transactions', transactionController.createTransaction);
router.post('/transactions/import', upload.single('file'), transactionController.importCsv);
router.get('/transactions', transactionController.getTransactions);
router.get('/transactions/:id', transactionController.getTransactionById);

// 3. Recovery Workflows & Simulation
router.get('/recovery/cases', recoveryController.getCases);
router.get('/recovery/cases/:id', recoveryController.getCaseById);
router.post('/recovery/cases/:id/analyze', recoveryController.analyzeCase);
router.post('/recovery/cases/:id/simulate', recoveryController.simulateAction);
router.post('/recovery/cases/:id/escalate', recoveryController.escalateCase);
router.post('/recovery/cases/:id/stop', recoveryController.stopCase);

// 4. Dashboard Endpoints
router.get('/dashboard/summary', dashboardController.getSummary);
router.get('/dashboard/activity', dashboardController.getActivity);

// 5. Analytics Endpoints
router.get('/analytics/recovery', analyticsController.getRecoveryAnalytics);

// 6. Notifications / Alerts
router.get('/alerts', alertController.getAlerts);
router.post('/alerts/:id/read', alertController.markAsRead);

// 7. System Audit Logs
router.get('/audit-logs', auditController.getAuditLogs);

// 8. AI Copilot
router.post('/copilot', copilotController.askCopilot);

export default router;
