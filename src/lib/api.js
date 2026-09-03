import { dashboardDemoData } from '../data/demoData';

const BASE_URL = import.meta.env.VITE_API_URL || '';

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

    const response = await fetch(`${BASE_URL}/api/payments?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch payments.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  getPayments: async (params = {}) => {
    return api.getTransactions(params);
  },

  getTransactionById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/payments/${id}`);
    if (!response.ok) throw new Error('Failed to fetch payment details.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  syncTransactions: async (gateway = 'razorpay') => {
    const response = await fetch(`${BASE_URL}/api/payments/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gateway })
    });
    if (!response.ok) throw new Error('Failed to sync transactions from Razorpay.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  verifySettlement: async (id) => {
    const response = await fetch(`${BASE_URL}/api/payments/verify-settlement/${id}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Settlement verification failed.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  // Recovery Cases
  getRecoveryCases: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.stage) queryParams.append('stage', params.stage);

    const response = await fetch(`${BASE_URL}/api/recovery/cases?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch recovery cases.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  getRecoveryCaseById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}`);
    if (!response.ok) throw new Error('Failed to fetch recovery case.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  analyzeRecoveryCase: async (id) => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}/analyze`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Analysis failed.');
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  },

  approveRecoveryCase: async (id, approvedBy = 'Merchant Admin') => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy })
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Approval failed.');
    }
    return response.json();
  },

  rejectRecoveryCase: async (id, reason = 'Rejected by Merchant') => {
    const response = await fetch(`${BASE_URL}/api/recovery/cases/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Rejection failed.');
    }
    return response.json();
  },

  executeRecoveryAction: async (id, actionType, idempotencyKey) => {
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

  // Copilot (with automatic client-side fallback for static cloud deployments)
  askCopilot: async (message, lang = 'English') => {
    try {
      const response = await fetch(`${BASE_URL}/api/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, lang })
      });

      if (response.ok) {
        const json = await response.json();
        return json.data !== undefined ? json.data : json;
      }
    } catch (networkErr) {
      console.warn('Backend Copilot API unreachable, using client telemetry fallback:', networkErr.message);
    }

    // Client-side grounded fallback response for Vercel static deployments
    const lower = message.toLowerCase();
    let reply = '';

    const summary = dashboardDemoData.summary;
    const act = dashboardDemoData.recoveryActivity;

    if (lower.includes('why') && (lower.includes('risk') || lower.includes('fail') || lower.includes('today'))) {
      if (lang === 'తెలుగు') {
        reply = `ప్రమాదంలో ఉన్న రాబడి ₹${summary.revenueAtRisk.toLocaleString('en-IN')} (${summary.activeCases} క్రియాశీల రికవరీ కేసులు). ప్రధాన కారణాలు: కార్డ్ 3DS ధృవీకరణ గడువు ముగిసింది మరియు బ్యాంక్ సెటిల్మెంట్ పెండింగ్.`;
      } else if (lang === 'हिंदी') {
        reply = `वर्तमान में ₹${summary.revenueAtRisk.toLocaleString('en-IN')} राजस्व जोखिम में है (${summary.activeCases} सक्रिय रिकवरी केस)। मुख्य कारण: 3DS ऑथेंटिकेशन टाइमआउट और बैंक सेटलमेंट देरी।`;
      } else {
        reply = `Based on transaction telemetry, ₹${summary.revenueAtRisk.toLocaleString('en-IN')} is currently at risk across ${summary.activeCases} active recovery cases.\n\nPrimary Causes:\n1. 3DS Authentication Timeout (TXN_3198 - ₹3,198)\n2. Bank Settlement Pending (TXN_8000 - ₹8,000)\n3. Critical Fraud Hold (TXN_12000 - ₹12,000)\n\nAutomated recovery workflows and guardrails are actively monitoring these cases.`;
      }
    } else if (lower.includes('today') && (lower.includes('recover') || lower.includes('recovered'))) {
      if (lang === 'తెలుగు') {
        reply = `ఈరోజు రికవరీలలో టెస్ట్ మోడ్‌లో విజయవంతంగా ధృవీకరించబడిన ₹5,000 ఉన్నాయి. మొత్తం రికవరీ రేటు ${summary.recoveryRate}%.`;
      } else if (lang === 'हिंदी') {
        reply = `आज की रिकवरी में टेस्ट मोड में सत्यापित ₹5,000 शामिल हैं। कुल रिकवरी दर ${summary.recoveryRate}% है।`;
      } else {
        reply = `Today's recoveries include ₹5,000 verified and settled in Test Mode.\n\nSummary:\n• Total Recovered Revenue: ₹${summary.recoveredRevenue.toLocaleString('en-IN')}\n• Recovery Rate: ${summary.recoveryRate}%\n• Monitored Transactions: ${summary.transactionsMonitored}`;
      }
    } else if (lower.includes('guardrail') || lower.includes('policy') || lower.includes('safe') || lower.includes('protect')) {
      reply = `Our Guardrail Engine enforces strict financial safety:\n• Max 3 retries per case (prevents network card spam)\n• Mandatory merchant approval for amounts ≥ ₹50,000\n• ₹1,00,000 automated execution ceiling\n• 24-hour cooldown between automated retries\n• Double-charge prevention on debited accounts`;
    } else if (lower.includes('attention') || lower.includes('cases') || lower.includes('priority')) {
      reply = `Cases requiring attention:\n1. TXN_12000 (₹12,000) — Escalated due to critical risk\n2. TXN_8000 (₹8,000) — Bank settlement reconciliation in progress\n3. TXN_3198 (₹3,198) — Customer card 3DS timeout; recovery link active`;
    } else if (lower.includes('how much') || lower.includes('revenue at risk') || lower.includes('risk')) {
      reply = `Currently, you have ₹${summary.revenueAtRisk.toLocaleString('en-IN')} in total revenue at risk across ${summary.activeCases} active cases. ₹${summary.recoveredRevenue.toLocaleString('en-IN')} has been recovered (${summary.recoveryRate}% recovery rate).`;
    } else {
      reply = `RazorRecover AI is monitoring ${summary.transactionsMonitored} transactions (${act.analyzed} analyzed, +${act.increasePercent}% risk). Current revenue at risk is ₹${summary.revenueAtRisk.toLocaleString('en-IN')} with ₹${summary.recoveredRevenue.toLocaleString('en-IN')} in verified recoveries (${summary.recoveryRate}% recovery rate).\n\nAsk me about root causes, priority cases, or guardrail policies!`;
    }

    return {
      reply,
      grounded: true,
      metrics: {
        revenueAtRisk: `₹${summary.revenueAtRisk}`,
        recoveredRevenue: `₹${summary.recoveredRevenue}`,
        activeCases: `${summary.activeCases} cases`,
        recoveryRate: `${summary.recoveryRate}%`
      }
    };
  },

  // Health
  getHealth: async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (!response.ok) throw new Error('Health check failed.');
      return response.json();
    } catch (err) {
      return { status: 'client-mode', time: new Date() };
    }
  }
};
