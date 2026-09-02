/**
 * Centralized Controlled DEMO / TEST Dataset for RazorRecover AI
 * 
 * Used for presentation mode, UI testing, and development fallback.
 * Controlled by DATA_MODE ('demo' | 'live').
 */

export const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'demo';

export const dashboardDemoData = {
  // Dashboard KPI Values
  revenueAtRisk: 3198,
  recoveredRevenue: 1150,
  activeCases: 6,
  recoveryRate: 26.4,
  transactionsMonitored: 124,

  // AI Activity / Recovery Values
  recovered: 5000,
  monitoring: 8000,
  escalated: 12000,
  transactionsAnalyzed: 73,
  revenueRiskIncrease: 18,

  // Demo Activity Feed Items
  activityItems: [
    {
      id: 'ACT_01',
      status: 'success',
      amount: 5000,
      title: '✓ ₹5,000 recovered',
      description: 'Payment verified and settled in Test Mode',
      time: '12 mins ago'
    },
    {
      id: 'ACT_02',
      status: 'warning',
      amount: 8000,
      title: '₹8,000 • Monitoring',
      description: 'Settlement reconciliation in progress under 24h cycle',
      time: '28 mins ago'
    },
    {
      id: 'ACT_03',
      status: 'error',
      amount: 12000,
      title: '₹12,000 • Escalated',
      description: 'High-value bank authentication hold routed to compliance',
      time: '1 hour ago'
    },
    {
      id: 'ACT_04',
      status: 'warning',
      amount: 3198,
      title: '₹3,198 • 3DS Drop',
      description: 'Customer card authorization timeout. Recovery link active',
      time: '2 hours ago'
    }
  ],

  // Demo Priority Cases
  priorityCases: [
    {
      id: 'TXN_12000',
      customerName: 'Vikram Mehta',
      amount: 12000,
      status: 'ESCALATED',
      risk: 'Critical',
      riskStatus: 'CRITICAL',
      date: '1 hour ago',
      failureReason: 'Critical compliance & fraud risk flag'
    },
    {
      id: 'TXN_8000',
      customerName: 'Shreya Patel',
      amount: 8000,
      status: 'Settlement Pending',
      risk: 'Medium',
      riskStatus: 'MEDIUM',
      date: '28 mins ago',
      failureReason: 'Settlement reconciliation pending'
    },
    {
      id: 'TXN_3198',
      customerName: 'Deepa Nair',
      amount: 3198,
      status: 'Payment Failed',
      risk: 'High',
      riskStatus: 'HIGH',
      date: '2 hours ago',
      failureReason: 'Customer card authorization timeout'
    }
  ]
};
