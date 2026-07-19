import React from 'react';
import { Sparkles } from 'lucide-react';

export const SmartReplies = ({ replies, onSelect }) => {
  if (!replies || replies.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 0', paddingBottom: '4px', scrollbarWidth: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: '4px' }}>
        <Sparkles size={16} color="#00FFA3" />
      </div>
      {replies.map((reply, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(reply)}
          style={{
            background: 'rgba(0, 255, 163, 0.1)',
            border: '1px solid rgba(0, 255, 163, 0.3)',
            color: '#00FFA3',
            borderRadius: '16px',
            padding: '6px 12px',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}
        >
          {reply}
        </button>
      ))}
    </div>
  );
};
