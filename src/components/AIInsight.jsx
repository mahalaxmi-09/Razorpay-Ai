import React, { useState } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';
import { isDemoMode } from '../config/dataMode';
import { dashboardDemoData } from '../data/demoData';

export default function AIInsight({ transactions = [], onNavigate }) {
  const isDemo = isDemoMode();
  const [activeIndex, setActiveIndex] = useState(0);

  const hasTransactions = transactions && transactions.length > 0;

  // Generate dynamic insights derived from live transactions or controlled demo data
  const insights = [];

  if (isDemo) {
    insights.push({
      id: 'demo-insight',
      text: dashboardDemoData.aiInsight.message,
      type: dashboardDemoData.aiInsight.severity.toLowerCase(),
      actionable: 'View recovery pipeline',
      route: '#/recovery'
    });
  } else if (hasTransactions) {
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
    if (currentInsight && currentInsight.route) {
      onNavigate(currentInsight.route);
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-warning-amber/[0.04]',
          border: 'border-warning-amber/20',
          indicator: 'bg-warning-amber',
          badgeText: 'text-warning-amber',
          badgeBg: 'bg-warning-amber/10'
        };
      case 'success':
        return {
          bg: 'bg-success-green/[0.04]',
          border: 'border-success-green/20',
          indicator: 'bg-success-green',
          badgeText: 'text-success-green',
          badgeBg: 'bg-success-green/10'
        };
      default:
        return {
          bg: 'bg-primary/[0.04]',
          border: 'border-primary/20',
          indicator: 'bg-primary',
          badgeText: 'text-primary',
          badgeBg: 'bg-primary/10'
        };
    }
  };

  const styles = currentInsight ? getTypeStyles(currentInsight.type) : getTypeStyles('info');

  return (
    <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex flex-col justify-between min-h-[160px]">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider">
              AI Insight
            </h3>
          </div>
          {hasInsights && (
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${styles.badgeBg} ${styles.badgeText}`}>
                {currentInsight.type}
              </span>
              {insights.length > 1 && (
                <div className="flex items-center ml-2">
                  <button 
                    onClick={prevInsight}
                    className="p-0.5 text-secondary-text hover:text-navy-dark rounded transition cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] text-secondary-text font-bold px-1">
                    {activeIndex + 1}/{insights.length}
                  </span>
                  <button 
                    onClick={nextInsight}
                    className="p-0.5 text-secondary-text hover:text-navy-dark rounded transition cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {!hasInsights ? (
          <div className="flex items-center gap-3 py-2 text-secondary-text">
            <Lightbulb size={20} className="text-secondary-text/50 shrink-0" />
            <p className="text-xs font-medium">
              No new AI insights available at this moment.
            </p>
          </div>
        ) : (
          <div className={`p-3.5 rounded-lg border ${styles.bg} ${styles.border} transition-all duration-200`}>
            <p className="text-xs font-semibold text-navy-dark leading-relaxed">
              {currentInsight.text}
            </p>
          </div>
        )}
      </div>

      {hasInsights && currentInsight.actionable && (
        <div className="mt-3 pt-3 border-t border-border-light/60 flex justify-between items-center">
          <span className="text-[10px] text-secondary-text font-medium">Grounded recommendation</span>
          <button
            onClick={handleAction}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{currentInsight.actionable}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
