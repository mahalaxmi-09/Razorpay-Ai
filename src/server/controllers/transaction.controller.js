import { z } from 'zod';
import { prisma } from '../config/db.js';
import { revenueRiskService } from '../services/revenueRisk.service.js';

// Zod Input Validation Schema
export const transactionInputSchema = z.object({
  id: z.string().optional(),
  externalTransactionId: z.string().optional(),
  externalOrderId: z.string().optional(),
  customerName: z.string().optional().default('Customer'),
  customerEmail: z.string().email().optional().default('customer@example.com'),
  customerPhone: z.string().optional(),
  amount: z.number().positive('Amount must be a positive integer in smallest unit'),
  currency: z.string().default('INR'),
  status: z.enum(['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'SETTLEMENT_PENDING', 'SETTLEMENT_PROCESSED', 'CANCELLED']),
  paymentMethod: z.string().default('UPI'),
  customerDebited: z.boolean().default(false),
  merchantSettlementStatus: z.enum(['PENDING', 'PROCESSED', 'FAILED', 'UNSETTLED']).default('PENDING'),
  failureReason: z.string().nullable().optional(),
  retryCount: z.number().int().min(0).default(0)
});

// Helper mapper for frontend compatibility
const mapTransaction = (t) => ({
  id: t.id,
  externalTransactionId: t.externalTransactionId,
  customer: t.customer ? t.customer.name : 'Unknown Customer',
  email: t.customer ? t.customer.email : '',
  phone: t.customer ? t.customer.phone : '',
  amount: Number(t.amount) / 100, // standard units for display
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
  risk: t.status === 'FAILED' ? 'High' : (t.merchantSettlementStatus === 'PENDING' ? 'Medium' : 'Low'),
  recommendation: t.status === 'FAILED'
    ? (t.retryCount >= 3 ? 'Stop Recovery' : 'Trigger Payment Recovery')
    : (t.merchantSettlementStatus === 'PENDING' ? 'Verify Settlement' : 'No Action Required'),
  aiConfidence: t.status === 'FAILED' ? '91%' : '94%',
  date: t.createdAt.toISOString().replace('T', ' ').substring(0, 16),
  createdAt: t.createdAt
});

export const transactionController = {
  // 1. Ingest Single Transaction
  createTransaction: async (req, res) => {
    try {
      const validation = transactionInputSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TRANSACTION',
            message: 'Transaction validation failed.',
            details: validation.error.format()
          }
        });
      }

      const data = validation.data;

      // Ensure default user and merchant exist
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: { name: 'Mounika Merchant', email: 'mounika@razorrecover.ai' }
        });
      }

      let merchant = await prisma.merchant.findFirst();
      if (!merchant) {
        merchant = await prisma.merchant.create({
          data: {
            userId: user.id,
            name: 'Mounika Enterprises',
            email: 'mounika@razorrecover.ai',
            defaultCurrency: data.currency || 'INR'
          }
        });
      }

      // Upsert Customer
      let customer = await prisma.customer.findUnique({
        where: { email: data.customerEmail }
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: data.customerName,
            email: data.customerEmail,
            phone: data.customerPhone
          }
        });
      }

      const txnId = data.id || `TXN_${Date.now()}`;

      // Check for duplicates
      const existing = await prisma.transaction.findUnique({
        where: { id: txnId }
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_TRANSACTION',
            message: `Transaction ${txnId} already exists.`
          }
        });
      }

      // Create Transaction
      const transaction = await prisma.transaction.create({
        data: {
          id: txnId,
          externalTransactionId: data.externalTransactionId || txnId,
          externalOrderId: data.externalOrderId || null,
          merchantId: merchant.id,
          customerId: customer.id,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          paymentMethod: data.paymentMethod,
          customerDebited: data.customerDebited,
          merchantSettlementStatus: data.merchantSettlementStatus,
          failureReason: data.failureReason || null,
          retryCount: data.retryCount || 0
        },
        include: { customer: true }
      });

      // Audit Log for Ingestion
      await prisma.auditLog.create({
        data: {
          merchantId: merchant.id,
          transactionId: transaction.id,
          eventType: 'TRANSACTION_INGESTED',
          actor: 'SYSTEM',
          description: `Transaction ${transaction.id} ingested with status ${transaction.status}. Amount: ${transaction.amount / 100} ${transaction.currency}.`
        }
      });

      // Automatically evaluate risk and create cases
      await revenueRiskService.processTransactionRisk(transaction);

      return res.status(201).json({
        success: true,
        data: mapTransaction(transaction)
      });
    } catch (error) {
      console.error('transactionController.createTransaction error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to create transaction.' }
      });
    }
  },

  // 2. Get Paginated & Filtered Transactions
  getTransactions: async (req, res) => {
    try {
      const { status, risk, currency, search, page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const take = parseInt(limit, 10);

      const where = {};
      if (status) where.status = status;
      if (currency) where.currency = currency;
      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { email: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { customer: true }
        }),
        prisma.transaction.count({ where })
      ]);

      const mapped = transactions.map(mapTransaction);

      return res.json({
        success: true,
        data: mapped,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / take) || 1
        }
      });
    } catch (error) {
      console.error('transactionController.getTransactions error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch transactions.' }
      });
    }
  },

  // 3. Get Single Transaction with complete history
  getTransactionById: async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          customer: true,
          revenueRiskEvents: true,
          recoveryCases: {
            include: {
              aiDecisions: true,
              recoveryActions: true
            }
          },
          auditLogs: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Transaction ${id} not found.` }
        });
      }

      return res.json({
        success: true,
        data: {
          ...mapTransaction(transaction),
          riskEvents: transaction.revenueRiskEvents,
          recoveryCases: transaction.recoveryCases,
          auditLogs: transaction.auditLogs
        }
      });
    } catch (error) {
      console.error('transactionController.getTransactionById error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve transaction details.' }
      });
    }
  },

  // 4. CSV File Ingestion
  importCsv: async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'CSV file is required in multipart form data.' }
        });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

      if (lines.length < 2) {
        return res.status(400).json({
          success: false,
          error: { code: 'EMPTY_CSV', message: 'CSV file must contain a header and at least one data row.' }
        });
      }

      const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const requiredColumns = ['transaction_id', 'amount', 'currency', 'status'];
      const hasRequired = requiredColumns.every(col => header.includes(col));

      if (!hasRequired) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CSV_HEADER',
            message: `CSV missing required columns. Expected: ${requiredColumns.join(', ')}`
          }
        });
      }

      let user = await prisma.user.findFirst();
      if (!user) user = await prisma.user.create({ data: { name: 'Merchant', email: 'merchant@razorrecover.ai' } });

      let merchant = await prisma.merchant.findFirst();
      if (!merchant) merchant = await prisma.merchant.create({ data: { userId: user.id, name: 'Merchant Store', email: 'merchant@razorrecover.ai' } });

      const results = {
        totalRows: lines.length - 1,
        successfulRows: 0,
        failedRows: 0,
        errors: []
      };

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
        const row = {};
        header.forEach((key, index) => {
          row[key] = values[index];
        });

        try {
          const rawAmount = parseFloat(row.amount);
          if (isNaN(rawAmount) || rawAmount <= 0) {
            throw new Error(`Invalid amount '${row.amount}'`);
          }

          const parsedRow = {
            id: row.transaction_id,
            externalTransactionId: row.transaction_id,
            amount: Math.round(rawAmount * 100), // convert to paise if standard currency units supplied
            currency: row.currency || 'INR',
            status: (row.status || 'CAPTURED').toUpperCase(),
            paymentMethod: (row.payment_method || 'UPI').toUpperCase(),
            customerDebited: row.customer_debited === 'true' || row.customer_debited === '1',
            merchantSettlementStatus: (row.merchant_settlement_status || 'PENDING').toUpperCase(),
            failureReason: row.failure_reason || null,
            retryCount: parseInt(row.retry_count || '0', 10),
            customerName: row.customer_name || 'CSV Customer',
            customerEmail: row.customer_email || `user_${i}@example.com`
          };

          const validation = transactionInputSchema.safeParse(parsedRow);
          if (!validation.success) {
            throw new Error(JSON.stringify(validation.error.format()));
          }

          // Upsert customer
          let customer = await prisma.customer.findUnique({ where: { email: parsedRow.customerEmail } });
          if (!customer) {
            customer = await prisma.customer.create({
              data: { name: parsedRow.customerName, email: parsedRow.customerEmail }
            });
          }

          // Check if exists
          const existingTxn = await prisma.transaction.findUnique({ where: { id: parsedRow.id } });
          if (existingTxn) {
            throw new Error(`Transaction ${parsedRow.id} already exists`);
          }

          const createdTxn = await prisma.transaction.create({
            data: {
              id: parsedRow.id,
              externalTransactionId: parsedRow.externalTransactionId,
              merchantId: merchant.id,
              customerId: customer.id,
              amount: parsedRow.amount,
              currency: parsedRow.currency,
              status: parsedRow.status,
              paymentMethod: parsedRow.paymentMethod,
              customerDebited: parsedRow.customerDebited,
              merchantSettlementStatus: parsedRow.merchantSettlementStatus,
              failureReason: parsedRow.failureReason,
              retryCount: parsedRow.retryCount
            }
          });

          await revenueRiskService.processTransactionRisk(createdTxn);
          results.successfulRows++;
        } catch (rowErr) {
          results.failedRows++;
          results.errors.push({ row: i + 1, error: rowErr.message });
        }
      }

      return res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('transactionController.importCsv error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'CSV_IMPORT_ERROR', message: 'Failed to process CSV file.' }
      });
    }
  }
};
