import React, { useEffect, useRef } from 'react';
import './LiveCaptions.css';

export const LiveCaptions = ({ captions, isEnabled, settings = {} }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [captions]);

  if (!isEnabled || captions.length === 0) return null;

  const positionStyles = settings.position === 'top' 
    ? { top: '80px', bottom: 'auto' } 
    : { bottom: '120px', top: 'auto' };

  const getFontSize = () => {
    switch (settings.fontSize) {
      case 'small': return '1rem';
      case 'large': return '1.8rem';
      case 'medium':
      default: return '1.4rem';
    }
  };

  return (
    <div className="live-captions-container" ref={containerRef} style={positionStyles}>
      {captions.map((cap, i) => {
        const isSelf = cap.speakerId === 'You';
        return (
          <div 
            key={i} 
            className={`caption-bubble ${cap.isPartial ? 'partial' : 'final'} ${isSelf ? 'self' : 'remote'}`}
            style={{ 
              backgroundColor: `rgba(0,0,0,${settings.opacity || 0.7})`,
              fontSize: getFontSize()
            }}
          >
            <div className="caption-sender" style={{ color: settings.color || '#00FFA3' }}>
              {cap.speakerId} {cap.targetLang && `(${cap.targetLang})`}
            </div>
            
            {settings.dualMode && cap.originalText && cap.translatedText && cap.originalText !== cap.translatedText ? (
              <>
                <div className="caption-original" style={{ color: '#aaa', fontSize: '0.85em' }}>{cap.originalText}</div>
                <div className="caption-translated" style={{ color: 'white', marginTop: '4px' }}>{cap.translatedText}</div>
              </>
            ) : (
              <div className="caption-translated" style={{ color: 'white' }}>
                {cap.translatedText || cap.originalText || cap.text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
