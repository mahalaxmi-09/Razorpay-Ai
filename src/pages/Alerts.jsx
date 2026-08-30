import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Trash2, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { formatCurrency } from '../services/mockData';
import { api } from '../lib/api';

export default function Alerts({ currency, onNavigate }) {
  const [filter, setFilter] = useState('All');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch alerts from the backend database
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await api.getAlerts();
        
        const mappedAlerts = data.map(n => ({
          id: n.id,
          type: n.type === 'ACTION_REQUIRED' ? 'critical' : (n.type === 'RECOVERY_PENDING' ? 'warning' : 'success'),
          title: n.title,
          message: n.message,
          time: 'Just now',
          read: n.read
        }));
        
        setAlerts(mappedAlerts);
      } catch (err) {
        console.error('Failed to load alerts feed:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'border-error-red/40 bg-error-red/[0.01] hover:bg-error-red/[0.03]';
      case 'warning': return 'border-warning-amber/40 bg-warning-amber/[0.01] hover:bg-warning-amber/[0.03]';
      case 'success': return 'border-success-green/40 bg-success-green/[0.01] hover:bg-success-green/[0.03]';
      default: return 'border-border-light bg-bg-light/40 hover:bg-bg-light';
    }
  };

  const getIndicatorColor = (type) => {
    switch (type) {
      case 'critical': return 'bg-error-red text-error-red';
      case 'warning': return 'bg-warning-amber text-warning-amber';
      case 'success': return 'bg-success-green text-success-green';
      default: return 'bg-secondary-text text-secondary-text';
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'All') return true;
    return a.type === filter.toLowerCase();
  });

  const handleResolveAlert = async (id, e) => {
    e.stopPropagation(); // Avoid card click navigation
    try {
      await api.markAlertAsRead(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to mark alert as resolved in database:', err.message);
    }
  };

  const handleCardClick = (alertItem) => {
    onNavigate('#/payments');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-navy-dark leading-none select-none">Alerts Center</h2>
          <p className="text-xs md:text-sm text-secondary-text mt-1">
            Real-time warnings, critical escalations, and automated success resolutions.
          </p>
        </div>

        {/* Filters */}
        <div className="flex bg-bg-light p-1 rounded-lg border border-border-light self-start">
          {['All', 'Critical', 'Warning', 'Success'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${filter === t ? 'bg-card-bg text-navy-dark shadow-sm' : 'text-secondary-text hover:text-navy-dark'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts feed */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-card-bg rounded-xl border border-border-light p-12 text-center text-secondary-text">
            <Bell size={32} className="mx-auto text-secondary-text/40 mb-3" />
            <span className="text-sm font-bold block mb-1">No active alerts yet.</span>
            <p className="text-xs">Connect payment data to start monitoring.</p>
          </div>
        ) : (
          filteredAlerts.map((item) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className={`p-4 border rounded-xl flex items-start gap-4 transition duration-150 cursor-pointer shadow-sm ${getAlertColor(item.type)}`}
            >
              {/* Dot Indicators */}
              <div className="mt-1">
                {item.type === 'critical' && <ShieldAlert size={18} className="text-error-red" />}
                {item.type === 'warning' && <AlertTriangle size={18} className="text-warning-amber" />}
                {item.type === 'success' && <CheckCircle2 size={18} className="text-success-green" />}
              </div>

              {/* Text content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xs font-extrabold text-navy-dark uppercase tracking-wider">{item.title}</h3>
                  <span className="text-[10px] text-secondary-text font-semibold">{item.time}</span>
                </div>
                
                <p className="text-xs text-navy-dark leading-relaxed font-semibold">
                  {item.message}
                </p>
                
                <span className="text-[10px] text-secondary-text block">
                  Click card to investigate case history
                </span>
              </div>

              {/* Actions */}
              <button
                onClick={(e) => handleResolveAlert(item.id, e)}
                className="p-1.5 hover:bg-border-light/40 hover:text-error-red rounded text-secondary-text transition cursor-pointer"
                title="Dismiss Alert"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
