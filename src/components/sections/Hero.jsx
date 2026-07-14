import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CalendarDays, Mic2, MicOff, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [partial, setPartial] = useState('');

  // Simulate WebSocket pipeline receiving subtitles
  useEffect(() => {
    if (isRecording) {
      setPartial('Listening...');
      const timers = [
        setTimeout(() => setPartial('Welcome to the future of'), 2000),
        setTimeout(() => { setSubtitle('Welcome to the future of global communication.'); setPartial(''); }, 3500),
        setTimeout(() => setPartial('グローバルコミュニケーションの未来へようこそ。'), 4000),
        setTimeout(() => { setSubtitle('グローバルコミュニケーションの未来へようこそ。'); setPartial(''); }, 5000),
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      setSubtitle('');
      setPartial('');
    }
  }, [isRecording]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <section className="hero-section">
      <div className="container hero-container">
        
        {/* Main Hero Content */}
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <motion.div 
            className="hero-badge glass"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Sparkles size={16} className="badge-icon" />
            <span>Unreal Engine 5 of Communication</span>
          </motion.div>

          <h1 className="hero-title">
            The Future of <br />
            <span className="gradient-text">Global Connection</span>
          </h1>
          
          <p className="hero-subtitle">
            Experience real-time AI translation in a hyper-realistic 3D spatial environment. Break language barriers with zero latency.
          </p>

          <div className="hero-actions">
            <motion.button 
              className={`btn-primary flex-center ${isRecording ? 'recording-active' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/auth')}
            >
              <Mic2 size={20} style={{ marginRight: '8px' }} />
              Start Meeting
            </motion.button>
            <motion.button 
              className="btn-secondary flex-center glass"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CalendarDays size={20} style={{ marginRight: '8px' }} />
              Schedule Meeting
            </motion.button>
          </div>

          {/* Live Subtitles Area */}
          <AnimatePresence>
            {(subtitle || partial) && (
              <motion.div 
                className="live-subtitles-container glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="subtitle-header">
                  <Volume2 size={16} className="subtitle-icon" />
                  <span>Live AI Translation</span>
                </div>
                {partial && <p className="subtitle-text partial">{partial}</p>}
                {subtitle && <p className="subtitle-text final">{subtitle}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Floating Cards / Glass Elements */}
        <div className="hero-floating-elements">
          <motion.div 
            className="floating-card translation-card glass-card"
            animate={{ 
              y: [0, -20, 0],
              rotateZ: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            <div className="card-header">
              <span className="lang-tag">ENG</span>
              <span className="arrow">→</span>
              <span className="lang-tag gradient-text">JPN</span>
            </div>
            <p className="card-text">"Welcome to the future..."</p>
            <p className="card-translated">「未来へようこそ...」</p>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
