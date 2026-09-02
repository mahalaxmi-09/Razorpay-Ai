// Utility localization and currency conversion tables for RazorRecover AI

export const currencyConversions = {
  INR: { symbol: '₹', rate: 1 },
  USD: { symbol: '$', rate: 0.012 },
  EUR: { symbol: '€', rate: 0.011 },
  GBP: { symbol: '£', rate: 0.0094 }
};

export const formatCurrency = (amount, currencyCode = 'INR') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }
  const conv = currencyConversions[currencyCode] || currencyConversions.INR;
  const converted = Math.round(amount * conv.rate);
  return `${conv.symbol}${converted.toLocaleString('en-IN')}`;
};

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
