import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function NotificationPanel({ notifications, setNotifications, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (item) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    setIsOpen(false);
    if (item.type === 'critical') {
      onNavigate('#/payments/TXN_10234'); // Navigate to high risk txn
    } else if (item.type === 'warning') {
      onNavigate('#/alerts');
    } else {
      onNavigate('#/payments');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-secondary-text hover:text-navy-dark hover:bg-bg-light rounded-lg transition duration-150 cursor-pointer"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-error-red text-[10px] text-white rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-80 bg-card-bg border border-border-light rounded-lg shadow-lg z-50 overflow-hidden py-1">
          <div className="px-4 py-2.5 border-b border-border-light flex items-center justify-between bg-bg-light">
            <span className="text-sm font-bold text-navy-dark">Notifications</span>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-secondary-text">
                <span className="text-xs font-bold text-navy-dark block mb-1">No new notifications</span>
                <p className="text-[10px]">Your alerts and notifications will appear here.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 border-b border-border-light hover:bg-bg-light cursor-pointer transition flex gap-2.5 ${!item.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="mt-0.5">
                    {item.type === 'critical' && <AlertTriangle size={16} className="text-error-red" />}
                    {item.type === 'warning' && <AlertTriangle size={16} className="text-warning-amber" />}
                    {item.type === 'success' && <CheckCircle2 size={16} className="text-success-green" />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-xs font-bold ${!item.read ? 'text-navy-dark' : 'text-secondary-text'}`}>
                      {item.title}
                    </div>
                    <p className="text-[11px] text-secondary-text mt-0.5 leading-snug">{item.message}</p>
                    <span className="text-[9px] text-secondary-text mt-1 block">{item.time}</span>
                  </div>
                  {!item.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border-light p-2 text-center bg-bg-light">
            <button 
              onClick={() => { setIsOpen(false); onNavigate('#/alerts'); }}
              className="text-xs text-secondary-text hover:text-navy-dark font-semibold"
            >
              View all alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
