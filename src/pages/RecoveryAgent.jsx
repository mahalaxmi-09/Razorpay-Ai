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
  PlayCircle,
  Sparkles,
  Check,
  X,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../lib/api';

export default function RecoveryAgent({ onNavigate }) {
  const [selectedStage, setSelectedStage] = useState('Detect');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [analyzingCaseId, setAnalyzingCaseId] = useState(null);
  const [processingCaseId, setProcessingCaseId] = useState(null);

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
      case 'Approval': return ShieldCheck;
      case 'Execute': return Bot;
      case 'Verify': return CheckCircle;
      default: return HelpCircle;
    }
  };

  // Group cases dynamically by Phase 6 state machine stages
  const detectCases = cases.filter(c => c.status === 'OPEN');
  const analyzeCases = cases.filter(c => c.status === 'ANALYZING' || c.status === 'MONITORING');
  const decideCases = cases.filter(c => c.status === 'ACTION_RECOMMENDED');
  const approvalCases = cases.filter(c => c.status === 'AWAITING_APPROVAL');
  const executeCases = cases.filter(c => c.status === 'APPROVED' || c.status === 'EXECUTING' || c.status === 'VERIFYING');
  const verifyCases = cases.filter(c => c.status === 'VERIFIED_RECOVERED');
  const stoppedCases = cases.filter(c => c.status === 'STOPPED' || c.status === 'ESCALATED' || c.status === 'FAILED');

  const stages = [
    { stage: 'Detect', count: detectCases.length, cases: detectCases, status: 'warning' },
    { stage: 'Analyze', count: analyzeCases.length, cases: analyzeCases, status: 'info' },
    { stage: 'Decide', count: decideCases.length, cases: decideCases, status: 'info' },
    { stage: 'Approval', count: approvalCases.length, cases: approvalCases, status: approvalCases.length > 0 ? 'warning' : 'info' },
    { stage: 'Execute', count: executeCases.length, cases: executeCases, status: 'info' },
    { stage: 'Verify', count: verifyCases.length, cases: verifyCases, status: 'success' }
  ];

  const activeStageData = stages.find(s => s.stage === selectedStage) || stages[0];

  const handleApproveCase = async (caseId) => {
    try {
      setProcessingCaseId(caseId);
      setActionMessage(`Approving recovery for case ${caseId}...`);
      const res = await api.approveRecoveryCase(caseId);
      setActionMessage(`✅ Case ${caseId} approved and executed. Result: ${res.data?.status || 'COMPLETED'}`);
      await fetchCases();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage(`❌ Approval failed: ${err.message}`);
      setTimeout(() => setActionMessage(''), 4000);
    } finally {
      setProcessingCaseId(null);
    }
  };

  const handleRejectCase = async (caseId) => {
    try {
      setProcessingCaseId(caseId);
      setActionMessage(`Rejecting recovery for case ${caseId}...`);
      await api.rejectRecoveryCase(caseId, 'MERCHANT', 'Merchant rejected automated recovery.');
      setActionMessage(`🛑 Case ${caseId} halted and marked STOPPED.`);
      await fetchCases();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage(`❌ Rejection error: ${err.message}`);
      setTimeout(() => setActionMessage(''), 4000);
    } finally {
      setProcessingCaseId(null);
    }
  };

  const handleExecuteRecovery = async (caseId, action) => {
    try {
      setProcessingCaseId(caseId);
      setActionMessage(`Autonomous Agent executing ${action || 'recovery'} on ${caseId}...`);
      const res = await api.executeRecoveryAction(caseId, action);
      if (res.data?.status === 'AWAITING_APPROVAL') {
        setActionMessage(`⚠️ Guardrail: Case ${caseId} requires merchant approval before execution.`);
      } else if (res.data?.status === 'VERIFIED_RECOVERED') {
        setActionMessage(`✅ Recovery Verified! ₹${res.data?.recoveredAmount?.toLocaleString('en-IN')} added to Recovered Revenue.`);
      } else {
        setActionMessage(`Action executed on ${caseId}. Status: ${res.data?.status || 'UPDATED'}`);
      }
      await fetchCases();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage(`❌ Recovery blocked by Guardrails: ${err.message}`);
      setTimeout(() => setActionMessage(''), 4000);
    } finally {
      setProcessingCaseId(null);
    }
  };

  const handleAnalyzeWithAI = async (caseId) => {
    try {
      setAnalyzingCaseId(caseId);
      setActionMessage(`🤖 Querying OpenAI intelligence engine for case ${caseId}...`);
      const res = await api.analyzeRecoveryCase(caseId);
      setActionMessage(`✅ AI Analysis Completed (${res.decisionSource || 'OpenAI Engine'}) for ${caseId}`);
      await fetchCases();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage(`⚠️ AI Analysis Error: ${err.message}`);
      setTimeout(() => setActionMessage(''), 4000);
    } finally {
      setAnalyzingCaseId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED_RECOVERED':
        return <span className="text-[9px] px-2 py-0.5 bg-success-green/10 text-success-green font-bold rounded-full border border-success-green/20 flex items-center gap-1">✓ Verified Recovered</span>;
      case 'AWAITING_APPROVAL':
        return <span className="text-[9px] px-2 py-0.5 bg-warning-amber/10 text-warning-amber font-bold rounded-full border border-warning-amber/20 flex items-center gap-1"><ShieldAlert size={10} /> Approval Required</span>;
      case 'EXECUTING':
      case 'VERIFYING':
        return <span className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary font-bold rounded-full border border-primary/20 flex items-center gap-1 animate-pulse"><Clock size={10} /> Verifying Settlement...</span>;
      case 'ESCALATED':
        return <span className="text-[9px] px-2 py-0.5 bg-error-red/10 text-error-red font-bold rounded-full border border-error-red/20">Escalated to Human</span>;
      case 'STOPPED':
        return <span className="text-[9px] px-2 py-0.5 bg-secondary-text/10 text-secondary-text font-bold rounded-full border border-secondary-text/20">Stopped</span>;
      default:
        return <span className="text-[9px] px-2 py-0.5 bg-bg-light text-navy-dark font-bold rounded-full border border-border-light">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-navy-dark leading-none select-none">AI Recovery Agent</h2>
          <p className="text-xs md:text-sm text-secondary-text mt-1">
            Autonomous revenue recovery pipeline powered by OpenAI reasoning and safety guardrails.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success-green/10 text-success-green rounded-lg border border-success-green/20 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-success-green animate-pulse"></span>
            <span>Autonomous Engine: ACTIVE (TEST MODE)</span>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs font-bold text-navy-dark animate-fade-in">
          {actionMessage}
        </div>
      )}

      {/* AI Pipeline Visualization Map */}
      <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
        <h3 className="text-xs font-bold text-secondary-text uppercase tracking-wider mb-6">Autonomous Recovery Pipeline</h3>

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
                  Loading recovery cases from database...
                </div>
              ) : activeStageData.cases.length === 0 ? (
                <div className="py-8 text-center text-secondary-text font-semibold text-xs">
                  No active recovery cases in queue for stage {activeStageData.stage}.
                </div>
              ) : (
                activeStageData.cases.map((c) => {
                  const txn = c.transaction || {};
                  const displayAmt = txn.amount ? `₹${(txn.amount / 100).toLocaleString('en-IN')}` : '₹0';
                  const latestDecision = c.aiDecisions && c.aiDecisions.length > 0 ? c.aiDecisions[0] : null;
                  const isAwaitingApproval = c.status === 'AWAITING_APPROVAL';
                  const isResolved = c.status === 'VERIFIED_RECOVERED';
                  const isBusy = processingCaseId === c.id || analyzingCaseId === c.id;

                  return (
                    <div key={c.id} className="py-3.5 flex flex-col gap-2 hover:bg-bg-light/20 px-2 rounded-lg -mx-2 transition">
                      <div className="flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-primary hover:underline cursor-pointer" onClick={() => onNavigate(`#/payments/${c.transactionId}`)}>
                              {c.transactionId}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 font-bold rounded ${c.priority === 'High' || c.priority === 'URGENT' ? 'bg-error-red/10 text-error-red' : 'bg-warning-amber/10 text-warning-amber'}`}>
                              {c.priority}
                            </span>
                            {getStatusBadge(c.status)}
                            {latestDecision && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-primary/10 text-primary font-bold rounded flex items-center gap-1">
                                <Sparkles size={10} /> {(latestDecision.confidence * 100).toFixed(0)}% AI Conf.
                              </span>
                            )}
                          </div>
                          <p className="text-secondary-text text-[11px] font-semibold">
                            Recommended Action: <span className="text-navy-dark font-bold">{c.recommendedAction || 'VERIFY_PAYMENT'}</span> • Attempts: {c.attempts || 0}/3
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-navy-dark mr-1">{displayAmt}</span>
                          
                          {/* Approval Actions */}
                          {isAwaitingApproval ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleApproveCase(c.id)}
                                disabled={isBusy}
                                className="px-2.5 py-1 bg-success-green hover:bg-success-green/90 text-white text-[10px] font-bold rounded transition cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <Check size={11} /> Approve
                              </button>
                              <button
                                onClick={() => handleRejectCase(c.id)}
                                disabled={isBusy}
                                className="px-2 py-1 bg-card-bg border border-error-red text-error-red hover:bg-error-red/10 text-[10px] font-bold rounded transition cursor-pointer flex items-center gap-1"
                              >
                                <X size={11} /> Reject
                              </button>
                            </div>
                          ) : isResolved ? (
                            <span className="text-xs font-bold text-success-green flex items-center gap-1">
                              <CheckCircle size={14} /> Settled
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => handleAnalyzeWithAI(c.id)}
                                disabled={isBusy}
                                className="px-2.5 py-1 bg-card-bg border border-border-light hover:border-primary text-navy-dark hover:bg-primary/5 text-[10px] font-bold rounded transition cursor-pointer flex items-center gap-1"
                              >
                                <Sparkles size={10} className="text-primary" />
                                <span>{analyzingCaseId === c.id ? 'Analyzing...' : 'Analyze'}</span>
                              </button>
                              <button 
                                onClick={() => handleExecuteRecovery(c.id, c.recommendedAction)}
                                disabled={isBusy}
                                className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded transition hover:bg-primary/90 cursor-pointer shadow-sm flex items-center gap-1"
                              >
                                <PlayCircle size={11} />
                                <span>{processingCaseId === c.id ? 'Executing...' : 'Execute'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Decision Panel if present */}
                      {latestDecision && (
                        <div className="p-2.5 bg-bg-light/70 border border-border-light rounded-md text-[11px] text-secondary-text space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-navy-dark">Root Cause: <span className="text-primary">{latestDecision.rootCause || latestDecision.issue}</span></span>
                            <span className="text-[9px] font-bold text-secondary-text">Source: {latestDecision.decisionSource || latestDecision.model || 'OpenAI'}</span>
                          </div>
                          <p className="text-[10px] text-navy-dark font-medium">{latestDecision.merchantMessage || latestDecision.reasoningSummary || latestDecision.reason}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-border-light/60 pt-4 mt-6 flex justify-between items-center text-xs">
            <span className="text-secondary-text font-medium">Single source of truth: SQLite / PostgreSQL database.</span>
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
            <h3 className="text-sm font-bold text-navy-dark mb-4 border-b border-border-light/60 pb-2">Autonomous Agent State</h3>
            
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-bg-light rounded-lg border border-border-light">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">TOTAL CASES TRACKED</span>
                <span className="text-base font-extrabold text-navy-dark">{cases.length} cases</span>
              </div>

              <div className="p-3 bg-bg-light rounded-lg border border-border-light">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">AWAITING MERCHANT APPROVAL</span>
                <span className={`text-base font-extrabold ${approvalCases.length > 0 ? 'text-warning-amber' : 'text-navy-dark'}`}>
                  {approvalCases.length} holds active
                </span>
              </div>

              <div className="p-3 bg-bg-light rounded-lg border border-border-light">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">CURRENTLY IN FLIGHT</span>
                <span className="text-base font-extrabold text-primary">{executeCases.length} executing</span>
              </div>

              <div className="p-3 bg-bg-light rounded-lg border border-border-light">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">VERIFIED RECOVERIES</span>
                <span className="text-base font-extrabold text-success-green">{verifyCases.length} confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
