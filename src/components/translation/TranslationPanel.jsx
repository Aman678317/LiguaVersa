import React, { useState } from 'react';
import './TranslationPanel.css'; // Simple CSS for aesthetics

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'ja', name: 'Japanese' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ta', name: 'Tamil' },
  { code: 'mr', name: 'Marathi' },
  { code: 'pa', name: 'Punjabi' }
];

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

export const TranslationPanel = ({ 
  isEnabled, 
  onToggle, 
  targetLang, 
  onLangChange, 
  targetVoice, 
  onVoiceChange, 
  latency, 
  isTranslating,
  onOpenCaptionSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`translation-panel ${isOpen ? 'open' : 'closed'}`}>
      <button className="panel-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Close Translation' : 'A|文 Live Translation'}
      </button>

      {isOpen && (
        <div className="panel-content">
          <h3>Real-Time Voice Translation</h3>
          
          <div className="setting-group">
            <label>Enable Translation</label>
            <label className="switch">
              <input type="checkbox" checked={isEnabled} onChange={onToggle} />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="setting-group">
            <label>Your Language</label>
            <select value={targetLang} onChange={(e) => onLangChange(e.target.value)} disabled={!isEnabled}>
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label>Incoming Voice Type</label>
            <select value={targetVoice} onChange={(e) => onVoiceChange(e.target.value)} disabled={!isEnabled}>
              {VOICES.map(v => (
                <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <button 
              onClick={onOpenCaptionSettings}
              style={{
                width: '100%', padding: '8px', background: 'rgba(0,255,163,0.1)', 
                border: '1px solid #00FFA3', color: '#00FFA3', borderRadius: '4px',
                cursor: 'pointer', marginTop: '8px'
              }}
            >
              Subtitle Settings ⚙️
            </button>
          </div>

          <div className="status-board">
            <div className="status-item">
              <span className="label">Status:</span>
              <span className={`value ${isTranslating ? 'active' : 'inactive'}`}>
                {isTranslating ? '● Listening & Translating' : 'Inactive'}
              </span>
            </div>
            {isEnabled && (
              <div className="status-item">
                <span className="label">Latency:</span>
                <span className={`value ${latency < 1000 ? 'good' : 'warning'}`}>
                  {latency > 0 ? `${latency}ms` : '---'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
