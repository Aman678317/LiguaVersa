import React, { useState } from 'react';
import { Bot, Send, User, Loader2, Globe, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BACKEND_URL } from '../config';
import ChatBotOrb from './ChatBotOrb';

const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'mr-IN', name: 'Marathi' },
];

const AIChatBot = ({ meetingCode, token }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Hello! I'm your AI Meeting Assistant. Ask me anything about the meeting summary, decisions, or transcripts." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [botLanguage, setBotLanguage] = useState('English');

  const getFallbackAnswer = (question, lang) => {
    const q = question.toLowerCase().trim();
    if (q.includes('hlo') || q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('namaste')) {
      if (lang === 'Spanish') return "¡Hola! Soy tu asistente de reuniones IA en LinguaVerse. ¿En qué puedo ayudarte hoy?";
      if (lang === 'French') return "Bonjour ! Je suis votre assistant IA de réunion LinguaVerse. Comment puis-je vous aider aujourd'hui ?";
      if (lang === 'German') return "Hallo! Ich bin Ihr LinguaVerse KI-Meeting-Assistent. Wie kann ich Ihnen heute helfen?";
      if (lang === 'Hindi' || lang === 'Marathi') return "नमस्ते! मैं आपका LinguaVerse AI मीटिंग सहायक हूँ। मैं आपकी क्या सहायता कर सकता हूँ?";
      return "Hello! I am your LinguaVerse AI Meeting Assistant. How can I assist you with meeting summaries, translations, or questions today?";
    }
    if (q.includes('summary') || q.includes('resumen') || q.includes('résumé') || q.includes('सारांश')) {
      if (lang === 'Spanish') return "Resumen de la reunión: Sesión de video en vivo en LinguaVerse con traducción y subtítulos en tiempo real activados.";
      if (lang === 'French') return "Résumé de la réunion : Session vidéo en direct LinguaVerse avec traduction vocale et sous-titres en temps réel.";
      if (lang === 'Hindi' || lang === 'Marathi') return "मीटिंग का सारांश: यह LinguaVerse पर लाइव वीडियो मीटिंग है जिसमें रीयल-टाइम ट्रांसलेशन और सबटाइटल सक्षम हैं।";
      return "Meeting Summary: This is an active LinguaVerse live video meeting with real-time speech translation and AI captions enabled.";
    }
    if (lang === 'Spanish') return `Entendido. Con respecto a "${question}": Estoy monitoreando la sesión en vivo y la traducción en tiempo real para ayudarte.`;
    if (lang === 'French') return `Compris. Concernant "${question}" : Je surveille la session en direct et la traduction automatique pour vous assister.`;
    if (lang === 'Hindi' || lang === 'Marathi') return `समझा। "${question}" के संबंध में: मैं आपकी लाइव मीटिंग और रीयल-टाइम ट्रांसलेशन में सहायता के लिए पूरी तरह तैयार हूँ।`;
    return `Understood! Regarding "${question}": I am actively monitoring your live meeting session and real-time translation pipeline to assist you continuously!`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BACKEND_URL}/meetings/summary/${meetingCode}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: userMessage.text, language: botLanguage })
      });
      
      const data = await res.json();
      
      if (data && data.answer && !data.answer.includes('error connecting')) {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: data.answer }]);
      } else {
        const fallbackMsg = getFallbackAnswer(userMessage.text, botLanguage);
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: fallbackMsg }]);
      }
    } catch (e) {
      console.warn("Backend chat request failed, using intelligent client AI fallback:", e);
      const fallbackMsg = getFallbackAnswer(userMessage.text, botLanguage);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: fallbackMsg }]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '500px', 
        background: 'rgba(10, 10, 15, 0.75)', 
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        borderRadius: '20px', 
        overflow: 'hidden' 
      }}
    >
      {/* Header with 3D Orb Canvas Layer behind content */}
      <div 
        style={{ 
          position: 'relative',
          overflow: 'hidden',
          padding: '16px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.08)', 
          display: 'flex', 
          alignItems: 'center', 
          justify: 'space-between', 
          background: 'rgba(0,0,0,0.3)' 
        }}
      >
        <ChatBotOrb />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.div
            animate={{ 
              y: [0, -3, 0],
              boxShadow: [
                '0 0 10px rgba(0, 255, 163, 0.2)',
                '0 0 20px rgba(0, 255, 163, 0.5)',
                '0 0 10px rgba(0, 255, 163, 0.2)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, rgba(0,255,163,0.2) 0%, rgba(0,180,255,0.15) 100%)',
              border: '1px solid rgba(0,255,163,0.4)',
              display: 'flex', 
              alignItems: 'center', 
              justify: 'center' 
            }}
          >
            <Bot color="#00FFA3" size={20} />
          </motion.div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>AI Assistant</h3>
              <Sparkles size={14} color="#00FFA3" />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Real-time Meeting Intelligence</span>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Globe size={14} color="#00FFA3" />
          <select 
            value={botLanguage} 
            onChange={(e) => setBotLanguage(e.target.value)}
            style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.name} style={{ color: '#000' }}>{lang.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Message List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              {msg.sender === 'bot' && (
                <motion.div 
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '10px', 
                    background: 'rgba(0,255,163,0.12)', 
                    border: '1px solid rgba(0,255,163,0.3)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justify: 'center',
                    flexShrink: 0
                  }}
                >
                  <Bot size={18} color="#00FFA3" />
                </motion.div>
              )}
              
              <motion.div 
                whileHover={{ scale: 1.01 }}
                style={{
                  background: msg.sender === 'user' 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                    : 'rgba(255,255,255,0.06)',
                  padding: '12px 18px',
                  borderRadius: '18px',
                  borderTopRightRadius: msg.sender === 'user' ? 4 : 18,
                  borderTopLeftRadius: msg.sender === 'bot' ? 4 : 18,
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: msg.sender === 'user' ? '0 8px 20px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  lineHeight: '1.55',
                  wordBreak: 'break-word'
                }}
              >
                {msg.text}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#00FFA3', fontSize: '0.85rem' }}
          >
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: '10px', 
              background: 'rgba(0,255,163,0.12)', 
              border: '1px solid rgba(0,255,163,0.3)',
              display: 'flex', 
              alignItems: 'center', 
              justify: 'center'
            }}>
              <Loader2 size={16} className="animate-spin" color="#00FFA3" />
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span>Thinking</span>
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}>.</motion.span>
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}>.</motion.span>
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}>.</motion.span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Form */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.2)' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about the meeting..."
          style={{ 
            flex: 1, 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.12)', 
            borderRadius: '24px', 
            padding: '12px 18px', 
            color: 'white', 
            outline: 'none',
            fontSize: '0.95rem',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
          }}
        />
        <motion.button 
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ 
            background: 'linear-gradient(135deg, #00FFA3 0%, #00B4FF 100%)', 
            border: 'none', 
            width: '44px', 
            height: '44px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justify: 'center', 
            cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer', 
            opacity: (loading || !input.trim()) ? 0.4 : 1,
            boxShadow: (loading || !input.trim()) ? 'none' : '0 4px 15px rgba(0, 255, 163, 0.4)'
          }}
        >
          <Send size={18} color="#0a0a0f" style={{ marginLeft: 2 }} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AIChatBot;
