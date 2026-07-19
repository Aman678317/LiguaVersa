import { useState, useEffect, useRef, useCallback } from 'react';
import { VAD } from '../utils/VAD';
import { CaptionSynchronizer } from '../utils/CaptionSynchronizer';

export const useRealTimeTranslation = (socket, roomId, userId, sourceLang, isEnabled) => {
  const [captions, setCaptions] = useState([]);
  const [latency, setLatency] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const lastChunkTimeRef = useRef(0);
  const sequenceIdRef = useRef(0);
  const vadRef = useRef(null);
  const synchronizerRef = useRef(null);

  // Initialize Audio Playback Queue
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
  }, []);

  // Handle incoming sockets
  useEffect(() => {
    if (!socket || !isEnabled) return;

    if (!synchronizerRef.current) {
      synchronizerRef.current = new CaptionSynchronizer((payload) => {
        setCaptions(prev => {
          const newCaptions = [...prev, payload];
          // Keep only the last 5 finalized captions
          return newCaptions.slice(-5);
        });
        if (lastChunkTimeRef.current) {
          setLatency(Date.now() - lastChunkTimeRef.current);
        }
      });
    }

    const handlePartial = (data) => {
      // Partial updates only append or overwrite the *current* live speaking line.
      // For simplicity, we just inject a special "partial" element at the end of the array.
      setCaptions(prev => {
        const filtered = prev.filter(c => !c.isPartial);
        return [...filtered, { ...data, isPartial: true }];
      });
    };

    const handleFinal = (data) => {
      // Queue it for sync
      synchronizerRef.current.queueCaption(data.sequenceId, { ...data, isPartial: false });
      
      // If it's the sender's own speech (no TTS delay), display immediately
      if (data.speakerId === userId) {
        synchronizerRef.current.syncAndDisplay(data.sequenceId);
      }
    };

    const handleAudioOut = async (data) => {
      if (!audioContextRef.current || data.senderId === userId) return;
      
      try {
        const rawAudio = data.audioData.data || data.audioData;
        
        // Fallback to Web Speech API if backend returned an empty/0-byte buffer (e.g. missing TTS API keys)
        if (!rawAudio || rawAudio.length === 0) {
          if (data.translatedText && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(data.translatedText);
            
            const langMap = { 'English': 'en-US', 'Spanish': 'es-ES', 'French': 'fr-FR', 'German': 'de-DE', 'Chinese': 'zh-CN', 'Japanese': 'ja-JP', 'Hindi': 'hi-IN', 'Marathi': 'mr-IN' };
            utterance.lang = langMap[data.targetLang] || 'en-US';
            
            window.speechSynthesis.speak(utterance);
            
            if (synchronizerRef.current) {
              synchronizerRef.current.syncAndDisplay(data.sequenceId);
            }
            
            const estDuration = Math.max(2, (data.translatedText.split(' ').length / 150) * 60);
            window.dispatchEvent(new CustomEvent('translation:playing', { detail: { duration: estDuration } }));
          }
          return;
        }

        const audioData = new Uint8Array(rawAudio).buffer;
        const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);

        const currentTime = audioContextRef.current.currentTime;
        if (nextPlayTimeRef.current < currentTime) {
          nextPlayTimeRef.current = currentTime + 0.1; // small buffer
        }

        source.start(nextPlayTimeRef.current);
        
        // Trigger synchronized caption display when audio starts playing
        // Timeout based on difference between now and nextPlayTime
        const delayMs = Math.max(0, (nextPlayTimeRef.current - currentTime) * 1000);
        setTimeout(() => {
          if (synchronizerRef.current) {
            synchronizerRef.current.syncAndDisplay(data.sequenceId);
          }
        }, delayMs);

        nextPlayTimeRef.current += audioBuffer.duration;

        // Note: Ducking of WebRTC audio happens in MeetingRoom.jsx via AudioMixer
        // emit custom event so the UI knows translated audio is playing
        window.dispatchEvent(new CustomEvent('translation:playing', { detail: { duration: audioBuffer.duration } }));
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    };

    socket.on('caption:partial', handlePartial);
    socket.on('caption:final', handleFinal);
    socket.on('translation:audio-out', handleAudioOut);

    return () => {
      socket.off('caption:partial', handlePartial);
      socket.off('caption:final', handleFinal);
      socket.off('translation:audio-out', handleAudioOut);
    };
  }, [socket, isEnabled, userId]);

  // Handle Microphone Recording
  const startRecording = useCallback(async (stream) => {
    if (!socket || !isEnabled) return;
    
    try {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      setIsTranslating(true);

      // Initialize VAD
      if (!vadRef.current) {
        vadRef.current = new VAD(audioContextRef.current, stream);
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0 && isEnabled) {
          // Check Voice Activity Detection
          if (vadRef.current && !vadRef.current.isSpeaking()) {
            return; // Skip silent chunks
          }

          lastChunkTimeRef.current = Date.now();
          sequenceIdRef.current += 1;
          const arrayBuffer = await e.data.arrayBuffer();
          
          socket.emit('translation:chunk', {
            sequenceId: sequenceIdRef.current,
            audioChunk: arrayBuffer,
            senderId: userId,
            roomId,
            sourceLang
          });
        }
      };
      
      // Request chunks every 400ms for low latency STT streaming
      recorder.start(400);
      
      socket.emit('translation:start', { meetingId: roomId, sourceLang });
    } catch (e) {
      console.error("Recording error:", e);
      setIsTranslating(false);
    }
  }, [socket, isEnabled, roomId, userId, sourceLang]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (vadRef.current) {
      vadRef.current.stop();
      vadRef.current = null;
    }
    socket?.emit('translation:stop', { meetingId: roomId });
    setIsTranslating(false);
  }, [socket, roomId]);

  return { captions, latency, isTranslating, startRecording, stopRecording, audioContext: audioContextRef.current };
};
