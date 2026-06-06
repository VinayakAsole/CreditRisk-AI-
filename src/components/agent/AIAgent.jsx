import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KB = {
  'pd score': 'Based on the alternate data signals, the applicant\'s **Probability of Default is 0.34** — placing them in the **Moderate Risk** band. Key drivers: strong telecom regularity (+0.18) offset by high loan-to-income ratio (-0.13). Recommendation: **Conditional Approval** with a 2.5% risk premium.',
  'defaulter': 'Found **5 active defaulters** matching Very High Risk criteria. Top priority: **Rajesh Patil** (PD: 0.91, DPD: 150 days, ₹8.9L outstanding) in Pune — Written Off status. Recommend immediate legal escalation and asset recovery proceedings.',
  'portfolio': 'Portfolio health is **stable but trending upward on default risk**. Default rate increased 0.4% to 3.2% this month. The Psychometric data source has a warning — this may affect scoring accuracy for ~12% of applications. PSI is at 0.09, approaching the 0.10 threshold.',
  'mumbai': '**Mumbai defaulter cluster** (234 accounts, ₹42Cr outstanding) shows strong social contagion — 68% of defaulters have shared co-applicants or guarantors. Network graph analysis reveals a central hub node linked to 12 NPA accounts. Recommend coordinated recovery action.',
  'model': 'Model performance is **tracking within acceptable bounds**: AUROC 0.78 (target ≥ 0.75), KS: 0.37, PSI: 0.09. Minor drift detected in E-Commerce feature distribution — monitoring monthly. Next champion-challenger cycle scheduled for June 15th.',
  'npa': 'Current NPA ratio stands at **1.8%** (improved from 2.1% last quarter). 3 accounts are in the process of write-off. Recovery rate is at **68.4%** — up 5.1% MoM due to improved field collection strategy.',
  'alternate data': 'Alternate data sources powering the model:\n• 📡 Telecom: 2.4M records — HEALTHY\n• ⚡ Utility: 1.8M records — HEALTHY\n• 🛒 E-Commerce: 3.1M records — HEALTHY\n• 🧠 Psychometric: 0.4M records — ⚠ WARNING\n• 📊 GST/Tax: 0.9M records — HEALTHY\n• 🕸️ Social Graph: 5.2M records — HEALTHY',
};

const getResponse = (msg) => {
  const lower = msg.toLowerCase();
  for (const [key, val] of Object.entries(KB)) {
    if (lower.includes(key)) return val;
  }
  if (lower.includes('hi') || lower.includes('hello')) return 'Hello! I\'m your **CreditRisk AI Agent** 🤖. I can help you with PD scores, defaulter profiles, portfolio analysis, model health, and alternate data signals. What would you like to know?';
  if (lower.includes('help')) return 'You can ask me about:\n• "What is the PD score for the portfolio?"\n• "Show me the top defaulters"\n• "How is the model performing?"\n• "Any alerts in Mumbai?"\n• "Status of alternate data sources"';
  return 'I\'m analyzing the credit risk data... Based on current portfolio signals, I recommend reviewing the flagged accounts in the **Very High Risk** band. Would you like a detailed breakdown?';
};

const SUGGESTIONS = [
  'Show top defaulters',
  'Portfolio health status',
  'Model performance metrics',
  'Mumbai risk cluster',
  'Alternate data sources',
];

export default function AIAgent({ onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1, role: 'agent',
      text: '👋 Hello! I\'m your **CreditRisk AI Agent**. I can analyze portfolio risk, explain PD scores, track defaulters, and provide model insights. What would you like to know?',
      time: 'just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const send = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text, time: 'just now' };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const response = getResponse(text);
      setMessages(p => [...p, { id: Date.now() + 1, role: 'agent', text: response, time: 'just now' }]);
    }, 1200 + Math.random() * 800);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: white">$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <motion.div
      className="ai-agent-panel glass-card"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
    >
      {/* Header */}
      <div className="ai-agent-header">
        <div className="agent-avatar">🤖</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>CreditRisk AI Agent</div>
          <div style={{ fontSize: '10px', color: 'var(--electric-blue)', fontFamily: 'var(--font-mono)' }}>Powered by LLM + Risk ML</div>
        </div>
        <div className="agent-status-dot" />
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', padding: '0 0 0 8px' }}
        >×</button>
      </div>

      {/* Suggestions */}
      <div className="suggestions">
        {SUGGESTIONS.map(s => (
          <button key={s} className="suggestion-chip" onClick={() => send(s)}>{s}</button>
        ))}
      </div>

      {/* Messages */}
      <div className="ai-messages" ref={scrollRef}>
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              className={`message ${msg.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="message-bubble" dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
              <div className="message-time">{msg.time}</div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div className="message agent" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="message-bubble">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px', fontFamily: 'var(--font-mono)' }}>Analyzing...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="ai-input-bar">
        <input
          className="ai-input"
          placeholder="Ask about risk, defaulters, model..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="send-btn" onClick={() => send(input)}>➤</button>
      </div>
    </motion.div>
  );
}
