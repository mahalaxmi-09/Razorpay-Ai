import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// STRICT SAFETY GUARD: Verify Key ID is for Test Mode only
const isTestModeKey = (key) => typeof key === 'string' && key.startsWith('rzp_test_');

if (KEY_ID && !isTestModeKey(KEY_ID)) {
  console.error('🚨 CRITICAL ERROR: Live Razorpay credentials detected. RazorRecover AI only operates in TEST MODE.');
  throw new Error('Live Razorpay credentials are not permitted. Use rzp_test_ keys only.');
}

let razorpayClient = null;
if (KEY_ID && KEY_SECRET && isTestModeKey(KEY_ID)) {
  try {
    razorpayClient = new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET
    });
    console.log('✅ Razorpay TEST MODE client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Razorpay SDK client:', err.message);
  }
} else {
  console.warn('⚠️ Razorpay credentials missing or incomplete. Running in simulation fallback mode.');
}

export const razorpayService = {
  isConfigured: () => Boolean(razorpayClient),

  getClient: () => razorpayClient,

  // 1. Fetch list of payments from Razorpay TEST API
  fetchPayments: async (options = { count: 50, skip: 0 }) => {
    if (!razorpayClient) {
      return { items: [], count: 0 };
    }
    try {
      return await razorpayClient.payments.all(options);
    } catch (error) {
      console.error('razorpayService.fetchPayments error:', error.message);
      throw new Error(`Razorpay API Error: ${error.error?.description || error.message}`);
    }
  },

  // 2. Fetch single payment by ID from Razorpay TEST API
  fetchPayment: async (paymentId) => {
    if (!razorpayClient) return null;
    try {
      return await razorpayClient.payments.fetch(paymentId);
    } catch (error) {
      console.error(`razorpayService.fetchPayment (${paymentId}) error:`, error.message);
      throw new Error(`Razorpay API Error: ${error.error?.description || error.message}`);
    }
  },

  // 3. Create test order
  createOrder: async ({ amount, currency = 'INR', receipt = 'receipt_1', notes = {} }) => {
    if (!razorpayClient) {
      throw new Error('Razorpay client not configured');
    }
    return await razorpayClient.orders.create({
      amount,
      currency,
      receipt,
      notes
    });
  },

  // 4. Capture payment in Test Mode
  capturePayment: async (paymentId, amount, currency = 'INR') => {
    if (!razorpayClient) {
      throw new Error('Razorpay client not configured');
    }
    return await razorpayClient.payments.capture(paymentId, amount, currency);
  },

  // 5. Fetch settlements list
  fetchSettlements: async (options = { count: 20 }) => {
    if (!razorpayClient || !razorpayClient.settlements) {
      return { items: [], count: 0 };
    }
    try {
      return await razorpayClient.settlements.all(options);
    } catch (err) {
      console.warn('Settlements endpoint unavailable or empty:', err.message);
      return { items: [], count: 0 };
    }
  },

  // 6. Verify Razorpay Webhook HMAC SHA256 Signature
  verifyWebhookSignature: (rawBody, signature, secret = WEBHOOK_SECRET) => {
    if (!rawBody || !signature || !secret) {
      return false;
    }
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch (err) {
      console.error('Webhook signature verification error:', err.message);
      return false;
    }
  },

  // 7. Normalize raw Razorpay payment object into internal payment model
  normalizePayment: (raw) => {
    if (!raw) return null;

    const rawStatus = (raw.status || '').toLowerCase();
    let status = 'PENDING';
    let customerDebited = false;
    let merchantSettlementStatus = 'PENDING';
    let riskStatus = 'LOW';

    if (rawStatus === 'captured') {
      status = 'CAPTURED';
      customerDebited = true;
      merchantSettlementStatus = raw.settled ? 'PROCESSED' : 'PENDING';
      riskStatus = raw.settled ? 'LOW' : 'MEDIUM';
    } else if (rawStatus === 'failed') {
      status = 'FAILED';
      customerDebited = false;
      merchantSettlementStatus = 'UNSETTLED';
      riskStatus = 'HIGH';
    } else if (rawStatus === 'authorized') {
      status = 'AUTHORIZED';
      customerDebited = true;
      merchantSettlementStatus = 'PENDING';
      riskStatus = 'MEDIUM';
    } else if (rawStatus === 'refunded') {
      status = 'SETTLEMENT_PROCESSED';
      customerDebited = true;
      merchantSettlementStatus = 'PROCESSED';
    }

    const failureReason = raw.error_description || raw.error_reason || (rawStatus === 'failed' ? 'Payment authentication failure' : null);

    return {
      provider: 'RAZORPAY_TEST',
      providerPaymentId: raw.id,
      providerOrderId: raw.order_id || null,
      amount: parseInt(raw.amount, 10), // in minor units (paise)
      currency: (raw.currency || 'INR').toUpperCase(),
      status,
      paymentMethod: (raw.method || 'UPI').toUpperCase(),
      captured: Boolean(raw.captured),
      customerDebited,
      merchantSettlementStatus,
      riskStatus,
      failureReason,
      retryCount: 0,
      customerEmail: raw.email || 'customer@example.com',
      customerContact: raw.contact || null,
      createdAt: raw.created_at ? new Date(raw.created_at * 1000) : new Date()
    };
  }
};
