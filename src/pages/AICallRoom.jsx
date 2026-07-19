import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer,
  useTracks,
  useDataChannel,
  useRoomContext,
  useLocalParticipant,
  ControlBar,
  DisconnectButton
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { BACKEND_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { Settings, Languages, VolumeX, Volume2 } from 'lucide-react';
import './AICallRoom.css';

const AICallRoom = () => {
  const { roomId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [lkToken, setLkToken] = useState('');
  
  useEffect(() => {
    if (!token || !user) return;
    
    // Fetch token from NestJS backend
    const fetchToken = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/meetings/${roomId}/livekit/token`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setLkToken(data.token);
      } catch (e) {
        console.error("Failed to fetch livekit token", e);
      }
    };
    
    fetchToken();
  }, [roomId, token, user]);

  if (!lkToken) {
    return <div className="loading-screen">Connecting to AI Call...</div>;
  }

  // The LiveKit URL from docker-compose is typically ws://localhost:7880,
  // but if accessing from the browser, we should use the host's IP/localhost.
  // In a real app, this should be in an env var. We use localhost for dev.
  const liveKitUrl = "ws://localhost:7880";

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#121212' }}>
      <LiveKitRoom
        video={true}
        audio={true}
        token={lkToken}
        serverUrl={liveKitUrl}
        onDisconnected={() => navigate('/')}
        data-lk-theme="default"
        style={{ height: '100%' }}
      >
        <CallLayout />
        {/* We use our custom audio renderer to handle muting original vs translated audio */}
        <CustomAudioManager />
      </LiveKitRoom>
    </div>
  );
};

const CallLayout = () => {
  const room = useRoomContext();
  const [translationEnabled, setTranslationEnabled] = useState(true);
  const [srcLang, setSrcLang] = useState('eng_Latn');
  const [tgtLang, setTgtLang] = useState('fra_Latn');
  const [captions, setCaptions] = useState([]);

  // Receive data messages (captions) from the AI participant
  useDataChannel((msg) => {
    const text = new TextDecoder().decode(msg.payload);
    if (text.startsWith("caption:")) {
      const captionText = text.replace("caption:", "");
      setCaptions(prev => [...prev.slice(-3), captionText]);
    }
  });

  const requestAI = async () => {
    try {
      await fetch(`http://localhost:8000/join/${room.name}`, { method: 'POST' });
    } catch (e) {
      console.error("Failed to summon AI", e);
    }
  };

  useEffect(() => {
    if (translationEnabled) {
      requestAI();
    }
  }, [translationEnabled, room.name]);

  return (
    <div className="ai-call-layout">
      <div className="video-area">
        <VideoConference />
      </div>
      
      <div className="captions-overlay">
        {captions.map((cap, i) => (
          <div key={i} className="caption-line">{cap}</div>
        ))}
      </div>

      <div className="custom-controls">
        <div className="controls-group glass">
          <label><Languages size={18} /> Source:</label>
          <select value={srcLang} onChange={e => setSrcLang(e.target.value)} className="lang-select">
            <option value="eng_Latn">English</option>
            <option value="fra_Latn">French</option>
            <option value="spa_Latn">Spanish</option>
            <option value="hin_Deva">Hindi</option>
          </select>

          <label>Target:</label>
          <select value={tgtLang} onChange={e => setTgtLang(e.target.value)} className="lang-select">
            <option value="fra_Latn">French</option>
            <option value="eng_Latn">English</option>
            <option value="spa_Latn">Spanish</option>
            <option value="hin_Deva">Hindi</option>
          </select>
          
          <button 
            className={`toggle-btn ${translationEnabled ? 'active' : ''}`}
            onClick={() => setTranslationEnabled(!translationEnabled)}
          >
            {translationEnabled ? 'AI Active' : 'AI Inactive'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Audio Manager to handle Original / Translated / Both
const CustomAudioManager = () => {
  const [audioMode, setAudioMode] = useState('both'); // original, translated, both
  const audioTracks = useTracks([Track.Source.Microphone]);

  return (
    <>
      <div className="audio-mode-selector glass">
        <label>Listen to:</label>
        <select value={audioMode} onChange={e => setAudioMode(e.target.value)} className="lang-select">
          <option value="both">Both (Original + AI)</option>
          <option value="original">Original Only</option>
          <option value="translated">Translated Only</option>
        </select>
      </div>

      {audioTracks.map((trackRef) => {
        // We assume the AI participant has identity "ai-translator"
        const isAI = trackRef.participant.identity === 'ai-translator';
        const isLocal = trackRef.participant.isLocal;

        if (isLocal) return null; // Don't play own audio

        let shouldPlay = true;
        if (audioMode === 'original' && isAI) shouldPlay = false;
        if (audioMode === 'translated' && !isAI) shouldPlay = false;

        return shouldPlay ? (
          <RoomAudioRenderer key={trackRef.participant.identity} />
        ) : null;
      })}
    </>
  );
};

export default AICallRoom;
