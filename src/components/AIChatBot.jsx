import React, { useState } from 'react';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BACKEND_URL } from '../config';

const AIChatBot = ({ meetingCode, token }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Hello! I'm your AI Meeting Assistant. Ask me anything about the meeting summary, decisions, or transcripts." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/meetings/summary/${meetingCode}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: userMessage.text })
      });
      const data = await res.json();
      
      if (data.answer) {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: data.answer }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "I couldn't process that request." }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "Sorry, I encountered an error connecting to the server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '500px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Bot color="#00FFA3" size={24} />
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>AI Assistant</h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}
            >
              {msg.sender === 'bot' && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,255,163,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={16} color="#00FFA3" /></div>}
              <div style={{
                background: msg.sender === 'user' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                padding: '12px 16px',
                borderRadius: '16px',
                borderTopRightRadius: msg.sender === 'user' ? 4 : 16,
                borderTopLeftRadius: msg.sender === 'bot' ? 4 : 16,
                color: '#fff',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <Loader2 size={16} className="animate-spin" /> <span>Thinking...</span>
          </div>
        )}
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about the meeting..."
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '10px 16px', color: 'white', outline: 'none' }}
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ background: '#3b82f6', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (loading || !input.trim()) ? 0.5 : 1 }}
        >
          <Send size={18} color="white" />
        </button>
      </div>
    </div>
  );
};

export default AIChatBot;
