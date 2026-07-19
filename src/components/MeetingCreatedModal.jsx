import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Copy, Mail, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BACKEND_URL } from '../config';

const MeetingCreatedModal = ({ isOpen, meetingCode, onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');

  if (!isOpen) return null;

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteStatus('Sending...');
    try {
      const res = await fetch(`${BACKEND_URL}/meetings/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingCode, email })
      });
      const data = await res.json();
      if (res.ok) {
        setInviteStatus('Invitation sent!');
        setEmail('');
      } else {
        setInviteStatus(data.message || 'Failed to send invite.');
      }
    } catch (err) {
      setInviteStatus('Network error.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999
          }}
        >
          <motion.div 
            className="modal-content glass-card"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            style={{ padding: '30px', borderRadius: '16px', maxWidth: '450px', width: '100%', position: 'relative' }}
          >
            <button 
              onClick={onClose} 
              style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            <h2 style={{ marginBottom: '10px' }}>Your meeting's ready</h2>
            <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '0.9rem' }}>
              Share this meeting code with others you want in the meeting.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              {/* URL Link */}
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Meeting Link</span>
                  <span style={{ fontSize: '0.9rem', color: '#6E56FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    https://linguaverse.ai/meet/{meetingCode}
                  </span>
                </div>
                <button onClick={() => handleCopy(`https://linguaverse.ai/meet/${meetingCode}`, 'Meeting Link')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                  <Copy size={18} />
                </button>
              </div>

              {/* Meeting ID */}
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Meeting ID</span>
                  <span style={{ fontSize: '1.1rem', letterSpacing: '2px', fontWeight: 'bold' }}>
                    {meetingCode.replace(/(.{4})/g, '$1 ').trim()}
                  </span>
                </div>
                <button onClick={() => handleCopy(meetingCode, 'Meeting ID')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                  <Copy size={18} />
                </button>
              </div>

              {/* Password */}
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</span>
                  <span style={{ fontSize: '1.1rem', letterSpacing: '2px', fontWeight: 'bold' }}>
                    ******
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleInvite} style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ddd' }}>Invite via Email</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Mail size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: '#888' }} />
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setInviteStatus(''); }}
                    style={{ 
                      width: '100%', padding: '12px 12px 12px 40px', 
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '8px', color: '#fff', outline: 'none'
                    }}
                  />
                </div>
                <button type="submit" style={{ 
                  background: '#6E56FF', color: '#fff', border: 'none', borderRadius: '8px', 
                  padding: '0 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <Send size={16} /> Send
                </button>
              </div>
              {inviteStatus && <div style={{ marginTop: '8px', fontSize: '0.8rem', color: inviteStatus.includes('sent') ? '#00FFA3' : '#FF4444' }}>{inviteStatus}</div>}
            </form>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ddd' }}>Share via Apps</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a 
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join my LinguaVerse meeting! Link: https://linguaverse.ai/meet/${meetingCode} Code: ${meetingCode}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: '10px', background: '#25D366', color: '#fff', 
                    borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem'
                  }}
                >
                  WhatsApp
                </a>
                <a 
                  href={`https://t.me/share/url?url=${encodeURIComponent(`https://linguaverse.ai/meet/${meetingCode}`)}&text=${encodeURIComponent(`Join my LinguaVerse meeting! Code: ${meetingCode}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: '10px', background: '#0088cc', color: '#fff', 
                    borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem'
                  }}
                >
                  Telegram
                </a>
              </div>
            </div>

            <button 
              onClick={() => navigate(`/meet/${meetingCode}`)}
              style={{
                width: '100%', padding: '15px', background: '#fff', color: '#121212',
                border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer'
              }}
            >
              Join Meeting Now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MeetingCreatedModal;
