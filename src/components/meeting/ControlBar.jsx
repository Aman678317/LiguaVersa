import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare, Users, Settings, Sparkles } from 'lucide-react';

const ControlBar = ({ isMuted, setIsMuted, isVideoOff, setIsVideoOff, isScreenSharing, toggleScreenShare, toggleSidebar, activeTab, onLeave }) => {
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

          <button className="control-btn ai-btn">
            <Sparkles />
          </button>

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
