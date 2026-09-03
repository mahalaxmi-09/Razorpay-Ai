import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Bot, 
  BarChart3, 
  Bell, 
  ClipboardList, 
  Settings, 
  HelpCircle,
  TrendingUp,
  X
} from 'lucide-react';
import { translations as defaultTranslations } from '../services/mockData';

export default function Sidebar({ 
  currentPath, 
  onNavigate, 
  lang = 'English', 
  translations, 
  isOpen = false, 
  onClose, 
  setIsOpen, 
  notificationsCount = 0 
}) {
  const t = (translations && translations[lang]) || defaultTranslations[lang] || defaultTranslations['English'];

  const menuItems = [
    { name: t?.dashboard || 'Dashboard', path: '#/dashboard', icon: LayoutDashboard },
    { name: t?.payments || 'Payments', path: '#/payments', icon: CreditCard },
    { name: t?.recoveryAgent || 'Recovery Agent', path: '#/recovery', icon: Bot },
    { name: t?.analytics || 'Analytics', path: '#/analytics', icon: BarChart3 },
    { name: t?.alerts || 'Alerts', path: '#/alerts', icon: Bell, badge: notificationsCount },
    { name: t?.auditLogs || 'Audit Logs', path: '#/audit-logs', icon: ClipboardList },
  ];

  const bottomItems = [
    { name: t?.settings || 'Settings', path: '#/settings', icon: Settings },
    { name: t?.helpSupport || 'Help & Support', path: '#/help', icon: HelpCircle },
  ];

  const handleClose = () => {
    if (onClose) onClose();
    if (setIsOpen) setIsOpen(false);
  };

  const handleLinkClick = (path) => {
    onNavigate(path);
    handleClose();
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-navy-dark/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Main Sidebar Component */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-50
        w-64 bg-card-bg border-r border-border-light flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top: Logo & Main Navigation */}
        <div className="space-y-6">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleLinkClick('#/dashboard')}>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-primary/30">
                RR
              </div>
              <div className="leading-tight">
                <span className="block font-black text-navy-dark text-base tracking-tight">RazorRecover</span>
                <span className="block text-[10px] text-primary font-bold uppercase tracking-widest -mt-0.5">Autonomous AI</span>
              </div>
            </div>

            {/* Mobile close button */}
            <button 
              onClick={handleClose}
              className="lg:hidden p-1.5 text-secondary-text hover:text-navy-dark rounded-md cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Primary Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.path === '#/dashboard' && (currentPath === '#/' || currentPath === ''));

              return (
                <button
                  key={item.path}
                  onClick={() => handleLinkClick(item.path)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer
                    ${isActive 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-secondary-text hover:text-navy-dark hover:bg-bg-light'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Settings, Help, AI Badge */}
        <div className="space-y-4 pt-4 border-t border-border-light">
          <div className="space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleLinkClick(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition duration-150 cursor-pointer
                    ${isActive 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-secondary-text hover:text-navy-dark hover:bg-bg-light'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 p-3 bg-bg-light border border-border-light rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-success-green animate-pulse"></span>
              <span className="text-[10px] font-bold text-navy-dark uppercase tracking-wider">Razorpay Test Mode</span>
            </div>
            <p className="text-[11px] text-secondary-text">
              Autonomous safety guardrails active across all recovery workflows.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
