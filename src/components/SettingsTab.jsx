import React, { useState, useEffect } from 'react';
import { User as UserIcon, Globe, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../config';
import './SettingsTab.css';

const SettingsTab = () => {
  const { user, token, login } = useAuth(); // login actually just sets token, wait, we need to refresh user. AuthContext fetches user when token changes, but here we can just update local state or let Context refresh if we add a refresh method. For now, we update local state.
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    timezone: 'UTC'
  });
  const [settingsData, setSettingsData] = useState({
    nativeLanguage: 'en-US',
    speechLanguage: 'en-US',
    captionLanguage: 'en-US',
    translationLanguage: 'en-US',
    captionFontSize: 'medium',
    captionTheme: 'dark',
    captionOpacity: 0.7,
    pinCaptions: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && user.profile) {
      setFormData({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        timezone: user.profile.timezone || 'UTC'
      });
    }
    if (user && user.settings) {
      setSettingsData({
        nativeLanguage: user.settings.nativeLanguage || 'en-US',
        speechLanguage: user.settings.speechLanguage || 'en-US',
        captionLanguage: user.settings.captionLanguage || 'en-US',
        translationLanguage: user.settings.translationLanguage || 'en-US',
        captionFontSize: user.settings.captionFontSize || 'medium',
        captionTheme: user.settings.captionTheme || 'dark',
        captionOpacity: user.settings.captionOpacity ?? 0.7,
        pinCaptions: user.settings.pinCaptions || false
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSettingsChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettingsData({ ...settingsData, [e.target.name]: value });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${BACKEND_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      const resSettings = await fetch(`${BACKEND_URL}/users/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsData)
      });
      const settingsResult = await resSettings.json();

      if (data.success && settingsResult.success) {
        setMessage('Preferences updated successfully! (Refresh to see changes globally)');
      } else {
        setMessage('Failed to update preferences.');
      }
    } catch (e) {
      console.error(e);
      setMessage('Error updating profile.');
    }
    setLoading(false);
  };

  return (
    <div className="settings-tab">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Manage your account preferences and profile.</p>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h3><UserIcon size={20} /> Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange} 
                placeholder="John" 
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                placeholder="Doe" 
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3><Globe size={20} /> Regional Preferences</h3>
          <div className="form-group">
            <label>Timezone</label>
            <select name="timezone" value={formData.timezone} onChange={handleChange}>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="PST">PST (Pacific Standard Time)</option>
              <option value="EST">EST (Eastern Standard Time)</option>
              <option value="IST">IST (Indian Standard Time)</option>
              <option value="JST">JST (Japan Standard Time)</option>
            </select>
          </div>
        </div>
        
        <div className="settings-section">
          <h3><Globe size={20} /> Live Captions & Translation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>My Speech Language</label>
              <select name="speechLanguage" value={settingsData.speechLanguage} onChange={handleSettingsChange}>
                <option value="en-US">English</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="zh-CN">Chinese</option>
                <option value="ja-JP">Japanese</option>
                <option value="hi-IN">Hindi</option>
                <option value="mr-IN">Marathi</option>
                <option value="gu-IN">Gujarati</option>
                <option value="pa-IN">Punjabi</option>
                <option value="ta-IN">Tamil</option>
                <option value="te-IN">Telugu</option>
                <option value="ml-IN">Malayalam</option>
                <option value="kn-IN">Kannada</option>
                <option value="bn-IN">Bengali</option>
                <option value="ur-PK">Urdu</option>
                <option value="ru-RU">Russian</option>
                <option value="ar-SA">Arabic</option>
                <option value="tr-TR">Turkish</option>
                <option value="pt-BR">Portuguese</option>
                <option value="ko-KR">Korean</option>
                <option value="it-IT">Italian</option>
              </select>
            </div>
            <div className="form-group">
              <label>Preferred Caption Language</label>
              <select name="captionLanguage" value={settingsData.captionLanguage} onChange={handleSettingsChange}>
                <option value="en-US">English</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="zh-CN">Chinese</option>
                <option value="ja-JP">Japanese</option>
                <option value="hi-IN">Hindi</option>
                <option value="mr-IN">Marathi</option>
                <option value="gu-IN">Gujarati</option>
                <option value="pa-IN">Punjabi</option>
                <option value="ta-IN">Tamil</option>
                <option value="te-IN">Telugu</option>
                <option value="ml-IN">Malayalam</option>
                <option value="kn-IN">Kannada</option>
                <option value="bn-IN">Bengali</option>
                <option value="ur-PK">Urdu</option>
                <option value="ru-RU">Russian</option>
                <option value="ar-SA">Arabic</option>
                <option value="tr-TR">Turkish</option>
                <option value="pt-BR">Portuguese</option>
                <option value="ko-KR">Korean</option>
                <option value="it-IT">Italian</option>
              </select>
            </div>
            <div className="form-group">
              <label>Caption Font Size</label>
              <select name="captionFontSize" value={settingsData.captionFontSize} onChange={handleSettingsChange}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="xlarge">Extra Large</option>
              </select>
            </div>
            <div className="form-group">
              <label>Caption Theme</label>
              <select name="captionTheme" value={settingsData.captionTheme} onChange={handleSettingsChange}>
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
                <option value="transparent">Transparent</option>
              </select>
            </div>
          </div>
        </div>

        {message && (
          <div style={{ padding: '12px', borderRadius: '8px', background: message.includes('success') ? 'rgba(0,255,163,0.1)' : 'rgba(255,68,68,0.1)', color: message.includes('success') ? '#00FFA3' : '#FF4444' }}>
            {message}
          </div>
        )}

        <div className="settings-actions">
          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
