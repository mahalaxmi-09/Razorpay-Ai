import { razorpayService } from './razorpay.service.js';

/**
 * Payment Provider Adapter Interface
 * 
 * Defines standard contract for all payment providers.
 * Core engine communicates exclusively via this abstraction.
 */

export class RazorpayTestProvider {
  constructor() {
    this.name = 'RAZORPAY_TEST';
  }

  async fetchPayment(paymentId) {
    const raw = await razorpayService.fetchPayment(paymentId);
    return razorpayService.normalizePayment(raw);
  }

  async fetchPayments(options = {}) {
    const rawList = await razorpayService.fetchPayments(options);
    const items = (rawList.items || []).map(r => razorpayService.normalizePayment(r));
    return {
      items,
      count: rawList.count || items.length
    };
  }

  async createOrder(orderData) {
    return await razorpayService.createOrder(orderData);
  }

  async capturePayment(paymentId, amount, currency) {
    return await razorpayService.capturePayment(paymentId, amount, currency);
  }

  async fetchSettlements(options = {}) {
    return await razorpayService.fetchSettlements(options);
  }

  verifyWebhookSignature(rawBody, signature, secret) {
    return razorpayService.verifyWebhookSignature(rawBody, signature, secret);
  }
}

export class PaymentProviderService {
  constructor(provider = new RazorpayTestProvider()) {
    this.provider = provider;
  }

  setProvider(provider) {
    this.provider = provider;
  }

  async fetchPayment(id) {
    return await this.provider.fetchPayment(id);
  }

  async fetchPayments(options) {
    return await this.provider.fetchPayments(options);
  }

  async createOrder(data) {
    return await this.provider.createOrder(data);
  }

  async capturePayment(id, amount, currency) {
    return await this.provider.capturePayment(id, amount, currency);
  }

  async fetchSettlements(options) {
    return await this.provider.fetchSettlements(options);
  }

  verifyWebhookSignature(rawBody, signature, secret) {
    return this.provider.verifyWebhookSignature(rawBody, signature, secret);
  }
}

export const paymentProviderService = new PaymentProviderService(new RazorpayTestProvider());
