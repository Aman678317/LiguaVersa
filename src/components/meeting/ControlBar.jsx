import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare, Users, Settings, Sparkles, Download, Circle, Square, Video as VideoIcon, Globe, Hand, Lock, Unlock } from 'lucide-react';

const ControlBar = ({ 
  isMuted, setIsMuted, 
  isVideoOff, setIsVideoOff, 
  isScreenSharing, toggleScreenShare, 
  toggleSidebar, activeTab, onLeave,
  isRecording, onStartRecording, onStopRecording, onPauseRecording,
  onExportCaptions, onDownloadVideo,
  isTranslationActive, onOpenTranslationSheet,
  isHandRaised, onToggleHand,
  isHost, isRoomLocked, onToggleLock
}) => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="control-bar-wrapper">
      <div className="control-bar glass" style={{ position: 'relative' }}>
        
        {/* Left: Meeting Info */}
        <div className="control-group left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="divider">|</span>
          <span className="meeting-code">ling-ua-verse</span>
          
          {isRecording && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 68, 68, 0.2)',
              border: '1px solid rgba(255, 68, 68, 0.6)',
              padding: '4px 10px',
              borderRadius: '16px',
              color: '#FF4444',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#FF4444',
                boxShadow: '0 0 10px #FF4444',
                animation: 'pulse 1.2s infinite'
              }}></span>
              REC
            </div>
          )}
        </div>

        {/* Center: Core Controls */}
        <div className="control-group center">
          <button 
            className={`control-btn ${isMuted ? 'danger' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </button>
          
          <button 
            className={`control-btn ${isVideoOff ? 'danger' : ''}`}
            onClick={() => setIsVideoOff(!isVideoOff)}
            title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
          >
            {isVideoOff ? <VideoOff /> : <Video />}
          </button>

          <button 
            className={`control-btn ${isHandRaised ? 'active' : ''}`}
            onClick={onToggleHand}
            title={isHandRaised ? "Lower Hand" : "Raise Hand"}
            style={{
              background: isHandRaised ? 'rgba(255, 187, 0, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: isHandRaised ? '1px solid #FFBB00' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isHandRaised ? '#FFBB00' : 'rgba(255, 255, 255, 0.8)'
            }}
          >
            <Hand size={20} />
          </button>

          {isHost && (
            <button 
              className={`control-btn ${isRoomLocked ? 'danger' : ''}`}
              onClick={onToggleLock}
              title={isRoomLocked ? "Unlock Meeting" : "Lock Meeting (Prevent new joiners)"}
            >
              {isRoomLocked ? <Lock size={20} /> : <Unlock size={20} />}
            </button>
          )}

          <button 
            className={`control-btn translate-btn ${isTranslationActive ? 'active-green' : ''}`}
            onClick={onOpenTranslationSheet}
            title="Translate AI"
            style={{
              background: isTranslationActive ? 'rgba(0, 255, 163, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: isTranslationActive ? '1px solid #00FFA3' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isTranslationActive ? '#00FFA3' : 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 14px',
              borderRadius: '24px',
              fontWeight: 700,
              fontSize: '0.85rem',
              boxShadow: isTranslationActive ? '0 0 15px rgba(0, 255, 163, 0.35)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Globe size={18} />
            <span>Translate</span>
          </button>
          
          <button 
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={toggleScreenShare}
            title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            <MonitorUp />
          </button>

          <button 
            className="control-btn whatsapp-btn"
            onClick={() => {
              const text = encodeURIComponent(`Hey! Join my live AI translated video call on LinguaVersa:\n${window.location.href}`);
              window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
            }}
            title="Share Video Call link on WhatsApp"
            style={{
              background: 'rgba(37, 211, 102, 0.2)',
              border: '1px solid #25D366',
              color: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(37, 211, 102, 0.3)'
            }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>📲</span>
          </button>

          <button className={`control-btn ai-btn ${activeTab === 'ai-bot' ? 'active' : ''}`} onClick={() => toggleSidebar('ai-bot')} title="AI Assistant">
            <Sparkles />
          </button>

          {!isRecording ? (
            <button className="control-btn" onClick={onStartRecording} title="Start Meeting Recording">
              <Circle color="#ff4444" fill="#ff4444" />
            </button>
          ) : (
            <button className="control-btn danger" onClick={onStopRecording} title="Stop & Save Recording">
              <Square fill="#fff" />
            </button>
          )}

          <div style={{ position: 'relative', display: 'inline-block' }} className="dropdown-container">
            <button 
              className="control-btn" 
              title="Download Options" 
              onClick={(e) => {
                const menu = e.currentTarget.nextElementSibling;
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
              }}
            >
              <Download />
            </button>

            <div 
              className="dropdown-menu" 
              style={{
                display: 'none', 
                position: 'absolute', 
                bottom: '110%', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                background: 'rgba(15, 15, 25, 0.95)', 
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.12)', 
                borderRadius: '12px', 
                padding: '8px', 
                minWidth: '210px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: 200
              }}
            >
              <div 
                style={{ 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  color: '#00FFA3',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                  background: 'rgba(0, 255, 163, 0.1)',
                  marginBottom: '6px'
                }}
                onClick={(e) => {
                  if (onDownloadVideo) onDownloadVideo();
                  e.currentTarget.parentElement.style.display = 'none';
                }}
              >
                <VideoIcon size={16} color="#00FFA3" />
                <span>Download Video (.webm)</span>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', padding: '4px 12px 2px 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Export Captions
              </div>

              {['TXT', 'PDF', 'DOCX', 'SRT', 'VTT', 'JSON'].map(fmt => (
                <div 
                  key={fmt} 
                  style={{ 
                    padding: '6px 12px', 
                    cursor: 'pointer', 
                    color: '#fff',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    transition: 'background 0.2s ease'
                  }} 
                  onClick={(e) => {
                    onExportCaptions(fmt);
                    e.currentTarget.parentElement.style.display = 'none';
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Export as {fmt}
                </div>
              ))}
            </div>
          </div>

          <button className="control-btn leave-btn" onClick={onLeave} title="Leave Meeting">
            <PhoneOff />
          </button>
        </div>

        {/* Right: Sidebar Toggles */}
        <div className="control-group right">
          <button 
            className={`control-btn side-toggle ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => toggleSidebar('chat')}
            title="Chat Messages"
          >
            <MessageSquare size={20} />
          </button>
          
          <button 
            className={`control-btn side-toggle ${activeTab === 'participants' ? 'active' : ''}`}
            onClick={() => toggleSidebar('participants')}
            title="Participants"
          >
            <Users size={20} />
          </button>
          
          <button 
            className={`control-btn side-toggle ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => toggleSidebar('settings')}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default ControlBar;
