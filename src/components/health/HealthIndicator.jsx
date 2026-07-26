import React from 'react';

export const HealthIndicator = ({ healthStatus }) => {
  const getOverallStatus = () => {
    const statuses = Object.values(healthStatus);
    if (statuses.includes('attention_required')) return { color: '#FF4444', text: 'Attention Required' };
    if (statuses.includes('recovering')) return { color: '#FFCC00', text: 'Recovering' };
    return { color: '#00FFA3', text: 'Healthy' };
  };

  const status = getOverallStatus();

  return (
    <div style={{
      position: 'absolute', top: 20, right: 20, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', padding: '8px 12px',
      borderRadius: '12px', color: status.color,
      fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
      border: `1px solid ${status.color}`
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: status.color }}></div>
      System: {status.text}
    </div>
  );
};
