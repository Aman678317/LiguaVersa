import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare, Users, Settings, Sparkles, Download, Circle, Square, Pause } from 'lucide-react';

const ControlBar = ({ 
  isMuted, setIsMuted, 
  isVideoOff, setIsVideoOff, 
  isScreenSharing, toggleScreenShare, 
  toggleSidebar, activeTab, onLeave,
  isRecording, onStartRecording, onStopRecording, onPauseRecording,
  onExportCaptions
}) => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="control-bar-wrapper">
      <div className="control-bar glass">
        
        {/* Left: Meeting Info */}
        <div className="control-group left">
          <span className="time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="divider">|</span>
          <span className="meeting-code">ling-ua-verse</span>
        </div>

        {/* Center: Core Controls */}
        <div className="control-group center">
          <button 
            className={`control-btn ${isMuted ? 'danger' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </button>
          
          <button 
            className={`control-btn ${isVideoOff ? 'danger' : ''}`}
            onClick={() => setIsVideoOff(!isVideoOff)}
          >
            {isVideoOff ? <VideoOff /> : <Video />}
          </button>
          
          <button 
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={toggleScreenShare}
          >
            <MonitorUp />
          </button>

          <button className={`control-btn ai-btn ${activeTab === 'ai-bot' ? 'active' : ''}`} onClick={() => toggleSidebar('ai-bot')} title="AI Assistant">
            <Sparkles />
          </button>

          
          {!isRecording ? (
            <button className="control-btn" onClick={onStartRecording} title="Start Recording">
              <Circle color="#ff4444" fill="#ff4444" />
            </button>
          ) : (
            <button className="control-btn danger" onClick={onStopRecording} title="Stop Recording">
              <Square fill="#fff" />
            </button>
          )}

          <div style={{position: 'relative', display: 'inline-block'}} className="dropdown-container">
            <button className="control-btn" title="Download Captions" onClick={(e) => {
              const menu = e.currentTarget.nextElementSibling;
              menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }}>
              <Download />
            </button>
            <div className="dropdown-menu" style={{display: 'none', position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px', zIndex: 100, marginBottom: '10px'}}>
              {['TXT', 'PDF', 'DOCX', 'SRT', 'VTT', 'JSON'].map(fmt => (
                <div key={fmt} style={{padding: '6px 12px', cursor: 'pointer', color: '#fff'}} onClick={(e) => {
                  onExportCaptions(fmt);
                  e.currentTarget.parentElement.style.display = 'none';
                }}>
                  {fmt}
                </div>
              ))}
            </div>
          </div>

          <button className="control-btn leave-btn" onClick={onLeave}>
            <PhoneOff />
          </button>
        </div>

        {/* Right: Sidebar Toggles */}
        <div className="control-group right">
          <button 
            className={`control-btn side-toggle ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => toggleSidebar('chat')}
          >
            <MessageSquare size={20} />
          </button>
          
          <button 
            className={`control-btn side-toggle ${activeTab === 'participants' ? 'active' : ''}`}
            onClick={() => toggleSidebar('participants')}
          >
            <Users size={20} />
          </button>
          
          <button 
            className={`control-btn side-toggle ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => toggleSidebar('settings')}
          >
            <Settings size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default ControlBar;
