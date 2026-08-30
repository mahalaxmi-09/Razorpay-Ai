import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

export default function LanguageSelector({ lang, onLangChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'English', label: 'English' },
    { code: 'తెలుగు', label: 'తెలుగు' },
    { code: 'हिंदी', label: 'हिंदी' }
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-card-bg border border-border-light rounded-lg text-sm text-navy-dark hover:bg-bg-light transition duration-150 font-semibold cursor-pointer"
      >
        <Globe size={16} className="text-secondary-text" />
        <span>{lang}</span>
        <ChevronDown size={14} className="text-secondary-text" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-32 bg-card-bg border border-border-light rounded-lg shadow-lg z-50 overflow-hidden">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                onLangChange(l.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition hover:bg-bg-light ${lang === l.code ? 'text-primary font-bold bg-bg-light' : 'text-navy-dark'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
