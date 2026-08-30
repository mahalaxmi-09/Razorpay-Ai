import React from 'react';
import { TrendingUp, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { formatCurrency } from '../services/mockData';

export default function KPICard({ title, value, type, isPercentage = false, currency }) {
  
  const getEmptyStateDetails = (title) => {
    const t = title.toLowerCase();
    if (t.includes('risk')) return { value: '—', subtext: 'No live data yet' };
    if (t.includes('recovered')) return { value: '—', subtext: 'Connect payment data' };
    if (t.includes('active')) return { value: '—', subtext: 'No live cases' };
    if (t.includes('rate')) return { value: '—', subtext: 'Awaiting transaction data' };
    return { value: '—', subtext: '' };
  };

  const isEmpty = value === null || value === undefined;
  const emptyDetails = isEmpty ? getEmptyStateDetails(title) : null;

  // Format the numerical value
  const displayValue = isEmpty
    ? emptyDetails.value
    : isPercentage 
      ? `${value}%` 
      : formatCurrency(value, currency);

  const subtext = isEmpty ? emptyDetails.subtext : '';

  // Styling maps based on type (green, blue, navy)
  const styles = {
    green: {
      border: 'border-l-4 border-l-success-green',
      iconBg: 'bg-success-green/10',
      iconColor: 'text-success-green',
      glow: 'shadow-success-green/5'
    },
    blue: {
      border: 'border-l-4 border-l-primary',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      glow: 'shadow-primary/5'
    },
    navy: {
      border: 'border-l-4 border-l-navy-dark',
      iconBg: 'bg-navy-dark/10',
      iconColor: 'text-navy-dark',
      glow: 'shadow-navy-dark/5'
    }
  };

  const currentStyle = styles[type] || styles.blue;

  return (
    <div className={`bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${currentStyle.border} ${currentStyle.glow}`}>
      <div>
        <span className="text-xs font-semibold text-secondary-text uppercase tracking-wider block mb-1">
          {title}
        </span>
        <span className="text-2xl md:text-3xl font-extrabold text-navy-dark tracking-tight leading-none block">
          {displayValue}
        </span>
        {subtext && (
          <span className="text-[10px] font-semibold text-secondary-text mt-1.5 block">
            {subtext}
          </span>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentStyle.iconBg} ${currentStyle.iconColor} shrink-0`}>
        {title.includes('Risk') && <AlertCircle size={20} />}
        {title.includes('Recovered') && <TrendingUp size={20} />}
        {title.includes('Active') && <RefreshCw size={20} className={isEmpty ? '' : 'animate-spin-slow'} />}
        {title.includes('Rate') && <BarChart2 size={20} />}
      </div>
    </div>
  );
}
