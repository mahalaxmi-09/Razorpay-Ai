import React, { useState } from 'react';
import { HelpCircle, FileText, Mail, MessageSquare, ExternalLink, Sparkles } from 'lucide-react';

export default function Help() {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketBody, setTicketBody] = useState('');

  const faqs = [
    {
      q: "What causes a payment to register as 'Settlement Missing'?",
      a: "This happens when the gateway successfully debits the customer (captured status) but our bank feeds do not confirm the receipt of funds within the expected reconciliation window (typically next-day settlement)."
    },
    {
      q: "How does the AI choose the 'Recommended Action'?",
      a: "The AI agent inspects webhook history, transaction logs, and UTR bank records to decide if a transaction capture matching is already complete. If matched, it recommends 'No Action' to avoid duplicate chargebacks. If captured but unsettled, it triggers 'Verify Settlement' through Bank APIs."
    },
    {
      q: "What are the automated Guardrails?",
      a: "Guardrails are security controls configured by the merchant to prevent unauthorized retries. For instance, the Duplicate Charge Guard pauses retries on captured transactions, and the Human Approval threshold holds any recoveries above limit for manual clearance."
    }
  ];

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (ticketSubject && ticketBody) {
      alert("Support ticket logged successfully! Our team will respond within 4 hours.");
      setTicketSubject('');
      setTicketBody('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-navy-dark leading-none select-none">Help & Support</h2>
        <p className="text-xs md:text-sm text-secondary-text mt-1">
          Explore documentation guides, frequently asked questions, or contact technical support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQs list */}
        <div className="lg:col-span-2 bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
          <h3 className="text-sm font-bold text-navy-dark mb-4 border-b border-border-light/60 pb-2">Frequently Asked Questions</h3>
          
          <div className="space-y-5 text-xs">
            {faqs.map((faq, idx) => (
              <div key={idx} className="space-y-1.5 p-3.5 bg-bg-light/40 border border-border-light rounded-lg">
                <span className="font-extrabold text-navy-dark block">{faq.q}</span>
                <p className="text-secondary-text leading-relaxed font-semibold">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Forms / Docs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Docs references */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
            <h3 className="text-sm font-bold text-navy-dark mb-4 border-b border-border-light/60 pb-2">Developer Guides</h3>
            
            <div className="space-y-3 text-xs">
              <a 
                href="#/docs/gateway" 
                onClick={(e) => { e.preventDefault(); alert("Redirecting to Webhook Setup Guide..."); }} 
                className="flex items-center justify-between p-2 bg-bg-light hover:bg-primary/5 rounded-lg border border-border-light font-bold text-navy-dark hover:border-primary/30 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText size={14} className="text-secondary-text" />
                  Webhook Setup Guide
                </span>
                <ExternalLink size={12} className="text-secondary-text" />
              </a>

              <a 
                href="#/docs/guardrails" 
                onClick={(e) => { e.preventDefault(); alert("Redirecting to Guardrail Integration docs..."); }} 
                className="flex items-center justify-between p-2 bg-bg-light hover:bg-primary/5 rounded-lg border border-border-light font-bold text-navy-dark hover:border-primary/30 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText size={14} className="text-secondary-text" />
                  Guardrails Config Specs
                </span>
                <ExternalLink size={12} className="text-secondary-text" />
              </a>
            </div>
          </div>

          {/* Submit ticket form */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm">
            <h3 className="text-sm font-bold text-navy-dark mb-4 border-b border-border-light/60 pb-2">Contact Support</h3>
            
            <form onSubmit={handleSubmitTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="text-secondary-text block mb-1">Subject:</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Gateway webhook delay"
                  required
                  className="w-full bg-bg-light border border-border-light px-3 py-2 rounded-lg outline-none text-navy-dark focus:border-primary focus:bg-card-bg"
                />
              </div>

              <div>
                <label className="text-secondary-text block mb-1">Details:</label>
                <textarea
                  rows="3"
                  value={ticketBody}
                  onChange={(e) => setTicketBody(e.target.value)}
                  placeholder="Provide transaction IDs if applicable..."
                  required
                  className="w-full bg-bg-light border border-border-light px-3 py-2 rounded-lg outline-none text-navy-dark focus:border-primary focus:bg-card-bg"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg transition duration-150 flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                <Mail size={14} />
                <span>Submit Ticket</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
