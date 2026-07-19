import React from 'react';
import { X } from 'lucide-react';

export const CaptionSettings = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  const handleChange = (field, value) => {
    onSettingsChange({ ...settings, [field]: value });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#1a1a1a', padding: '24px', borderRadius: '12px',
        width: '350px', color: 'white', position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        <h3 style={{ marginTop: 0 }}>Caption Settings</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Font Size</label>
          <select value={settings.fontSize} onChange={(e) => handleChange('fontSize', e.target.value)} style={{ width: '100%', padding: '8px', background: '#333', color: 'white', border: 'none', borderRadius: '4px' }}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Position</label>
          <select value={settings.position} onChange={(e) => handleChange('position', e.target.value)} style={{ width: '100%', padding: '8px', background: '#333', color: 'white', border: 'none', borderRadius: '4px' }}>
            <option value="bottom">Bottom</option>
            <option value="top">Top</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Text Color</label>
          <input type="color" value={settings.color} onChange={(e) => handleChange('color', e.target.value)} style={{ width: '100%', height: '40px', border: 'none', padding: 0 }} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={settings.dualMode} onChange={(e) => handleChange('dualMode', e.target.checked)} />
            Dual Caption Mode (Show original & translated)
          </label>
        </div>

      </div>
    </div>
  );
};
