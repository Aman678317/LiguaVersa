import React from 'react';
import { Globe, Check, Sparkles, X } from 'lucide-react';
import { soundAudioSystem } from '../../utils/SoundAudioSystem';
import './LanguageSheet.css';

const LANGUAGES = [
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  { code: 'en-US', name: 'English', native: 'English' },
  { code: 'es-ES', name: 'Spanish', native: 'Español' },
  { code: 'fr-FR', name: 'French', native: 'Français' },
  { code: 'de-DE', name: 'German', native: 'Deutsch' },
  { code: 'zh-CN', name: 'Chinese', native: '中文' },
  { code: 'ja-JP', name: 'Japanese', native: '日本語' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी' },
];

export const LanguageSheet = ({
  isOpen,
  onClose,
  yourLang,
  setYourLang,
  partnerLang,
  setPartnerLang,
  voiceGender,
  setVoiceGender,
  autoDetect,
  setAutoDetect,
  onStartTranslation,
  isTranslationActive
}) => {
  if (!isOpen) return null;

  const handleStart = () => {
    soundAudioSystem.playTranslationStartSound();
    onStartTranslation();
    onClose();
  };

  return (
    <div className="language-sheet-overlay" onClick={onClose}>
      <div className="language-sheet glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <div className="title-group">
            <Globe className="globe-icon pulse-glow" size={22} />
            <h3>AI Translation Setup</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="sheet-body">
          {/* Your Language */}
          <div className="form-group">
            <label>Your Language</label>
            <div className="select-wrapper">
              <select value={yourLang} onChange={(e) => setYourLang(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.native})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Partner Language */}
          <div className="form-group">
            <label>Partner Language</label>
            <div className="select-wrapper">
              <select value={partnerLang} onChange={(e) => setPartnerLang(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.native})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Voice Gender Selection */}
          <div className="form-group">
            <label>Voice Output</label>
            <div className="voice-options">
              <button
                type="button"
                className={`voice-btn ${voiceGender === 'male' ? 'active' : ''}`}
                onClick={() => setVoiceGender('male')}
              >
                Male
              </button>
              <button
                type="button"
                className={`voice-btn ${voiceGender === 'female' ? 'active' : ''}`}
                onClick={() => setVoiceGender('female')}
              >
                Female
              </button>
            </div>
          </div>

          {/* Auto Detect Checkbox */}
          <div className="form-group auto-detect-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
              />
              <span className="checkmark">
                {autoDetect && <Check size={14} />}
              </span>
              <span className="checkbox-label">Enable Auto Detect Language</span>
            </label>
          </div>
        </div>

        <div className="sheet-footer">
          <button className="start-translation-btn" onClick={handleStart}>
            <Sparkles size={18} />
            <span>{isTranslationActive ? 'Update Settings' : 'Start Translation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
