import React, { useMemo } from 'react';
import VideoTile from './VideoTile';

const VideoGrid = ({ participants }) => {
  // Calculate grid layout based on number of participants
  const gridStyle = useMemo(() => {
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

  return (
    <div className="video-grid-container">
      <div className="video-grid" style={gridStyle}>
        {participants.map((p) => (
          <VideoTile key={p.id} participant={p} />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
