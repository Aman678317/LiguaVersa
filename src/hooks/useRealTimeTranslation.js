import { useState, useEffect, useRef, useCallback } from 'react';
import { VAD } from '../utils/VAD';
import { CaptionSynchronizer } from '../utils/CaptionSynchronizer';
import { AudioStreamBuilder } from '../utils/AudioStreamBuilder';

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
  const streamBuildersRef = useRef({}); // targetSocketId -> AudioStreamBuilder

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
      if (!audioContextRef.current) return;
      
      try {
        const rawAudio = data.audioData.data || data.audioData;
        if (!rawAudio || rawAudio.length === 0) return;

        // If we are the sender, we need to build the WebRTC track
        if (data.senderId === userId) {
          const targetSocketId = data.targetSocketId;
          
          if (!streamBuildersRef.current[targetSocketId]) {
            const builder = new AudioStreamBuilder(audioContextRef.current);
            streamBuildersRef.current[targetSocketId] = builder;
            
            // Notify MeetingRoom that a new translated track is ready for this peer
            const stream = builder.getStream();
            const track = stream.getAudioTracks()[0];
            window.dispatchEvent(new CustomEvent('translation:track-ready', { 
              detail: { targetSocketId, track, stream } 
            }));
          }
          
          const builder = streamBuildersRef.current[targetSocketId];
          await builder.addAudioChunk(rawAudio);

          // Trigger synchronized caption display
          if (synchronizerRef.current) {
            synchronizerRef.current.syncAndDisplay(data.sequenceId);
          }
        }
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
