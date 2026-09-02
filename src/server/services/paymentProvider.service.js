/**
 * Payment Provider Adapter Interface
 * 
 * Provides an abstract layer for payment integrations.
 * Future payment gateways (e.g. Razorpay, Stripe) will implement this interface.
 * Currently uses MockPaymentProvider for independent simulation.
 */

export class MockPaymentProvider {
  constructor(config = {}) {
    this.name = 'MockPaymentProvider';
    this.config = config;
  }

  async fetchTransaction(externalTransactionId) {
    return {
      provider: this.name,
      externalTransactionId,
      status: 'CAPTURED',
      amount: 500000,
      currency: 'INR',
      customerDebited: true,
      merchantSettlementStatus: 'PENDING',
      timestamp: new Date().toISOString()
    };
  }

  async fetchTransactions(filter = {}) {
    return {
      provider: this.name,
      transactions: [],
      total: 0
    };
  }

  async getTransactionStatus(externalTransactionId) {
    return {
      externalTransactionId,
      status: 'CAPTURED',
      customerDebited: true
    };
  }

  async getSettlementStatus(externalTransactionId) {
    return {
      externalTransactionId,
      merchantSettlementStatus: 'PENDING',
      settlementUtr: null
    };
  }
}

export const paymentProviderService = new MockPaymentProvider();
