import React from 'react';

export const AudioSettingsModal = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#1a1a1a', padding: '24px', borderRadius: '12px',
        width: '400px', color: 'white'
      }}>
        <h3 style={{ marginTop: 0 }}>Advanced Audio Settings</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Voice Profile</label>
          <select 
            value={settings.targetVoice}
            onChange={(e) => onSettingsChange({ ...settings, targetVoice: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#333', color: 'white', border: 'none' }}
          >
            <option value="alloy">Alloy (Neutral)</option>
            <option value="echo">Echo (Deep)</option>
            <option value="fable">Fable (Expressive)</option>
            <option value="onyx">Onyx (Authoritative)</option>
            <option value="nova">Nova (Energetic)</option>
            <option value="shimmer">Shimmer (Clear)</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Original Voice Ducking (Volume)</label>
          <input 
            type="range" 
            min="0" max="1" step="0.1" 
            value={settings.duckVolume}
            onChange={(e) => onSettingsChange({ ...settings, duckVolume: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '0.8rem', color: '#aaa', textAlign: 'right' }}>
            {Math.round(settings.duckVolume * 100)}%
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={settings.autoDetect}
              onChange={(e) => onSettingsChange({ ...settings, autoDetect: e.target.checked })}
            />
            Auto-Detect Incoming Language
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: '1px solid #555',
              background: 'transparent', color: 'white', cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
