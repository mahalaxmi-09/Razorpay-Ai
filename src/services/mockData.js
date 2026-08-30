// Centralized mock data store for RazorRecover AI

export const mockNotifications = [
  {
    id: 1,
    type: 'critical',
    title: 'High Risk Alert: ₹45,000 at risk',
    message: 'TXN_10234 Rahul Sharma - Customer debited, but Merchant settlement missing. AI suggests immediate verification.',
    time: '2 min ago',
    read: false,
  },
  {
    id: 2,
    type: 'warning',
    title: 'Settlement Pending',
    message: 'TXN_10238 Priya Nair - ₹18,000 settlement monitoring is active.',
    time: '15 min ago',
    read: false,
  },
  {
    id: 3,
    type: 'success',
    title: 'Revenue Recovered successfully',
    message: 'TXN_10235 Ananya - ₹2,500 recovery completed.',
    time: '1 hour ago',
    read: true,
  },
];

export const mockTransactions = [
  {
    id: 'TXN_10234',
    customer: 'Rahul Sharma',
    amount: 445000,
    status: 'Settlement Missing',
    risk: 'High',
    recommendation: 'Verify Settlement',
    customerDebited: 'Yes',
    merchantSettlement: 'Missing',
    aiConfidence: '94%',
    currency: 'INR',
    email: 'rahul.sharma@gmail.com',
    date: '2026-08-30 01:10 AM',
    issue: 'Customer payment captured on gateway but merchant settlement is missing from bank feeds.',
    why: 'Payment has already been settled on the gateway side. Retrying the payment directly could create a duplicate charge risk. Initiating direct settlement reconciliation is advised.',
  },
  {
    id: 'TXN_10235',
    customer: 'Ananya Iyer',
    amount: 680000,
    status: 'Recovered',
    risk: 'Low',
    recommendation: 'No Action Required',
    customerDebited: 'Yes',
    merchantSettlement: 'Settled',
    aiConfidence: '99%',
    currency: 'INR',
    email: 'ananya.iyer@yahoo.com',
    date: '2026-08-29 11:45 PM',
    issue: 'None. Automatic recovery verified the transaction matching. Revenue rescued.',
    why: 'Reconciliation engine matched the capture ID with Bank UTR reference successfully.',
  },
  {
    id: 'TXN_10236',
    customer: 'Manoj Kumar',
    amount: 180000,
    status: 'Settlement Pending',
    risk: 'Medium',
    recommendation: 'Monitor Settlement',
    customerDebited: 'Yes',
    merchantSettlement: 'Pending',
    aiConfidence: '88%',
    currency: 'INR',
    email: 'manoj.k@outlook.com',
    date: '2026-08-29 10:20 PM',
    issue: 'Settlement verification in progress. Payment capture confirmed.',
    why: 'Payment capture is complete. Awaiting Bank settlement cycle execution (next 12 hours). Cooldown monitor active.',
  },
  {
    id: 'TXN_10237',
    customer: 'Sarah Jenkins',
    amount: 75000,
    status: 'Payment Failed',
    risk: 'High',
    recommendation: 'Trigger Payment Recovery',
    customerDebited: 'No',
    merchantSettlement: 'Unsettled',
    aiConfidence: '91%',
    currency: 'INR',
    email: 'sarah.j@gmail.com',
    date: '2026-08-29 09:15 PM',
    issue: 'Customer card failed authentication during check-out flow.',
    why: 'Auth failed code: 3DSECURE_FAILURE. Retrying using fallback link via recovery agent is recommended.',
  },
  {
    id: 'TXN_10238',
    customer: 'Vijay Patel',
    amount: 120000,
    status: 'Escalated',
    risk: 'High',
    recommendation: 'Human Investigation',
    customerDebited: 'Yes',
    merchantSettlement: 'Failed',
    aiConfidence: '95%',
    currency: 'INR',
    email: 'vijay.patel@rediffmail.com',
    date: '2026-08-29 08:30 PM',
    issue: 'Retry limit reached. Gateway reported successful debit, but webhook signature mismatch occurred.',
    why: 'Critical safety guardrail reached: Security signature mismatch detected. Human review required to ensure no fraud.',
  },
  {
    id: 'TXN_10239',
    customer: 'Deepa Roy',
    amount: 205000,
    status: 'Settlement Pending',
    risk: 'High',
    recommendation: 'Verify Settlement',
    customerDebited: 'Yes',
    merchantSettlement: 'Pending',
    aiConfidence: '92%',
    currency: 'INR',
    email: 'deepa.roy@gmail.com',
    date: '2026-08-29 06:12 PM',
    issue: 'Customer payment captured but merchant settlement is pending.',
    why: 'Payment is already captured. Retrying the payment could create a duplicate charge risk. Verification is active.',
  }
];

