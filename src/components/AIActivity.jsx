import React from 'react';
import { Sparkles, Activity } from 'lucide-react';
import { formatCurrency } from '../services/mockData';
import { DATA_MODE, dashboardDemoData } from '../data/demoData';

export default function AIActivity({ transactions = [], currency }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-success-green';
      case 'warning': return 'bg-warning-amber';
      case 'error': return 'bg-error-red';
      default: return 'bg-secondary-text';
    }
  };

  const isDemo = DATA_MODE === 'demo';
  const hasLiveTransactions = transactions.length > 0;

  // Determine display activity list
  let displayActivities = [];

  if (hasLiveTransactions) {
    displayActivities = transactions.slice(0, 4).map(t => {
      const isRecovered = t.status === 'Recovered' || t.status === 'VERIFIED_RECOVERED';
      return {
        id: t.id,
        status: isRecovered ? 'success' : (t.status === 'Payment Failed' || t.status === 'FAILED' ? 'error' : 'warning'),
        amount: t.amount,
        title: isRecovered 
          ? `✓ ${formatCurrency(t.amount, currency)} recovered` 
          : `${formatCurrency(t.amount, currency)} • ${t.status}`,
        description: isRecovered 
          ? 'Payment verified successfully' 
          : (t.failureReason || (t.status === 'Settlement Pending' ? 'Settlement reconciliation in progress' : 'Monitored by recovery engine')),
        time: t.date || 'Recently'
      };
    });
  } else if (isDemo) {
    displayActivities = dashboardDemoData.activityItems.map(item => ({
      ...item,
      title: item.amount ? (item.status === 'success' ? `✓ ${formatCurrency(item.amount, currency)} recovered` : `${formatCurrency(item.amount, currency)} • ${item.title.split('• ')[1] || 'Tracked'}`) : item.title
    }));
  }

  const showEmptyState = !hasLiveTransactions && !isDemo;

  return (
    <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex flex-col h-full min-h-[220px]">
      <div className="flex items-center justify-between mb-4 border-b border-border-light pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary animate-pulse" />
          <h2 className="text-base font-bold text-navy-dark">AI Recovery Activity</h2>
        </div>
        {isDemo && (
          <span className="text-[10px] font-bold text-secondary-text bg-bg-light px-2 py-0.5 rounded border border-border-light">
            {dashboardDemoData.transactionsAnalyzed} analyzed (+{dashboardDemoData.revenueRiskIncrease}%)
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {showEmptyState ? (
          <div className="border border-dashed border-border-light rounded-xl p-4 flex flex-col items-center justify-center text-center bg-bg-light/10 h-full">
            <Activity size={24} className="text-secondary-text/50 mb-2" />
            <span className="text-navy-dark font-extrabold text-xs block mb-1">No recoveries yet.</span>
            <p className="text-secondary-text text-[11px] leading-normal max-w-xs">
              AI recovery activity will appear once transactions are verified.
            </p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[290px] pr-1">
            {displayActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 text-xs leading-tight transition hover:bg-bg-light/40 p-2 rounded-lg -mx-2">
                <div className="mt-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full block ${getStatusColor(activity.status)}`}></span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-navy-dark">
                      {activity.title}
                    </span>
                    <span className="text-[10px] text-secondary-text font-medium">{activity.time}</span>
                  </div>
                  <p className="text-secondary-text text-[11px] mt-1">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
