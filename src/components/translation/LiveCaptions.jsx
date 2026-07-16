import React, { useEffect, useRef } from 'react';
import './LiveCaptions.css';

export const LiveCaptions = ({ captions, isEnabled }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [captions]);

  if (!isEnabled || captions.length === 0) return null;

  return (
    <div className="live-captions-container" ref={containerRef}>
      {captions.map((cap, i) => (
        <div key={i} className="caption-bubble">
          <div className="caption-sender">{cap.senderId}</div>
          <div className="caption-original">{cap.originalText}</div>
          {cap.translatedText && cap.translatedText !== cap.originalText && (
            <div className="caption-translated">{cap.translatedText}</div>
          )}
        </div>
      ))}
    </div>
  );
};