export const mockRecoveryCases = [
  {
    stage: 'Detect',
    status: 'active',
    count: 32,
    cases: [
      { id: 'TXN_10234', amount: '₹45,000', detail: 'Missing UTR record' },
      { id: 'TXN_10239', amount: '₹5,000', detail: 'Reconciliation mismatch' }
    ]
  },
  {
    stage: 'Analyze',
    status: 'active',
    count: 18,
    cases: [
      { id: 'TXN_10236', amount: '₹18,000', detail: 'Determining charge route' }
    ]
  },
  {
    stage: 'Decide',
    status: 'active',
    count: 14,
    cases: [
      { id: 'TXN_10237', amount: '₹7,500', detail: 'Recovery link generated' }
    ]
  },
  {
    stage: 'Guardrail',
    status: 'warning',
    count: 3,
    cases: [
      { id: 'TXN_10238', amount: '₹12,000', detail: 'Cooldown guardrail active' }
    ]
  },
  {
    stage: 'Recover',
    status: 'active',
    count: 24,
    cases: [
      { id: 'TXN_10231', amount: '₹15,000', detail: 'Settlement dispatch triggered' }
    ]
  },
  {
    stage: 'Verify',
    status: 'success',
    count: 118,
    cases: [
      { id: 'TXN_10235', amount: '₹2,500', detail: 'Completed reconciliation' }
    ]
  }
];

export const mockAuditLogs = [
  {
    timestamp: '10:34 AM',
    transaction: 'TXN_10234',
    decision: 'VERIFY_SETTLEMENT',
    reason: 'Payment captured, settlement pending',
    guardrail: 'PASSED',
    action: 'Settlement Verification',
    outcome: 'Processed',
    amount: '₹45,000'
  },
  {
    timestamp: '09:45 AM',
    transaction: 'TXN_10235',
    decision: 'AUTO_RESOLVE',
    reason: 'Payment match verified',
    guardrail: 'PASSED',
    action: 'Auto Settlement',
    outcome: 'Resolved',
    amount: '₹2,500'
  },
  {
    timestamp: '08:12 AM',
    transaction: 'TXN_10238',
    decision: 'ESCALATE_CASE',
    reason: 'Retry limit reached',
    guardrail: 'TRIGGERED',
    action: 'Notify Merchant Support',
    outcome: 'Escalated',
    amount: '₹12,000'
  },
  {
    timestamp: '07:22 AM',
    transaction: 'TXN_10236',
    decision: 'MONITOR_SETTLEMENT',
    reason: 'Waiting bank window',
    guardrail: 'PASSED',
    action: 'Activate Cooldown',
    outcome: 'Monitoring',
    amount: '₹18,000'
  },
  {
    timestamp: '06:05 AM',
    transaction: 'TXN_10237',
    decision: 'TRIGGER_RECOVERY',
    reason: 'Auth failure - card retry fallback',
    guardrail: 'PASSED',
    action: 'SMS / Email Link Dispatched',
    outcome: 'Sent',
    amount: '₹7,500'
  }
];

export const mockAIInsights = [
  {
    id: 1,
    text: "Settlement-related revenue risk increased by 18% today. 73 transactions may require merchant attention.",
    type: "warning",
    actionable: "View affected transactions"
  },
  {
    id: 2,
    text: "AI Smart Recovery rate increased to 66.3% following the deployment of the 24h Cooldown retry model.",
    type: "success",
    actionable: "View analytics logs"
  },
  {
    id: 3,
    text: "A transient gateway timeout is affecting HDFC bank debit cards. Recovery guardrails have automatically paused retries for 14 active payments.",
    type: "info",
    actionable: "Check active guardrails"
  }
];

export const mockAIActivity = [
  {
    id: 1,
    status: 'success',
    amount: '₹5,000',
    title: '₹5,000 recovered',
    description: 'Settlement successfully processed',
    time: '2 min ago'
  },
  {
    id: 2,
    status: 'warning',
    amount: '₹8,000',
    title: '₹8,000 monitoring',
    description: 'Settlement verification in progress',
    time: '5 min ago'
  },
  {
    id: 3,
    status: 'error',
    amount: '₹12,000',
    title: '₹12,000 escalated',
    description: 'Recovery limit reached',
    time: '12 min ago'
  },
  {
    id: 4,
    status: 'success',
    amount: '₹45,000',
    title: '₹45,000 resolved',
    description: 'Settlement verified and resolved',
    time: '45 min ago'
  }
];

