import React, { useState, useEffect } from 'react';
import { Volume2, Mic, Headphones, Sparkles, X, Sliders } from 'lucide-react';
import { soundAudioSystem } from '../../utils/SoundAudioSystem';

export const AudioSettingsModal = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [devices, setDevices] = useState({ inputs: [], outputs: [] });
  const [selectedInput, setSelectedInput] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');
  const [masterVolume, setMasterVolume] = useState(1.0);

  useEffect(() => {
    if (isOpen) {
      soundAudioSystem.getAudioDevices().then(d => {
        setDevices(d);
        if (d.inputs.length > 0) setSelectedInput(d.inputs[0].deviceId);
        if (d.outputs.length > 0) setSelectedOutput(d.outputs[0].deviceId);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestSound = () => {
    soundAudioSystem.playTranslationStartSound();
  };

  const handleVolumeChange = (v) => {
    setMasterVolume(v);
    soundAudioSystem.setVolume(v);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'rgba(18, 20, 32, 0.95)', border: '1px solid rgba(0, 255, 163, 0.3)',
        borderRadius: '20px', width: '100%', maxWidth: '440px', color: 'white',
        padding: '24px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
      }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: 18, right: 18, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#00FFA3' }}>
          <Volume2 size={22} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Sound Audio System</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Master Volume */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
              <span>Master Sound Volume</span>
              <span>{Math.round(masterVolume * 100)}%</span>
            </label>
            <input 
              type="range" min="0" max="1" step="0.05" 
              value={masterVolume} 
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))} 
              style={{ width: '100%', accentColor: '#00FFA3' }} 
            />
          </div>

          {/* Test Sound Effect */}
          <button 
            type="button"
            onClick={handleTestSound}
            style={{
              padding: '10px 14px', background: 'rgba(0, 255, 163, 0.15)',
              border: '1px solid #00FFA3', borderRadius: '12px', color: '#00FFA3',
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <Sparkles size={16} />
            <span>Test Sound Effect Chime</span>
          </button>

          {/* Microphone Selector */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
              <Mic size={14} /> Microphone Input
            </label>
            <select 
              value={selectedInput} 
              onChange={(e) => setSelectedInput(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px' }}
            >
              {devices.inputs.length > 0 ? (
                devices.inputs.map(d => <option key={d.deviceId} value={d.deviceId} style={{ background: '#121420' }}>{d.label || `Microphone ${d.deviceId.slice(0, 5)}`}</option>)
              ) : (
                <option style={{ background: '#121420' }}>Default System Microphone</option>
              )}
            </select>
          </div>

          {/* Speaker Selector */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
              <Headphones size={14} /> Speaker / Output
            </label>
            <select 
              value={selectedOutput} 
              onChange={(e) => setSelectedOutput(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px' }}
            >
              {devices.outputs.length > 0 ? (
                devices.outputs.map(d => <option key={d.deviceId} value={d.deviceId} style={{ background: '#121420' }}>{d.label || `Speaker ${d.deviceId.slice(0, 5)}`}</option>)
              ) : (
                <option style={{ background: '#121420' }}>Default System Speakers</option>
              )}
            </select>
          </div>

          {/* Voice Profile */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>AI Translation Voice</label>
            <select 
              value={settings?.targetVoice || 'alloy'}
              onChange={(e) => onSettingsChange && onSettingsChange({ ...settings, targetVoice: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px' }}
            >
              <option value="alloy" style={{ background: '#121420' }}>Alloy (Neutral)</option>
              <option value="echo" style={{ background: '#121420' }}>Echo (Male)</option>
              <option value="fable" style={{ background: '#121420' }}>Fable (Expressive Male)</option>
              <option value="onyx" style={{ background: '#121420' }}>Onyx (Deep Male)</option>
              <option value="nova" style={{ background: '#121420' }}>Nova (Female)</option>
              <option value="shimmer" style={{ background: '#121420' }}>Shimmer (Soft Female)</option>
            </select>
          </div>

          {/* Audio Ducking */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
              <span>Background Audio Ducking</span>
              <span>{Math.round((settings?.duckVolume ?? 0.15) * 100)}%</span>
            </label>
            <input 
              type="range" min="0" max="0.5" step="0.05" 
              value={settings?.duckVolume ?? 0.15}
              onChange={(e) => onSettingsChange && onSettingsChange({ ...settings, duckVolume: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#00FFA3' }}
            />
          </div>
        </div>

        <button 
          onClick={onClose}
          style={{
            marginTop: '20px', width: '100%', padding: '12px', background: '#00FFA3',
            border: 'none', borderRadius: '12px', color: '#0B0E14', fontWeight: 700, cursor: 'pointer'
          }}
        >
          Save Audio System Settings
        </button>
      </div>
    </div>
  );
};
