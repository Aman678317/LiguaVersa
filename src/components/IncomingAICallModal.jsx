import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../config';

const IncomingAICallModal = ({ callData, onAccept, onDecline, currentUserId }) => {
  const navigate = useNavigate();

  if (!callData) return null;

  const handleAccept = () => {
    // Notify caller that we accepted
    const socket = io(BACKEND_URL, { 
      transports: ['websocket'],
      query: { userId: currentUserId }
    });
    socket.emit('accept-ai-call', { targetUserId: callData.callerId, roomId: callData.roomId });
    
    onAccept();
    navigate(`/aicall/${callData.roomId}`);
  };

  const handleDecline = () => {
    const socket = io(BACKEND_URL, { 
      transports: ['websocket'],
      query: { userId: currentUserId }
    });
    socket.emit('reject-ai-call', { targetUserId: callData.callerId });
    onDecline();
  };

  return (
    <AnimatePresence>
      {callData && (
        <motion.div 
          className="incoming-call-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <motion.div 
            className="incoming-call-card glass-card"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            style={{
              padding: '40px',
              borderRadius: '24px',
              textAlign: 'center',
              maxWidth: '400px',
              width: '100%'
            }}
          >
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: '#ff007f',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              boxShadow: '0 0 30px rgba(255, 0, 127, 0.4)'
            }}>
              <Bot size={40} color="white" />
            </div>
            <h2 style={{ marginBottom: '8px', fontSize: '1.5rem' }}>Incoming AI Call</h2>
            <p style={{ color: '#aaa', marginBottom: '24px' }}>
              <strong>{callData.callerName || callData.callerId}</strong> is calling you for an AI translated session.<br/>
            </p>

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <button 
                onClick={handleDecline}
                style={{
                  width: '60px', height: '60px', borderRadius: '50%', background: '#FF4444',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(255, 68, 68, 0.3)'
                }}
              >
                <PhoneOff color="white" size={28} />
              </button>
              
              <button 
                onClick={handleAccept}
                style={{
                  width: '60px', height: '60px', borderRadius: '50%', background: '#00FFA3',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(0, 255, 163, 0.3)'
                }}
              >
                <Phone color="#121212" size={28} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IncomingAICallModal;
