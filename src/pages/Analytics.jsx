import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  HelpCircle, 
  Settings2, 
  Calculator, 
  Sparkles 
} from 'lucide-react';
import KPICard from '../components/KPICard';
import { analyticsData } from '../data/analytics';
import { currencyConversions, formatCurrency } from '../services/mockData';

export default function Analytics({ currency }) {
  // Simulator parameters
  const [retryWindow, setRetryWindow] = useState(24);
  const [retryAttempts, setRetryAttempts] = useState(2);

  const hasData = analyticsData.failureReasons && analyticsData.failureReasons.length > 0;

  // Dynamic values based on slider (default fallback structure for future integration)
  const getSimulatedValues = () => {
    if (!hasData) {
      return { txns: 0, risk: 0, minRecovery: 0, maxRecovery: 0 };
    }
    const factorWindow = retryWindow <= 24 ? 1 : retryWindow <= 48 ? 0.85 : 0.65;
    const factorAttempts = retryAttempts === 1 ? 0.7 : retryAttempts === 2 ? 1 : retryAttempts === 3 ? 1.15 : 0.9;

    const eligibleTxns = Math.round(326 * (retryWindow / 24) * (retryAttempts / 2));
    const baseRisk = 420000;
    const convertedRisk = Math.round(baseRisk * (retryWindow / 24) * factorAttempts);
    
    const minRec = Math.round(convertedRisk * 0.68 * factorWindow);
    const maxRec = Math.round(convertedRisk * 0.81 * factorWindow);

    return {
      txns: eligibleTxns,
      risk: convertedRisk,
      minRecovery: minRec,
      maxRecovery: maxRec
    };
  };

  const sim = getSimulatedValues();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-navy-dark leading-none select-none">Analytics</h2>
        <p className="text-xs md:text-sm text-secondary-text mt-1">
          Detailed metrics, failure reasons, and yield simulators.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard title="Total Revenue at Risk" value={null} type="blue" currency={currency} />
        <KPICard title="Total Recovered" value={null} type="green" currency={currency} />
        <KPICard title="Recovery Rate" value={null} type="green" isPercentage={true} currency={currency} />
        
        {/* Metric for average recovery time */}
        <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-secondary-text uppercase tracking-wider block mb-1">
              Avg Recovery Time
            </span>
            <span className="text-2xl md:text-3xl font-extrabold text-navy-dark tracking-tight leading-none block">
              —
            </span>
            <span className="text-[10px] font-semibold text-secondary-text mt-1.5 block">
              Awaiting logs
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary shrink-0">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Failure reasons & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Failure Breakdown Card */}
        <div className="lg:col-span-1 bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <h3 className="text-base font-bold text-navy-dark mb-1">Failure Reasons</h3>
            <p className="text-xs text-secondary-text mb-6">Principal friction events causing captured payment delays.</p>

            {hasData ? (
              <div className="space-y-4">
                {analyticsData.failureReasons.map((item) => (
                  <div key={item.name} className="text-xs space-y-1.5">
                    <div className="flex justify-between font-bold text-navy-dark">
                      <span className="truncate max-w-[200px]" title={item.name}>{item.name}</span>
                      <span>{item.percentage}% ({item.count})</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-bg-light border border-border-light rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border-light rounded-xl p-4 flex flex-col items-center justify-center text-center bg-bg-light/10 min-h-[160px]">
                <span className="text-navy-dark font-extrabold text-xs block mb-1">No failure data yet.</span>
                <p className="text-secondary-text text-[11px] leading-normal max-w-xs">
                  Friction breakdown will appear once gateway transactions are linked.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border-light/60 pt-4 mt-6 text-center">
            <span className="text-[10px] text-secondary-text uppercase font-bold tracking-wider">
              {hasData ? `Sample size: ${analyticsData.failureReasons.reduce((a,b)=>a+b.count,0)} issues analyzed` : 'No issues analyzed yet'}
            </span>
          </div>
        </div>

        {/* What-if Simulator Column (spans 2 cols) */}
        <div className="lg:col-span-2 bg-card-bg p-6 rounded-xl border border-primary/20 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[320px]">
          {/* subtle background glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl"></div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                <Calculator size={14} />
              </div>
              <h3 className="text-base font-bold text-navy-dark">What-if Recovery Simulator</h3>
            </div>
            <p className="text-xs text-secondary-text mb-6">
              Simulate recovery yields by adjusting retry attempts and transaction cooldown windows.
            </p>

            {hasData ? (
              <>
                {/* Inputs grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Retry Window Slider */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-navy-dark">
                      <span className="flex items-center gap-1">
                        Retry Window
                        <HelpCircle size={12} className="text-secondary-text" title="Ideal range is 24-48 hours" />
                      </span>
                      <span className="text-primary">{retryWindow} Hours</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      step="12"
                      value={retryWindow}
                      onChange={(e) => setRetryWindow(parseInt(e.target.value, 10))}
                      className="w-full accent-primary bg-bg-light border border-border-light rounded-lg h-2"
                    />
                    <span className="text-[10px] text-secondary-text block">Recommended: 24–48 hours</span>
                  </div>

                  {/* Retry Attempts Slider */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-navy-dark">
                      <span>Retry attempts limit</span>
                      <span className="text-primary">{retryAttempts} Retries</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={retryAttempts}
                      onChange={(e) => setRetryAttempts(parseInt(e.target.value, 10))}
                      className="w-full accent-primary bg-bg-light border border-border-light rounded-lg h-2"
                    />
                    <span className="text-[10px] text-secondary-text block">Recommended: 2 retries</span>
                  </div>
                </div>

                {/* Simulated outputs */}
                <div className="bg-bg-light border border-border-light rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider block mb-1">Eligible Transactions</span>
                    <span className="text-base font-extrabold text-navy-dark">{sim.txns}</span>
                  </div>
                  
                  <div>
                    <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider block mb-1">Simulated Risk</span>
                    <span className="text-base font-extrabold text-navy-dark">{formatCurrency(sim.risk, currency)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider block mb-1">Expected Recovery</span>
                    <div className="flex items-center justify-center gap-1 font-black text-success-green text-base">
                      <span>{formatCurrency(sim.minRecovery, currency)}</span>
                      <span>–</span>
                      <span>{formatCurrency(sim.maxRecovery, currency)}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="border border-dashed border-border-light rounded-xl p-8 flex flex-col items-center justify-center text-center bg-bg-light/10 min-h-[160px]">
                <span className="text-navy-dark font-extrabold text-sm block mb-1">Simulator Locked</span>
                <p className="text-secondary-text text-xs max-w-xs leading-normal">
                  Connect your transaction data to run interactive retry simulations and yield estimates.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border-light/60 pt-4 mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <span className="text-secondary-text font-semibold flex items-center gap-1">
              <Sparkles size={12} className="text-primary shrink-0" />
              {hasData ? `Retrying captures within ${retryWindow} hours yields optimal authorization rates.` : 'Awaiting payment integrations to simulate recovery outcomes.'}
            </span>
            
            {hasData && (
              <button
                onClick={() => alert("Simulation settings saved to active AI guardrail preferences!")}
                className="px-3 py-1.5 bg-primary text-white hover:bg-primary/95 font-bold rounded-lg text-xs transition duration-150 cursor-pointer shadow-sm"
              >
                Apply to Guardrails
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
