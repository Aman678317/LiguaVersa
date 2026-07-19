import { useState, useEffect, useRef, useCallback } from 'react';
import { VAD } from '../utils/VAD';

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

    const handleCaption = (data) => {
      setCaptions(prev => [...prev.slice(-4), data]);
    };

    const handleText = (data) => {
      setCaptions(prev => {
        const last = prev[prev.length - 1];
        if (last && last.originalText === data.originalText && last.senderId === data.senderId) {
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, translatedText: data.translatedText };
          return updated;
        }
        return [...prev.slice(-4), data];
      });
      // Calculate Latency
      if (lastChunkTimeRef.current) {
        setLatency(Date.now() - lastChunkTimeRef.current);
      }
    };

    const handleAudioOut = async (data) => {
      if (!audioContextRef.current || data.senderId === userId) return;
      
      try {
        const audioData = new Uint8Array(data.audioData.data || data.audioData).buffer;
        const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);

        const currentTime = audioContextRef.current.currentTime;
        if (nextPlayTimeRef.current < currentTime) {
          nextPlayTimeRef.current = currentTime + 0.1; // small buffer
        }

        source.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += audioBuffer.duration;

        // Note: Ducking of WebRTC audio happens in MeetingRoom.jsx via AudioMixer
        // emit custom event so the UI knows translated audio is playing
        window.dispatchEvent(new CustomEvent('translation:playing', { detail: { duration: audioBuffer.duration } }));
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    };

    socket.on('translation:caption', handleCaption);
    socket.on('translation:text', handleText);
    socket.on('translation:audio-out', handleAudioOut);

    return () => {
      socket.off('translation:caption', handleCaption);
      socket.off('translation:text', handleText);
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
