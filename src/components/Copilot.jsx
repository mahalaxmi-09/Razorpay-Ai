import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RotateCcw, Loader2, Globe, Languages } from 'lucide-react';
import { api } from '../lib/api';

const COPILOT_I18N = {
  English: {
    headerTitle: 'RazorRecover Copilot',
    telemetryBadge: 'Grounded Telemetry',
    welcome: "Hello! I am your RazorRecover AI Copilot. Ask me anything about your revenue at risk, payment failures, recovery cases, or financial safety guardrails.",
    resetMsg: "Chat cleared. How can I assist you with your revenue recovery operations?",
    suggestedTitle: "Suggested Inquiries",
    placeholder: "Ask anything about revenue recovery...",
    analyzing: "Analyzing database telemetry...",
    suggestedQuestions: [
      "What is the current revenue at risk?",
      "Which recovery cases need attention?",
      "Why is my revenue at risk?",
      "How does the guardrail engine protect me?",
      "How much revenue has been recovered?"
    ]
  },
  తెలుగు: {
    headerTitle: 'RazorRecover కోపైలట్',
    telemetryBadge: 'ప్రత్యక్ష డేటా ఆధారితం',
    welcome: "నమస్కారం! నేను మీ RazorRecover AI కోపైలట్. ప్రమాదంలో ఉన్న రాబడి, విఫలమైన చెల్లింపులు, రికవరీ కేసులు లేదా ఆర్థిక భద్రతా నిబంధనల (Guardrails) గురించి ఏదైనా నన్ను అడగండి.",
    resetMsg: "చాట్ క్లియర్ చేయబడింది. మీ రాబడి రికవరీ కార్యకలాపాలలో నేను మీకు ఎలా సహాయపడగలను?",
    suggestedTitle: "సూచించిన ప్రశ్నలు",
    placeholder: "రాబడి రికవరీ గురించి ఏదైనా అడగండి...",
    analyzing: "డేటాబేస్ టెలిమెట్రీని విశ్లేషిస్తోంది...",
    suggestedQuestions: [
      "ప్రస్తుతం ప్రమాదంలో ఉన్న రాబడి ఎంత?",
      "ఏ రికవరీ కేసులపై తక్షణ దృష్టి పెట్టాలి?",
      "నా రాబడి ఎందుకు ప్రమాదంలో ఉంది?",
      "గార్డ్‌రైల్స్ ఇంజిన్ నన్ను ఎలా రక్షిస్తుంది?",
      "ఇప్పటివరకు ఎంత రాబడి రికవరీ చేయబడింది?"
    ]
  },
  हिंदी: {
    headerTitle: 'RazorRecover कोपायलट',
    telemetryBadge: 'सत्यापित डेटा आधारित',
    welcome: "नमस्ते! मैं आपका RazorRecover AI कोपायलट हूँ। जोखिम में पड़े राजस्व, विफल भुगतानों, रिकवरी मामलों या वित्तीय सुरक्षा गार्डरेल्स के बारे में कुछ भी पूछें।",
    resetMsg: "चैट साफ़ हो गई। मैं आपकी राजस्व रिकवरी में कैसे सहायता कर सकता हूँ?",
    suggestedTitle: "सुझाए गए प्रश्न",
    placeholder: "राजस्व रिकवरी के बारे में कुछ भी पूछें...",
    analyzing: "डेटाबेस टेलीमेट्री का विश्लेषण किया जा रहा है...",
    suggestedQuestions: [
      "वर्तमान में जोखिम में कितना राजस्व है?",
      "किन रिकवरी मामलों पर तुरंत ध्यान देने की आवश्यकता है?",
      "मेरा राजस्व जोखिम में क्यों है?",
      "गार्डरेल इंजन मुझे कैसे सुरक्षित रखता है?",
      "अब तक कितना राजस्व रिकवर किया गया है?"
    ]
  }
};

