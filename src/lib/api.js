const BASE_URL = ''; // Routed via Vite proxy dynamically in dev environment

export const api = {
  getDashboardSummary: async () => {
    const response = await fetch(`${BASE_URL}/api/dashboard/summary`);
    if (!response.ok) throw new Error('Failed to fetch dashboard summary.');
    return response.json();
  },

  getDashboardActivity: async () => {
    const response = await fetch(`${BASE_URL}/api/dashboard/activity`);
    if (!response.ok) throw new Error('Failed to fetch dashboard activity feed.');
    return response.json();
  },

  getPayments: async (status = '', limit = '') => {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (limit) queryParams.append('limit', limit);

    const response = await fetch(`${BASE_URL}/api/payments?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch transaction list.');
    return response.json();
  },

  getPayment: async (id) => {
    const response = await fetch(`${BASE_URL}/api/payments/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch payment details for transaction ${id}.`);
    }
    return response.json();
  },

  getPaymentStatus: async (id) => {
    const response = await fetch(`${BASE_URL}/api/payments/${id}/status`);
    if (!response.ok) throw new Error(`Failed to fetch status for transaction ${id}.`);
    return response.json();
  },

  getRiskPayments: async () => {
    const response = await fetch(`${BASE_URL}/api/payments/risk`);
    if (!response.ok) throw new Error('Failed to fetch risk flagged events.');
    return response.json();
  },

  getSettlements: async () => {
    const response = await fetch(`${BASE_URL}/api/payments/settlements`);
    if (!response.ok) throw new Error('Failed to fetch settlement records.');
    return response.json();
  },

  getAnalytics: async () => {
    const response = await fetch(`${BASE_URL}/api/analytics/recovery`);
    if (!response.ok) throw new Error('Failed to fetch recovery analytics data.');
    return response.json();
  },

  getAlerts: async () => {
    const response = await fetch(`${BASE_URL}/api/alerts`);
    if (!response.ok) throw new Error('Failed to fetch alerts list.');
    return response.json();
  },

  markAlertAsRead: async (id) => {
    const response = await fetch(`${BASE_URL}/api/alerts/${id}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to mark alert as read.');
    return response.json();
  },

  getAuditLogs: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.transactionId) queryParams.append('transactionId', filters.transactionId);
    if (filters.eventType) queryParams.append('eventType', filters.eventType);

    const response = await fetch(`${BASE_URL}/api/audit-logs?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch audit log list.');
    return response.json();
  }
};
