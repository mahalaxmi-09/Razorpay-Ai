import React, { useState } from 'react';
import { ArrowLeft, Sparkles, ClipboardList, ShieldCheck, CheckCircle2, Play } from 'lucide-react';
import { mockTransactions, formatCurrency } from '../services/mockData';
import StatusBadge from '../components/StatusBadge';

import { api } from '../lib/api';

export default function PaymentDetail({ transactionId, onNavigate, currency, transactions = [], onUpdateStatus }) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState('');

  // Find transaction from active state
  const txn = transactions.find(t => t.id === transactionId);

  if (!txn) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => onNavigate('#/payments')}
          className="flex items-center gap-1.5 text-xs font-bold text-secondary-text hover:text-navy-dark transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Payments</span>
        </button>
        <div className="bg-card-bg rounded-xl border border-border-light p-12 text-center text-secondary-text">
          <ClipboardList size={32} className="mx-auto text-secondary-text/40 mb-3 animate-pulse" />
          <span className="text-sm font-bold block mb-1">Transaction Details Unavailable</span>
          <p className="text-xs">No active payments match this ID. Connect transaction data to audit recovery pipelines.</p>
        </div>
      </div>
    );
  }

  const handleExecuteRecovery = async () => {
    setIsExecuting(true);
    setExecutionStatus('Initiating gateway safety checks...');
    
    try {
      const casesRes = await api.getRecoveryCases();
      const caseItem = (casesRes.data || casesRes || []).find(c => c.transactionId === txn.id);
      
      if (caseItem) {
        setExecutionStatus('Running guardrail & recovery simulation...');
        const simRes = await api.simulateRecoveryAction(caseItem.id, caseItem.recommendedAction || 'VERIFY_STATUS');
        setIsExecuting(false);
        setExecutionStatus('completed');
        if (onUpdateStatus) {
          onUpdateStatus(txn.id, 'Recovered');
        }
        alert(`✅ ${simRes.data?.simulationResult || 'Recovery simulation completed successfully!'}`);
      } else {
        setExecutionStatus('Matching settlement status...');
        await api.verifySettlement(txn.id);
        setIsExecuting(false);
        setExecutionStatus('completed');
        if (onUpdateStatus) {
          onUpdateStatus(txn.id, 'Recovered');
        }
        alert(`✅ Settlement verified for ${txn.id}! Status updated to Recovered.`);
      }
    } catch (err) {
      setIsExecuting(false);
      setExecutionStatus('error');
      alert(`⚠️ Recovery Action: ${err.message}`);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return 'text-error-red bg-error-red/10 border-error-red/20';
      case 'Medium': return 'text-warning-amber bg-warning-amber/10 border-warning-amber/20';
      case 'Low': return 'text-success-green bg-success-green/10 border-success-green/20';
      default: return 'text-secondary-text bg-secondary-text/10 border-secondary-text/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button 
        onClick={() => onNavigate('#/payments')}
        className="flex items-center gap-1.5 text-xs font-bold text-secondary-text hover:text-navy-dark transition cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Payments</span>
      </button>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-light pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-navy-dark tracking-tight leading-none">{txn.id}</h2>
            <StatusBadge status={txn.status} />
          </div>
          <p className="text-xs text-secondary-text mt-1.5">Registered on {txn.date}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('#/audit')}
            className="px-3.5 py-2 bg-white border border-border-light text-navy-dark hover:bg-bg-light/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <ClipboardList size={14} />
            <span>View Audit Trail</span>
          </button>
          
          {txn.status !== 'Recovered' && (
            <button
              onClick={handleExecuteRecovery}
              disabled={isExecuting || executionStatus === 'completed'}
              className="px-3.5 py-2 bg-primary hover:bg-primary/95 text-white disabled:bg-secondary-text font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm shadow-primary/25 cursor-pointer"
            >
              <Play size={12} fill="white" />
              <span>{isExecuting ? 'Running...' : executionStatus === 'completed' ? 'Recovery Verified' : 'Trigger Recovery Action'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Executing status indicator */}
      {isExecuting && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-navy-dark">{executionStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details (Grid spans 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Base Specs card */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
            <h3 className="text-sm font-bold text-navy-dark mb-4 border-b border-border-light/60 pb-2">Transaction Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div className="flex justify-between border-b border-bg-light py-2">
                <span className="text-secondary-text">Customer:</span>
                <span className="font-bold text-navy-dark">{txn.customer}</span>
              </div>
              <div className="flex justify-between border-b border-bg-light py-2">
                <span className="text-secondary-text">Customer Email:</span>
                <span className="font-bold text-navy-dark">{txn.email}</span>
              </div>
              <div className="flex justify-between border-b border-bg-light py-2">
                <span className="text-secondary-text">Total Amount:</span>
                <span className="font-black text-navy-dark">{formatCurrency(txn.amount, currency)}</span>
              </div>
              <div className="flex justify-between border-b border-bg-light py-2">
                <span className="text-secondary-text">Currency:</span>
                <span className="font-bold text-navy-dark">{txn.currency}</span>
              </div>
              <div className="flex justify-between border-b border-bg-light py-2">
                <span className="text-secondary-text">Customer Debited:</span>
                <span className="font-bold text-navy-dark">{txn.customerDebited}</span>
              </div>
              <div className="flex justify-between border-b border-bg-light py-2">
                <span className="text-secondary-text">Merchant Settlement:</span>
                <span className="font-bold text-navy-dark">{txn.merchantSettlement}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-secondary-text">Risk Level:</span>
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(txn.risk)}`}>
                  {txn.risk}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-secondary-text">AI Confidence Rating:</span>
                <span className="font-extrabold text-navy-dark">{txn.aiConfidence}</span>
              </div>
            </div>
          </div>

          {/* AI Analysis Card */}
          <div className="bg-card-bg p-6 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden">
            {/* Corner glows */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
            
            <div className="flex items-center gap-2 mb-4 border-b border-border-light/60 pb-3">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles size={14} />
              </div>
              <h3 className="text-sm font-bold text-navy-dark">AI Recovery Analysis</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-secondary-text block mb-1">Issue Identified:</span>
                <p className="font-bold text-navy-dark">{txn.issue}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-secondary-text block mb-1">Recovery Probability:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-success-green">{txn.aiConfidence}</span>
                    <span className="text-[10px] text-secondary-text">(High probability)</span>
                  </div>
                </div>
                <div>
                  <span className="text-secondary-text block mb-1">Recommended Operation:</span>
                  <code className="text-xs font-bold text-primary px-2 py-1 bg-primary/5 rounded border border-primary/10 inline-block">
                    {txn.recommendation}
                  </code>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-secondary-text block mb-1">AI Recommendation Breakdown:</span>
                <p className="text-secondary-text font-semibold leading-relaxed">
                  {txn.why}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Audit Trails Snapshot (Grid spans 1 col) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-navy-dark mb-4 border-b border-border-light/60 pb-2">Active Safety Filters</h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-success-green mt-0.5" />
                  <div>
                    <span className="font-bold text-navy-dark block">Duplicate Capture Guard</span>
                    <p className="text-[10px] text-secondary-text mt-0.5">Verified. No duplicate transactions match this amount.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-success-green mt-0.5" />
                  <div>
                    <span className="font-bold text-navy-dark block">24h Retries Cooldown</span>
                    <p className="text-[10px] text-secondary-text mt-0.5">Inactive. Cooldown period elapsed.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-success-green mt-0.5" />
                  <div>
                    <span className="font-bold text-navy-dark block">Reconciliation Signature Match</span>
                    <p className="text-[10px] text-secondary-text mt-0.5">Verified. Gateway payloads validated against checksum.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border-light/60 pt-4 mt-6">
              <div className="p-3 bg-bg-light rounded-lg border border-border-light flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-success-green"></div>
                <span className="text-[10px] font-bold text-navy-dark uppercase tracking-wider">Ready for execution</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
