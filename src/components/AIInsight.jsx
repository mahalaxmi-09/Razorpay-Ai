import React, { useState } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';

export default function AIInsight({ transactions = [], onNavigate }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const hasTransactions = transactions && transactions.length > 0;

  // Generate dynamic insights strictly derived from actual database transactions
  const insights = [];

  if (hasTransactions) {
    const atRiskTxns = transactions.filter(t => t.risk === 'High' || t.riskStatus === 'HIGH' || t.riskStatus === 'CRITICAL');
    const pendingSettlements = transactions.filter(t => t.merchantSettlementStatus === 'PENDING' || t.status === 'Settlement Pending');
    const recoveredTxns = transactions.filter(t => t.status === 'Recovered' || t.rawStatus === 'SETTLEMENT_PROCESSED');
    const failedTxns = transactions.filter(t => t.status === 'Payment Failed' || t.rawStatus === 'FAILED');

    if (atRiskTxns.length > 0) {
      insights.push({
        id: 'risk',
        text: `${atRiskTxns.length} payment${atRiskTxns.length > 1 ? 's are' : ' is'} flagged at high revenue risk. Automated recovery workflows are active.`,
        type: 'warning',
        actionable: 'View affected transactions',
        route: '#/payments'
      });
    }

    if (pendingSettlements.length > 0) {
      insights.push({
        id: 'settlement',
        text: `${pendingSettlements.length} captured payment${pendingSettlements.length > 1 ? 's are' : ' is'} undergoing bank settlement reconciliation monitoring.`,
        type: 'info',
        actionable: 'View recovery pipeline',
        route: '#/recovery'
      });
    }

    if (recoveredTxns.length > 0) {
      insights.push({
        id: 'recovered',
        text: `${recoveredTxns.length} transaction${recoveredTxns.length > 1 ? 's have' : ' has'} been successfully verified and recovered into settled funds.`,
        type: 'success',
        actionable: 'View analytics logs',
        route: '#/analytics'
      });
    }

    if (failedTxns.length > 0 && atRiskTxns.length === 0) {
      insights.push({
        id: 'failed',
        text: `${failedTxns.length} failed payment${failedTxns.length > 1 ? 's' : ''} evaluated by safety guardrails.`,
        type: 'warning',
        actionable: 'Inspect failure causes',
        route: '#/payments'
      });
    }
  }

  const hasInsights = insights.length > 0;
  const currentInsight = hasInsights ? insights[activeIndex % insights.length] : null;

  const nextInsight = () => {
    setActiveIndex((prev) => (prev + 1) % insights.length);
  };

  const prevInsight = () => {
    setActiveIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  const handleAction = () => {
    if (!currentInsight || !onNavigate) return;
    onNavigate(currentInsight.route || '#/payments');
  };

  const getBorderColor = (type) => {
    if (!hasInsights) return 'border-border-light bg-card-bg';
    if (type === 'warning') return 'border-warning-amber/40 bg-warning-amber/[0.02]';
    if (type === 'success') return 'border-success-green/40 bg-success-green/[0.02]';
    return 'border-primary/40 bg-primary/[0.02]';
  };

  return (
    <div className={`p-6 rounded-xl border transition-all duration-300 ${getBorderColor(currentInsight?.type)} flex flex-col justify-between min-h-[140px] h-full`}>
      {!hasInsights ? (
        <div className="flex flex-col items-center justify-center text-center h-full gap-2 py-2">
          <div className="flex items-center gap-1.5 justify-center">
            <Lightbulb size={16} className="text-secondary-text/60 animate-pulse" />
            <span className="text-navy-dark font-extrabold text-xs block">No insights available yet.</span>
          </div>
          <p className="text-secondary-text text-[11px] leading-normal max-w-xs">
            Insights will appear dynamically as transaction records enter the system.
          </p>
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles size={14} />
                </div>
                <span className="text-xs font-bold text-navy-dark uppercase tracking-wider">AI Insight</span>
              </div>
              
              {/* Pagers */}
              {insights.length > 1 && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={prevInsight}
                    className="p-1 hover:bg-bg-light border border-border-light rounded text-secondary-text cursor-pointer"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <span className="text-[10px] text-secondary-text font-bold px-1 select-none">
                    {(activeIndex % insights.length) + 1}/{insights.length}
                  </span>
                  <button 
                    onClick={nextInsight}
                    className="p-1 hover:bg-bg-light border border-border-light rounded text-secondary-text cursor-pointer"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm font-semibold text-navy-dark leading-relaxed mb-4">
              "{currentInsight.text}"
            </p>
          </div>

          <button
            onClick={handleAction}
            className="self-start text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition"
          >
            <span>{currentInsight.actionable}</span>
            <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  );
}
