import React, { useState, useEffect } from 'react';
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
import { api } from '../lib/api';

export default function RecoveryAgent({ onNavigate }) {
  const [selectedStage, setSelectedStage] = useState('Detect');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.getRecoveryCases();
      const items = res.data || res || [];
      setCases(items);
    } catch (err) {
      console.error('Failed to load recovery cases:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

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

  // Group cases dynamically by pipeline stages
  const detectCases = cases.filter(c => c.status === 'OPEN');
  const analyzeCases = cases.filter(c => c.status === 'MONITORING');
  const decideCases = cases.filter(c => c.aiDecisions && c.aiDecisions.length > 0);
  const guardrailCases = cases.filter(c => c.status === 'ESCALATED' || c.status === 'STOPPED');
  const recoverCases = cases.filter(c => c.recommendedAction === 'RETRY_ELIGIBLE_PAYMENT');
  const verifyCases = cases.filter(c => c.status === 'RECOVERED');

  const stages = [
    { stage: 'Detect', count: detectCases.length, cases: detectCases, status: 'warning' },
    { stage: 'Analyze', count: analyzeCases.length, cases: analyzeCases, status: 'info' },
    { stage: 'Decide', count: decideCases.length, cases: decideCases, status: 'info' },
    { stage: 'Guardrail', count: guardrailCases.length, cases: guardrailCases, status: guardrailCases.length > 0 ? 'error' : 'success' },
    { stage: 'Recover', count: recoverCases.length, cases: recoverCases, status: 'info' },
    { stage: 'Verify', count: verifyCases.length, cases: verifyCases, status: 'success' }
  ];

  const activeStageData = stages.find(s => s.stage === selectedStage) || stages[0];

  const handleTriggerSim = async (caseId, action) => {
    try {
      setActionMessage(`Executing simulation on ${caseId}...`);
      await api.simulateRecoveryAction(caseId, action || 'VERIFY_STATUS');
      setActionMessage(`✅ Simulation successful on ${caseId}`);
      await fetchCases();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage(`❌ Simulation blocked: ${err.message}`);
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

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
            <span>Agent Status: ACTIVE (TEST MODE)</span>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs font-bold text-navy-dark">
          {actionMessage}
        </div>
      )}

      {/* AI Pipeline Visualization Map */}
      <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
        <h3 className="text-xs font-bold text-secondary-text uppercase tracking-wider mb-6">AI Pipeline Workflow Visualization</h3>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
          {stages.map((item, idx) => {
            const Icon = getStageIcon(item.stage);
            const isSelected = selectedStage === item.stage;

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
              {loading ? (
                <div className="py-8 text-center text-secondary-text font-semibold text-xs">
                  Loading recovery cases...
                </div>
              ) : activeStageData.cases.length === 0 ? (
                <div className="py-8 text-center text-secondary-text font-semibold text-xs">
                  No active cases in queue for stage {activeStageData.stage}.
                </div>
              ) : (
                activeStageData.cases.map((c) => {
                  const txn = c.transaction || {};
                  const displayAmt = txn.amount ? `₹${(txn.amount / 100).toLocaleString('en-IN')}` : '₹0';

                  return (
                    <div key={c.id} className="py-3 flex items-center justify-between text-xs hover:bg-bg-light/20 px-2 rounded-lg -mx-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-primary hover:underline cursor-pointer" onClick={() => onNavigate(`#/payments/${c.transactionId}`)}>
                            {c.transactionId}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 font-bold rounded ${c.priority === 'High' ? 'bg-error-red/10 text-error-red' : 'bg-warning-amber/10 text-warning-amber'}`}>
                            {c.priority} Priority
                          </span>
                        </div>
                        <p className="text-secondary-text text-[11px] font-semibold">
                          Recommended: <span className="text-navy-dark font-bold">{c.recommendedAction}</span> • Status: {c.status}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-black text-navy-dark">{displayAmt}</span>
                        <button 
                          onClick={() => handleTriggerSim(c.id, c.recommendedAction)}
                          className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded transition hover:bg-primary/90 cursor-pointer shadow-sm"
                        >
                          Simulate Action
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-border-light/60 pt-4 mt-6 flex justify-between items-center text-xs">
            <span className="text-secondary-text">Live database queue connected.</span>
            <button 
              onClick={fetchCases}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              Refresh Queue
            </button>
          </div>
        </div>

        {/* AI Agent Status / Metrics Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
            <h3 className="text-sm font-bold text-navy-dark mb-4 border-b border-border-light/60 pb-2">Pipeline Summary Metrics</h3>
            
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-bg-light rounded-lg border border-border-light">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">ACTIVE RECOVERY CASES</span>
                <span className="text-base font-extrabold text-navy-dark">{cases.length} cases tracked</span>
              </div>

              <div className="p-3 bg-bg-light rounded-lg border border-border-light">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">GUARDRAIL INTERVENTIONS</span>
                <span className="text-base font-extrabold text-warning-amber">{guardrailCases.length} holds active</span>
              </div>

              <div className="p-3 bg-bg-light rounded-lg border border-border-light">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">COMPLETED VERIFICATIONS</span>
                <span className="text-base font-extrabold text-success-green">{verifyCases.length} resolved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
