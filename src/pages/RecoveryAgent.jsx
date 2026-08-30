import React, { useState } from 'react';
import { 
  Bot, 
  Search, 
  HelpCircle, 
  ChevronRight, 
  Database, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import { recoveryData } from '../data/recovery';

export default function RecoveryAgent({ onNavigate }) {
  const [selectedStage, setSelectedStage] = useState('Detect');

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'Detect': return Database;
      case 'Analyze': return Layers;
      case 'Decide': return TrendingUp;
      case 'Guardrail': return ShieldCheck;
      case 'Recover': return Bot;
      case 'Verify': return CheckCircle;
      default: return HelpCircle;
    }
  };

  const getStageColor = (status) => {
    switch (status) {
      case 'success': return 'border-success-green text-success-green bg-success-green/10';
      case 'warning': return 'border-warning-amber text-warning-amber bg-warning-amber/10';
      case 'error': return 'border-error-red text-error-red bg-error-red/10';
      default: return 'border-primary text-primary bg-primary/10';
    }
  };

  const activeStageData = recoveryData.stages.find(item => item.stage === selectedStage) || recoveryData.stages[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-navy-dark leading-none select-none">AI Recovery Agent</h2>
          <p className="text-xs md:text-sm text-secondary-text mt-1">
            Observe the active AI reconciliation pipeline and autonomous recovery workflows.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success-green/10 text-success-green rounded-lg border border-success-green/20 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-success-green animate-pulse"></span>
            <span>Agent Status: NOMINAL</span>
          </div>
        </div>
      </div>

      {/* AI Pipeline Visualization Map */}
      <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
        <h3 className="text-xs font-bold text-secondary-text uppercase tracking-wider mb-6">AI Pipeline Workflow Visualization</h3>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
          {recoveryData.stages.map((item, idx) => {
            const Icon = getStageIcon(item.stage);
            const isSelected = selectedStage === item.stage;
            const colors = getStageColor(item.status);

            return (
              <div key={item.stage} className="flex flex-col items-center relative">
                {/* Horizontal Line Connector */}
                {idx < 5 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 bg-border-light z-0">
                    <ChevronRight size={12} className="absolute -top-1.5 right-0 text-secondary-text/50" />
                  </div>
                )}
                
                {/* Stage Button Icon */}
                <button
                  onClick={() => setSelectedStage(item.stage)}
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center border-2 transition z-10 cursor-pointer
                    ${isSelected 
                      ? 'border-primary bg-primary text-white scale-110 shadow-lg shadow-primary/20' 
                      : `bg-card-bg hover:bg-bg-light border-border-light text-secondary-text hover:text-navy-dark`
                    }
                  `}
                >
                  <Icon size={20} />
                </button>

                {/* Info Text */}
                <div className="text-center mt-3">
                  <span className="block text-xs font-extrabold text-navy-dark leading-none">{item.stage}</span>
                  <span className="inline-block text-[10px] text-secondary-text font-bold mt-1 px-1.5 py-0.5 bg-bg-light border border-border-light rounded-full">
                    {item.count} cases
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases Listing */}
        <div className="lg:col-span-2 bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-border-light pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
                <h3 className="text-sm font-bold text-navy-dark">Queue Details: Stage {activeStageData.stage}</h3>
              </div>
              <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">
                Showing {activeStageData.cases.length} entries
              </span>
            </div>

            <div className="divide-y divide-border-light/60">
              {activeStageData.cases.length === 0 ? (
                <div className="py-8 text-center text-secondary-text font-semibold">
                  No active cases in queue for stage {activeStageData.stage}.
                </div>
              ) : (
                activeStageData.cases.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between text-xs hover:bg-bg-light/20 px-2 rounded-lg -mx-2">
                    <div className="space-y-1">
                      <span className="font-extrabold text-primary hover:underline cursor-pointer" onClick={() => onNavigate(`#/payments/${c.id}`)}>
                        {c.id}
                      </span>
                      <p className="text-secondary-text text-[11px] font-semibold">{c.detail}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-black text-navy-dark">{c.amount}</span>
                      <button 
                        onClick={() => onNavigate(`#/payments/${c.id}`)}
                        className="px-2.5 py-1 bg-card-bg border border-border-light hover:border-primary text-[10px] font-bold text-navy-dark hover:bg-primary/5 rounded transition cursor-pointer"
                      >
                        Audit case
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-border-light/60 pt-4 mt-6 flex justify-between items-center text-xs">
            <span className="text-secondary-text">Reconciliation feeds automatically updated every 15s.</span>
            <button 
              onClick={() => alert("Verification run triggered successfully!")}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              Trigger Run Manually
            </button>
          </div>
        </div>

        {/* AI Agent Status / Metrics Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
            <h3 className="text-sm font-bold text-navy-dark mb-4 border-b border-border-light/60 pb-2">Pipeline Summary Metrics</h3>
            
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-bg-light rounded-lg border border-border-light">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">TOTAL PIPELINE CAPTURES</span>
                <span className="text-base font-extrabold text-navy-dark">177 active processes</span>
              </div>

              <div className="p-3 bg-bg-light rounded-lg border border-border-light">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">GUARDRAIL INTERVENTIONS</span>
                <span className="text-base font-extrabold text-warning-amber">3 holds active</span>
              </div>

              <div className="p-3 bg-bg-light rounded-lg border border-border-light">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">COMPLETED VERIFICATIONS (24H)</span>
                <span className="text-base font-extrabold text-success-green">412 resolved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
