import React from 'react';
import PaymentTable from '../components/PaymentTable';
import { mockTransactions } from '../services/mockData';

export default function Payments({ currency, onNavigate, transactions = [] }) {
  const handleSelectTransaction = (id) => {
    onNavigate(`#/payments/${id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-navy-dark leading-none select-none">Payments</h2>
        <p className="text-xs md:text-sm text-secondary-text mt-1">
          Monitor merchant captures, failed authorizations, and settle statuses.
        </p>
      </div>

      <PaymentTable 
        transactions={transactions} 
        currency={currency} 
        onSelectTransaction={handleSelectTransaction} 
      />
    </div>
  );
}
