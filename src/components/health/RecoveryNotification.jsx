import React, { useEffect, useState } from 'react';

export const RecoveryNotification = ({ recovering }) => {
  if (!recovering) return null;

  return (
    <div style={{
      position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, background: '#FFCC00', color: '#000',
      padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px'
    }}>
      <span className="spinner" style={{ width: 16, height: 16, border: '2px solid #000', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
      {recovering.message || `Recovering ${recovering.component}...`}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
