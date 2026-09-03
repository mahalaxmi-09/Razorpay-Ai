import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Trash2, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { isDemoMode } from '../config/dataMode';
import { notificationsData } from '../data/notifications';
import { formatCurrency } from '../services/mockData';
import { api } from '../lib/api';

export default function Alerts({ currency, onNavigate }) {
  const isDemo = isDemoMode();
  const [filter, setFilter] = useState('All');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch alerts from demo data or backend database
  useEffect(() => {
    const fetchAlerts = async () => {
      if (isDemo) {
        setAlerts(notificationsData);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await api.getAlerts();
        
        const mappedAlerts = (Array.isArray(data) ? data : []).map(n => ({
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
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [isDemo]);

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
    e.stopPropagation();
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (!isDemo) {
      try {
        await api.markAlertAsRead(id);
      } catch (err) {
        console.error('Failed to mark alert read:', err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-navy-dark leading-none select-none">Alerts & Notifications</h2>
          <p className="text-xs md:text-sm text-secondary-text mt-1">
            Real-time critical events, authorization drops, and high-value approvals.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-bg-light p-1 rounded-lg border border-border-light self-start">
          {['All', 'Critical', 'Warning', 'Success'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                filter === t ? 'bg-card-bg text-primary shadow-sm' : 'text-secondary-text hover:text-navy-dark'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-secondary-text text-xs">Loading alert notifications...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-card-bg border border-dashed border-border-light rounded-xl p-12 text-center text-secondary-text">
            <CheckCircle2 size={32} className="mx-auto text-success-green/40 mb-2" />
            <span className="text-sm font-bold text-navy-dark block">All Alerts Cleared</span>
            <p className="text-xs mt-1">No pending notifications in this category.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-4 rounded-xl border bg-card-bg transition duration-150 flex items-start justify-between gap-4 ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start gap-3">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getIndicatorColor(alert.type)}`}></span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-navy-dark">{alert.title}</span>
                    <span className="text-[10px] text-secondary-text font-semibold">{alert.time}</span>
                  </div>
                  <p className="text-xs text-secondary-text font-medium leading-relaxed">{alert.message}</p>
                </div>
              </div>

              <button
                onClick={(e) => handleResolveAlert(alert.id, e)}
                className="p-1.5 text-secondary-text hover:text-error-red hover:bg-error-red/10 rounded-lg transition shrink-0 cursor-pointer"
                title="Dismiss alert"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
