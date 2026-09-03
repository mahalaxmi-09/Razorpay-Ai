import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  HelpCircle, 
  Settings2, 
  Calculator, 
  Sparkles 
} from 'lucide-react';
import KPICard from '../components/KPICard';
import { isDemoMode } from '../config/dataMode';
import { dashboardDemoData } from '../data/demoData';
import { transactionsData } from '../data/transactions';
import { api } from '../lib/api';
import { currencyConversions, formatCurrency } from '../services/mockData';

export default function Analytics({ currency }) {
  const isDemo = isDemoMode();
  const [summary, setSummary] = useState({
    revenueAtRisk: null,
    recoveredRevenue: null,
    activeCases: null,
    recoveryRate: null
  });
  const [failureReasons, setFailureReasons] = useState([]);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Simulator parameters
  const [retryWindow, setRetryWindow] = useState(24);
  const [retryAttempts, setRetryAttempts] = useState(2);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (isDemo) {
        setSummary({
          revenueAtRisk: dashboardDemoData.summary.revenueAtRisk,
          recoveredRevenue: dashboardDemoData.summary.recoveredRevenue,
          activeCases: dashboardDemoData.summary.activeCases,
          recoveryRate: dashboardDemoData.summary.recoveryRate
        });
        setTransactionsCount(dashboardDemoData.summary.transactionsMonitored);

        const reasonCounts = {};
        let totalFailures = 0;

        transactionsData.forEach(t => {
          if (t.failureReason) {
            totalFailures++;
            reasonCounts[t.failureReason] = (reasonCounts[t.failureReason] || 0) + 1;
          } else if (t.merchantSettlementStatus === 'PENDING') {
            totalFailures++;
            const reason = 'Settlement Pending Reconciliation';
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
          }
        });

        const colors = ['bg-error-red', 'bg-warning-amber', 'bg-primary', 'bg-navy-dark'];
        const formatted = Object.entries(reasonCounts).map(([name, count], idx) => ({
          name,
          count,
          percentage: totalFailures > 0 ? Math.round((count / totalFailures) * 100) : 0,
          color: colors[idx % colors.length]
        }));

        setFailureReasons(formatted);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [sumData, txns] = await Promise.all([
          api.getDashboardSummary(),
          api.getPayments()
        ]);

        setSummary(sumData);
        setTransactionsCount(Array.isArray(txns) ? txns.length : 0);

        const reasonCounts = {};
        let totalFailures = 0;

        (Array.isArray(txns) ? txns : []).forEach(t => {
          if (t.failureReason) {
            totalFailures++;
            reasonCounts[t.failureReason] = (reasonCounts[t.failureReason] || 0) + 1;
          } else if (t.merchantSettlementStatus === 'PENDING') {
            totalFailures++;
            const reason = 'Settlement Pending Reconciliation';
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
          }
        });

        const colors = ['bg-error-red', 'bg-warning-amber', 'bg-primary', 'bg-navy-dark'];
        const formatted = Object.entries(reasonCounts).map(([name, count], idx) => ({
          name,
          count,
          percentage: totalFailures > 0 ? Math.round((count / totalFailures) * 100) : 0,
          color: colors[idx % colors.length]
        }));

        setFailureReasons(formatted);
      } catch (err) {
        console.error('Failed to load analytics records:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [isDemo]);

  // Currency multiplier
  const conv = currencyConversions[currency] || currencyConversions.INR;

  // Simulator dynamic calculations
  const rawRisk = summary.revenueAtRisk || 0;
  const baseRecoverableRate = (retryAttempts * 0.15) + (retryWindow === 24 ? 0.15 : retryWindow === 48 ? 0.25 : 0.05);
  const simulatedYieldPercent = Math.min(Math.round(baseRecoverableRate * 100), 85);
  const simulatedRecoveredAmount = Math.round(rawRisk * (simulatedYieldPercent / 100));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-navy-dark leading-none select-none">Recovery Analytics</h2>
        <p className="text-xs md:text-sm text-secondary-text mt-1">
          Detailed metrics on payment failure causes, recovery yields, and simulated optimizations.
        </p>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard 
          title="Revenue at Risk" 
          value={summary.revenueAtRisk} 
          type="blue" 
          currency={currency} 
        />
        <KPICard 
          title="Recovered Revenue" 
          value={summary.recoveredRevenue} 
          type="green" 
          currency={currency} 
        />
        <KPICard 
          title="Active Cases" 
          value={summary.activeCases} 
          type="navy" 
          isCount={true}
          currency={currency} 
        />
        <KPICard 
          title="Recovery Rate" 
          value={summary.recoveryRate} 
          type="green" 
          isPercentage={true}
          currency={currency} 
        />
      </div>

      {/* Analytics Main Breakdown Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failure Reasons Breakdown Card */}
        <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                <h3 className="text-base font-bold text-navy-dark">Primary Failure Causes</h3>
              </div>
              <span className="text-[10px] font-bold text-secondary-text">
                {transactionsCount} Total Events
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-secondary-text">Loading failure causes...</div>
            ) : failureReasons.length === 0 ? (
              <div className="border border-dashed border-border-light rounded-xl p-8 text-center text-secondary-text text-xs">
                No payment failures recorded in database.
              </div>
            ) : (
              <div className="space-y-4">
                {failureReasons.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-navy-dark truncate max-w-[280px]" title={item.name}>
                        {item.name}
                      </span>
                      <span className="text-secondary-text font-semibold">
                        {item.count} events ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-bg-light rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border-light/60 pt-4 mt-6 flex items-center justify-between text-xs text-secondary-text">
            <span>Root-cause telemetry grouped by AI diagnosis</span>
            <span className="font-bold text-navy-dark">OpenAI Grounded</span>
          </div>
        </div>

        {/* Interactive Recovery Simulator */}
        <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-success-green" />
                <h3 className="text-base font-bold text-navy-dark">Recovery Yield Simulator</h3>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-success-green/10 text-success-green border border-success-green/20">
                Predictive
              </span>
            </div>

            <p className="text-xs text-secondary-text mb-4">
              Simulate potential recovered yield by tuning guardrail retry windows and autonomous attempt limits.
            </p>

            <div className="space-y-4">
              {/* Retry Window Slider */}
              <div className="p-3 bg-bg-light rounded-lg border border-border-light space-y-2">
                <div className="flex justify-between text-xs font-bold text-navy-dark">
                  <span>Retry Cooldown Window</span>
                  <span className="text-primary">{retryWindow} Hours</span>
                </div>
                <input 
                  type="range" 
                  min="6" 
                  max="72" 
                  step="6"
                  value={retryWindow}
                  onChange={(e) => setRetryWindow(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Max Attempts Selector */}
              <div className="p-3 bg-bg-light rounded-lg border border-border-light space-y-2">
                <div className="flex justify-between text-xs font-bold text-navy-dark">
                  <span>Max Auto Attempts</span>
                  <span className="text-primary">{retryAttempts} Retries</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRetryAttempts(num)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded border transition cursor-pointer ${
                        retryAttempts === num 
                          ? 'bg-primary text-white border-primary shadow-sm' 
                          : 'bg-card-bg text-secondary-text border-border-light hover:text-navy-dark'
                      }`}
                    >
                      {num} {num === 1 ? 'Attempt' : 'Attempts'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulator Output Box */}
              <div className="p-4 bg-success-green/[0.04] border border-success-green/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-secondary-text">Estimated Recoverable Yield:</span>
                  <span className="text-sm font-black text-success-green">{simulatedYieldPercent}%</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-success-green/10 pt-2">
                  <span className="font-bold text-navy-dark">Potential Added Revenue:</span>
                  <span className="text-base font-black text-navy-dark">
                    {formatCurrency(simulatedRecoveredAmount, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border-light/60 pt-4 mt-6 flex items-center justify-between text-xs text-secondary-text">
            <span>Projection based on simulated mathematical model</span>
            <span className="text-primary font-bold">Policy Safe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
