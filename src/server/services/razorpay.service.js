import dotenv from 'dotenv';
dotenv.config();

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const BASE_URL = 'https://api.razorpay.com/v1';

// Base64 Basic Auth encoding
const getAuthHeader = () => {
  if (!KEY_ID || !KEY_SECRET) return '';
  const token = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
  return `Basic ${token}`;
};

export const razorpayService = {
  fetchPayment: async (paymentId) => {
    try {
      const response = await fetch(`${BASE_URL}/payments/${paymentId}`, {
        headers: {
          'Authorization': getAuthHeader()
        }
      });
      if (!response.ok) {
        throw new Error(`Razorpay fetchPayment failed: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('razorpayService.fetchPayment error:', error.message);
      throw error;
    }
  },

  fetchPayments: async () => {
    try {
      const response = await fetch(`${BASE_URL}/payments`, {
        headers: {
          'Authorization': getAuthHeader()
        }
      });
      if (!response.ok) {
        throw new Error(`Razorpay fetchPayments failed: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('razorpayService.fetchPayments error:', error.message);
      throw error;
    }
  },

  fetchSettlements: async () => {
    try {
      const response = await fetch(`${BASE_URL}/settlements`, {
        headers: {
          'Authorization': getAuthHeader()
        }
      });
      if (!response.ok) {
        throw new Error(`Razorpay fetchSettlements failed: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('razorpayService.fetchSettlements error:', error.message);
      throw error;
    }
  },

  fetchSettlement: async (settlementId) => {
    try {
      const response = await fetch(`${BASE_URL}/settlements/${settlementId}`, {
        headers: {
          'Authorization': getAuthHeader()
        }
      });
      if (!response.ok) {
        throw new Error(`Razorpay fetchSettlement failed: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('razorpayService.fetchSettlement error:', error.message);
      throw error;
    }
  }
};
