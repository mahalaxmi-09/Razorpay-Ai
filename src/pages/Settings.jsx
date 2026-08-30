import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Sparkles, 
  Sliders, 
  Volume2, 
  Bell, 
  User, 
  Globe, 
  DollarSign, 
  Lock 
} from 'lucide-react';
import { formatCurrency } from '../services/mockData';

export default function SettingsPage({ lang, onLangChange, currency, onCurrencyChange }) {
  // Guardrail states
  const [maxRetries, setMaxRetries] = useState(3);
  const [cooldown, setCooldown] = useState(true);
  const [maxTxnLimit, setMaxTxnLimit] = useState(100000);
  const [duplicateProtection, setDuplicateProtection] = useState(true);
  const [humanApprovalThreshold, setHumanApprovalThreshold] = useState(50000);
  
  // AI Preference States
  const [agentMode, setAgentMode] = useState('Copilot'); // Copilot or Autonomous
  
  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [webhookAlerts, setWebhookAlerts] = useState(false);

  const handleSaveSettings = () => {
    alert("RazorRecover guardrails and preferences saved successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-navy-dark leading-none select-none">Settings</h2>
          <p className="text-xs md:text-sm text-secondary-text mt-1">
            Configure automated retry guardrails, AI agent behavior, notifications, and system localizations.
          </p>
        </div>
        
        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg text-xs transition duration-150 shadow-sm cursor-pointer"
        >
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: General & AI Config */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recovery Guardrails Controls */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-border-light/60 pb-3">
              <ShieldCheck size={18} className="text-primary" />
              <h3 className="text-sm font-extrabold text-navy-dark">Recovery Guardrails</h3>
            </div>

            <div className="space-y-5 text-xs">
              {/* Max Retry Attempts */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-navy-dark">
                  <span>Maximum Retry Attempts</span>
                  <span className="text-primary">{maxRetries} Attempts</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(parseInt(e.target.value, 10))}
                  className="w-full accent-primary bg-bg-light border border-border-light rounded-lg h-2"
                />
                <p className="text-[10px] text-secondary-text">Limits the number of times the recovery agent attempts auto-reconciliation retry.</p>
              </div>

              {/* Human Approval Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-navy-dark">
                  <span>Human Approval Threshold</span>
                  <span className="text-primary">{formatCurrency(humanApprovalThreshold, currency)}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="200000"
                  step="10000"
                  value={humanApprovalThreshold}
                  onChange={(e) => setHumanApprovalThreshold(parseInt(e.target.value, 10))}
                  className="w-full accent-primary bg-bg-light border border-border-light rounded-lg h-2"
                />
                <p className="text-[10px] text-secondary-text">Any payment risks exceeding this amount require manual authorization before executing recovery.</p>
              </div>

              {/* Max transaction limit */}
              <div className="space-y-2">
                <label className="font-bold text-navy-dark block">Maximum Transaction Amount</label>
                <div className="flex bg-bg-light border border-border-light rounded-lg overflow-hidden w-full max-w-xs px-3 py-2 items-center">
                  <span className="font-bold text-secondary-text mr-1.5">{currency === 'INR' ? '₹' : '$'}</span>
                  <input
                    type="number"
                    value={maxTxnLimit}
                    onChange={(e) => setMaxTxnLimit(parseInt(e.target.value, 10))}
                    className="bg-transparent border-none outline-none w-full font-bold text-navy-dark"
                  />
                </div>
                <p className="text-[10px] text-secondary-text">Do not retry any transactions larger than this limit under any circumstances.</p>
              </div>

              {/* Cooldown & Duplicate Protection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* 24h Cooldown */}
                <div className="p-3 bg-bg-light border border-border-light rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-navy-dark block">24-hour cooldown</span>
                    <span className="text-[9px] text-secondary-text block mt-0.5">Enforces sleep cycles between retries</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={cooldown}
                    onChange={(e) => setCooldown(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* Duplicate protection */}
                <div className="p-3 bg-bg-light border border-border-light rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-navy-dark block">Duplicate Charge Guard</span>
                    <span className="text-[9px] text-secondary-text block mt-0.5">Scans webhooks to prevent double debits</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={duplicateProtection}
                    onChange={(e) => setDuplicateProtection(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Settings preference card */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-border-light/60 pb-3">
              <Sparkles size={18} className="text-primary" />
              <h3 className="text-sm font-extrabold text-navy-dark">AI Preferences</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-4">
                {['Copilot', 'Autonomous'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAgentMode(mode)}
                    className={`
                      px-4 py-2.5 rounded-lg border font-bold transition flex-1 cursor-pointer text-center
                      ${agentMode === mode 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-border-light bg-card-bg text-navy-dark hover:bg-bg-light'
                      }
                    `}
                  >
                    {mode === 'Copilot' ? 'AI Copilot Mode' : 'Fully Autonomous Recovery'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-secondary-text">
                {agentMode === 'Copilot' 
                  ? 'AI analyzes cases and recommends actions. Execution remains in manual pending queues.'
                  : 'AI autonomously executes recoveries, retries, and reconciliations. Reports outputs in audits.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Localizations & System */}
        <div className="lg:col-span-1 space-y-6">
          {/* Localization Card */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-border-light/60 pb-3">
              <Globe size={18} className="text-primary" />
              <h3 className="text-sm font-extrabold text-navy-dark">System Localization</h3>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-secondary-text block mb-1">Language Preferences:</label>
                <select
                  value={lang}
                  onChange={(e) => onLangChange(e.target.value)}
                  className="w-full bg-card-bg border border-border-light rounded-lg px-3 py-2 outline-none text-navy-dark focus:border-primary font-bold cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="తెలుగు">తెలుగు</option>
                  <option value="हिंदी">हिंदी</option>
                </select>
              </div>

              <div>
                <label className="text-secondary-text block mb-1">Display Currency:</label>
                <select
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                  className="w-full bg-card-bg border border-border-light rounded-lg px-3 py-2 outline-none text-navy-dark focus:border-primary font-bold cursor-pointer"
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-border-light/60 pb-3">
              <Bell size={18} className="text-primary" />
              <h3 className="text-sm font-extrabold text-navy-dark">System Alerts</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="font-bold text-navy-dark block">Email Alert Reports</span>
                  <span className="text-[9px] text-secondary-text">Receive daily audit digests</span>
                </div>
                <input 
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="font-bold text-navy-dark block">Critical Slack Webhooks</span>
                  <span className="text-[9px] text-secondary-text">Alert channels on high risk</span>
                </div>
                <input 
                  type="checkbox"
                  checked={webhookAlerts}
                  onChange={(e) => setWebhookAlerts(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Account Profile specs */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-border-light/60 pb-3">
              <User size={18} className="text-primary" />
              <h3 className="text-sm font-extrabold text-navy-dark">Merchant Profile</h3>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between border-b border-bg-light py-1.5">
                <span className="text-secondary-text">Merchant Name:</span>
                <span className="font-bold text-navy-dark">Mounika</span>
              </div>
              <div className="flex justify-between border-b border-bg-light py-1.5">
                <span className="text-secondary-text">Company Name:</span>
                <span className="font-bold text-navy-dark">Mounika Fintech Ltd</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-secondary-text">Account Tier:</span>
                <span className="font-bold text-primary">Enterprise Pro</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