export const mockPriorityCases = [
  {
    id: 'TXN_10234',
    priority: 'HIGH PRIORITY',
    amount: '₹45,000',
    condition: 'Customer debited',
    issue: 'Merchant settlement missing',
    confidence: '94%',
  },
  {
    id: 'TXN_10236',
    priority: 'MEDIUM PRIORITY',
    amount: '₹18,000',
    condition: 'Settlement pending',
    issue: 'Bank reconciliation timeout',
    confidence: '88%',
  },
  {
    id: 'TXN_10237',
    priority: 'LOW PRIORITY',
    amount: '₹7,500',
    condition: 'Payment recovery required',
    issue: 'Gateway auth failure',
    confidence: '91%',
  }
];

// Helper to convert currencies mocks
export const currencyConversions = {
  INR: { symbol: '₹', rate: 1 },
  USD: { symbol: '$', rate: 0.012 },
  EUR: { symbol: '€', rate: 0.011 },
  GBP: { symbol: '£', rate: 0.0094 }
};

export const formatCurrency = (amount, currencyCode = 'INR') => {
  const conv = currencyConversions[currencyCode] || currencyConversions.INR;
  const converted = Math.round(amount * conv.rate);
  return `${conv.symbol}${converted.toLocaleString('en-IN')}`;
};

// Mock translations
export const translations = {
  English: {
    dashboard: 'Dashboard',
    payments: 'Payments',
    recoveryAgent: 'Recovery Agent',
    analytics: 'Analytics',
    alerts: 'Alerts',
    auditLogs: 'Audit Logs',
    settings: 'Settings',
    helpSupport: 'Help & Support',
    revenueAtRisk: 'Revenue at Risk',
    recoveredRevenue: 'Recovered Revenue',
    activeCases: 'Active Cases',
    recoveryRate: 'Recovery Rate',
    aiActivity: 'AI Recovery Activity',
    priorityCases: 'Priority Cases',
    aiInsight: 'AI Insight',
    welcomeBack: 'Welcome back',
    tagline: 'Recover revenue. Intelligently.',
    searchPlaceholder: 'Search transactions...',
    whatIfSim: 'What-if Recovery Simulator'
  },
  తెలుగు: {
    dashboard: 'డాష్‌బోర్డ్',
    payments: 'చెల్లింపులు',
    recoveryAgent: 'రికవరీ ఏజెంట్',
    analytics: 'విశ్లేషణలు',
    alerts: 'హెచ్చరికలు',
    auditLogs: 'ఆడిట్ లాగ్‌లు',
    settings: 'సెట్టింగ్లు',
    helpSupport: 'సహాయం & మద్దతు',
    revenueAtRisk: 'ప్రమాదంలో ఉన్న రాబడి',
    recoveredRevenue: 'తిరిగి పొందిన రాబడి',
    activeCases: 'సక్రియ కేసులు',
    recoveryRate: 'రికవరీ రేటు',
    aiActivity: 'AI రికవరీ కార్యాచరణ',
    priorityCases: 'ప్రాధాన్యత కేసులు',
    aiInsight: 'AI అంతర్దృష్టి',
    welcomeBack: 'మరలా స్వాగతం',
    tagline: 'రాబడిని తిరిగి పొందండి. తెలివిగా.',
    searchPlaceholder: 'లావాదేవీలను శోధించండి...',
    whatIfSim: 'ఒకవేళ రికవరీ సిమ్యులేటర్'
  },
  हिंदी: {
    dashboard: 'डैशबोर्ड',
    payments: 'भुगतान',
    recoveryAgent: 'रिकवरी एजेंट',
    analytics: 'विश्लेषण',
    alerts: 'अलर्ट',
    auditLogs: 'ऑडिट लॉग',
    settings: 'सेटिंग्स',
    helpSupport: 'सहायता और समर्थन',
    revenueAtRisk: 'जोखिम में राजस्व',
    recoveredRevenue: 'पुनर्प्राप्त राजस्व',
    activeCases: 'सक्रिय मामले',
    recoveryRate: 'रिकवरी दर',
    aiActivity: 'एआई रिकवरी गतिविधि',
    priorityCases: 'प्राथमिकता मामले',
    aiInsight: 'एआई अंतर्दृष्टि',
    welcomeBack: 'वापसी पर स्वागत है',
    tagline: 'राजस्व पुनर्प्राप्त करें। बुद्धिमानी से।',
    searchPlaceholder: 'लेन-देन खोजें...',
    whatIfSim: 'व्हाट-इफ रिकवरी सिम्युलेटर'
  }
};