export default function Copilot({ isOpen, setIsOpen, lang = 'English', onLangChange }) {
  const [currentLang, setCurrentLang] = useState(lang);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: COPILOT_I18N[lang]?.welcome || COPILOT_I18N.English.welcome
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Sync with prop when global language changes
  useEffect(() => {
    if (lang && lang !== currentLang) {
      setCurrentLang(lang);
      // If only the welcome message exists, update it to the new language
      setMessages((prev) => {
        if (prev.length <= 1) {
          return [{ sender: 'bot', text: COPILOT_I18N[lang]?.welcome || COPILOT_I18N.English.welcome }];
        }
        return prev;
      });
    }
  }, [lang]);

  const t = COPILOT_I18N[currentLang] || COPILOT_I18N.English;

  const handleLanguageSwitch = (newLang) => {
    setCurrentLang(newLang);
    if (onLangChange) {
      onLangChange(newLang);
    }
    // Update initial message if chat is fresh or inform about language switch
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [{ sender: 'bot', text: COPILOT_I18N[newLang]?.welcome || COPILOT_I18N.English.welcome }];
      } else {
        const switchNotice = newLang === 'తెలుగు' 
          ? "భాష తెలుగుకి మార్చబడింది. మీ ప్రశ్నలను తెలుగులో అడగవచ్చు."
          : newLang === 'हिंदी'
          ? "भाषा हिंदी में बदल दी गई है। आप अपने प्रश्न हिंदी में पूछ सकते हैं।"
          : "Language switched to English. You can continue asking your questions in English.";
        return [...prev, { sender: 'bot', text: switchNotice }];
      }
    });
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.askCopilot(query, currentLang);
      const replyText = response.data?.reply || response.reply || response.data || (
        currentLang === 'తెలుగు' 
          ? "ఆ అభ్యర్థన కోసం రికవరీ డేటాను పొందలేకపోయాను."
          : currentLang === 'हिंदी'
          ? "उस अनुरोध के लिए रिकवरी डेटा प्राप्त नहीं किया जा सका।"
          : "I couldn't retrieve recovery data for that request."
      );
      setMessages((prev) => [...prev, { sender: 'bot', text: replyText }]);
    } catch (err) {
      const errorMsg = currentLang === 'తెలుగు'
        ? `⚠️ కోపైలట్ ఇంజిన్‌కు కనెక్ట్ కాలేకపోయాము: ${err.message}`
        : currentLang === 'हिंदी'
        ? `⚠️ कोपायलट इंजन से कनेक्ट करने में असमर्थ: ${err.message}`
        : `⚠️ Unable to connect to Copilot engine: ${err.message}. Please verify the backend is running.`;
      setMessages((prev) => [
        ...prev, 
        { sender: 'bot', text: errorMsg }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: t.resetMsg
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
        fixed inset-y-0 right-0 w-full sm:w-[440px] bg-card-bg border-l border-border-light shadow-2xl z-50 flex flex-col justify-between
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
              <h2 className="text-sm font-extrabold text-navy-dark leading-none">{t.headerTitle}</h2>
              <span className="text-[10px] text-secondary-text font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse"></span>
                {t.telemetryBadge} • {currentLang}
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

        {/* Multilingual Language Switcher Bar */}
        <div className="px-4 py-2 bg-card-bg border-b border-border-light/80 flex items-center justify-between">
          <span className="text-[11px] font-bold text-secondary-text flex items-center gap-1">
            <Languages size={13} className="text-primary" />
            Language:
          </span>
          <div className="flex items-center gap-1 bg-bg-light p-0.5 rounded-lg border border-border-light">
            {[
              { id: 'English', label: 'English' },
              { id: 'తెలుగు', label: 'తెలుగు' },
              { id: 'हिंदी', label: 'हिंदी' }
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => handleLanguageSwitch(l.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  currentLang === l.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-secondary-text hover:text-navy-dark hover:bg-card-bg'
                }`}
              >
                {l.label}
              </button>
            ))}
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
                <span className="font-semibold">{t.analyzing}</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Questions Section */}
        <div className="px-4 py-2.5 border-t border-border-light/60 bg-bg-light/30">
          <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block mb-2">{t.suggestedTitle}</span>
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
            {t.suggestedQuestions.map((q, idx) => (
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
            placeholder={t.placeholder}
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
