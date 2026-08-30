import React from 'react';
import { Sparkles, Activity } from 'lucide-react';
import { formatCurrency } from '../services/mockData';

export default function AIActivity({ transactions = [], currency }) {
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-success-green';
      case 'warning': return 'bg-warning-amber';
      case 'error': return 'bg-error-red';
      default: return 'bg-secondary-text';
    }
  };

  const hasActivity = transactions.length > 0;

  // Render mock activities list only if data exists
  const activities = hasActivity ? [
    { id: 1, status: 'success', amount: 5000, title: '₹5,000 recovered', description: 'Settlement successfully processed', time: '2 min ago' },
    { id: 2, status: 'warning', amount: 8000, title: '₹8,000 monitoring', description: 'Settlement verification in progress', time: '5 min ago' },
    { id: 3, status: 'error', amount: 12000, title: '₹12,000 escalated', description: 'Recovery limit reached', time: '12 min ago' }
  ] : [];

  return (
    <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex flex-col h-full min-h-[220px]">
      <div className="flex items-center gap-2 mb-4 border-b border-border-light pb-3 shrink-0">
        <Sparkles size={18} className="text-primary animate-pulse" />
        <h2 className="text-base font-bold text-navy-dark">AI Recovery Activity</h2>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {!hasActivity ? (
          <div className="border border-dashed border-border-light rounded-xl p-4 flex flex-col items-center justify-center text-center bg-bg-light/10 h-full">
            <Activity size={24} className="text-secondary-text/50 mb-2" />
            <span className="text-navy-dark font-extrabold text-xs block mb-1">No AI recovery actions yet.</span>
            <p className="text-secondary-text text-[11px] leading-normal max-w-xs">
              AI activity will appear once transaction data is available.
            </p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[290px] pr-1">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 text-xs leading-tight transition hover:bg-bg-light/40 p-2 rounded-lg -mx-2">
                <div className="mt-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full block ${getStatusColor(activity.status)}`}></span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-navy-dark">
                      {formatCurrency(activity.amount, currency)} {activity.title.split(' ')[1]}
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
