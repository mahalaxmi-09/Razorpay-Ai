import React, { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, LogOut, Settings, ShieldCheck } from 'lucide-react';

export default function AccountMenu({ merchantName = 'Mounika', onNavigate, onSignOut }) {
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

  const handleSignOut = () => {
    setIsOpen(false);
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-card-bg border border-border-light rounded-lg hover:bg-bg-light transition duration-150 cursor-pointer"
      >
        <div className="w-6 h-6 rounded-full bg-sky-blue flex items-center justify-center text-primary font-bold text-xs">
          {merchantName.charAt(0)}
        </div>
        <span className="text-sm font-semibold text-navy-dark hidden md:inline">{merchantName}</span>
        <ChevronDown size={14} className="text-secondary-text" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 bg-card-bg border border-border-light rounded-lg shadow-lg z-50 overflow-hidden py-1">
          <div className="px-4 py-2 border-b border-border-light bg-bg-light">
            <span className="block text-xs text-secondary-text">Logged in as</span>
            <span className="block text-sm font-bold text-navy-dark">{merchantName}</span>
          </div>

          <button
            onClick={() => {
              onNavigate('#/settings');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-navy-dark hover:bg-bg-light flex items-center gap-2 transition"
          >
            <User size={14} className="text-secondary-text" />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => {
              onNavigate('#/settings');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-navy-dark hover:bg-bg-light flex items-center gap-2 transition"
          >
            <ShieldCheck size={14} className="text-secondary-text" />
            <span>Account Security</span>
          </button>

          <button
            onClick={() => {
              onNavigate('#/settings');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-navy-dark hover:bg-bg-light flex items-center gap-2 transition"
          >
            <Settings size={14} className="text-secondary-text" />
            <span>Preferences</span>
          </button>

          <div className="border-t border-border-light my-1"></div>

          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm text-error-red hover:bg-error-red/5 flex items-center gap-2 transition font-semibold"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
