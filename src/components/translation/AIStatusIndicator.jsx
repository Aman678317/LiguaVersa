import React from 'react';
import { Activity, Radio, Volume2, CheckCircle2 } from 'lucide-react';
import './AIStatusIndicator.css';

export const AIStatusIndicator = ({ isEnabled, isTranslating, latency, isGeneratingVoice }) => {
  if (!isEnabled) return null;

  let statusText = 'Connected';
  let IconComponent = CheckCircle2;
  let statusClass = 'connected';

  if (isGeneratingVoice) {
    statusText = 'Generating Voice...';
    IconComponent = Volume2;
    statusClass = 'generating';
  } else if (isTranslating) {
    statusText = 'AI Translating...';
    IconComponent = Activity;
    statusClass = 'translating';
  } else {
    statusText = 'AI Listening...';
    IconComponent = Radio;
    statusClass = 'listening';
  }

  return (
    <div className={`ai-status-pill ${statusClass}`}>
      <span className="status-dot-pulse"></span>
      <IconComponent size={14} className="status-icon" />
      <span className="status-label">{statusText}</span>
      {latency > 0 && <span className="latency-badge">{latency}ms</span>}
    </div>
  );
};
