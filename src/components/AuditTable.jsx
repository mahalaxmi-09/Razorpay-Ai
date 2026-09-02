import React, { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatCurrency } from '../services/mockData';

export default function AuditTable({ logs = [], currency }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [guardrailFilter, setGuardrailFilter] = useState('All');

  const filteredLogs = logs.filter(log => {
    const txn = log.transaction || '';
    const dec = log.decision || '';
    const reas = log.reason || '';
    const act = log.action || '';

    const matchesSearch = 
      txn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dec.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGuardrail = 
      guardrailFilter === 'All' || 
      log.guardrail === guardrailFilter;

    return matchesSearch && matchesGuardrail;
  });

  return (
    <div className="bg-card-bg rounded-xl border border-border-light shadow-sm overflow-hidden flex flex-col">
      {/* Filters header */}
      <div className="p-4 border-b border-border-light flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-light/30">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-secondary-text">Guardrails:</label>
          <select 
            value={guardrailFilter}
            onChange={(e) => setGuardrailFilter(e.target.value)}
            className="text-xs bg-card-bg border border-border-light px-2 py-1.5 rounded-lg outline-none text-navy-dark focus:border-primary/40 font-semibold cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="PASSED">Passed Only</option>
            <option value="TRIGGERED">Triggered Only</option>
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search decisions, reasons..."
            className="w-full pl-9 pr-4 py-2 border border-border-light bg-card-bg rounded-lg text-xs outline-none text-navy-dark focus:border-primary/50"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border-light bg-bg-light/50 text-secondary-text font-bold uppercase tracking-wider">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Transaction</th>
              <th className="p-4">AI Decision</th>
              <th className="p-4">Reason</th>
              <th className="p-4">Guardrail</th>
              <th className="p-4">Action</th>
              <th className="p-4">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light text-navy-dark font-medium">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-12 text-center text-secondary-text">
                  <span className="text-navy-dark font-extrabold text-sm block mb-1">No audit history found.</span>
                  <p className="text-xs max-w-sm mx-auto leading-normal">
                    Audit logs will be populated as AI reconciliation decisions are executed.
                  </p>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-secondary-text text-sm">
                  No matching audit entries found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => {
                const displayAmt = log.amount ? (typeof log.amount === 'number' ? formatCurrency(log.amount, currency) : log.amount) : '—';

                return (
                  <tr key={idx} className="hover:bg-bg-light/30 transition">
                    <td className="p-4 text-secondary-text">{log.timestamp}</td>
                    <td className="p-4 font-bold text-primary">
                      <div>{log.transaction}</div>
                      <div className="text-[9px] text-secondary-text font-semibold">{displayAmt}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Sparkles size={11} className="text-primary" />
                        <code className="text-[11px] font-bold text-navy-dark px-1.5 py-0.5 bg-bg-light border border-border-light rounded">{log.decision}</code>
                      </div>
                    </td>
                    <td className="p-4 text-secondary-text max-w-xs">{log.reason}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                        log.guardrail === 'PASSED' ? 'bg-success-green/10 text-success-green' : 'bg-warning-amber/10 text-warning-amber'
                      }`}>
                        {log.guardrail === 'PASSED' ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                        <span>{log.guardrail}</span>
                      </span>
                    </td>
                    <td className="p-4 text-navy-dark font-bold">{log.action}</td>
                    <td className="p-4">
                      <StatusBadge status={log.outcome} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
