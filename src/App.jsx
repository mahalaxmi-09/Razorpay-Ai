import React, { useState, useEffect } from 'react';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Copilot from './components/Copilot';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import PaymentDetail from './pages/PaymentDetail';
import RecoveryAgent from './pages/RecoveryAgent';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import AuditLogs from './pages/AuditLogs';
import SettingsPage from './pages/Settings';
import Help from './pages/Help';

// Services / Data
import { isDemoMode } from './config/dataMode';
import { transactionsData } from './data/transactions';
import { notificationsData } from './data/notifications';
import { api } from './lib/api';

export default function App() {
  // Global States (persisted across refreshes in localStorage)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [merchantName, setMerchantName] = useState(() => localStorage.getItem('merchantName') || 'Mounika');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'English');
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'INR');
  const [notifications, setNotifications] = useState([]);
  
  // Theme state (localStorage persisted)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // Real-time payments database state
  const [transactions, setTransactions] = useState([]);

  // Layout States
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Load transaction and alert feeds based on data mode
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      if (isDemoMode()) {
        setTransactions(transactionsData);
        setNotifications(notificationsData);
        return;
      }

      try {
        const txns = await api.getPayments();
        setTransactions(Array.isArray(txns) ? txns : []);

        const alerts = await api.getAlerts();
        setNotifications(Array.isArray(alerts) ? alerts.map(n => ({
          id: n.id,
          type: n.type === 'ACTION_REQUIRED' ? 'critical' : (n.type === 'RECOVERY_PENDING' ? 'warning' : 'success'),
          title: n.title,
          message: n.message,
          time: 'Just now',
          read: n.read
        })) : []);
      } catch (err) {
        console.error('Failed to load backend records:', err.message);
      }
    };

    loadData();
  }, [isAuthenticated, currentPath]);

  // Theme Toggler effect using data-theme attribute on documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  // Status updating transaction callback
  const handleUpdateTransactionStatus = (id, newStatus) => {
    setTransactions(prev => prev.map(t => t.id === id ? { 
      ...t, 
      status: newStatus, 
      merchantSettlement: newStatus === 'Recovered' ? 'Settled' : t.merchantSettlement 
    } : t));
  };

  // Hash Router listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/dashboard';
      setCurrentPath(hash);
      
      // Auto close sidebar on route changes
      setIsSidebarOpen(false);
      
      // Scroll to top on navigation
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Programmatic navigation handler
  const handleNavigate = (path) => {
    window.location.hash = path;
    setCurrentPath(path);
    setIsSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogin = (userCredentials) => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    if (userCredentials?.merchantName) {
      setMerchantName(userCredentials.merchantName);
      localStorage.setItem('merchantName', userCredentials.merchantName);
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('merchantName');
    window.location.hash = '#/login';
  };

  // Route Views Renderer
  const renderContent = () => {
    if (currentPath.startsWith('#/payments/')) {
      const paymentId = currentPath.replace('#/payments/', '');
      return (
        <PaymentDetail 
          paymentId={paymentId} 
          currency={currency} 
          onNavigate={handleNavigate} 
          onUpdateStatus={handleUpdateTransactionStatus}
        />
      );
    }

    switch (currentPath) {
      case '#/':
      case '#/dashboard':
        return (
          <Dashboard 
            lang={lang} 
            currency={currency} 
            merchantName={merchantName} 
            onNavigate={handleNavigate} 
            transactions={transactions}
          />
        );
      case '#/payments':
        return (
          <Payments 
            currency={currency} 
            onNavigate={handleNavigate} 
            transactions={transactions} 
          />
        );
      case '#/recovery':
        return (
          <RecoveryAgent 
            onNavigate={handleNavigate} 
          />
        );
      case '#/analytics':
        return (
          <Analytics 
            currency={currency} 
          />
        );
      case '#/alerts':
        return (
          <Alerts 
            currency={currency} 
            onNavigate={handleNavigate} 
          />
        );
      case '#/audit-logs':
        return (
          <AuditLogs 
            currency={currency} 
          />
        );
      case '#/settings':
        return (
          <SettingsPage 
            lang={lang}
            onLangChange={handleLangChange}
            currency={currency}
            onCurrencyChange={handleCurrencyChange}
            merchantName={merchantName}
            onMerchantNameChange={(newName) => {
              setMerchantName(newName);
              localStorage.setItem('merchantName', newName);
            }}
          />
        );
      case '#/help':
        return <Help />;
      default:
        return (
          <Dashboard 
            lang={lang} 
            currency={currency} 
            merchantName={merchantName} 
            onNavigate={handleNavigate} 
            transactions={transactions}
          />
        );
    }
  };

  // Get current page display title
  const getPageTitle = () => {
    const t = requireTranslations()[lang] || requireTranslations()['English'];
    
    if (currentPath.startsWith('#/payments/')) {
      return 'Payment Investigation';
    }

    switch (currentPath) {
      case '#/':
      case '#/dashboard':
        return t.dashboard;
      case '#/payments':
        return t.payments;
      case '#/recovery':
        return t.recoveryAgent;
      case '#/analytics':
        return t.analytics;
      case '#/alerts':
        return t.alerts;
      case '#/audit-logs':
        return t.auditLogs;
      case '#/settings':
        return t.settings;
      case '#/help':
        return t.helpSupport;
      default:
        return t.dashboard;
    }
  };

  // If not authenticated, render Login or Signup views
  if (!isAuthenticated) {
    if (currentPath === '#/signup') {
      return (
        <Signup 
          onSignup={handleLogin} 
          onNavigate={handleNavigate} 
        />
      );
    }
    return (
      <Login 
        onLogin={handleLogin} 
        onNavigate={handleNavigate} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-bg-light overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentPath={currentPath} 
        onNavigate={handleNavigate} 
        lang={lang}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        notificationsCount={notifications.filter(n => !n.read).length}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Workspace Header */}
        <Header 
          pageTitle={getPageTitle()} 
          lang={lang} 
          onLangChange={handleLangChange} 
          currency={currency} 
          onCurrencyChange={handleCurrencyChange} 
          merchantName={merchantName}
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
          notifications={notifications}
          setNotifications={setNotifications}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />

        {/* Dynamic content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* AI Copilot Drawer */}
      <Copilot 
        isOpen={isCopilotOpen} 
        setIsOpen={setIsCopilotOpen} 
        lang={lang}
      />
    </div>
  );
}

// Translations wrapper helper
function requireTranslations() {
  return {
    English: {
      dashboard: 'Dashboard',
      payments: 'Payments',
      recoveryAgent: 'Recovery Agent',
      analytics: 'Analytics',
      alerts: 'Alerts',
      auditLogs: 'Audit Logs',
      settings: 'Settings',
      helpSupport: 'Help & Support'
    },
    తెలుగు: {
      dashboard: 'డాష్‌బోర్డ్',
      payments: 'చెల్లింపులు',
      recoveryAgent: 'రికవరీ ఏజెంట్',
      analytics: 'విశ్లేషణలు',
      alerts: 'హెచ్చరికలు',
      auditLogs: 'ఆడిట్ లాగ్‌లు',
      settings: 'సెట్టింగ్లు',
      helpSupport: 'సహాయం & మద్దతు'
    },
    हिंदी: {
      dashboard: 'डैशबोर्ड',
      payments: 'भुगतान',
      recoveryAgent: 'रिकवरी एजेंट',
      analytics: 'विश्लेषण',
      alerts: 'अलर्ट',
      auditLogs: 'ऑडिट लॉग',
      settings: 'सेटिंग्स',
      helpSupport: 'सहायता और समर्थन'
    }
  };
}
