import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CurrencySelector({ currency, onCurrencyChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currencies = [
    { code: 'INR', label: '₹ INR' },
    { code: 'USD', label: '$ USD' },
    { code: 'EUR', label: '€ EUR' },
    { code: 'GBP', label: '£ GBP' }
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

  const activeLabel = currencies.find(c => c.code === currency)?.label || '₹ INR';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-card-bg border border-border-light rounded-lg text-sm text-navy-dark hover:bg-bg-light transition duration-150 font-semibold cursor-pointer"
      >
        <span>{activeLabel}</span>
        <ChevronDown size={14} className="text-secondary-text" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-32 bg-card-bg border border-border-light rounded-lg shadow-lg z-50 overflow-hidden">
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                onCurrencyChange(c.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition hover:bg-bg-light ${currency === c.code ? 'text-primary font-bold bg-bg-light' : 'text-navy-dark'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
