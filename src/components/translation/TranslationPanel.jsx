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
  onOpenCaptionSettings,
  captionsEnabled,
  onToggleCaptions,
  summaryEnabled,
  onToggleSummary,
  isRecording,
  onToggleRecording
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`translation-panel ${isOpen ? 'open' : 'closed'}`}>
      <button className="panel-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Close Translation' : 'A|文 Live Translation'}
      </button>

      {isOpen && (
        <div className="panel-content">
          <h3>Meeting Settings</h3>
          
          <div className="setting-group">
            <label>Language</label>
            <select value={targetLang} onChange={(e) => onLangChange(e.target.value)}>
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label>Translation</label>
            <select value={targetVoice} onChange={(e) => onVoiceChange(e.target.value)}>
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="setting-group toggle-row">
            <label>Captions</label>
            <label className="switch">
              <input type="checkbox" checked={captionsEnabled} onChange={onToggleCaptions} />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="setting-group toggle-row">
            <label>Meeting Summary</label>
            <label className="switch">
              <input type="checkbox" checked={summaryEnabled} onChange={onToggleSummary} />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="setting-group toggle-row">
            <label>Recording</label>
            <label className="switch">
              <input type="checkbox" checked={isRecording} onChange={onToggleRecording} />
              <span className="slider round"></span>
            </label>
          </div>

        </div>
      )}
    </div>
  );
};
