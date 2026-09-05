import React from 'react';
import { AlertCircle, ArrowUpRight, Inbox, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../services/mockData';
import { isDemoMode } from '../config/dataMode';
import { dashboardDemoData } from '../data/demoData';

export default function PriorityCases({ transactions = [], currency, onNavigate }) {
  const isDemo = isDemoMode();

  const liveCases = transactions.filter(t => 
    t.risk === 'High' || t.riskStatus === 'HIGH' || t.riskStatus === 'CRITICAL' || t.risk === 'Medium' || t.riskStatus === 'MEDIUM'
  );
  
  const priorityItems = isDemo 
    ? dashboardDemoData.priorityCases 
    : liveCases;

  const hasCases = priorityItems.length > 0;

  return (
    <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex flex-col h-full min-h-[220px]">
      <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4 shrink-0">
        <h2 className="text-base font-bold text-navy-dark">Priority Cases</h2>
        {hasCases && (
          <span className="text-[10px] bg-error-red/10 text-error-red px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            Action Required
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {!hasCases ? (
          <div className="border border-dashed border-border-light rounded-xl p-4 flex flex-col items-center justify-center text-center bg-bg-light/10 h-full">
            <Inbox size={24} className="text-secondary-text/50 mb-2" />
            <span className="text-navy-dark font-extrabold text-xs block mb-1">No priority cases yet.</span>
            <p className="text-secondary-text text-[11px] leading-normal max-w-xs">
              Priority cases will appear here when risk events are detected.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {priorityItems.slice(0, 3).map((c, index) => {
              const isFirst = index === 0;

              if (isFirst) {
                const confidenceVal = c.confidence ? `${c.confidence}%` : (c.aiConfidence || '96%');
                const issueText = c.issue || c.failureReason || 'Merchant settlement not confirmed';
                const actionLabel = c.action || 'Verify & reconcile settlement';
                const customerName = c.customer || c.customerName || 'Rahul Sharma';
                const statusLabel = c.status || 'UNDER VERIFICATION';
                const subheading = c.subheading || 'Customer Debited — Settlement Missing';

                const isRecovered = statusLabel === 'VERIFIED RECOVERED' || statusLabel === 'VERIFIED_RECOVERED';

                return (
                  <div key={index} className="p-4 bg-error-red/[0.02] border border-error-red/20 rounded-xl">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] text-error-red font-extrabold uppercase tracking-widest flex items-center gap-1">
                        <AlertCircle size={10} /> {c.priority || 'HIGH PRIORITY'}
                      </span>
                      <span className="text-xs text-secondary-text font-semibold">
                        AI Confidence: <strong className="text-navy-dark font-extrabold">{confidenceVal}</strong>
                      </span>
                    </div>

                    {subheading && (
                      <span className="text-[11px] font-bold text-navy-dark block mb-2">
                        {subheading}
                      </span>
                    )}
                    
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xl font-black text-navy-dark">{formatCurrency(c.amount, currency)}</span>
                      {statusLabel && (
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
                          isRecovered 
                            ? 'bg-success-green/10 text-success-green border-success-green/20' 
                            : 'bg-warning-amber/10 text-warning-amber border-warning-amber/20'
                        }`}>
                          {isRecovered ? <CheckCircle2 size={10} /> : <ShieldAlert size={10} />}
                          {statusLabel}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-secondary-text space-y-1 mb-4">
                      <div className="flex justify-between border-b border-border-light/40 py-1">
                        <span>Customer:</span>
                        <span className="font-bold text-navy-dark">
                          {customerName}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Issue:</span>
                        <span className="font-bold text-error-red truncate max-w-[200px]" title={issueText}>
                          {issueText}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => onNavigate('#/recovery')} 
                      className="w-full py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-xs shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{actionLabel}</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                );
              }

              const customerName = c.customer || c.customerName || `TXN_${c.id || index}`;
              const issueText = c.issue || c.failureReason || c.status;
              const priorityLabel = c.priority || c.risk || c.riskStatus || 'Medium';

              return (
                <div key={index} className="flex items-center justify-between text-xs py-2 border-b border-border-light/40 last:border-0 hover:bg-bg-light/30 px-2 rounded-lg -mx-2 transition">
                  <div className="space-y-0.5">
                    <span className="font-bold text-navy-dark block">{customerName}</span>
                    <span className="text-[11px] text-secondary-text">{issueText}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-navy-dark block">{formatCurrency(c.amount, currency)}</span>
                    <span className="text-[10px] text-warning-amber font-bold">{priorityLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
