import React, { useMemo } from 'react';
import VideoTile from './VideoTile';

const VideoGrid = ({ participants = [], translationEnabled, layoutMode = 'gallery', pinnedParticipantId, onTogglePin }) => {
  // Determine primary (stage) participant for Speaker View / Screen Share / Pinned
  const activeSpeakerOrPresenter = useMemo(() => {
    if (pinnedParticipantId) {
      const pinned = participants.find(p => p.id === pinnedParticipantId);
      if (pinned) return pinned;
    }
    const presenter = participants.find(p => p.isScreenSharing || p.isLocalScreenSharing);
    if (presenter) return presenter;

    const speaker = participants.find(p => p.speaking);
    if (speaker) return speaker;

    return participants[0] || null;
  }, [participants, pinnedParticipantId]);

  const filmstripParticipants = useMemo(() => {
    if (!activeSpeakerOrPresenter) return participants;
    return participants.filter(p => p.id !== activeSpeakerOrPresenter.id);
  }, [participants, activeSpeakerOrPresenter]);

  // Gallery View responsive grid style
  const galleryGridStyle = useMemo(() => {
    const count = participants.length;
    let columns = 1;
    let rows = 1;

    if (count === 2) { columns = 2; rows = 1; }
    else if (count <= 4) { columns = 2; rows = 2; }
    else if (count <= 6) { columns = 3; rows = 2; }
    else if (count <= 9) { columns = 3; rows = 3; }
    else if (count <= 12) { columns = 4; rows = 3; }
    else { columns = 4; rows = Math.ceil(count / 4); }

    return {
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
    };
  }, [participants.length]);

  if (layoutMode === 'speaker' && activeSpeakerOrPresenter && participants.length > 1) {
    return (
      <div className="video-grid-container speaker-layout" style={{ display: 'flex', gap: '16px', width: '100%', height: '100%', padding: '12px' }}>
        {/* Main Stage Tile */}
        <div className="main-stage-tile" style={{ flex: 1, height: '100%', minWidth: 0 }}>
          <VideoTile 
            participant={activeSpeakerOrPresenter} 
            translationEnabled={translationEnabled}
            isPinned={pinnedParticipantId === activeSpeakerOrPresenter.id}
            onTogglePin={onTogglePin}
          />
        </div>

        {/* Side Filmstrip */}
        <div className="filmstrip-column" style={{
          width: '260px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
          maxHeight: '100%'
        }}>
          {filmstripParticipants.map((p) => (
            <div key={p.id} style={{ height: '160px', minHeight: '160px', width: '100%' }}>
              <VideoTile 
                participant={p} 
                translationEnabled={translationEnabled}
                isPinned={pinnedParticipantId === p.id}
                onTogglePin={onTogglePin}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="video-grid-container" style={{ width: '100%', height: '100%', padding: '12px' }}>
      <div className="video-grid" style={{ ...galleryGridStyle, display: 'grid', gap: '12px', width: '100%', height: '100%' }}>
        {participants.map((p) => (
          <VideoTile 
            key={p.id} 
            participant={p} 
            translationEnabled={translationEnabled}
            isPinned={pinnedParticipantId === p.id}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
