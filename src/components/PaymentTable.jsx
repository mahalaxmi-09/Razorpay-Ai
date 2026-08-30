import React, { useState } from 'react';
import { Search, Eye, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatCurrency } from '../services/mockData';

export default function PaymentTable({ transactions, currency, onSelectTransaction }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // Filter based on tab
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      // Search text match
      const matchesSearch = 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Tab match
      if (activeTab === 'All') return true;
      if (activeTab === 'At Risk') return t.risk === 'High' || t.risk === 'Medium';
      if (activeTab === 'Failed') return t.status.toLowerCase().includes('fail') || t.status.toLowerCase().includes('escalat');
      if (activeTab === 'Settlement Issues') return t.status.toLowerCase().includes('settlement') || t.merchantSettlement.toLowerCase().includes('pending') || t.merchantSettlement.toLowerCase().includes('missing');

      return true;
    });
  };

  const filtered = getFilteredTransactions();

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return 'text-error-red bg-error-red/10 border-error-red/20';
      case 'Medium': return 'text-warning-amber bg-warning-amber/10 border-warning-amber/20';
      case 'Low': return 'text-success-green bg-success-green/10 border-success-green/20';
      default: return 'text-secondary-text bg-secondary-text/10 border-secondary-text/20';
    }
  };

  return (
    <div className="bg-card-bg rounded-xl border border-border-light shadow-sm overflow-hidden flex flex-col">
      {/* Search and Tabs */}
      <div className="p-4 border-b border-border-light flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-light/30">
        {/* Tabs */}
        <div className="flex border-b border-border-light md:border-b-0 space-x-4 overflow-x-auto pb-1 md:pb-0">
          {['All', 'At Risk', 'Failed', 'Settlement Issues'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 md:pb-1 text-xs font-bold transition whitespace-nowrap cursor-pointer ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-secondary-text hover:text-navy-dark'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payments, customers..."
            className="w-full pl-9 pr-4 py-2 border border-border-light bg-card-bg rounded-lg text-xs outline-none text-navy-dark focus:border-primary/50"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border-light bg-bg-light/50 text-secondary-text font-bold uppercase tracking-wider">
              <th className="p-4">Payment ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Risk Level</th>
              <th className="p-4">AI Recommendation</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light text-navy-dark font-medium">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-12 text-center text-secondary-text">
                  <span className="text-navy-dark font-extrabold text-sm block mb-1">No transactions loaded yet.</span>
                  <p className="text-xs max-w-md mx-auto leading-normal">
                    Connect to your payment gateway (e.g. Razorpay Test Mode) or import a transaction ledger to display payment records.
                  </p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-secondary-text text-sm">
                  No matching payments found.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-bg-light/30 transition">
                  <td className="p-4 font-bold text-primary">{t.id}</td>
                  <td className="p-4">
                    <div className="font-bold">{t.customer}</div>
                    <div className="text-[10px] text-secondary-text font-normal">{t.email}</div>
                  </td>
                  <td className="p-4 font-black">{formatCurrency(t.amount, currency)}</td>
                  <td className="p-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(t.risk)}`}>
                      {t.risk}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                      <span className="font-semibold text-navy-dark">{t.recommendation}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => onSelectTransaction(t.id)}
                      className="px-2.5 py-1.5 bg-bg-light border border-border-light text-navy-dark hover:border-primary/40 hover:bg-primary/5 rounded font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
