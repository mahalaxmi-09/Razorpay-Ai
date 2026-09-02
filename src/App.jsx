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
import { api } from './lib/api';

export default function App() {
  // Global States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [merchantName, setMerchantName] = useState(() => localStorage.getItem('merchantName') || 'Mounika');
  const [lang, setLang] = useState('English');
  const [currency, setCurrency] = useState('INR');
  const [notifications, setNotifications] = useState([]);
  
  // Theme state (localStorage persisted)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // Real-time payments database state
  const [transactions, setTransactions] = useState([]);

  // Layout States
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Load live transaction and alert feeds from PostgreSQL database
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadBackendData = async () => {
      try {
        const txns = await api.getPayments();
        setTransactions(txns);

        const alerts = await api.getAlerts();
        setNotifications(alerts.map(n => ({
          id: n.id,
          type: n.type === 'ACTION_REQUIRED' ? 'critical' : (n.type === 'RECOVERY_PENDING' ? 'warning' : 'success'),
          title: n.title,
          message: n.message,
          time: 'Just now',
          read: n.read
        })));
      } catch (err) {
        console.error('Failed to load backend records:', err.message);
      }
    };

    loadBackendData();
  }, [isAuthenticated, currentPath]);

  // Theme Toggler effect using data-theme attribute on documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
    
    // Check if initial hash is set, if not default
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (path) => {
    window.location.hash = path;
  };

  const handleLogin = (user) => {
    const validName = user && typeof user === 'string' && user.trim() ? user.trim() : 'Mounika';
    setMerchantName(validName);
    localStorage.setItem('merchantName', validName);
    setIsAuthenticated(true);
    handleNavigate('#/dashboard');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    handleNavigate('#/login');
  };

  // Auth Guard
  useEffect(() => {
    const publicRoutes = ['#/login', '#/signup'];
    if (!isAuthenticated && !publicRoutes.includes(currentPath)) {
      handleNavigate('#/login');
    }
  }, [currentPath, isAuthenticated]);

  // Page Title Resolver
  const getPageTitle = () => {
    if (currentPath.startsWith('#/payments/')) return 'Payment Detail';
    
    switch (currentPath) {
      case '#/dashboard': return 'Dashboard';
      case '#/payments': return 'Payments';
      case '#/recovery': return 'Recovery Agent';
      case '#/analytics': return 'Analytics';
      case '#/alerts': return 'Alerts';
      case '#/audit': return 'Audit Logs';
      case '#/settings': return 'Settings';
      case '#/help': return 'Help & Support';
      default: return 'RazorRecover AI';
    }
  };

  // Render active page component
  const renderContent = () => {
    if (currentPath.startsWith('#/payments/')) {
      const transactionId = currentPath.split('/').pop();
      return (
        <PaymentDetail 
          transactionId={transactionId} 
          onNavigate={handleNavigate} 
          currency={currency} 
          transactions={transactions}
          onUpdateStatus={handleUpdateTransactionStatus}
        />
      );
    }

    switch (currentPath) {
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
            transactions={transactions}
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
      case '#/audit':
        return (
          <AuditLogs 
            currency={currency} 
          />
        );
      case '#/settings':
        return (
          <SettingsPage 
            lang={lang} 
            onLangChange={setLang} 
            currency={currency} 
            onCurrencyChange={setCurrency} 
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

  // Public View: Login / Signup Layout
  if (!isAuthenticated) {
    if (currentPath === '#/signup') {
      return (
        <Signup 
          onLogin={handleLogin} 
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

  // Private View: Main Application Layout
  return (
    <div className="flex h-screen bg-bg-light overflow-hidden transition-colors duration-200">
      
      {/* Sidebar Panel */}
      <Sidebar 
        currentPath={currentPath} 
        onNavigate={handleNavigate} 
        lang={lang} 
        translations={requireTranslations()} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        transactionsCount={transactions.length}
      />

      {/* Main Container Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header toolbar */}
        <Header 
          pageTitle={getPageTitle()} 
          lang={lang} 
          onLangChange={setLang} 
          currency={currency} 
          onCurrencyChange={setCurrency} 
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
