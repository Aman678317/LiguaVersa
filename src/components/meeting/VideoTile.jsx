import React, { useRef, useEffect } from 'react';
import { MicOff, User } from 'lucide-react';
import { motion } from 'framer-motion';

const VideoTile = ({ participant, translationEnabled }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && participant?.stream) {
      videoRef.current.srcObject = participant.stream;
      videoRef.current.play().catch(err => {
        console.log("Autoplay play() notification:", err.message);
      });
    }
  }, [participant?.stream]);

  return (
    <motion.div 
      className={`video-tile ${participant.speaking ? 'speaking' : ''}`}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{ position: 'relative', width: '100%', height: '100%', background: '#0B0E14', borderRadius: '16px', overflow: 'hidden' }}
    >
      {participant.videoOff ? (
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
            objectFit: 'cover',
            transform: participant.isLocal ? 'scaleX(-1)' : 'none'
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
