import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare, Users, Settings, Sparkles, Download, Circle, Square, Video as VideoIcon } from 'lucide-react';

const ControlBar = ({ 
  isMuted, setIsMuted, 
  isVideoOff, setIsVideoOff, 
  isScreenSharing, toggleScreenShare, 
  toggleSidebar, activeTab, onLeave,
  isRecording, onStartRecording, onStopRecording, onPauseRecording,
  onExportCaptions, onDownloadVideo
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
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={toggleScreenShare}
            title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            <MonitorUp />
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
