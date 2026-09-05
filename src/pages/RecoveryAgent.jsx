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
  Sparkles, 
  Check, 
  X, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  PlayCircle,
  RotateCcw,
  UserCheck,
  Send,
  RefreshCw,
  FileCheck2
} from 'lucide-react';
import { isDemoMode } from '../config/dataMode';
import { recoveryCasesData } from '../data/recovery';
import { api } from '../lib/api';

export default function RecoveryAgent({ onNavigate }) {
  const isDemo = isDemoMode();
  const [selectedStage, setSelectedStage] = useState('Detect');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [analyzingCaseId, setAnalyzingCaseId] = useState(null);
  const [processingCaseId, setProcessingCaseId] = useState(null);

  // Interactive Simulator State
  const [showSimulator, setShowSimulator] = useState(false);
  const [simScenario, setSimScenario] = useState('settle'); // 'settle' | 'wrong'
  const [simStep, setSimStep] = useState(0);

  const fetchCases = async () => {
    if (isDemo) {
      setCases(recoveryCasesData);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.getRecoveryCases();
      const items = res.data || res || [];
      setCases(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load recovery cases:', err.message);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [isDemo]);

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
  const approvalCases = cases.filter(c => c.status === 'AWAITING_APPROVAL' || c.guardrailBlocked);
  const executeCases = cases.filter(c => c.status === 'APPROVED' || c.status === 'EXECUTING' || c.status === 'VERIFYING');
  const verifyCases = cases.filter(c => c.status === 'VERIFIED_RECOVERED');

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
    setProcessingCaseId(caseId);
    setActionMessage(`Approving recovery for case ${caseId}...`);

    if (isDemo) {
      setTimeout(() => {
        setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'VERIFIED_RECOVERED', approvalRequired: false, guardrailBlocked: false } : c));
        setActionMessage(`✅ Case ${caseId} approved and executed. Result: VERIFIED_RECOVERED`);
        setProcessingCaseId(null);
        setTimeout(() => setActionMessage(''), 4000);
      }, 600);
      return;
    }

    try {
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
    setProcessingCaseId(caseId);
    setActionMessage(`Rejecting recovery for case ${caseId}...`);

    if (isDemo) {
      setTimeout(() => {
        setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'STOPPED' } : c));
        setActionMessage(`🛑 Case ${caseId} halted and marked STOPPED.`);
        setProcessingCaseId(null);
        setTimeout(() => setActionMessage(''), 4000);
      }, 600);
      return;
    }

    try {
      await api.rejectRecoveryCase(caseId, 'Merchant rejected automated recovery.');
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
    setProcessingCaseId(caseId);
    setActionMessage(`Autonomous Agent executing ${action || 'recovery'} on ${caseId}...`);

    if (isDemo) {
      setTimeout(() => {
        setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'VERIFYING', currentAction: action } : c));
        setActionMessage(`✅ Action ${action || 'VERIFY_SETTLEMENT'} executed on ${caseId}. Verifying provider capture.`);
        setProcessingCaseId(null);
        setTimeout(() => setActionMessage(''), 4000);
      }, 600);
      return;
    }

    try {
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
    setAnalyzingCaseId(caseId);
    setActionMessage(`🤖 Querying OpenAI intelligence engine for case ${caseId}...`);

    if (isDemo) {
      setTimeout(() => {
        setCases(prev => prev.map(c => c.id === caseId ? {
          ...c,
          status: 'ACTION_RECOMMENDED',
          aiDecision: {
            rootCause: 'INSUFFICIENT_FUNDS',
            confidence: 0.92,
            modelUsed: 'gpt-4o',
            reasoningSummary: 'Temporary customer balance drop. Customer recovery link recommended.',
            merchantMessage: 'Send automated WhatsApp / SMS payment link to customer.'
          }
        } : c));
        setActionMessage(`✅ AI Analysis Completed (OpenAI gpt-4o) for ${caseId}`);
        setAnalyzingCaseId(null);
        setTimeout(() => setActionMessage(''), 4000);
      }, 800);
      return;
    }

    try {
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

  // Scenario Simulator Handlers
  const handleStartSim = (scenario) => {
    setSimScenario(scenario);
    setShowSimulator(true);
    setSimStep(0);
  };

  const handleSimStepAdvance = (nextStep) => {
    setSimStep(nextStep);
    if (nextStep === 6) {
      const targetCaseId = simScenario === 'settle' ? 'CASE_SETTLE_001' : 'CASE_WRONG_001';
      setCases(prev => prev.map(c => c.id === targetCaseId ? {
        ...c,
        status: 'VERIFIED_RECOVERED',
        approvalRequired: false,
        guardrailBlocked: false,
        transaction: {
          ...c.transaction,
          merchantSettlementStatus: 'PROCESSED'
        }
      } : c));
    }
  };

  const getStatusBadge = (status, guardrailBlocked) => {
    if (guardrailBlocked || status === 'GUARDRAIL_BLOCKED') {
      return <span className="text-[9px] px-2 py-0.5 bg-warning-amber/10 text-warning-amber font-bold rounded-full border border-warning-amber/20 flex items-center gap-1"><ShieldAlert size={10} /> Guardrail Blocked</span>;
    }

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
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Demo Scenario Simulator Triggers */}
          <button
            onClick={() => handleStartSim('settle')}
            className="px-3 py-1.5 bg-success-green/10 hover:bg-success-green/20 text-success-green border border-success-green/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles size={14} />
            <span>Simulate Settlement Missing (₹18,500)</span>
          </button>

          <button
            onClick={() => handleStartSim('wrong')}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles size={14} />
            <span>Simulate Wrong Number (₹4,500)</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-dark/10 text-navy-dark rounded-lg border border-navy-dark/20 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-success-green animate-pulse"></span>
            Razorpay Test Mode
          </div>
        </div>
      </div>

      {/* Interactive Simulation Drawer / Modal */}
      {showSimulator && (
        <div className="p-5 bg-card-bg border-2 border-primary/30 rounded-2xl shadow-lg space-y-4 animate-fade-in relative">
          <div className="flex items-center justify-between border-b border-border-light pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase px-2 py-0.5 bg-primary text-white rounded">
                DEMO / SIMULATED
              </span>
              <h3 className="text-sm font-extrabold text-navy-dark">
                {simScenario === 'settle'
                  ? 'Simulated Scenario: Customer Debited — Merchant Settlement Missing (TXN_SETTLE_001)'
                  : 'Simulated Scenario: Wrong Number Payment (TXN_WRONG_001)'}
              </h3>
            </div>
            <button 
              onClick={() => setShowSimulator(false)}
              className="text-secondary-text hover:text-navy-dark cursor-pointer p-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-center">
            {(simScenario === 'settle'
              ? ['1. Open', '2. Analyze', '3. Decide', '4. Duplicate Guard', '5. Reconcile', '6. Settlement Verified', '7. Recovered']
              : ['1. Open', '2. Analyze', '3. Decide', '4. Guardrail Block', '5. Customer Verify', '6. Safe Retry', '7. Recovered']
            ).map((label, idx) => (
              <div 
                key={label}
                className={`py-1 px-1 rounded truncate ${
                  simStep === idx ? 'bg-primary text-white font-extrabold shadow-sm' :
                  simStep > idx ? 'bg-success-green/20 text-success-green' :
                  'bg-bg-light text-secondary-text'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Step Detail Content */}
          <div className="bg-bg-light/60 p-4 rounded-xl border border-border-light text-xs space-y-2">
            {simScenario === 'settle' ? (
              // --- Scenario: Customer Debited - Merchant Settlement Missing ---
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-extrabold text-navy-dark text-sm block">
                      Customer: Rahul Sharma • Amount: <span className="text-success-green font-black">₹18,500</span> (UPI)
                    </span>
                    <span className="text-secondary-text text-[11px]">
                      Payment Status: <strong className="text-navy-dark">CAPTURED</strong> • Customer Debited: <strong className="text-success-green">YES</strong> • Settlement: <strong className="text-warning-amber">PENDING</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-warning-amber/10 text-warning-amber border border-warning-amber/20">
                    Settlement Reconciliation Mismatch
                  </span>
                </div>

                {simStep === 0 && (
                  <div className="pt-2">
                    <p className="text-secondary-text">
                      <strong>State: OPEN.</strong> ₹18,500 payment capture confirmed by gateway, but merchant settlement is missing from banking ledger.
                    </p>
                    <button 
                      onClick={() => handleSimStepAdvance(1)}
                      className="mt-3 px-3 py-1.5 bg-primary text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Step 1: Start AI Root Cause Analysis</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {simStep === 1 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-secondary-text">
                      <strong>State: ANALYZING.</strong> OpenAI intelligence evaluating transaction telemetry and reconciliation logs...
                    </p>
                    <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-[11px] text-navy-dark font-medium">
                      🤖 AI Root Cause: Payment capture succeeded, but settlement confirmation is unavailable or delayed. Reconciliation mismatch between customer debit and merchant settlement.
                    </div>
                    <button 
                      onClick={() => handleSimStepAdvance(2)}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Step 2: Generate Recommendation (96% Confidence)</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {simStep === 2 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-secondary-text">
                      <strong>State: ACTION_RECOMMENDED.</strong> AI Recommendation: <em>VERIFY_SETTLEMENT</em>. Decision: <strong>DO NOT RETRY PAYMENT</strong>.
                    </p>
                    <button 
                      onClick={() => handleSimStepAdvance(3)}
                      className="px-3 py-1.5 bg-navy-dark text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Step 3: Check Duplicate Payment Prevention Guardrail</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {simStep === 3 && (
                  <div className="pt-2 space-y-2">
                    <div className="p-3 bg-success-green/10 border border-success-green/30 rounded-lg text-success-green font-bold text-xs flex items-center gap-2">
                      <ShieldCheck size={16} />
                      <span>Guardrail: DUPLICATE PAYMENT PREVENTION → Automatic customer payment retry strictly BLOCKED. Cleared for Settlement Verification.</span>
                    </div>
                    <p className="text-secondary-text text-[11px]">
                      Policy Enforced: Customer account is already debited. Under no circumstances will a duplicate payment link or retry charge be created.
                    </p>
                    <button 
                      onClick={() => handleSimStepAdvance(4)}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      <span>Step 4: Initiate Settlement Reconciliation</span>
                    </button>
                  </div>
                )}

                {simStep === 4 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-secondary-text">
                      <strong>State: VERIFYING.</strong> Querying Razorpay Test Mode settlement batch pipeline and banking reconciliation service...
                    </p>
                    <button 
                      onClick={() => handleSimStepAdvance(5)}
                      className="px-3 py-1.5 bg-navy-dark text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <FileCheck2 size={14} />
                      <span>Step 5: Confirm Provider Settlement Batch</span>
                    </button>
                  </div>
                )}

                {simStep === 5 && (
                  <div className="pt-2 space-y-2">
                    <div className="p-3 bg-success-green/10 border border-success-green/30 rounded-lg text-success-green font-bold text-xs flex items-center gap-2">
                      <CheckCircle size={16} />
                      <span>Settlement Confirmed: Merchant Settlement status updated from PENDING → PROCESSED in Razorpay Test Mode.</span>
                    </div>
                    <button 
                      onClick={() => handleSimStepAdvance(6)}
                      className="px-3 py-1.5 bg-success-green text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Step 6: Mark Case VERIFIED_RECOVERED</span>
                    </button>
                  </div>
                )}

                {simStep === 6 && (
                  <div className="pt-2 space-y-2">
                    <div className="p-3 bg-success-green/10 border border-success-green/30 rounded-lg text-success-green font-bold text-xs flex items-center gap-2">
                      <CheckCircle size={16} />
                      <span>✅ Recovery Case VERIFIED_RECOVERED! ₹18,500 successfully accounted in Test Mode.</span>
                    </div>
                    <p className="text-[11px] text-secondary-text">
                      13 immutable audit events logged. Merchant notification generated with zero duplicate customer charges.
                    </p>
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <button 
                        onClick={() => { setSelectedStage('Verify'); setShowSimulator(false); }}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg font-bold text-xs cursor-pointer"
                      >
                        View in Verified Stage
                      </button>
                      <button 
                        onClick={() => onNavigate('#/audit-logs')}
                        className="px-3 py-1.5 bg-bg-light border border-border-light text-navy-dark rounded-lg font-bold text-xs cursor-pointer"
                      >
                        View Audit Logs
                      </button>
                      <button 
                        onClick={() => setSimStep(0)}
                        className="px-3 py-1.5 text-secondary-text hover:text-navy-dark text-xs font-bold cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Reset Simulation
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // --- Scenario: Wrong Number Payment ---
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-extrabold text-navy-dark text-sm block">
                      Customer: Ananya Reddy • Amount: <span className="text-primary font-black">₹4,500</span> (UPI)
                    </span>
                    <span className="text-secondary-text text-[11px]">
                      Entered Identifier: <strong className="text-error-red">wrongnumber@upi</strong> • Expected: <strong className="text-success-green">merchant@upi</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-error-red/10 text-error-red border border-error-red/20">
                    Payment Routing Error
                  </span>
                </div>

                {simStep === 0 && (
                  <div className="pt-2">
                    <p className="text-secondary-text">
                      <strong>State: OPEN.</strong> Payment attempt failed with recipient mismatch. Autonomous agent ready to ingest telemetry.
                    </p>
                    <button 
                      onClick={() => handleSimStepAdvance(1)}
                      className="mt-3 px-3 py-1.5 bg-primary text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Step 1: Start AI Analysis</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {simStep === 1 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-secondary-text">
                      <strong>State: ANALYZING.</strong> Querying OpenAI reasoning engine to diagnose failure cause and evaluate misrouting risk...
                    </p>
                    <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-[11px] text-navy-dark font-medium">
                      🤖 AI Reasoning: Payment attempted with recipient <em>wrongnumber@upi</em> instead of expected merchant VPA. Risk of sending funds to an unintended party.
                    </div>
                    <button 
                      onClick={() => handleSimStepAdvance(2)}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Step 2: Generate Recommendation (92% Confidence)</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {simStep === 2 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-secondary-text">
                      <strong>State: ACTION_RECOMMENDED.</strong> AI Recommendation: <em>Do NOT auto-retry to unknown recipient. Recipient verification required.</em>
                    </p>
                    <button 
                      onClick={() => handleSimStepAdvance(3)}
                      className="px-3 py-1.5 bg-navy-dark text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Step 3: Run Safety Guardrail Check</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {simStep === 3 && (
                  <div className="pt-2 space-y-2">
                    <div className="p-3 bg-warning-amber/10 border border-warning-amber/30 rounded-lg text-warning-amber font-bold text-xs flex items-center gap-2">
                      <ShieldAlert size={16} />
                      <span>Guardrail Check: Recipient verification required → Automatic retry BLOCKED. Marked AWAITING_APPROVAL.</span>
                    </div>
                    <p className="text-secondary-text text-[11px]">
                      Safety Policy enforced: Money will NEVER be automatically transferred without confirmed recipient authorization.
                    </p>
                    <button 
                      onClick={() => handleSimStepAdvance(4)}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck size={14} />
                      <span>Step 4: Dispatch Customer Recipient Verification</span>
                    </button>
                  </div>
                )}

                {simStep === 4 && (
                  <div className="pt-2 space-y-2">
                    <div className="p-3 bg-success-green/10 border border-success-green/30 rounded-lg text-success-green font-bold text-xs flex items-center gap-2">
                      <CheckCircle size={16} />
                      <span>Customer Ananya Reddy confirmed recipient corrected to: merchant@upi</span>
                    </div>
                    <button 
                      onClick={() => handleSimStepAdvance(5)}
                      className="px-3 py-1.5 bg-navy-dark text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Send size={14} />
                      <span>Step 5: Execute Safe Test Retry</span>
                    </button>
                  </div>
                )}

                {simStep === 5 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-secondary-text">
                      <strong>State: SAFE RETRY / VERIFYING.</strong> Test Mode transaction dispatched to Razorpay Test Gateway using verified VPA <em>merchant@upi</em>.
                    </p>
                    <button 
                      onClick={() => handleSimStepAdvance(6)}
                      className="px-3 py-1.5 bg-success-green text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Step 6: Verify Final Test Capture</span>
                    </button>
                  </div>
                )}

                {simStep === 6 && (
                  <div className="pt-2 space-y-2">
                    <div className="p-3 bg-success-green/10 border border-success-green/30 rounded-lg text-success-green font-bold text-xs flex items-center gap-2">
                      <CheckCircle size={16} />
                      <span>✅ Test Recovery Verified! ₹4,500 successfully accounted in Razorpay Test Mode.</span>
                    </div>
                    <p className="text-[11px] text-secondary-text">
                      Full 8 audit events logged to immutable trail. Safe recovery completed with zero risk of misrouted funds.
                    </p>
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <button 
                        onClick={() => { setSelectedStage('Verify'); setShowSimulator(false); }}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg font-bold text-xs cursor-pointer"
                      >
                        View in Verified Stage
                      </button>
                      <button 
                        onClick={() => onNavigate('#/audit-logs')}
                        className="px-3 py-1.5 bg-bg-light border border-border-light text-navy-dark rounded-lg font-bold text-xs cursor-pointer"
                      >
                        View Audit Logs
                      </button>
                      <button 
                        onClick={() => setSimStep(0)}
                        className="px-3 py-1.5 text-secondary-text hover:text-navy-dark text-xs font-bold cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Reset Simulation
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Global Action Feedback Message */}
      {actionMessage && (
        <div className="p-3 bg-navy-dark text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-lg animate-fade-in">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-secondary-text hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Pipeline Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {stages.map((stage) => {
          const Icon = getStageIcon(stage.stage);
          const isSelected = selectedStage === stage.stage;
          return (
            <button
              key={stage.stage}
              onClick={() => setSelectedStage(stage.stage)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.02]' 
                  : 'bg-card-bg text-navy-dark border-border-light hover:border-primary/40 hover:bg-bg-light/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={18} className={isSelected ? 'text-white' : 'text-primary'} />
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-bg-light text-secondary-text'
                }`}>
                  {stage.count}
                </span>
              </div>
              <div className={`text-xs font-black tracking-tight ${isSelected ? 'text-white' : 'text-navy-dark'}`}>
                {stage.stage}
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Workspace */}
      <div className="bg-card-bg rounded-xl border border-border-light shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border-light flex items-center justify-between bg-bg-light/40">
          <div>
            <h3 className="text-base font-extrabold text-navy-dark flex items-center gap-2">
              <span>{selectedStage} Pipeline</span>
              <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {activeStageData.count} Cases
              </span>
            </h3>
            <p className="text-xs text-secondary-text mt-0.5">
              {selectedStage === 'Detect' && 'Real-time payment failures and settlement delays ingested from Razorpay webhook telemetry.'}
              {selectedStage === 'Analyze' && 'Evaluating payment telemetry and root cause diagnostics with OpenAI reasoning.'}
              {selectedStage === 'Decide' && 'Autonomous AI recovery recommendations validated against business safety policies.'}
              {selectedStage === 'Approval' && 'Transactions exceeding safety limits (≥ ₹50,000 or Recipient Mismatch) held for merchant authorization.'}
              {selectedStage === 'Execute' && 'Safe Test Mode recovery actions actively processing or verifying provider capture.'}
              {selectedStage === 'Verify' && 'Positive provider capture confirmed. Successfully counted towards Recovered Revenue.'}
            </p>
          </div>
        </div>

        {/* Stage Cases List */}
        <div className="divide-y divide-border-light">
          {loading ? (
            <div className="p-12 text-center text-xs text-secondary-text">
              Loading recovery pipeline cases...
            </div>
          ) : activeStageData.cases.length === 0 ? (
            <div className="p-12 text-center text-secondary-text">
              <CheckCircle size={32} className="mx-auto text-success-green/40 mb-2" />
              <span className="text-sm font-bold text-navy-dark block">No cases in {selectedStage} stage</span>
              <p className="text-xs mt-1 max-w-sm mx-auto">
                All cases in this stage have completed or transitioned through the autonomous recovery state machine.
              </p>
            </div>
          ) : (
            activeStageData.cases.map((c) => {
              const txn = c.transaction || {};
              const amountInr = txn.amount ? (txn.amount / 100).toLocaleString('en-IN') : '0';
              const ai = c.aiDecision;
              const isSettleCase = c.id === 'CASE_SETTLE_001' || txn.id === 'TXN_SETTLE_001';
              const isWrongNumberCase = c.id === 'CASE_WRONG_001' || txn.id === 'TXN_WRONG_001';

              return (
                <div key={c.id} className="p-5 hover:bg-bg-light/30 transition duration-150">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Transaction & Risk Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-navy-dark tracking-tight">
                          {c.transactionId || c.id}
                        </span>
                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded">
                          ₹{amountInr}
                        </span>
                        {getStatusBadge(c.status, c.guardrailBlocked)}
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          c.priority === 'CRITICAL' ? 'bg-error-red/10 text-error-red' :
                          c.priority === 'HIGH' ? 'bg-warning-amber/10 text-warning-amber' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {c.priority} Priority
                        </span>
                        {(isSettleCase || isWrongNumberCase) && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            TEST SCENARIO
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-secondary-text flex items-center gap-4 flex-wrap">
                        <span>Customer: <strong className="text-navy-dark">{txn.customer?.name || 'Customer'}</strong></span>
                        <span>Attempts: <strong className="text-navy-dark">{c.attempts}/{c.maxAttempts || 3}</strong></span>
                        <span>Method: <strong className="text-navy-dark">{txn.paymentMethod || 'UPI'}</strong></span>
                        {txn.customerDebited && (
                          <span>Customer Debited: <strong className="text-success-green">YES</strong></span>
                        )}
                        {txn.merchantSettlementStatus && (
                          <span>Merchant Settlement: <strong className={txn.merchantSettlementStatus === 'PROCESSED' ? 'text-success-green' : 'text-warning-amber'}>{txn.merchantSettlementStatus}</strong></span>
                        )}
                      </div>

                      {/* Failure / Context details */}
                      <p className="text-xs text-secondary-text font-medium bg-bg-light p-2.5 rounded-lg border border-border-light max-w-2xl">
                        <strong className="text-navy-dark">Reason: </strong>
                        {txn.failureReason || (txn.merchantSettlementStatus === 'PENDING' ? 'Bank settlement reconciliation pending' : 'Active monitoring')}
                      </p>

                      {/* Guardrail Notice */}
                      {c.guardrailRule && (
                        <div className="p-2.5 bg-success-green/10 border border-success-green/30 rounded-lg text-success-green text-xs font-bold flex items-center gap-1.5 max-w-2xl">
                          <ShieldCheck size={14} />
                          <span>Guardrail: {c.guardrailRule} — Automatic retry blocked to protect debited customer.</span>
                        </div>
                      )}

                      {/* AI Decision Box if available */}
                      {ai && (
                        <div className="mt-2 p-3 bg-primary/[0.03] border border-primary/20 rounded-lg text-xs space-y-1 max-w-2xl">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary flex items-center gap-1">
                              <Sparkles size={12} /> Root Cause: {ai.rootCause}
                            </span>
                            <span className="text-[10px] text-secondary-text font-bold">
                              Confidence: <strong>{Math.round((ai.confidence || 0.96) * 100)}%</strong> ({ai.modelUsed || 'OpenAI gpt-4o'})
                            </span>
                          </div>
                          <p className="text-secondary-text text-[11px]">{ai.reasoningSummary}</p>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                      {/* Scenario Simulator Shortcut */}
                      {isSettleCase && (
                        <button
                          onClick={() => handleStartSim('settle')}
                          className="px-3 py-1.5 bg-success-green hover:bg-success-green/90 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <PlayCircle size={14} />
                          <span>Step Through Scenario</span>
                        </button>
                      )}

                      {isWrongNumberCase && c.status === 'AWAITING_APPROVAL' && (
                        <button
                          onClick={() => handleStartSim('wrong')}
                          className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <PlayCircle size={14} />
                          <span>Step Through Scenario</span>
                        </button>
                      )}

                      {/* Stage 1: Detect -> Analyze */}
                      {c.status === 'OPEN' && !isSettleCase && !isWrongNumberCase && (
                        <button
                          onClick={() => handleAnalyzeWithAI(c.id)}
                          disabled={analyzingCaseId === c.id}
                          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles size={14} />
                          <span>{analyzingCaseId === c.id ? 'Analyzing...' : 'Analyze with AI'}</span>
                        </button>
                      )}

                      {/* Stage 2 & 3: Analyze / Decide -> Execute */}
                      {(c.status === 'ANALYZING' || c.status === 'ACTION_RECOMMENDED') && (
                        <button
                          onClick={() => handleExecuteRecovery(c.id, c.recommendedAction || 'VERIFY_SETTLEMENT')}
                          disabled={processingCaseId === c.id}
                          className="px-4 py-2 bg-navy-dark hover:bg-navy-dark/90 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Bot size={14} />
                          <span>{processingCaseId === c.id ? 'Executing...' : `Execute ${c.recommendedAction || 'Recovery'}`}</span>
                        </button>
                      )}

                      {/* Stage 4: Approval */}
                      {c.status === 'AWAITING_APPROVAL' && !isWrongNumberCase && !isSettleCase && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveCase(c.id)}
                            disabled={processingCaseId === c.id}
                            className="px-3 py-1.5 bg-success-green hover:bg-success-green/90 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectCase(c.id)}
                            disabled={processingCaseId === c.id}
                            className="px-3 py-1.5 bg-error-red/10 text-error-red hover:bg-error-red/20 border border-error-red/20 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {/* Stage 5 & 6: Inspect details */}
                      <button
                        onClick={() => onNavigate && onNavigate(`#/payments/${c.transactionId}`)}
                        className="p-2 text-secondary-text hover:text-navy-dark hover:bg-bg-light rounded-lg transition"
                        title="View Full Payment Telemetry"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
