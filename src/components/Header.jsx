import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import CurrencySelector from './CurrencySelector';
import AccountMenu from './AccountMenu';
import NotificationPanel from './NotificationPanel';

export default function Header({ 
  pageTitle, 
  lang, 
  onLangChange, 
  currency, 
  onCurrencyChange, 
  merchantName, 
  onNavigate, 
  onSignOut,
  notifications,
  setNotifications,
  onMenuToggle,
  theme,
  onThemeToggle
}) {
  return (
    <header className="bg-card-bg border-b border-border-light px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Left: Page Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-secondary-text hover:text-navy-dark hover:bg-bg-light rounded-lg transition"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl md:text-2xl font-extrabold text-navy-dark tracking-tight capitalize select-none leading-none">
          {pageTitle}
        </h1>
        <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
          Razorpay Test Mode
        </span>
      </div>

      {/* Right: Actions and Dropdowns */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className="p-2 text-secondary-text hover:text-navy-dark hover:bg-bg-light rounded-lg transition duration-150 cursor-pointer"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications Panel */}
        <NotificationPanel 
          notifications={notifications} 
          setNotifications={setNotifications} 
          onNavigate={onNavigate} 
        />

        <div className="h-6 w-px bg-border-light hidden md:block"></div>

        {/* Language Selector */}
        <LanguageSelector 
          lang={lang} 
          onLangChange={onLangChange} 
        />

        {/* Currency Selector */}
        <CurrencySelector 
          currency={currency} 
          onCurrencyChange={onCurrencyChange} 
        />

        <div className="h-6 w-px bg-border-light"></div>

        {/* User Merchant Profile */}
        <AccountMenu 
          merchantName={merchantName} 
          onNavigate={onNavigate} 
          onSignOut={onSignOut} 
        />
      </div>
    </header>
  );
}
