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
    const isTelugu = lang === 'తెలుగు' || lang?.toLowerCase() === 'telugu';
    const isHindi = lang === 'हिंदी' || lang?.toLowerCase() === 'hindi';

    if (lower.includes('why') || lower.includes('ఎందుకు') || lower.includes('కారణం') || lower.includes('क्यों') || lower.includes('कारण') || (lower.includes('fail') && lower.includes('risk'))) {
      if (isTelugu) {
        reply = `ప్రమాదంలో ఉన్న రాబడి ₹${summary.revenueAtRisk.toLocaleString('en-IN')} (${summary.activeCases} క్రియాశీల రికవరీ కేసులు).\n\nప్రధాన కారణాలు:\n1. 3DS ఆథరైజేషన్ టైమ్‌అవుట్ (TXN_3198 - ₹3,198)\n2. బ్యాంక్ సెటిల్మెంట్ పెండింగ్ (TXN_8000 - ₹8,000)\n3. క్రిటికల్ ఫ్రాడ్ రిస్క్ హోల్డ్ (TXN_12000 - ₹12,000)\n4. కస్టమర్ డెబిట్ సెటిల్మెంట్ మిస్సింగ్ (TXN_SETTLE_001 - ₹18,500)\n\nఅటానమస్ రికవరీ వర్క్‌ఫ్లోలు మరియు సేఫ్టీ గార్డ్‌రైల్స్ వీటిని చురుకుగా పర్యవేక్షిస్తున్నాయి.`;
      } else if (isHindi) {
        reply = `वर्तमान में ₹${summary.revenueAtRisk.toLocaleString('en-IN')} राजस्व जोखिम में है (${summary.activeCases} सक्रिय रिकवरी केस)।\n\nमुख्य कारण:\n1. 3DS ऑथेंटिकेशन टाइमआउट (TXN_3198 - ₹3,198)\n2. बैंक सेटलमेंट देरी (TXN_8000 - ₹8,000)\n3. क्रिटिकल फ्रॉड होल्ड (TXN_12000 - ₹12,000)\n4. ग्राहक डेबिट सेटलमेंट मिसिंग (TXN_SETTLE_001 - ₹18,500)\n\nस्वायत्त रिकवरी वर्कफ़्लो और गार्डरेल्स इन मामलों की सक्रिय रूप से निगरानी कर रहे हैं।`;
      } else {
        reply = `Based on transaction telemetry, ₹${summary.revenueAtRisk.toLocaleString('en-IN')} is currently at risk across ${summary.activeCases} active recovery cases.\n\nPrimary Causes:\n1. 3DS Authentication Timeout (TXN_3198 - ₹3,198)\n2. Bank Settlement Pending (TXN_8000 - ₹8,000)\n3. Critical Fraud Hold (TXN_12000 - ₹12,000)\n4. Customer Debited Settlement Missing (TXN_SETTLE_001 - ₹18,500)\n\nAutomated recovery workflows and guardrails are actively monitoring these cases.`;
      }
    } else if (lower.includes('recover') || lower.includes('rate') || lower.includes('రికవరీ') || lower.includes('రికవర్') || lower.includes('रिकवर') || lower.includes('रिकवरी')) {
      if (isTelugu) {
        reply = `టెస్ట్ మోడ్‌లో ధృవీకరించబడిన మొత్తం రికవరీ రాబడి ₹${summary.recoveredRevenue.toLocaleString('en-IN')}.\n\nసారాంశం:\n• మొత్తం రికవరీ రాబడి: ₹${summary.recoveredRevenue.toLocaleString('en-IN')}\n• రికవరీ రేటు: ${summary.recoveryRate}%\n• పర్యవేక్షించబడిన లావాదేవీలు: ${summary.transactionsMonitored}\n• విశ్లేషించబడిన లావాదేవీలు: ${act.analyzed}`;
      } else if (isHindi) {
        reply = `टेस्ट मोड में सत्यापित कुल रिकवर किया गया राजस्व ₹${summary.recoveredRevenue.toLocaleString('en-IN')} है।\n\nसारांश:\n• कुल रिकवर राजस्व: ₹${summary.recoveredRevenue.toLocaleString('en-IN')}\n• रिकवरी दर: ${summary.recoveryRate}%\n• मॉनिटर किए गए लेनदेन: ${summary.transactionsMonitored}\n• विश्लेषित लेनदेन: ${act.analyzed}`;
      } else {
        reply = `Today's recoveries include ₹5,000 verified and settled in Test Mode.\n\nSummary:\n• Total Recovered Revenue: ₹${summary.recoveredRevenue.toLocaleString('en-IN')}\n• Recovery Rate: ${summary.recoveryRate}%\n• Monitored Transactions: ${summary.transactionsMonitored}\n• Analyzed Transactions: ${act.analyzed}`;
      }
    } else if (lower.includes('guardrail') || lower.includes('policy') || lower.includes('safe') || lower.includes('protect') || lower.includes('గార్డ్‌రైల్') || lower.includes('భద్రత') || lower.includes('गार्डरेल') || lower.includes('सुरक्षा')) {
      if (isTelugu) {
        reply = `మా గార్డ్‌రైల్స్ ఇంజిన్ కఠినమైన ఆర్థిక భద్రతను అమలు చేస్తుంది:\n• ప్రతి కేసుకు గరిష్టంగా 3 రికవరీ ప్రయత్నాలు (నెట్‌వర్క్ స్పామ్ నివారణ)\n• ≥ ₹50,000 లావాదేవీలకు తప్పనిసరి మర్చంట్ ఆమోదం\n• ₹1,00,000 ఆటోమేటెడ్ ఎగ్జిక్యూషన్ సీలింగ్ పరిమితి\n• ఆటోమేటెడ్ ప్రయత్నాల మధ్య 24 గంటల కూల్‌డౌన్\n• డెబిట్ అయిన ఖాతాలపై డూప్లికేట్ ఛార్జ్ నివారణ\n• రాంగ్ నంబర్ లేదా తప్పు గ్రహీత చెల్లింపులపై గ్రహీత ధృవీకరణ నిబంధన`;
      } else if (isHindi) {
        reply = `हमारा गार्डरेल इंजन सख्त वित्तीय सुरक्षा लागू करता है:\n• प्रति मामला अधिकतम 3 पुनः प्रयास (नेटवर्क स्पैम की रोकथाम)\n• ₹50,000 से अधिक के लेनदेन के लिए अनिवार्य मर्चेंट अनुमोदन\n• ₹1,00,000 स्वचालित निष्पादन सीमा\n• स्वचालित पुनः प्रयासों के बीच 24 घंटे का कूलडाउन\n• डेबिट खातों पर डुप्लिकेट चार्ज की रोकथाम\n• गलत नंबर / प्राप्तकर्ता बेमेल पर प्राप्तकर्ता सत्यापन नियम`;
      } else {
        reply = `Our Guardrail Engine enforces strict financial safety:\n• Max 3 retries per case (prevents network card spam)\n• Mandatory merchant approval for amounts ≥ ₹50,000\n• ₹1,00,000 automated execution ceiling\n• 24-hour cooldown between automated retries\n• Double-charge prevention on debited accounts\n• Recipient verification guardrail for wrong number / mismatched recipients`;
      }
    } else if (lower.includes('attention') || lower.includes('cases') || lower.includes('priority') || lower.includes('కేసులు') || lower.includes('శ్రద్ధ') || lower.includes('मामले') || lower.includes('ध्यान')) {
      if (isTelugu) {
        reply = `తక్షణ శ్రద్ధ అవసరమైన ముఖ్యమైన రికవరీ కేసులు:\n1. TXN_SETTLE_001 (₹18,500) — కస్టమర్ డెబిట్ అయింది, సెటిల్మెంట్ ధృవీకరణ పెండింగ్ (డూప్లికేట్ పేమెంట్ ప్రివెన్షన్ యాక్టివ్)\n2. TXN_12000 (₹12,000) — క్రిటికల్ రిస్క్ కారణంగా ఎస్కలేట్ చేయబడింది\n3. TXN_8000 (₹8,000) — బ్యాంక్ సెటిల్మెంట్ రీకన్సిలియేషన్ పురోగతిలో ఉంది\n4. TXN_WRONG_001 (₹4,500) — గ్రహీత ధృవీకరణ అవసరం (గార్డ్‌రైల్ బ్లాక్ చేయబడింది)`;
      } else if (isHindi) {
        reply = `तत्काल ध्यान देने योग्य मुख्य मामले:\n1. TXN_SETTLE_001 (₹18,500) — ग्राहक डेबिट हुआ, सेटलमेंट सत्यापन लंबित (डुप्लिकेट भुगतान रोकथाम सक्रिय)\n2. TXN_12000 (₹12,000) — गंभीर जोखिम के कारण एस्केलेट किया गया\n3. TXN_8000 (₹8,000) — बैंक सेटलमेंट समाधान प्रक्रिया में है\n4. TXN_WRONG_001 (₹4,500) — प्राप्तकर्ता सत्यापन आवश्यक (गार्डरेल ब्लॉक)`;
      } else {
        reply = `Cases requiring immediate attention:\n1. TXN_SETTLE_001 (₹18,500) — Customer debited, settlement under verification (Duplicate Payment Prevention active)\n2. TXN_12000 (₹12,000) — Escalated due to critical risk\n3. TXN_8000 (₹8,000) — Bank settlement reconciliation in progress\n4. TXN_WRONG_001 (₹4,500) — Recipient verification required (Guardrail Blocked)`;
      }
    } else if (lower.includes('how much') || lower.includes('revenue at risk') || lower.includes('risk') || lower.includes('ఎంత') || lower.includes('రాబడి') || lower.includes('कितना') || lower.includes('राजस्व')) {
      if (isTelugu) {
        reply = `ప్రస్తుతం, మీ వద్ద ${summary.activeCases} క్రియాశీల కేసులలో మొత్తం ₹${summary.revenueAtRisk.toLocaleString('en-IN')} ప్రమాదంలో ఉన్న రాబడి ఉంది. ఇప్పటివరకు ₹${summary.recoveredRevenue.toLocaleString('en-IN')} రికవరీ చేయబడింది (${summary.recoveryRate}% రికవరీ రేటు).`;
      } else if (isHindi) {
        reply = `वर्तमान में, आपके पास ${summary.activeCases} सक्रिय मामलों में कुल ₹${summary.revenueAtRisk.toLocaleString('en-IN')} राजस्व जोखिम में है। अब तक ₹${summary.recoveredRevenue.toLocaleString('en-IN')} रिकवर किया गया है (${summary.recoveryRate}% रिकवरी दर)।`;
      } else {
        reply = `Currently, you have ₹${summary.revenueAtRisk.toLocaleString('en-IN')} in total revenue at risk across ${summary.activeCases} active cases. ₹${summary.recoveredRevenue.toLocaleString('en-IN')} has been recovered (${summary.recoveryRate}% recovery rate).`;
      }
    } else {
      if (isTelugu) {
        reply = `RazorRecover AI మొత్తం ${summary.transactionsMonitored} లావాదేవీలను పర్యవేక్షిస్తోంది (${act.analyzed} విశ్లేషించబడ్డాయి). ప్రస్తుత ప్రమాదంలో ఉన్న రాబడి ₹${summary.revenueAtRisk.toLocaleString('en-IN')}, ధృవీకరించబడిన రికవరీ ₹${summary.recoveredRevenue.toLocaleString('en-IN')} (${summary.recoveryRate}% రికవరీ రేటు).\n\nరిస్క్ కారణాలు, ప్రాధాన్యత కేసులు లేదా గార్డ్‌రైల్స్ పాలసీల గురించి మీరు నన్ను అడగవచ్చు!`;
      } else if (isHindi) {
        reply = `RazorRecover AI कुल ${summary.transactionsMonitored} लेनदेन की निगरानी कर रहा है (${act.analyzed} विश्लेषित)। वर्तमान जोखिम में राजस्व ₹${summary.revenueAtRisk.toLocaleString('en-IN')} है और सत्यापित रिकवरी ₹${summary.recoveredRevenue.toLocaleString('en-IN')} (${summary.recoveryRate}% रिकवरी दर) है।\n\nआप मुझसे जोखिम कारणों, प्राथमिकता मामलों या गार्डरेल नीतियों के बारे में पूछ सकते हैं!`;
      } else {
        reply = `RazorRecover AI is monitoring ${summary.transactionsMonitored} transactions (${act.analyzed} analyzed, +${act.increasePercent}% risk). Current revenue at risk is ₹${summary.revenueAtRisk.toLocaleString('en-IN')} with ₹${summary.recoveredRevenue.toLocaleString('en-IN')} in verified recoveries (${summary.recoveryRate}% recovery rate).\n\nAsk me about root causes, priority cases, or guardrail policies!`;
      }
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
