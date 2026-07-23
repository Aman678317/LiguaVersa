import React, { useState } from 'react';
import './TranslationPanel.css'; // Simple CSS for aesthetics

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'de-DE', name: 'German' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'mr-IN', name: 'Marathi' }
];

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
            <label>My Language</label>
            <select value={targetLang} onChange={(e) => onLangChange(e.target.value)}>
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
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
