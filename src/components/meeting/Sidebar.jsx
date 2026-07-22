import React, { useState, useRef, useEffect } from 'react';
import { X, Send, UserMinus, ToggleLeft, ToggleRight, Mic, Globe, Bot, MessageSquare, Users, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceRecorder } from '../chat/VoiceRecorder';
import { SmartReplies } from '../chat/SmartReplies';
import AIChatBot from '../AIChatBot';

const Sidebar = ({ 
  isOpen, 
  activeTab, 
  onClose, 
  participants, 
  chatMessages = [], 
  sendMessage, 
  typingUsers = [], 
  onTyping, 
  sendVoiceMessage, 
  requestSmartReplies,
  meetingCode,
  token,
  setActiveTab
}) => {
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);
  
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [showOriginal, setShowOriginal] = useState(true);
  const [smartReplies, setSmartReplies] = useState([]);

  const handleSend = () => {
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput('');
      onTyping(false);
      setSmartReplies([]);
    }
  };

  const handleInputChange = (e) => {
    setChatInput(e.target.value);
    if (e.target.value.length > 0) {
      onTyping(true);
    } else {
      onTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Automatically request smart replies if the last message was received from someone else
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg && lastMsg.sender !== 'You' && requestSmartReplies) {
      requestSmartReplies().then(replies => setSmartReplies(replies)).catch(() => setSmartReplies([]));
    }
  }, [chatMessages, requestSmartReplies]);

  const getTitle = () => {
    if (activeTab === 'chat') return 'In-call Messages';
    if (activeTab === 'ai-bot' || activeTab === 'captions') return 'AI Assistant';
    if (activeTab === 'participants') return 'Participants';
    if (activeTab === 'settings') return 'Settings';
    return 'In-call Messages';
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
          <div className="sidebar-header" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3>{getTitle()}</h3>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            {/* Sub-navigation Tabs */}
            {setActiveTab && (
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setActiveTab('chat')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'chat' ? 'rgba(0,255,163,0.15)' : 'transparent',
                    color: activeTab === 'chat' ? '#00FFA3' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MessageSquare size={14} />
                  <span>Chat</span>
                </button>

                <button
                  onClick={() => setActiveTab('ai-bot')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',

                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: (activeTab === 'ai-bot' || activeTab === 'captions') ? 'rgba(0,255,163,0.15)' : 'transparent',
                    color: (activeTab === 'ai-bot' || activeTab === 'captions') ? '#00FFA3' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Bot size={14} />
                  <span>AI Bot</span>
                </button>

                <button
                  onClick={() => setActiveTab('participants')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'participants' ? 'rgba(0,255,163,0.15)' : 'transparent',
                    color: activeTab === 'participants' ? '#00FFA3' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Users size={14} />
                  <span>Users</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'settings' ? 'rgba(0,255,163,0.15)' : 'transparent',
                    color: activeTab === 'settings' ? '#00FFA3' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <SettingsIcon size={14} />
                  <span>Config</span>
                </button>
              </div>
            )}
          </div>

          <div className="sidebar-content">
            {activeTab === 'chat' && (
              <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="messages-area" style={{ flex: 1, overflowY: 'auto' }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#888', fontSize: '0.9rem' }}>
                      No messages yet.<br/>Say hello!
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className={`chat-message ${msg.sender === 'You' || msg.isSelf ? 'sent' : 'received'}`}>
                        <div className="msg-header">
                          <span className="msg-sender">{msg.sender}</span>
                          <span className="msg-time">{msg.timestamp}</span>
                        </div>
                        <div className="msg-content">
                          {(msg.sender === 'You' || msg.isSelf) ? (
                            msg.message
                          ) : (
                            <>
                              <span style={{ fontWeight: '500', color: '#FFF' }}>
                                {msg.message}
                                {msg.isVoice && <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#00FFA3' }}>🎤 Voice</span>}
                              </span>
                              {showOriginal && msg.originalMessage && msg.originalMessage !== msg.message && (
                                <div style={{ fontSize: '0.8rem', color: '#A0A0A0', marginTop: '4px', fontStyle: 'italic' }}>
                                  {msg.originalMessage}
                                </div>
                              )}
                              {msg.targetLang && (
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>
                                  Translated to {msg.targetLang}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {typingUsers.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#aaa', fontStyle: 'italic', padding: '4px 8px' }}>
                      {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <div style={{ padding: '0 15px' }}>
                  <SmartReplies 
                    replies={smartReplies} 
                    onSelect={(reply) => {
                      setChatInput(reply);
                      handleSend();
                    }} 
                  />
                </div>

                <div className="chat-input-area" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <VoiceRecorder onSendVoice={sendVoiceMessage} />
                  <input 
                    type="text" 
                    placeholder="Send a message..." 
                    className="glass-input" 
                    value={chatInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    style={{ flex: 1 }}
                  />
                  <button className="send-btn" onClick={handleSend}><Send size={18} /></button>
                </div>
              </div>
            )}

            {(activeTab === 'ai-bot' || activeTab === 'captions') && (
              <div style={{ height: '100%', overflow: 'hidden' }}>
                <AIChatBot meetingCode={meetingCode} token={token} />
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
                      <Globe size={18} className="text-primary" />
                      <div>
                        <h4>Auto-Translate Chat</h4>
                        <p>Translate incoming messages to my language.</p>
                      </div>
                    </div>
                    <button className="toggle-btn" onClick={() => setAutoTranslate(!autoTranslate)}>
                      {autoTranslate ? <ToggleRight size={28} color="#00FFA3" /> : <ToggleLeft size={28} color="#888" />}
                    </button>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <Globe size={18} className="text-primary" />
                      <div>
                        <h4>Show Original Message</h4>
                        <p>Display the original text alongside the translation.</p>
                      </div>
                    </div>
                    <button className="toggle-btn" onClick={() => setShowOriginal(!showOriginal)}>
                      {showOriginal ? <ToggleRight size={28} color="#00FFA3" /> : <ToggleLeft size={28} color="#888" />}
                    </button>
                  </div>

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
