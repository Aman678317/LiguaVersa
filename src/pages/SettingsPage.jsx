import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, Volume2, MessageSquare, Monitor, Mic, Accessibility, ArrowLeft } from 'lucide-react';

const SettingsPage = () => {
  const { user, updateSettings } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('translation');
  const [localSettings, setLocalSettings] = useState(user?.settings || {});

  const handleChange = (field, value) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await updateSettings(localSettings);
    alert('Settings saved successfully across all devices.');
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0 }}>Global Translation Settings</h1>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '24px', overflow: 'hidden' }}>
        <div className="glass" style={{ width: '250px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <TabButton active={activeTab === 'translation'} onClick={() => setActiveTab('translation')} icon={<Settings size={18}/>} label="Translation" />
          <TabButton active={activeTab === 'voice'} onClick={() => setActiveTab('voice')} icon={<Mic size={18}/>} label="Voice" />
          <TabButton active={activeTab === 'captions'} onClick={() => setActiveTab('captions')} icon={<Monitor size={18}/>} label="Captions" />
          <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={18}/>} label="Chat" />
          <TabButton active={activeTab === 'accessibility'} onClick={() => setActiveTab('accessibility')} icon={<Accessibility size={18}/>} label="Accessibility" />
        </div>

        <div className="glass" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {activeTab === 'translation' && (
            <div className="settings-section">
              <h2>Translation Preferences</h2>
              <SettingSelect label="My Native Language" value={localSettings.nativeLanguage || 'en-US'} onChange={(v) => handleChange('nativeLanguage', v)} options={LANGUAGES} />
              <SettingSelect label="Default Speech Language" value={localSettings.speechLanguage || 'en-US'} onChange={(v) => handleChange('speechLanguage', v)} options={LANGUAGES} />
              <SettingToggle label="Auto-Start Translation in Meetings" checked={localSettings.autoStartTranslation || false} onChange={(v) => handleChange('autoStartTranslation', v)} />
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="settings-section">
              <h2>AI Voice Persona</h2>
              <SettingSelect label="Voice Gender" value={localSettings.voiceGender || 'neutral'} onChange={(v) => handleChange('voiceGender', v)} options={[{value: 'male', label: 'Male'}, {value: 'female', label: 'Female'}, {value: 'neutral', label: 'Neutral'}]} />
              <SettingSelect label="Voice Accent" value={localSettings.voiceAccent || 'standard'} onChange={(v) => handleChange('voiceAccent', v)} options={[{value: 'standard', label: 'Standard'}, {value: 'british', label: 'British'}, {value: 'indian', label: 'Indian'}]} />
              <SettingToggle label="Preserve Emotion (Dynamic Pitch)" checked={localSettings.emotionPreservation !== false} onChange={(v) => handleChange('emotionPreservation', v)} />
              
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Background Original Voice Volume (Ducking)</label>
                <input type="range" min="0" max="1" step="0.05" value={localSettings.originalVoiceVolume || 0.15} onChange={(e) => handleChange('originalVoiceVolume', parseFloat(e.target.value))} style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {activeTab === 'captions' && (
            <div className="settings-section">
              <h2>Live Captions & Subtitles</h2>
              <SettingSelect label="Caption Font Size" value={localSettings.captionFontSize || 'medium'} onChange={(v) => handleChange('captionFontSize', v)} options={[{value: 'small', label: 'Small'}, {value: 'medium', label: 'Medium'}, {value: 'large', label: 'Large'}]} />
              <SettingSelect label="Caption Position" value={localSettings.captionPosition || 'bottom'} onChange={(v) => handleChange('captionPosition', v)} options={[{value: 'top', label: 'Top'}, {value: 'bottom', label: 'Bottom'}]} />
              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Caption Color</label>
                <input type="color" value={localSettings.captionColor || '#ffffff'} onChange={(e) => handleChange('captionColor', e.target.value)} />
              </div>
              <SettingToggle label="Dual Caption Mode (Show original & translated)" checked={localSettings.dualCaptionMode !== false} onChange={(v) => handleChange('dualCaptionMode', v)} />
              <SettingToggle label="Pin Captions to Screen" checked={localSettings.pinCaptions || false} onChange={(v) => handleChange('pinCaptions', v)} />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="settings-section">
              <h2>Chat Translation</h2>
              <SettingToggle label="Auto Translate Incoming Messages" checked={localSettings.autoTranslateChat !== false} onChange={(v) => handleChange('autoTranslateChat', v)} />
              <SettingToggle label="Always Show Original Message" checked={localSettings.alwaysShowOriginal !== false} onChange={(v) => handleChange('alwaysShowOriginal', v)} />
              <SettingToggle label="Translate Voice Memos" checked={localSettings.translateVoiceMsgs !== false} onChange={(v) => handleChange('translateVoiceMsgs', v)} />
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="settings-section">
              <h2>Accessibility</h2>
              <SettingToggle label="High Contrast Mode" checked={localSettings.highContrastMode || false} onChange={(v) => handleChange('highContrastMode', v)} />
              <SettingToggle label="Enforce Large Fonts Globally" checked={localSettings.largeFonts || false} onChange={(v) => handleChange('largeFonts', v)} />
              <SettingToggle label="Color Blind Friendly UI" checked={localSettings.colorBlindMode || false} onChange={(v) => handleChange('colorBlindMode', v)} />
            </div>
          )}

          <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <button onClick={handleSave} className="btn-primary" style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
              Save Global Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
      background: active ? 'rgba(110, 86, 255, 0.2)' : 'transparent',
      border: 'none', borderRadius: '8px', color: active ? '#6E56FF' : '#ccc',
      cursor: 'pointer', textAlign: 'left', fontWeight: active ? 'bold' : 'normal',
      transition: 'all 0.2s'
    }}
  >
    {icon} {label}
  </button>
);

const SettingToggle = ({ label, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <span style={{ color: '#eee' }}>{label}</span>
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="slider round"></span>
    </label>
  </div>
);

const SettingSelect = ({ label, value, onChange, options }) => (
  <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>{label}</label>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px' }}
    >
      {options.map(opt => <option key={opt.value || opt.code} value={opt.value || opt.code}>{opt.label || opt.name}</option>)}
    </select>
  </div>
);

const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'hi-IN', name: 'Hindi' },
];

export default SettingsPage;
