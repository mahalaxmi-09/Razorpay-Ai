import React, { useState } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';
import { mockAIInsights } from '../services/mockData';

export default function AIInsight({ transactions = [], onNavigate }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const hasInsights = transactions.length > 0;

  const nextInsight = () => {
    setActiveIndex((prev) => (prev + 1) % mockAIInsights.length);
  };

  const prevInsight = () => {
    setActiveIndex((prev) => (prev - 1 + mockAIInsights.length) % mockAIInsights.length);
  };

  const currentInsight = hasInsights ? mockAIInsights[activeIndex] : null;

  const handleAction = () => {
    if (!currentInsight) return;
    if (currentInsight.actionable.includes('transactions')) {
      onNavigate('#/payments');
    } else if (currentInsight.actionable.includes('analytics')) {
      onNavigate('#/analytics');
    } else {
      onNavigate('#/settings');
    }
  };

  const getBorderColor = (type) => {
    if (!hasInsights) return 'border-border-light bg-card-bg';
    if (type === 'warning') return 'border-warning-amber/40 bg-warning-amber/[0.02]';
    if (type === 'success') return 'border-success-green/40 bg-success-green/[0.02]';
    return 'border-primary/40 bg-primary/[0.02]';
  };

  return (
    <div className={`p-6 rounded-xl border transition-all duration-300 ${getBorderColor(currentInsight?.type)} flex flex-col justify-between min-h-[140px] h-full`}>
      {!hasInsights ? (
        <div className="flex flex-col items-center justify-center text-center h-full gap-2">
          <div className="flex items-center gap-1.5 justify-center">
            <Lightbulb size={16} className="text-secondary-text/60 animate-pulse" />
            <span className="text-navy-dark font-extrabold text-xs block">No insights available yet.</span>
          </div>
          <p className="text-secondary-text text-[11px] leading-normal max-w-xs">
            Insights will appear after the system analyzes transaction data.
          </p>
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles size={14} />
                </div>
                <span className="text-xs font-bold text-navy-dark uppercase tracking-wider">AI Insight</span>
              </div>
              
              {/* Pagers */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={prevInsight}
                  className="p-1 hover:bg-bg-light border border-border-light rounded text-secondary-text cursor-pointer"
                >
                  <ChevronLeft size={12} />
                </button>
                <span className="text-[10px] text-secondary-text font-bold px-1 select-none">
                  {activeIndex + 1}/{mockAIInsights.length}
                </span>
                <button 
                  onClick={nextInsight}
                  className="p-1 hover:bg-bg-light border border-border-light rounded text-secondary-text cursor-pointer"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

            <p className="text-sm font-semibold text-navy-dark leading-relaxed mb-4">
              "{currentInsight.text}"
            </p>
          </div>

          <button
            onClick={handleAction}
            className="self-start text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition"
          >
            <span>{currentInsight.actionable}</span>
            <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  );
}
