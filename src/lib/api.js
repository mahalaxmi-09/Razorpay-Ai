const BASE_URL = ''; // Proxied via Vite dev server

export const api = {
  // Dashboard
  getDashboardSummary: async () => {
    const response = await fetch(`${BASE_URL}/api/dashboard/summary`);
    if (!response.ok) throw new Error('Failed to fetch dashboard summary.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  getDashboardActivity: async () => {
    const response = await fetch(`${BASE_URL}/api/dashboard/activity`);
    if (!response.ok) throw new Error('Failed to fetch dashboard activity feed.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  // Transactions
  getTransactions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.currency) queryParams.append('currency', params.currency);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await fetch(`${BASE_URL}/api/transactions?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch transaction list.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  getPayments: async (status = '', limit = '') => {
    return api.getTransactions({ status, limit });
  },

  getTransaction: async (id) => {
    const response = await fetch(`${BASE_URL}/api/transactions/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch transaction ${id}.`);
    }
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  getPayment: async (id) => {
    return api.getTransaction(id);
  },

  createTransaction: async (payload) => {
    const response = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to ingest transaction.');
    return response.json();
  },

  importCsv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/api/transactions/import`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to import CSV file.');
    return response.json();
  },

  // Recovery Workflows
  getRecoveryCases: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);

    const response = await fetch(`${BASE_URL}/api/recovery/cases?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch recovery cases.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  getRecoveryCase: async (id) => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch case ${id}.`);
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  analyzeRecoveryCase: async (id) => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}/analyze`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to analyze recovery case.');
    return response.json();
  },

  simulateRecoveryAction: async (id, actionType) => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType })
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Simulation failed.');
    }
    return response.json();
  },

  approveRecoveryCase: async (id, approvedBy = 'MERCHANT', reason = 'Merchant approved recovery action.') => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy, reason })
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Approval failed.');
    }
    return response.json();
  },

  rejectRecoveryCase: async (id, rejectedBy = 'MERCHANT', reason = 'Merchant rejected recovery action.') => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectedBy, reason })
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Rejection failed.');
    }
    return response.json();
  },

  executeRecoveryAction: async (id, actionType, idempotencyKey = null) => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType, idempotencyKey })
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Execution failed.');
    }
    return response.json();
  },

  verifyRecoveryCase: async (id) => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}/verify`, {
      method: 'POST'
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Verification failed.');
    }
    return response.json();
  },

  escalateCase: async (id) => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}/escalate`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Escalation failed.');
    return response.json();
  },

  stopRecoveryCase: async (id) => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}/stop`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Stop action failed.');
    return response.json();
  },

  // Analytics
  getAnalytics: async () => {
    const response = await fetch(`${BASE_URL}/api/analytics/recovery`);
    if (!response.ok) throw new Error('Failed to fetch analytics.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  // Alerts
  getAlerts: async () => {
    const response = await fetch(`${BASE_URL}/api/alerts`);
    if (!response.ok) throw new Error('Failed to fetch alerts.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  markAlertAsRead: async (id) => {
    const response = await fetch(`${BASE_URL}/api/alerts/${id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to mark alert as read.');
    return response.json();
  },

  // Audit Logs
  getAuditLogs: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.transactionId) queryParams.append('transactionId', filters.transactionId);
    if (filters.eventType) queryParams.append('eventType', filters.eventType);

    const response = await fetch(`${BASE_URL}/api/audit-logs?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch audit logs.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  // Copilot
  askCopilot: async (message, lang = 'English') => {
    const response = await fetch(`${BASE_URL}/api/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, lang })
    });
    if (!response.ok) throw new Error('Failed to query AI copilot.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  // Health
  getHealth: async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) throw new Error('Health check failed.');
    return response.json();
  }
};
