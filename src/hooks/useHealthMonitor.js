import { useState, useEffect, useRef } from 'react';

export const useHealthMonitor = (socket, roomId, localStream, peersRef) => {
  const [healthStatus, setHealthStatus] = useState({
    audio: 'healthy',
    video: 'healthy',
    network: 'healthy',
    translation: 'healthy'
  });

  const [recovering, setRecovering] = useState(null);

  // Monitor Audio/Video Tracks
  useEffect(() => {
    const interval = setInterval(() => {
      if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        const videoTracks = localStream.getVideoTracks();

        if (audioTracks.length > 0 && audioTracks[0].readyState === 'ended' && healthStatus.audio === 'healthy') {
          reportIssue('audio', 'Microphone disconnected or track ended');
        }

        if (videoTracks.length > 0 && videoTracks[0].readyState === 'ended' && healthStatus.video === 'healthy') {
          reportIssue('video', 'Camera disconnected or track ended');
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [localStream, healthStatus]);

  const reportIssue = (component, issue) => {
    setHealthStatus(prev => ({ ...prev, [component]: 'attention_required' }));
    if (socket && roomId) {
      socket.emit('health:report_issue', { component, issue, roomId });
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('health:recovering', (data) => {
      setRecovering(data);
      setHealthStatus(prev => ({ ...prev, [data.component]: 'recovering' }));
    });

    socket.on('health:fixed', (data) => {
      setRecovering(null);
      setHealthStatus(prev => ({ ...prev, [data.component]: 'healthy' }));
      // Could show a success toast here
    });

    socket.on('health:error', (data) => {
      setRecovering(null);
      setHealthStatus(prev => ({ ...prev, [data.component]: 'attention_required' }));
    });

    return () => {
      socket.off('health:recovering');
      socket.off('health:fixed');
      socket.off('health:error');
    };
  }, [socket]);

  return { healthStatus, recovering, reportIssue };
};
