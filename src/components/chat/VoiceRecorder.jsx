import React, { useState, useRef } from 'react';
import { Mic, Square, Loader } from 'lucide-react';

export const VoiceRecorder = ({ onSendVoice }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        // Note: In a real app we might upload the blob to a storage bucket and send the URL.
        // Since we are using websockets, we can emit the buffer directly.
        const arrayBuffer = await audioBlob.arrayBuffer();
        onSendVoice(arrayBuffer);
        setIsProcessing(false);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Microphone access denied or error:", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {isProcessing ? (
        <Loader size={20} className="spin" color="#00FFA3" />
      ) : isRecording ? (
        <button onClick={stopRecording} style={{ background: '#FF4444', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex' }}>
          <Square size={16} color="white" />
        </button>
      ) : (
        <button onClick={startRecording} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', color: '#888' }}>
          <Mic size={20} />
        </button>
      )}
      {isRecording && <span style={{ fontSize: '0.8rem', color: '#FF4444', animation: 'pulse 1.5s infinite' }}>Recording...</span>}
    </div>
  );
};
