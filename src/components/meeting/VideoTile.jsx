import React, { useRef, useEffect } from 'react';
import { MicOff, User } from 'lucide-react';
import { motion } from 'framer-motion';

const VideoTile = ({ participant, translationEnabled }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);
  return (
    <motion.div 
      className={`video-tile ${participant.speaking ? 'speaking' : ''}`}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      {participant.videoOff ? (
        <div className="video-placeholder">
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
          muted={participant.isLocal || translationEnabled}
          onLoadedMetadata={() => videoRef.current?.play().catch(e => console.log('Autoplay prevented:', e))}
        />
      )}

      <div className="tile-overlay">
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
