import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer; // Polyfill for simple-peer

import { useAuth } from '../context/AuthContext';
import VideoGrid from '../components/meeting/VideoGrid';
import ControlBar from '../components/meeting/ControlBar';
import Sidebar from '../components/meeting/Sidebar';
import { BACKEND_URL } from '../config';
import '../components/meeting/Meeting.css';

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
  const { token } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [backendStatus, setBackendStatus] = useState('Connecting...');
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  
  // Translation & Subtitles State
  const [subtitle, setSubtitle] = useState(null);
  const [sourceLang, setSourceLang] = useState('en-US');
  const sourceLangRef = useRef(sourceLang);
  
  useEffect(() => { sourceLangRef.current = sourceLang; }, [sourceLang]);

  useEffect(() => {
    if (socketRef.current) {
      const langName = LANGUAGES.find(l => l.code === sourceLang)?.name || 'English';
      socketRef.current.emit('set-language', { lang: langName });
    }
  }, [sourceLang]);

  const recognitionRef = useRef(null);
  
  const socketRef = useRef();
  const peersRef = useRef([]); // Stores peer instances
  const streamRef = useRef();
  const screenStreamRef = useRef(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to Backend!', socketRef.current.id);
      setBackendStatus('Connected to Backend');
      
      // Ensure backend knows our language immediately upon connection
      const langName = LANGUAGES.find(l => l.code === sourceLangRef.current)?.name || 'English';
      socketRef.current.emit('set-language', { lang: langName });
      
      // Request Camera and Mic permissions
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        streamRef.current = stream;
        
        // Add self to participants
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
        
        // When someone else joins, WE initiate the call to them
        socketRef.current.on('user-joined', (data) => {
          console.log('👤 User joined, initiating call:', data.userId);
          const peer = createPeer(data.userId, socketRef.current.id, stream);
          peersRef.current.push({ peerID: data.userId, peer });
        });

        // When we receive an offer from an initiator, we answer it
        socketRef.current.on('offer', (data) => {
          console.log('📥 Received offer from:', data.callerId);
          const peer = addPeer(data.offer, data.callerId, stream);
          peersRef.current.push({ peerID: data.callerId, peer });
        });

        // When we receive an answer to our offer
        socketRef.current.on('answer', (data) => {
          console.log('📥 Received answer from:', data.callerId);
          const item = peersRef.current.find(p => p.peerID === data.callerId);
          if (item) {
            item.peer.signal(data.answer);
          }
        });

        // Handle incoming chat messages
        socketRef.current.on('chat-message', (data) => {
          setChatMessages(prev => [...prev, data]);
        });

        // Handle incoming translated speech
        socketRef.current.on('translated-speech', (data) => {
          setSubtitle({
            text: data.translatedText,
            original: data.originalText,
            senderId: data.senderId
          });
          
          // Clear subtitle after 4 seconds
          setTimeout(() => {
            setSubtitle(null);
          }, 4000);
        });

        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = sourceLangRef.current;
          
          recognitionRef.current.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            
            const sourceName = LANGUAGES.find(l => l.code === sourceLangRef.current)?.name || 'English';

            // Send to backend for translation
            socketRef.current.emit('speech-transcription', {
              text: transcript,
              senderId: socketRef.current.id,
              roomId: id,
              sourceLang: sourceName
            });
          };

          // Automatically restart recognition if it stops (common browser behavior)
          recognitionRef.current.onend = () => {
            if (!isMuted && recognitionRef.current) {
              try { recognitionRef.current.start(); } catch (e) {}
            }
          };
          
          // Start recognition if mic is not muted
          recognitionRef.current.start();
        }

      }).catch(err => {
        console.error("Failed to get media devices:", err);
        setBackendStatus('Camera/Mic Blocked');
      });
    });

    socketRef.current.on('disconnect', () => {
      setBackendStatus('Disconnected');
    });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      socketRef.current.disconnect();
    };
  }, [id]);

  // Create a peer (Initiator)
  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
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

  // Answer a peer (Receiver)
  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
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

  // Chat Functionality
  const sendMessage = (text) => {
    if (!text.trim()) return;
    const msgData = {
      message: text,
      sender: 'You',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Add to local state
    setChatMessages(prev => [...prev, msgData]);
    
    const sourceName = LANGUAGES.find(l => l.code === sourceLangRef.current)?.name || 'English';

    // Send to server
    socketRef.current.emit('chat-message', {
      message: text,
      sender: 'Remote User', // To others, we are the remote user
      roomId: id,
      sourceLang: sourceName
    });
  };

  // Screen Share Functionality
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
        screenStreamRef.current = screenStream;
        
        // Replace video track in all peers
        const videoTrack = streamRef.current.getVideoTracks()[0];
        const screenTrack = screenStream.getVideoTracks()[0];
        
        peersRef.current.forEach(item => {
          item.peer.replaceTrack(videoTrack, screenTrack, streamRef.current);
        });
        
        // Update local video tile
        setParticipants(prev => prev.map(p => p.isLocal ? { ...p, stream: screenStream } : p));
        setIsScreenSharing(true);

        // When user clicks "Stop sharing" on the browser popup
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
    
    // Switch back to webcam
    const videoTrack = streamRef.current.getVideoTracks()[0];
    
    peersRef.current.forEach(item => {
      // We don't have the old screen track reference easily accessible in this scope for all peers,
      // but simple-peer allows us to re-add the old track or we can fetch the current track from the peer.
      // Easiest is to re-trigger replaceTrack.
      const currentStream = item.peer.streams[0]; // This is incoming stream, wait.
      // simple-peer replaceTrack requires (oldTrack, newTrack, stream)
      // Since we modified the stream, we just need to replace the sender's track.
      // Actually simple-peer needs the exact old track.
      // For simplicity in this demo, let's just force a reload or handle it via a new stream.
      // The robust way is keeping track of the old track. Let's do it robustly:
      const screenTrack = item.peer._pc.getSenders().find(s => s.track.kind === 'video').track;
      if (screenTrack && videoTrack) {
        item.peer.replaceTrack(screenTrack, videoTrack, streamRef.current);
      }
    });

    setParticipants(prev => prev.map(p => p.isLocal ? { ...p, stream: streamRef.current } : p));
    setIsScreenSharing(false);
  };

  // Toggle Mute & Language
  useEffect(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
      }
    }
    setParticipants(prev => prev.map(p => p.isLocal ? { ...p, muted: isMuted } : p));
    
    // Manage speech recognition when muted or language changes
    if (recognitionRef.current) {
      recognitionRef.current.lang = sourceLang;
      try { recognitionRef.current.stop(); } catch (e) {}
      if (!isMuted) {
        setTimeout(() => { try { recognitionRef.current.start(); } catch (e) {} }, 100);
      }
    }
  }, [isMuted, sourceLang]);

  // Toggle Video
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ meetingCode: id, duration })
      });
    } catch (e) {
      console.error('Failed to save history', e);
    }
    
    navigate(`/summary/${id}`);
  };

  return (
    <div className="meeting-container">
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
                  background: 'rgba(110, 86, 255, 0.2)',
                  border: '1px solid #6E56FF',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Copy Invite Link
              </button>
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

          <VideoGrid participants={participants} />
          
          {/* Cinematic Subtitles Overlay */}
          {subtitle && (
            <div style={{
              position: 'absolute',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              padding: '12px 24px',
              borderRadius: '20px',
              color: '#FFF',
              textAlign: 'center',
              zIndex: 50,
              maxWidth: '80%',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '500', letterSpacing: '0.5px' }}>
                {subtitle.text}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#A0A0A0', marginTop: '4px' }}>
                {subtitle.original}
              </div>
            </div>
          )}
          
          <ControlBar 
            isMuted={isMuted} setIsMuted={setIsMuted}
            isVideoOff={isVideoOff} setIsVideoOff={setIsVideoOff}
            isScreenSharing={isScreenSharing} toggleScreenShare={toggleScreenShare}
            toggleSidebar={toggleSidebar}
            activeTab={isSidebarOpen ? activeTab : null}
            onLeave={handleLeave}
          />
        </div>

        <Sidebar 
          isOpen={isSidebarOpen} 
          activeTab={activeTab} 
          onClose={() => setIsSidebarOpen(false)} 
          participants={participants}
          chatMessages={chatMessages}
          sendMessage={sendMessage}
        />
      </div>
    </div>
  );
};

export default MeetingRoom;
