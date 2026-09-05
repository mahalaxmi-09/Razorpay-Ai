/**
 * Centralized Controlled DEMO / TEST Dataset for RazorRecover AI
 * 
 * Contains all exact approved Dashboard demo/testing values,
 * including high-value simulated scenarios:
 * 1. "Customer Debited - Merchant Settlement Missing" (₹18,500 - TXN_SETTLE_001)
 * 2. "Wrong Number Payment" (₹4,500 - TXN_WRONG_001)
 */

export const dashboardDemoData = {
  summary: {
    revenueAtRisk: 3198,
    recoveredRevenue: 1150,
    activeCases: 6,
    recoveryRate: 26.4,
    transactionsMonitored: 124,
  },

  recoveryActivity: {
    analyzed: 73,
    increasePercent: 18,

    items: [
      {
        amount: 18500,
        label: "Verifying Settlement",
        description: "Customer debited; verifying merchant settlement batch in Test Mode",
        time: "3 mins ago",
        type: "monitoring"
      },
      {
        amount: 5000,
        label: "Recovered",
        description: "Payment verified and settled in Test Mode",
        time: "12 mins ago",
        type: "success"
      },
      {
        amount: 8000,
        label: "Monitoring",
        description: "Settlement reconciliation in progress under 24h cycle",
        time: "28 mins ago",
        type: "monitoring"
      },
      {
        amount: 12000,
        label: "Escalated",
        description: "High-value bank authentication hold routed to compliance",
        time: "1 hour ago",
        type: "escalated"
      },
      {
        amount: 3198,
        label: "3DS Drop",
        description: "Customer card authorization timeout. Recovery link active",
        time: "2 hours ago",
        type: "warning"
      }
    ]
  },

  guardrails: {
    monitored: 124,
    maxRetries: "3 Attempts",
    cooldown: "24 Hours",
    maxLimit: 100000,
    approvalThreshold: 50000,
    statusText: "All active guards reporting nominal operation."
  },

  priorityCases: [
    {
      id: "TXN_SETTLE_001",
      customer: "Rahul Sharma",
      amount: 18500,
      priority: "HIGH PRIORITY",
      subheading: "Customer Debited — Settlement Missing",
      confidence: 96,
      issue: "Merchant settlement not confirmed",
      paymentStatus: "CAPTURED",
      customerDebited: "Yes",
      merchantSettlement: "Pending",
      action: "Verify & reconcile settlement",
      status: "UNDER VERIFICATION",
      guardrailRule: "DUPLICATE PAYMENT PREVENTION"
    },
    {
      id: "TXN_WRONG_001",
      customer: "Ananya Reddy",
      amount: 4500,
      priority: "HIGH PRIORITY",
      confidence: 92,
      issue: "Incorrect UPI recipient / wrong number",
      action: "Verify recipient before retry",
      status: "GUARDRAIL BLOCKED",
      guardrailRule: "Recipient verification required"
    },
    {
      amount: 12000,
      priority: "HIGH PRIORITY",
      confidence: 94,
      issue: "Critical compliance & fraud risk",
      action: "Trigger Autonomous Recovery"
    },
    {
      customer: "Shreya Patel",
      amount: 8000,
      issue: "Settlement reconciliation pending",
      priority: "Medium"
    },
    {
      customer: "Deepa Nair",
      amount: 3198,
      issue: "Customer card authorization timeout",
      priority: "High"
    }
  ],

  aiInsight: {
    severity: "WARNING",
    message: "₹18,500 payment was captured and the customer was debited, but merchant settlement was not confirmed. Automatic retry was blocked to prevent duplicate payment. Settlement verification has been initiated."
  },

  // Demo chart timeframes
  chartData: {
    '7 Days': [
      { date: 'Mon', revenueAtRisk: 1200, recoveredRevenue: 450 },
      { date: 'Tue', revenueAtRisk: 1900, recoveredRevenue: 800 },
      { date: 'Wed', revenueAtRisk: 1400, recoveredRevenue: 600 },
      { date: 'Thu', revenueAtRisk: 2600, recoveredRevenue: 950 },
      { date: 'Fri', revenueAtRisk: 2200, recoveredRevenue: 850 },
      { date: 'Sat', revenueAtRisk: 2800, recoveredRevenue: 1050 },
      { date: 'Sun', revenueAtRisk: 3198, recoveredRevenue: 1150 }
    ],
    '30 Days': [
      { date: 'Week 1', revenueAtRisk: 1500, recoveredRevenue: 520 },
      { date: 'Week 2', revenueAtRisk: 2100, recoveredRevenue: 780 },
      { date: 'Week 3', revenueAtRisk: 2800, recoveredRevenue: 990 },
      { date: 'Week 4', revenueAtRisk: 3198, recoveredRevenue: 1150 }
    ],
    '90 Days': [
      { date: 'Month 1', revenueAtRisk: 1800, recoveredRevenue: 600 },
      { date: 'Month 2', revenueAtRisk: 2500, recoveredRevenue: 890 },
      { date: 'Month 3', revenueAtRisk: 3198, recoveredRevenue: 1150 }
    ]
  }
};
