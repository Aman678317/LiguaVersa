import React, { useState, useRef, useEffect } from 'react';
import { X, Send, UserMinus, ToggleLeft, ToggleRight, Mic, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, activeTab, onClose, participants, chatMessages = [], sendMessage }) => {
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);
  
  // Settings State Placeholders
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);

  const handleSend = () => {
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getTitle = () => {
    if (activeTab === 'chat') return 'In-call Messages';
    if (activeTab === 'participants') return 'Participants';
    if (activeTab === 'settings') return 'Settings';
    return '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="meeting-sidebar glass"
          initial={{ x: 350, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 350, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="sidebar-header">
            <h3>{getTitle()}</h3>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="sidebar-content">
            {activeTab === 'chat' && (
              <div className="chat-container">
                <div className="messages-area">
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#888', fontSize: '0.9rem' }}>
                      No messages yet.<br/>Say hello!
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className={`chat-message ${msg.sender === 'You' ? 'sent' : 'received'}`}>
                        <div className="msg-header">
                          <span className="msg-sender">{msg.sender}</span>
                          <span className="msg-time">{msg.timestamp}</span>
                        </div>
                        <div className="msg-content">
                          {msg.sender === 'You' ? (
                            msg.message
                          ) : (
                            <>
                              <span style={{ fontWeight: '500', color: '#FFF' }}>{msg.message}</span>
                              {msg.originalMessage && (
                                <div style={{ fontSize: '0.8rem', color: '#A0A0A0', marginTop: '4px' }}>
                                  Original: {msg.originalMessage}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-area">
                  <input 
                    type="text" 
                    placeholder="Send a message..." 
                    className="glass-input" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button className="send-btn" onClick={handleSend}><Send size={18} /></button>
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="participants-container">
                <div className="participants-list">
                  {participants.map(p => (
                    <div key={p.id} className="participant-row">
                      <div className="p-info">
                        <div className="p-avatar">{p.name.charAt(0)}</div>
                        <span>{p.name} {p.isLocal && '(You)'}</span>
                      </div>
                      {!p.isLocal && (
                        <div className="p-actions">
                           <UserMinus size={16} className="text-muted cursor-pointer" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button className="btn-secondary mute-all-btn">Mute All</button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-container">
                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <Mic size={18} className="text-primary" />
                      <div>
                        <h4>AI Noise Cancellation</h4>
                        <p>Filter out background noise automatically.</p>
                      </div>
                    </div>
                    <button className="toggle-btn" onClick={() => setNoiseCancellation(!noiseCancellation)}>
                      {noiseCancellation ? <ToggleRight size={28} color="#00FFA3" /> : <ToggleLeft size={28} color="#888" />}
                    </button>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <Globe size={18} className="text-primary" />
                      <div>
                        <h4>Auto-Translate Captions</h4>
                        <p>Instantly translate incoming audio.</p>
                      </div>
                    </div>
                    <button className="toggle-btn" onClick={() => setAutoTranslate(!autoTranslate)}>
                      {autoTranslate ? <ToggleRight size={28} color="#00FFA3" /> : <ToggleLeft size={28} color="#888" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
