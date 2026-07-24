import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Buffer } from 'buffer';
import process from 'process';
globalThis.Buffer = Buffer; // Polyfill for simple-peer
globalThis.process = process;
import { useAuth } from '../context/AuthContext';
import VideoGrid from '../components/meeting/VideoGrid';
import ControlBar from '../components/meeting/ControlBar';
import Sidebar from '../components/meeting/Sidebar';
import { BACKEND_URL } from '../config';
import '../components/meeting/Meeting.css';
import { RecordingManager } from '../utils/RecordingManager';
import { exportCaptions } from '../utils/CaptionExporter';
import { AudioMixer } from '../utils/AudioMixer';

import { useRealTimeTranslation } from '../hooks/useRealTimeTranslation';
import { TranslationPanel } from '../components/translation/TranslationPanel';
import { LiveCaptions } from '../components/translation/LiveCaptions';
import { CaptionSettings } from '../components/translation/CaptionSettings';

const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'mr-IN', name: 'Marathi' },
];

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [backendStatus, setBackendStatus] = useState('Connecting...');
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const recordingManagerRef = useRef(null);
  const captionsLogRef = useRef([]);
  
  // Translation & Subtitles State
  const [sourceLang, setSourceLang] = useState((user?.settings?.speechLanguage === 'English') ? 'en-US' : (user?.settings?.speechLanguage || 'en-US'));
  const [translationEnabled, setTranslationEnabled] = useState(user?.settings?.autoStartTranslation !== false);
  const [targetVoice, setTargetVoice] = useState('alloy');
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [summaryEnabled, setSummaryEnabled] = useState(true);
  const [captionSettings, setCaptionSettings] = useState({
    fontSize: user?.settings?.captionFontSize || 'medium',
    position: user?.settings?.captionPosition || 'bottom',
    color: user?.settings?.captionColor || '#ffffff',
    dualMode: user?.settings?.dualCaptionMode !== false,
    opacity: user?.settings?.captionOpacity || 0.7
  });
  const [isCaptionSettingsOpen, setIsCaptionSettingsOpen] = useState(false);
  
  const sourceLangRef = useRef(sourceLang);
  useEffect(() => { sourceLangRef.current = sourceLang; }, [sourceLang]);

  const socketRef = useRef();
  const [socket, setSocket] = useState(null);
  const peersRef = useRef([]); // Stores peer instances
  const streamRef = useRef();
  const screenStreamRef = useRef(null);
  const startTime = useRef(Date.now());
  const audioMixerRef = useRef(null);

  // Real-Time Voice Translation Hook
  const { 
    captions, 
    latency, 
    isTranslating, 
    startRecording, 
    stopRecording,
    audioContext
  } = useRealTimeTranslation(
    socket, 
    id, 
    user?.id || socketRef.current?.id || 'local', 
    sourceLang, 
    translationEnabled
  );

  // Set up AudioMixer when audioContext becomes available
  useEffect(() => {
    if (audioContext && !audioMixerRef.current) {
      audioMixerRef.current = new AudioMixer(audioContext);
    }
  }, [audioContext]);

  // Listen for new translated tracks to send over WebRTC
  useEffect(() => {
    const handleTranslatedTrack = (e) => {
      const { targetSocketId, track, stream } = e.detail;
      
      const peerItem = peersRef.current.find(p => p.peerID === targetSocketId);
      if (peerItem) {
        // Find the original audio track to replace
        const originalAudioTrack = streamRef.current?.getAudioTracks()[0];
        const peer = peerItem.peer;
        
        if (originalAudioTrack && track) {
          try {
            // Replace the original audio track with the translated track for this specific peer
            peer.replaceTrack(originalAudioTrack, track, streamRef.current);
            console.log(`Replaced audio track for peer ${targetSocketId} with translated track`);
          } catch (err) {
            console.error("Failed to replace track:", err);
          }
        }
      }
    };
    window.addEventListener('translation:track-ready', handleTranslatedTrack);
    return () => window.removeEventListener('translation:track-ready', handleTranslatedTrack);
  }, []);

  // Handle Ducking when translated audio plays (Now obsolete since it's remote, but kept for safety)
  useEffect(() => {
    const handleTranslationPlaying = (e) => {
      if (audioMixerRef.current) {
        audioMixerRef.current.duckOriginal(0.15);
        setTimeout(() => {
          audioMixerRef.current.restoreOriginal(1.0);
        }, e.detail.duration * 1000 + 500); // Wait until translated speech ends + 500ms
      }
    };
    window.addEventListener('translation:playing', handleTranslationPlaying);
    return () => window.removeEventListener('translation:playing', handleTranslationPlaying);
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      const settings = user?.settings || {};
      const targetLanguageCode = settings.translationLanguage || 'hi-IN';
      socketRef.current.emit('set-language', { 
        ...settings, 
        lang: sourceLang, 
        captionLanguage: sourceLang,
        translationLanguage: targetLanguageCode,
        translationEnabled,
        translationVoice: targetVoice
      });
    }
  }, [sourceLang, translationEnabled, targetVoice, user]);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket'],
    });
    setSocket(socketRef.current);

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to Backend!', socketRef.current.id);
      setBackendStatus('Connected to Backend');
      
      const settings = user?.settings || {};
      const targetLanguageCode = settings.translationLanguage || 'hi-IN';
      socketRef.current.emit('set-language', { 
        ...settings, 
        lang: sourceLangRef.current, 
        captionLanguage: sourceLangRef.current,
        translationLanguage: targetLanguageCode,
        translationEnabled,
        translationVoice: targetVoice
      });
      
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        streamRef.current = stream;
        
        setParticipants([{
          id: socketRef.current.id,
          name: 'You',
          isLocal: true,
          speaking: false,
          muted: false,
          videoOff: false,
          stream: stream
        }]);

        socketRef.current.emit('join-room', { roomId: id });
        
        socketRef.current.on('user-joined', (data) => {
          const peer = createPeer(data.userId, socketRef.current.id, stream);
          peersRef.current.push({ peerID: data.userId, peer });
        });

        socketRef.current.on('offer', (data) => {
          let item = peersRef.current.find(p => p.peerID === data.callerId);
          if (item) {
            item.peer.signal(data.offer);
          } else {
            const peer = addPeer(data.offer, data.callerId, stream);
            peersRef.current.push({ peerID: data.callerId, peer });
          }
        });

        socketRef.current.on('answer', (data) => {
          const item = peersRef.current.find(p => p.peerID === data.callerId);
          if (item) {
            item.peer.signal(data.answer);
          }
        });

        socketRef.current.on('chat-message', (data) => {
          setChatMessages(prev => [...prev, data]);
        });

        socketRef.current.on('chat:typing', (data) => {
          setTypingUsers(prev => {
            if (data.isTyping) {
              return prev.includes(data.sender) ? prev : [...prev, data.sender];
            } else {
              return prev.filter(u => u !== data.sender);
            }
          });
        });

        socketRef.current.on('preferences:sync', (newSettings) => {
          if (newSettings.speechLanguage) setSourceLang(newSettings.speechLanguage);
          if (newSettings.captionFontSize) setCaptionSettings(prev => ({ ...prev, fontSize: newSettings.captionFontSize }));
          if (newSettings.captionPosition) setCaptionSettings(prev => ({ ...prev, position: newSettings.captionPosition }));
          if (newSettings.captionColor) setCaptionSettings(prev => ({ ...prev, color: newSettings.captionColor }));
          if (newSettings.dualCaptionMode !== undefined) setCaptionSettings(prev => ({ ...prev, dualMode: newSettings.dualCaptionMode }));
          if (newSettings.voiceGender || newSettings.voiceAccent) {
            // A primitive mapping just to show voice changes apply
            setTargetVoice(newSettings.voiceGender === 'female' ? 'nova' : 'alloy');
          }
        });
      }).catch(err => {
        console.error("Failed to get media devices:", err);
        setBackendStatus('Camera/Mic Blocked');
      });
    });

    socketRef.current.on('disconnect', () => {
      setBackendStatus('Disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId: id });
        socketRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      stopRecording();
      socketRef.current.disconnect();
    };
  }, [id]);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: true,
      stream,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    });

    peer.on('signal', signal => {
      socketRef.current.emit('offer', {
        targetUserId: userToSignal,
        callerId: callerID,
        offer: signal,
        roomId: id
      });
    });

    peer.on('stream', (remoteStream) => {
      setParticipants(prev => [...prev.filter(p => p.id !== userToSignal), {
        id: userToSignal,
        name: 'Remote User',
        isLocal: false,
        speaking: false,
        muted: false,
        videoOff: false,
        stream: remoteStream
      }]);
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    });

    peer.on('signal', signal => {
      socketRef.current.emit('answer', {
        targetUserId: callerID,
        callerId: socketRef.current.id,
        answer: signal,
        roomId: id
      });
    });

    peer.on('stream', (remoteStream) => {
      setParticipants(prev => [...prev.filter(p => p.id !== callerID), {
        id: callerID,
        name: 'Remote User',
        isLocal: false,
        speaking: false,
        muted: false,
        videoOff: false,
        stream: remoteStream
      }]);
    });

    peer.signal(incomingSignal);
    return peer;
  }

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const msgData = {
      message: text,
      sender: 'You',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, msgData]);

    socketRef.current.emit('chat-message', {
      message: text,
      sender: 'Remote User',
      senderUserId: user?.id,
      roomId: id,
      sourceLang: sourceLangRef.current
    });
  };

  const handleTyping = (isTyping) => {
    socketRef.current?.emit('chat:typing', {
      isTyping,
      roomId: id,
      sender: 'Remote User'
    });
  };

  const handleSendVoiceMessage = (arrayBuffer) => {
    socketRef.current?.emit('chat:voice', {
      audioChunk: arrayBuffer,
      sender: 'Remote User',
      senderUserId: user?.id,
      roomId: id,
      sourceLang: sourceLangRef.current
    });
  };

  const handleRequestSmartReplies = async () => {
    // Mocking smart replies based on last message for Phase 5 prototype
    const lastMsg = chatMessages[chatMessages.length - 1]?.message || '';
    if (lastMsg.includes('?')) return ['I agree', 'Can you clarify?', 'No, I don\'t think so'];
    return ['Sounds good!', 'Got it.', 'Thanks!'];
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
        screenStreamRef.current = screenStream;
        
        const videoTrack = streamRef.current.getVideoTracks()[0];
        const screenTrack = screenStream.getVideoTracks()[0];
        
        peersRef.current.forEach(item => {
          item.peer.replaceTrack(videoTrack, screenTrack, streamRef.current);
        });
        
        setParticipants(prev => prev.map(p => p.isLocal ? { ...p, stream: screenStream } : p));
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.error("Failed to share screen:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    peersRef.current.forEach(item => {
      const screenTrack = item.peer._pc.getSenders().find(s => s.track.kind === 'video').track;
      if (screenTrack && videoTrack) {
        item.peer.replaceTrack(screenTrack, videoTrack, streamRef.current);
      }
    });

    setParticipants(prev => prev.map(p => p.isLocal ? { ...p, stream: streamRef.current } : p));
    setIsScreenSharing(false);
  };

  useEffect(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
      }
    }
    setParticipants(prev => prev.map(p => p.isLocal ? { ...p, muted: isMuted } : p));
    
    if (!isMuted && translationEnabled && streamRef.current) {
      startRecording(streamRef.current);
    } else {
      stopRecording();
      // If translation stops, restore original track for all peers
      if (streamRef.current) {
        const originalAudioTrack = streamRef.current.getAudioTracks()[0];
        peersRef.current.forEach(item => {
          const senders = item.peer._pc.getSenders();
          const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
          if (audioSender && audioSender.track !== originalAudioTrack) {
            try {
              item.peer.replaceTrack(audioSender.track, originalAudioTrack, streamRef.current);
            } catch (e) {
               console.error("Error restoring original track", e);
            }
          }
        });
      }
    }
  }, [isMuted, translationEnabled, sourceLang, startRecording, stopRecording]);

  useEffect(() => {
    if (streamRef.current && !isScreenSharing) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOff;
      }
    }
    setParticipants(prev => prev.map(p => p.isLocal ? { ...p, videoOff: isVideoOff } : p));
  }, [isVideoOff, isScreenSharing]);

  const toggleSidebar = (tab) => {
    if (isSidebarOpen && activeTab === tab) {
      setIsSidebarOpen(false);
    } else {
      setActiveTab(tab);
      setIsSidebarOpen(true);
    }
  };

  const handleLeave = async () => {
    const duration = Math.floor((Date.now() - startTime.current) / 1000);
    try {
      await fetch(`${BACKEND_URL}/history/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ meetingCode: id, duration })
      });
      
      if (recordingManagerRef.current && isRecording) {
        recordingManagerRef.current.stopRecording();
        await recordingManagerRef.current.finalizeRecording();
      } else {
        // Force finalize to trigger summary generation even if not recorded
        await fetch(`${BACKEND_URL}/recordings/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ meetingId: id })
        });
      }
    } catch (e) {
      console.error('Failed to save history or finalize', e);
    }
    navigate(`/summary/${id}`);
  };

  const handleStartRecording = async () => {
    if (!recordingManagerRef.current) {
      recordingManagerRef.current = new RecordingManager(id, token);
    }
    if (streamRef.current) {
      await recordingManagerRef.current.startRecording(streamRef.current);
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (recordingManagerRef.current) {
      recordingManagerRef.current.stopRecording();
      setIsRecording(false);
      setTimeout(() => {
        const downloaded = recordingManagerRef.current.downloadVideo();
        if (downloaded) {
          alert("🎥 Meeting Recording Saved & Downloaded to your computer!");
        }
      }, 500);
    }
  };

  const handleDownloadVideo = () => {
    if (recordingManagerRef.current && recordingManagerRef.current.recordedChunks.length > 0) {
      recordingManagerRef.current.downloadVideo();
    } else {
      alert("No video recording active or saved yet. Click the red Record button (🔴) to start recording your meeting, then click it again to save & download!");
    }
  };

  const handleExportCaptions = (format) => {
    if (!captions || captions.length === 0) {
      alert("No captions to export yet! Turn on Live Translation / Captions during your call.");
      return;
    }
    exportCaptions(captionsLogRef.current.length > 0 ? captionsLogRef.current : captions, format, sourceLang);
  };

  return (
    <div className="meeting-container">
      <TranslationPanel 
        isEnabled={translationEnabled}
        onToggle={() => setTranslationEnabled(!translationEnabled)}
        targetLang={sourceLang}
        onLangChange={setSourceLang}
        targetVoice={targetVoice}
        onVoiceChange={setTargetVoice}
        latency={latency}
        isTranslating={isTranslating}
        onOpenCaptionSettings={() => setIsCaptionSettingsOpen(true)}
        captionsEnabled={captionsEnabled}
        onToggleCaptions={() => setCaptionsEnabled(!captionsEnabled)}
        summaryEnabled={summaryEnabled}
        onToggleSummary={() => setSummaryEnabled(!summaryEnabled)}
        isRecording={isRecording}
        onToggleRecording={() => isRecording ? handleStopRecording() : handleStartRecording()}
      />
      
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '12px', color: backendStatus === 'Connected to Backend' ? '#00FFA3' : '#FF4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: backendStatus === 'Connected to Backend' ? '#00FFA3' : '#FF4444' }}></div>
        {backendStatus}
      </div>

      <div className="meeting-bg"></div>

      <div className="meeting-main">
        <div className={`meeting-grid-area ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="meeting-header glass" style={{ width: '100%', justifyContent: 'space-between', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h2>Meeting: {id}</h2>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Meeting Link Copied! Send it to a friend to join the call.");
                }}
                style={{
                  background: 'rgba(110, 86, 255, 0.2)', border: '1px solid #6E56FF', color: 'white',
                  padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                Copy Invite Link
              </button>
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join my LinguaVerse meeting! Link: ${window.location.href}`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  background: '#25D366', color: 'white', padding: '6px 12px', borderRadius: '8px', 
                  textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold'
                }}
              >
                WhatsApp
              </a>
              <a 
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Join my LinguaVerse meeting!')}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  background: '#0088cc', color: 'white', padding: '6px 12px', borderRadius: '8px', 
                  textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold'
                }}
              >
                Telegram
              </a>
            </div>
            <div className="meeting-badges" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{color: 'white', fontSize: '0.85rem'}}>My Language:</span>
              <select 
                value={sourceLang} 
                onChange={e => setSourceLang(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                {LANGUAGES.map(l => <option key={l.code} value={l.code} style={{color: 'black'}}>{l.name}</option>)}
              </select>
            </div>
          </div>

          {/* WebRTC Video component handles audio context ducking globally */}
          <VideoGrid participants={participants} translationEnabled={translationEnabled} />
          
          <LiveCaptions captions={captions} isEnabled={captionsEnabled} settings={captionSettings} />
          
          <CaptionSettings 
            isOpen={isCaptionSettingsOpen} 
            onClose={() => setIsCaptionSettingsOpen(false)} 
            settings={captionSettings}
            onSettingsChange={setCaptionSettings} 
          />
          
          <ControlBar 
            isMuted={isMuted} setIsMuted={setIsMuted}
            isVideoOff={isVideoOff} setIsVideoOff={setIsVideoOff}
            isScreenSharing={isScreenSharing} toggleScreenShare={toggleScreenShare}
            toggleSidebar={toggleSidebar}
            activeTab={isSidebarOpen ? activeTab : null}
            onLeave={handleLeave}
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onExportCaptions={handleExportCaptions}
            onDownloadVideo={handleDownloadVideo}
          />
        </div>


        <Sidebar 
          isOpen={isSidebarOpen} 
          activeTab={activeTab} 
          onClose={() => setIsSidebarOpen(false)} 
          participants={participants}
          chatMessages={chatMessages}
          sendMessage={sendMessage}
          typingUsers={typingUsers}
          onTyping={handleTyping}
          sendVoiceMessage={handleSendVoiceMessage}
          requestSmartReplies={handleRequestSmartReplies}
          meetingCode={id}
          token={token}
          setActiveTab={setActiveTab}
        />

      </div>
    </div>
  );
};

export default MeetingRoom;
