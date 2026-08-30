import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import RecoveryChart from '../components/RecoveryChart';
import AIActivity from '../components/AIActivity';
import PriorityCases from '../components/PriorityCases';
import AIInsight from '../components/AIInsight';
import { translations } from '../services/mockData';
import { api } from '../lib/api';

export default function Dashboard({ lang, currency, merchantName, onNavigate, transactions = [] }) {
  const [summary, setSummary] = useState({
    revenueAtRisk: null,
    recoveredRevenue: null,
    activeCases: 0,
    recoveryRate: null
  });

  // Dynamic greetings based on language
  const getGreeting = () => {
    switch (lang) {
      case 'తెలుగు': return `శుభోదయం, ${merchantName} 👋`;
      case 'हिंदी': return `सुप्रभात, ${merchantName} 👋`;
      default: return `Good morning, ${merchantName} 👋`;
    }
  };

  const getSubtitle = () => {
    switch (lang) {
      case 'తెలుగు': return 'ఇదిగో మీ రాబడి రికవరీ అవలోకనం.';
      case 'हिंदी': return 'यहाँ आपका राजस्व सुधार अवलोकन है।';
      default: return "Here's your revenue recovery overview.";
    }
  };

  // Fetch summary aggregates from backend API
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await api.getDashboardSummary();
        setSummary(data);
      } catch (err) {
        console.error('Failed to load dashboard summary metrics:', err.message);
      }
    };
    fetchSummary();
  }, [transactions]);

  const totalRisk = summary.revenueAtRisk;
  const totalRecovered = summary.recoveredRevenue;
  const activeCasesCount = summary.activeCases;
  const recoveryRate = summary.recoveryRate;

  return (
    <div className="space-y-6">
      {/* Welcome Greeting */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-navy-dark leading-tight select-none">
          {getGreeting()}
        </h2>
        <p className="text-xs md:text-sm text-secondary-text mt-1">
          {getSubtitle()}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard 
          title={translations[lang]?.revenueAtRisk || 'Revenue at Risk'} 
          value={totalRisk} 
          type="blue" 
          currency={currency} 
        />
        <KPICard 
          title={translations[lang]?.recoveredRevenue || 'Recovered Revenue'} 
          value={totalRecovered} 
          type="green" 
          currency={currency} 
        />
        <KPICard 
          title={translations[lang]?.activeCases || 'Active Cases'} 
          value={activeCasesCount} 
          type="navy" 
          isPercentage={false}
          currency={currency} 
        />
        <KPICard 
          title={translations[lang]?.recoveryRate || 'Recovery Rate'} 
          value={recoveryRate} 
          type="green" 
          isPercentage={true}
          currency={currency} 
        />
      </div>

      {/* Main dashboard content grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column - spans 2 cols */}
        <div className="lg:col-span-2">
          <RecoveryChart currency={currency} />
        </div>
        
        {/* AI Insights and Priorities - spans 1 col */}
        <div className="flex flex-col gap-6">
          <AIInsight transactions={transactions} onNavigate={onNavigate} />
          <PriorityCases transactions={transactions} currency={currency} onNavigate={onNavigate} />
        </div>
      </div>

      {/* Second grid layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time AI activity log */}
        <div className="lg:col-span-1">
          <AIActivity transactions={transactions} currency={currency} />
        </div>

        {/* Short summary table or quick settings info */}
        <div className="lg:col-span-2 bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-dark mb-2">Automated Guardrails Status</h3>
            <p className="text-xs text-secondary-text mb-4">Safety checks active for all payment retry workflows.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-bg-light rounded-lg border border-border-light text-center">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">MAX RETRIES</span>
                <span className="text-sm font-extrabold text-navy-dark">3 Attempts</span>
              </div>
              <div className="p-3 bg-bg-light rounded-lg border border-border-light text-center">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">COOLDOWN</span>
                <span className="text-sm font-extrabold text-navy-dark">24 Hours</span>
              </div>
              <div className="p-3 bg-bg-light rounded-lg border border-border-light text-center">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">MAX LIMIT</span>
                <span className="text-sm font-extrabold text-navy-dark">₹1,00,000</span>
              </div>
              <div className="p-3 bg-bg-light rounded-lg border border-border-light text-center">
                <span className="text-[10px] text-secondary-text font-bold block mb-1">APPROVAL</span>
                <span className="text-sm font-extrabold text-navy-dark">&gt; ₹50,000</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border-light/60 pt-4 mt-6 flex justify-between items-center">
            <span className="text-xs font-semibold text-secondary-text">All active guards reporting nominal operation.</span>
            <button 
              onClick={() => onNavigate('#/settings')} 
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              Configure Guardrails
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
