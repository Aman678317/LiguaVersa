import React, { useRef, useEffect } from 'react';
import { MicOff, User, Pin, MonitorUp } from 'lucide-react';
import { motion } from 'framer-motion';

const VideoTile = ({ participant, translationEnabled, isPinned, onTogglePin }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && participant?.stream) {
      videoRef.current.srcObject = participant.stream;
      videoRef.current.play().catch(err => {
        console.log("Autoplay play() notification:", err.message);
      });
    }
  }, [participant?.stream]);

  const isPresenting = participant?.isScreenSharing || participant?.isLocalScreenSharing;

  return (
    <motion.div 
      className={`video-tile ${participant.speaking ? 'speaking' : ''} ${isPinned ? 'pinned' : ''}`}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#0B0E14',
        borderRadius: '16px',
        overflow: 'hidden',
        border: isPinned ? '2px solid #00FFA3' : '1px solid rgba(255,255,255,0.08)'
      }}
    >
      {/* Top Right Pin Button */}
      <button 
        onClick={() => onTogglePin && onTogglePin(participant.id)}
        title={isPinned ? "Unpin tile" : "Pin tile"}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 20,
          background: isPinned ? '#00FFA3' : 'rgba(0, 0, 0, 0.5)',
          color: isPinned ? '#000' : '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <Pin size={16} style={{ transform: isPinned ? 'rotate(45deg)' : 'none' }} />
      </button>

      {/* Presenting Badge */}
      {isPresenting && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 20,
          background: 'rgba(0, 255, 163, 0.2)',
          border: '1px solid #00FFA3',
          color: '#00FFA3',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.78rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <MonitorUp size={14} />
          <span>{participant.isLocal ? 'You are presenting' : `${participant.name} is presenting`}</span>
        </div>
      )}

      {participant.videoOff && !isPresenting ? (
        <div className="video-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div className="avatar-circle">
            <User size={40} />
          </div>
        </div>
      ) : (
        <video 
          ref={videoRef}
          className="video-stream"
          autoPlay 
          playsInline 
          muted={participant.isLocal}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: isPresenting ? 'contain' : 'cover',
            transform: (participant.isLocal && !isPresenting) ? 'scaleX(-1)' : 'none'
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.play().catch(e => console.log('Autoplay on metadata:', e));
            }
          }}
        />
      )}

      <div className="tile-overlay" style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '12px', color: '#fff', fontSize: '0.85rem' }}>
        <span className="participant-name">
          {participant.name}
          {participant.isLocal && " (You)"}
        </span>
        {participant.muted && (
          <div className="mute-indicator">
            <MicOff size={14} color="#ff4b4b" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VideoTile;
