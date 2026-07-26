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
import { LanguageSheet } from '../components/translation/LanguageSheet';
import { AIStatusIndicator } from '../components/translation/AIStatusIndicator';
import { AudioSettingsModal } from '../components/meeting/AudioSettingsModal';

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

  // Phase 1 Host Controls & Waiting Room State
  const [isHost, setIsHost] = useState(false);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [isWaitingInRoom, setIsWaitingInRoom] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [isHandRaised, setIsHandRaised] = useState(false);

  
  // Translation & Subtitles State
  const [sourceLang, setSourceLang] = useState(user?.settings?.speechLanguage || 'hi-IN');
  const [partnerLang, setPartnerLang] = useState(user?.settings?.translationLanguage || 'en-US');
  const [voiceGender, setVoiceGender] = useState('female');
  const [autoDetect, setAutoDetect] = useState(true);
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const [translationEnabled, setTranslationEnabled] = useState(user?.settings?.autoStartTranslation !== false);
  const [targetVoice, setTargetVoice] = useState('alloy');
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [summaryEnabled, setSummaryEnabled] = useState(true);
  const [captionSettings, setCaptionSettings] = useState({
    fontSize: user?.settings?.captionFontSize || 'medium',
    position: user?.settings?.captionPosition || 'bottom',
    color: user?.settings?.captionColor || '#ffffff',
    dualMode: user?.settings?.dualCaptionMode !== false,
    opacity: user?.settings?.captionOpacity || 0.7,
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    autoDetect: true,
    translationQuality: 'balanced',
    audioEnhancement: true
  });
  const [isCaptionSettingsOpen, setIsCaptionSettingsOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  
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
    const obtainUserMediaStream = async () => {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      } catch (e1) {
        try {
          return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (e2) {
          try {
            return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          } catch (e3) {
            try {
              return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            } catch (e4) {
              console.warn("Using synthetic stream fallback:", e4);
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const dst = ctx.createMediaStreamDestination();
              osc.connect(dst);
              osc.start();
              const canvas = document.createElement('canvas');
              canvas.width = 640;
              canvas.height = 480;
              const canvasStream = canvas.captureStream(10);
              return new MediaStream([...canvasStream.getVideoTracks(), ...dst.stream.getAudioTracks()]);
            }
          }
        }
      }
    };

    let isMounted = true;

    // 1. Initialize local media stream first, then connect socket
    obtainUserMediaStream().then((stream) => {
      if (!isMounted) return;

      streamRef.current = stream;
      setParticipants(prev => {
        const hasLocal = prev.some(p => p.isLocal);
        if (hasLocal) return prev.map(p => p.isLocal ? { ...p, stream } : p);
        return [{
          id: 'local',
          name: 'You',
          isLocal: true,
          speaking: false,
          muted: false,
          videoOff: false,
          stream: stream
        }, ...prev];
      });

      // 2. Connect to Socket.IO backend with polling fallback for mobile/restrictive networks
      socketRef.current = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        secure: true,
        reconnection: true,
        reconnectionAttempts: 10,
      });
      setSocket(socketRef.current);

      socketRef.current.on('connect', () => {
        console.log('✅ Connected to Backend!', socketRef.current.id);
        setBackendStatus('Connected to Backend');
        soundAudioSystem.playConnectedSound();
        
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

        setParticipants(prev => prev.map(p => p.isLocal ? { ...p, id: socketRef.current.id } : p));
        socketRef.current.emit('join-room', { roomId: id, name: user?.profile?.firstName || user?.email || 'Guest' });

        // Phase 1 Host Controls & Waiting Room Listeners
        socketRef.current.on('room:role', (data) => {
          setIsHost(data.isHost);
        });

        socketRef.current.on('room:waiting-holding', () => {
          setIsWaitingInRoom(true);
        });

        socketRef.current.on('waiting-room:admitted', () => {
          setIsWaitingInRoom(false);
        });

        socketRef.current.on('waiting-room:denied', (data) => {
          alert(data.message || 'Entry denied by host');
          navigate('/');
        });

        socketRef.current.on('waiting-room:updated', (list) => {
          setWaitingUsers(list);
        });

        socketRef.current.on('room:lock-updated', (data) => {
          setIsRoomLocked(data.isLocked);
        });

        socketRef.current.on('room:locked', (data) => {
          alert(data.message || 'Meeting is locked by the host.');
          navigate('/');
        });

        socketRef.current.on('host:muted', () => {
          setIsMuted(true);
        });

        socketRef.current.on('participant:muted', (data) => {
          setParticipants(prev => prev.map(p => p.id === data.socketId ? { ...p, muted: true } : p));
        });

        socketRef.current.on('participant:mute-all', () => {
          setIsMuted(true);
        });

        socketRef.current.on('host:removed', (data) => {
          alert(data.message || 'You have been removed from the meeting by the host.');
          navigate('/');
        });

        socketRef.current.on('hand:updated', (data) => {
          setParticipants(prev => prev.map(p => p.id === data.socketId ? { ...p, isHandRaised: data.isHandRaised } : p));
          if (data.socketId === socketRef.current?.id) {
            setIsHandRaised(data.isHandRaised);
          }
        });

        // New joiner receives list of existing room members and initiates WebRTC offer to each
        socketRef.current.on('all-users', (existingUsers) => {
          console.log('📡 [WebRTC] Room members found:', existingUsers);
          const activeStream = streamRef.current || stream;
          existingUsers.forEach(userID => {
            if (!peersRef.current.some(p => p.peerID === userID)) {
              console.log('🚀 [WebRTC Initiator] Creating offer peer connection to existing user:', userID);
              const peer = createPeer(userID, socketRef.current.id, activeStream);
              peersRef.current.push({ peerID: userID, peer });
            }
          });
        });

        // Existing members receive notice when a new user joins
        socketRef.current.on('user-joined', (data) => {
          console.log('👤 [WebRTC] New participant joined room:', data.socketId);
          soundAudioSystem.playUserJoinSound();
        });

        // Receiving an offer from a peer -> create a receiver peer (addPeer) and answer
        socketRef.current.on('offer', (data) => {
          console.log('📡 [WebRTC Receiver] Received offer from:', data.callerId);
          const activeStream = streamRef.current || stream;
          let item = peersRef.current.find(p => p.peerID === data.callerId);
          if (item) {
            item.peer.signal(data.offer);
          } else {
            const peer = addPeer(data.offer, data.callerId, activeStream);
            peersRef.current.push({ peerID: data.callerId, peer });
          }
        });

        // Receiving an answer from a peer -> pass signal into initiator peer
        socketRef.current.on('answer', (data) => {
          console.log('📡 [WebRTC Initiator] Received answer from:', data.callerId);
          const item = peersRef.current.find(p => p.peerID === data.callerId);
          if (item) {
            item.peer.signal(data.answer);
          }
        });

        // Receiving trickle ICE candidate -> pass candidate signal to peer
        socketRef.current.on('ice-candidate', (data) => {
          console.log('📡 [WebRTC] Received ICE candidate from:', data.callerId);
          const item = peersRef.current.find(p => p.peerID === data.callerId);
          if (item && item.peer) {
            item.peer.signal(data.candidate);
          }
        });

        // User left room -> destroy peer connection cleanly
        socketRef.current.on('user-left', (data) => {
          console.log('👋 [WebRTC] User left room:', data.userId);
          const peerObj = peersRef.current.find(p => p.peerID === data.userId);
          if (peerObj) {
            try { peerObj.peer.destroy(); } catch (e) {}
          }
          peersRef.current = peersRef.current.filter(p => p.peerID !== data.userId);
          setParticipants(prev => prev.filter(p => p.id !== data.userId));
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
            setTargetVoice(newSettings.voiceGender === 'female' ? 'nova' : 'alloy');
          }
        });
      });

      socketRef.current.on('disconnect', () => {
        setBackendStatus('Disconnected');
      });
    });

    return () => {
      isMounted = false;
      peersRef.current.forEach(p => {
        try { p.peer.destroy(); } catch (e) {}
      });
      peersRef.current = [];
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
    };
  }, [id]);

  const getIceServersConfig = () => {
    const turnUrl = import.meta.env.VITE_TURN_URL;
    const turnUsername = import.meta.env.VITE_TURN_USERNAME;
    const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

    const servers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ];

    if (turnUrl) {
      servers.push({
        urls: turnUrl,
        username: turnUsername || '',
        credential: turnCredential || ''
      });
    } else {
      servers.push(
        { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
      );
    }

    return { iceServers: servers };
  };

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: true,
      stream,
      config: getIceServersConfig()
    });

    peer.on('error', err => {
      console.error('❌ [WebRTC Peer Error - Initiator]:', userToSignal, err);
    });

    if (peer._pc) {
      peer._pc.oniceconnectionstatechange = () => {
        const state = peer._pc?.iceConnectionState;
        console.log(`📡 [WebRTC ICE State - Initiator] target=${userToSignal} state=${state}`);
        if (state === 'failed') {
          console.warn(`⚠️ [WebRTC ICE] Connection failed for ${userToSignal}. Check STUN/TURN server connectivity.`);
        }
      };
    }

    peer.on('signal', signal => {
      if (signal.type === 'offer') {
        socketRef.current?.emit('offer', {
          targetUserId: userToSignal,
          callerId: callerID,
          offer: signal,
          roomId: id
        });
      } else if (signal.candidate) {
        socketRef.current?.emit('ice-candidate', {
          targetUserId: userToSignal,
          callerId: callerID,
          candidate: signal,
          roomId: id
        });
      } else {
        socketRef.current?.emit('offer', {
          targetUserId: userToSignal,
          callerId: callerID,
          offer: signal,
          roomId: id
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      console.log('🎥 [WebRTC] Received remote stream from initiator target:', userToSignal);
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
      config: getIceServersConfig()
    });

    peer.on('error', err => {
      console.error('❌ [WebRTC Peer Error - Receiver]:', callerID, err);
    });

    if (peer._pc) {
      peer._pc.oniceconnectionstatechange = () => {
        const state = peer._pc?.iceConnectionState;
        console.log(`📡 [WebRTC ICE State - Receiver] caller=${callerID} state=${state}`);
        if (state === 'failed') {
          console.warn(`⚠️ [WebRTC ICE] Connection failed for caller ${callerID}. Check STUN/TURN server connectivity.`);
        }
      };
    }

    peer.on('signal', signal => {
      if (signal.type === 'answer') {
        socketRef.current?.emit('answer', {
          targetUserId: callerID,
          callerId: socketRef.current.id,
          answer: signal,
          roomId: id
        });
      } else if (signal.candidate) {
        socketRef.current?.emit('ice-candidate', {
          targetUserId: callerID,
          callerId: socketRef.current.id,
          candidate: signal,
          roomId: id
        });
      } else {
        socketRef.current?.emit('answer', {
          targetUserId: callerID,
          callerId: socketRef.current.id,
          answer: signal,
          roomId: id
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      console.log('🎥 [WebRTC] Received remote stream from receiver caller:', callerID);
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
    soundAudioSystem.playDisconnectSound();
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

  const handleToggleHand = () => {
    socketRef.current?.emit('hand:toggle', { roomId: id });
  };

  const handleAdmitUser = (targetSocketId) => {
    socketRef.current?.emit('host:admit-user', { roomId: id, targetSocketId });
  };

  const handleDenyUser = (targetSocketId) => {
    socketRef.current?.emit('host:deny-user', { roomId: id, targetSocketId });
  };

  const handleMuteUser = (targetSocketId) => {
    socketRef.current?.emit('host:mute-user', { roomId: id, targetSocketId });
  };

  const handleMuteAll = () => {
    socketRef.current?.emit('host:mute-all', { roomId: id });
  };

  const handleRemoveUser = (targetSocketId) => {
    socketRef.current?.emit('host:remove-user', { roomId: id, targetSocketId });
  };

  const handleToggleLock = () => {
    socketRef.current?.emit('host:toggle-lock', { roomId: id });
  };

  if (isWaitingInRoom) {
    return (
      <div className="waiting-room-screen" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0F0F19',
        color: '#fff',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 187, 0, 0.15)',
          border: '1px solid #FFBB00',
          borderRadius: '50%',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '2.5rem' }}>⏳</span>
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '10px' }}>Waiting for the host to admit you...</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: '420px', fontSize: '0.95rem', lineHeight: 1.5 }}>
          You have connected to the waiting room for meeting <strong>{id}</strong>. The host has been notified and will let you in shortly.
        </p>
      </div>
    );
  }

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
              <button 
                onClick={() => {
                  const text = encodeURIComponent(`Hey! Join my live AI translated video call on LinguaVersa:\n${window.location.href}`);
                  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                }}
                style={{
                  background: '#25D366', border: 'none', color: 'white',
                  padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold',
                  boxShadow: '0 2px 10px rgba(37, 211, 102, 0.4)'
                }}
              >
                📲 Share on WhatsApp
              </button>
            </div>
            <div className="meeting-badges" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <AIStatusIndicator 
                isEnabled={translationEnabled} 
                isTranslating={isTranslating} 
                latency={latency} 
              />
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

          <AudioSettingsModal
            isOpen={isAudioSettingsOpen}
            onClose={() => setIsAudioSettingsOpen(false)}
            settings={{ targetVoice, duckVolume: 0.15, autoDetect }}
            onSettingsChange={(newSet) => {
              if (newSet.targetVoice) setTargetVoice(newSet.targetVoice);
              if (newSet.autoDetect !== undefined) setAutoDetect(newSet.autoDetect);
            }}
          />

          <LanguageSheet 
            isOpen={isLanguageSheetOpen}
            onClose={() => setIsLanguageSheetOpen(false)}
            yourLang={sourceLang}
            setYourLang={setSourceLang}
            partnerLang={partnerLang}
            setPartnerLang={setPartnerLang}
            voiceGender={voiceGender}
            setVoiceGender={setVoiceGender}
            autoDetect={autoDetect}
            setAutoDetect={setAutoDetect}
            onStartTranslation={() => {
              setTranslationEnabled(true);
              socketRef.current?.emit('translation:start', { meetingId: id, sourceLang });
            }}
            isTranslationActive={translationEnabled}
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
            isTranslationActive={translationEnabled}
            onOpenTranslationSheet={() => setIsLanguageSheetOpen(true)}
            isHandRaised={isHandRaised}
            onToggleHand={handleToggleHand}
            isHost={isHost}
            isRoomLocked={isRoomLocked}
            onToggleLock={handleToggleLock}
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
          isHost={isHost}
          waitingUsers={waitingUsers}
          onAdmitUser={handleAdmitUser}
          onDenyUser={handleDenyUser}
          onMuteUser={handleMuteUser}
          onMuteAll={handleMuteAll}
          onRemoveUser={handleRemoveUser}
          isRoomLocked={isRoomLocked}
          onToggleLock={handleToggleLock}
        />

      </div>
    </div>
  );
};

export default MeetingRoom;
