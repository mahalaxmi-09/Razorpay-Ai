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

export default function Sidebar({ currentPath, onNavigate, lang, translations, isOpen, setIsOpen }) {
  const menuItems = [
    { name: translations[lang]?.dashboard || 'Dashboard', path: '#/dashboard', icon: LayoutDashboard },
    { name: translations[lang]?.payments || 'Payments', path: '#/payments', icon: CreditCard },
    { name: translations[lang]?.recoveryAgent || 'Recovery Agent', path: '#/recovery', icon: Bot },
    { name: translations[lang]?.analytics || 'Analytics', path: '#/analytics', icon: BarChart3 },
    { name: translations[lang]?.alerts || 'Alerts', path: '#/alerts', icon: Bell },
    { name: translations[lang]?.auditLogs || 'Audit Logs', path: '#/audit', icon: ClipboardList },
  ];

  const bottomItems = [
    { name: translations[lang]?.settings || 'Settings', path: '#/settings', icon: Settings },
    { name: translations[lang]?.helpSupport || 'Help & Support', path: '#/help', icon: HelpCircle },
  ];

  const handleLinkClick = (path) => {
    onNavigate(path);
    setIsOpen(false); // Close sidebar on mobile
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-navy-dark/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed inset-y-0 left-0 bg-card-bg border-r border-border-light flex flex-col justify-between z-50
        transition-all duration-300 w-64 lg:static lg:flex
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo and Branding */}
        <div>
          <div className="p-6 border-b border-border-light flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleLinkClick('#/dashboard')}>
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                ↗
              </div>
              <div>
                <span className="font-extrabold text-navy-dark text-lg block leading-none">RazorRecover</span>
                <span className="text-xs text-primary font-bold tracking-wider uppercase">AI</span>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 text-secondary-text hover:text-navy-dark hover:bg-bg-light rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              // Check if active: path matches or starts with path (e.g. #/payments and #/payments/TXN_123)
              const isActive = currentPath === item.path || (item.path !== '#/dashboard' && currentPath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => handleLinkClick(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200
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
          </nav>
        </div>

        {/* Bottom Menu Items */}
        <div className="p-4 border-t border-border-light">
          <div className="space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleLinkClick(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200
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
              <span className="text-[10px] font-bold text-navy-dark uppercase tracking-wider">AI Recovery Active</span>
            </div>
            <p className="text-[11px] text-secondary-text">Monitoring 124 transactions for risk factors.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
