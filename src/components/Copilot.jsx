import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';

export default function Copilot({ isOpen, setIsOpen }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Connect your transaction data to start analyzing revenue recovery."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);

  const suggestedQuestions = [
    "Why is my revenue at risk?",
    "Show today's recoveries",
    "Which cases need attention?",
    "What caused today's payment issues?",
    "What can I recover this week?"
  ];

  const getMockAnswer = (question) => {
    return "I need transaction data to answer that accurately. Connect your payment data first.";
  };

  const handleSend = (text) => {
    if (!text.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInputValue('');

    // Simulate AI typing delay
    setTimeout(() => {
      const responseText = getMockAnswer(text);
      setMessages((prev) => [...prev, { sender: 'bot', text: responseText }]);
    }, 600);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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
        fixed inset-y-0 right-0 w-full sm:w-[400px] bg-card-bg border-l border-border-light shadow-2xl z-50 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Panel Header */}
        <div className="p-4 border-b border-border-light flex items-center justify-between bg-bg-light">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-navy-dark leading-none">RazorRecover Copilot</h2>
              <span className="text-[10px] text-secondary-text font-semibold">Your AI revenue recovery assistant</span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-border-light rounded text-secondary-text hover:text-navy-dark cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat History Panel */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex gap-2.5 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${m.sender === 'bot' ? 'bg-primary/10 text-primary' : 'bg-sky-blue text-navy-dark font-bold'}`}>
                {m.sender === 'bot' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className={`p-3 rounded-lg text-xs leading-relaxed ${m.sender === 'bot' ? 'bg-bg-light text-navy-dark border border-border-light' : 'bg-primary text-white font-medium'}`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Questions Section */}
        <div className="px-4 py-2 border-t border-border-light/60 bg-bg-light/30">
          <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block mb-2">Suggested Questions</span>
          <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-[10px] bg-card-bg border border-border-light text-navy-dark hover:border-primary/50 hover:bg-primary/5 font-semibold py-1.5 px-2.5 rounded-lg transition text-left cursor-pointer"
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
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
            placeholder="Ask RazorRecover..."
            className="flex-1 bg-bg-light border border-border-light px-3 py-2 rounded-lg text-xs outline-none text-navy-dark focus:border-primary/50 focus:bg-white"
          />
          <button
            onClick={() => handleSend(inputValue)}
            className="p-2.5 bg-primary hover:bg-primary/95 text-white rounded-lg transition cursor-pointer flex items-center justify-center"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
