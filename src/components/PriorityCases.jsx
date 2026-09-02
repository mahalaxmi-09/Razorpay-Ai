import React from 'react';
import { AlertCircle, ArrowUpRight, Inbox } from 'lucide-react';
import { formatCurrency } from '../services/mockData';

export default function PriorityCases({ transactions = [], currency, onNavigate }) {
  
  // Filter cases from active transaction state
  const priorityItems = transactions.filter(t => t.risk === 'High' || t.riskStatus === 'HIGH' || t.riskStatus === 'CRITICAL' || t.risk === 'Medium' || t.riskStatus === 'MEDIUM');
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
              const isHigh = index === 0;

              if (isHigh) {
                return (
                  <div key={c.id} className="p-4 bg-error-red/[0.02] border border-error-red/20 rounded-xl">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] text-error-red font-extrabold uppercase tracking-widest flex items-center gap-1">
                        <AlertCircle size={10} /> HIGH PRIORITY
                      </span>
                      <span className="text-xs text-secondary-text font-semibold">AI Confidence: <strong className="text-navy-dark font-extrabold">{c.aiConfidence || '94%'}</strong></span>
                    </div>
                    
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xl font-black text-navy-dark">{formatCurrency(c.amount, currency)}</span>
                    </div>

                    <div className="text-xs text-secondary-text space-y-1 mb-4">
                      <div className="flex justify-between border-b border-border-light/40 py-1">
                        <span>Gate Status:</span>
                        <span className="font-bold text-navy-dark">{c.customerDebited === 'Yes' ? 'Customer debited' : 'Failed'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Issue:</span>
                        <span className="font-bold text-error-red truncate max-w-[200px]" title={c.failureReason || c.status}>
                          {c.failureReason || (c.merchantSettlementStatus === 'PENDING' ? 'Merchant settlement pending' : 'Risk action required')}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => onNavigate(`#/payments/${c.id}`)}
                      className="w-full py-2 bg-primary text-white hover:bg-primary/95 font-bold rounded-lg text-xs transition duration-150 flex items-center justify-center gap-1 shadow-sm shadow-primary/25 cursor-pointer"
                    >
                      <span>Investigate</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                );
              }

              return (
                <div 
                  key={c.id} 
                  onClick={() => onNavigate(`#/payments/${c.id}`)}
                  className="p-3 border border-border-light hover:border-primary/30 rounded-lg flex items-center justify-between cursor-pointer transition bg-bg-light/20 hover:bg-bg-light/60"
                >
                  <div>
                    <span className="text-xs text-secondary-text block mb-0.5 truncate max-w-[150px]" title={c.status}>
                      {c.status || 'Settlement pending'}
                    </span>
                    <span className="text-sm font-bold text-navy-dark">{formatCurrency(c.amount, currency)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] block font-semibold text-secondary-text">AI Confidence</span>
                    <span className="text-xs font-bold text-navy-dark">{c.aiConfidence || '91%'}</span>
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
