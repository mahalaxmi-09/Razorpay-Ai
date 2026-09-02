import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RotateCcw, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function Copilot({ isOpen, setIsOpen, lang = 'English' }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your RazorRecover AI Copilot. Ask me anything about your revenue at risk, payment failures, recovery cases, or financial safety guardrails."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const suggestedQuestions = [
    "What is the current revenue at risk?",
    "Which recovery cases need attention?",
    "Why is my revenue at risk?",
    "How does the guardrail engine protect me?",
    "How much revenue has been recovered?"
  ];

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.askCopilot(query, lang);
      const replyText = response.data?.reply || response.reply || response.data || "I couldn't retrieve recovery data for that request.";
      setMessages((prev) => [...prev, { sender: 'bot', text: replyText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev, 
        { sender: 'bot', text: `⚠️ Unable to connect to Copilot engine: ${err.message}. Please verify the backend is running.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: "Chat cleared. How can I assist you with your revenue recovery operations?"
      }
    ]);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  return (
    <>
      {/* Floating Sparkles Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary/95 text-white font-bold py-3 px-5 rounded-full shadow-lg shadow-primary/30 flex items-center gap-2 transition duration-200 hover:scale-105 cursor-pointer"
        >
          <Sparkles size={16} className="animate-pulse" />
          <span>✦ AI Copilot</span>
        </button>
      )}

      {/* Slide-out Sidebar Panel */}
      <div className={`
        fixed inset-y-0 right-0 w-full sm:w-[420px] bg-card-bg border-l border-border-light shadow-2xl z-50 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Panel Header */}
        <div className="p-4 border-b border-border-light flex items-center justify-between bg-bg-light">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-navy-dark leading-none">RazorRecover Copilot</h2>
              <span className="text-[10px] text-secondary-text font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse"></span>
                Grounded Telemetry • {lang}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleResetChat}
              title="Clear chat"
              className="p-1.5 hover:bg-border-light rounded text-secondary-text hover:text-navy-dark cursor-pointer transition"
            >
              <RotateCcw size={15} />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-border-light rounded text-secondary-text hover:text-navy-dark cursor-pointer transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chat History Panel */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex gap-2.5 max-w-[88%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${m.sender === 'bot' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-sky-blue text-navy-dark font-bold'}`}>
                {m.sender === 'bot' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${m.sender === 'bot' ? 'bg-bg-light text-navy-dark border border-border-light' : 'bg-primary text-white font-medium shadow-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 max-w-[85%]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 bg-primary/10 text-primary border border-primary/20">
                <Bot size={14} />
              </div>
              <div className="p-3 rounded-xl text-xs leading-relaxed bg-bg-light text-secondary-text border border-border-light flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-primary" />
                <span className="font-semibold">Analyzing database telemetry...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Questions Section */}
        <div className="px-4 py-2.5 border-t border-border-light/60 bg-bg-light/30">
          <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block mb-2">Suggested Inquiries</span>
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-[10px] bg-card-bg border border-border-light text-navy-dark hover:border-primary hover:bg-primary/5 font-semibold py-1.5 px-2.5 rounded-lg transition text-left cursor-pointer disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Box */}
        <div className="p-4 border-t border-border-light bg-card-bg flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about revenue recovery..."
            disabled={loading}
            className="flex-1 bg-bg-light border border-border-light px-3.5 py-2.5 rounded-lg text-xs outline-none text-navy-dark focus:border-primary focus:bg-white transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputValue.trim()}
            className="p-2.5 bg-primary hover:bg-primary/95 text-white rounded-lg transition cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
