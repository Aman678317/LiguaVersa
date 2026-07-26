import React from 'react';
import { X, Sliders, Volume2, Mic, Sparkles } from 'lucide-react';

export const CaptionSettings = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  const handleChange = (field, value) => {
    onSettingsChange({ ...settings, [field]: value });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'rgba(18, 20, 32, 0.95)', border: '1px solid rgba(0, 255, 163, 0.3)',
        borderRadius: '20px', width: '100%', maxWidth: '420px', color: 'white',
        padding: '24px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
      }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: 18, right: 18, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#00FFA3' }}>
          <Sliders size={22} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>AI & Audio Settings</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
          {/* Voice Speed */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
              <span>Voice Speed</span>
              <span>{settings.voiceSpeed || 1.0}x</span>
            </label>
            <input 
              type="range" min="0.5" max="2.0" step="0.1" 
              value={settings.voiceSpeed || 1.0} 
              onChange={(e) => handleChange('voiceSpeed', parseFloat(e.target.value))} 
              style={{ width: '100%', accentColor: '#00FFA3' }} 
            />
          </div>

          {/* Voice Pitch */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
              <span>Voice Pitch</span>
              <span>{settings.voicePitch || 1.0}x</span>
            </label>
            <input 
              type="range" min="0.5" max="2.0" step="0.1" 
              value={settings.voicePitch || 1.0} 
              onChange={(e) => handleChange('voicePitch', parseFloat(e.target.value))} 
              style={{ width: '100%', accentColor: '#00FFA3' }} 
            />
          </div>

          {/* Caption Size */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>Caption Size</label>
            <select 
              value={settings.fontSize || 'medium'} 
              onChange={(e) => handleChange('fontSize', e.target.value)} 
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px' }}
            >
              <option value="small" style={{ background: '#121420' }}>Small</option>
              <option value="medium" style={{ background: '#121420' }}>Medium</option>
              <option value="large" style={{ background: '#121420' }}>Large</option>
            </select>
          </div>

          {/* Translation Quality */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>Translation Quality</label>
            <select 
              value={settings.translationQuality || 'balanced'} 
              onChange={(e) => handleChange('translationQuality', e.target.value)} 
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px' }}
            >
              <option value="fast" style={{ background: '#121420' }}>Fast (Lowest Latency)</option>
              <option value="balanced" style={{ background: '#121420' }}>Balanced (Recommended)</option>
              <option value="premium" style={{ background: '#121420' }}>Premium (Highest Accuracy)</option>
            </select>
          </div>

          {/* Audio Enhancement */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 500 }}>Audio Enhancement (Noise / Echo)</span>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={settings.audioEnhancement !== false} 
                onChange={(e) => handleChange('audioEnhancement', e.target.checked)} 
                style={{ opacity: 0, width: 0, height: 0 }} 
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: settings.audioEnhancement !== false ? '#00FFA3' : 'rgba(255,255,255,0.2)',
                borderRadius: '24px', transition: '0.3s'
              }}></span>
            </label>
          </div>

          {/* Auto Detect */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 500 }}>Auto Detect Speaker Language</span>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={settings.autoDetect !== false} 
                onChange={(e) => handleChange('autoDetect', e.target.checked)} 
                style={{ opacity: 0, width: 0, height: 0 }} 
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: settings.autoDetect !== false ? '#00FFA3' : 'rgba(255,255,255,0.2)',
                borderRadius: '24px', transition: '0.3s'
              }}></span>
            </label>
          </div>

          {/* Dual Caption Mode */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 500 }}>Dual Subtitles (Original & Translated)</span>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={settings.dualMode !== false} 
                onChange={(e) => handleChange('dualMode', e.target.checked)} 
                style={{ opacity: 0, width: 0, height: 0 }} 
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: settings.dualMode !== false ? '#00FFA3' : 'rgba(255,255,255,0.2)',
                borderRadius: '24px', transition: '0.3s'
              }}></span>
            </label>
          </div>
        </div>

        <button 
          onClick={onClose} 
          style={{
            marginTop: '20px', width: '100%', padding: '12px', background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer'
          }}
        >
          Save & Done
        </button>
      </div>
    </div>
  );
};
