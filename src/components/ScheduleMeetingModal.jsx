import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X } from 'lucide-react';
import './ScheduleMeetingModal.css';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Hindi', 'Marathi'];
const TIMEZONES = [
  'Pacific Time (PT)', 'Mountain Time (MT)', 'Central Time (CT)', 
  'Eastern Time (ET)', 'Greenwich Mean Time (GMT)', 'Central European Time (CET)',
  'Indian Standard Time (IST)', 'Japan Standard Time (JST)'
];

const ScheduleMeetingModal = ({ isOpen, onClose, onSchedule }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hostName: '',
    date: '',
    startTime: '',
    endTime: '',
    timeZone: 'Indian Standard Time (IST)',
    meetingLanguage: 'English',
    translationLanguage: 'Hindi',
    meetingType: 'Video',
    participants: '',
    password: '',
    waitingRoom: true,
    recording: false,
    liveTranslation: true,
    liveCaptions: true,
    aiSummary: true,
    recurring: 'None',
    reminder: '15 Minutes',
    inviteEmail: true,
    inviteInApp: true,
    invitePush: true,
    inviteWhatsapp: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSchedule) onSchedule(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="schedule-modal-overlay" onClick={onClose}>
        <motion.div 
          className="schedule-modal"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="schedule-modal-header">
            <h2><Calendar size={22} className="text-primary" /> Schedule Meeting</h2>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div className="schedule-modal-body">
              {/* Basic Info */}
              <div className="form-group">
                <label>Meeting Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Quarterly Sync" />
              </div>
              
              <div className="form-group">
                <label>Meeting Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="What is this meeting about?"></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Host Name</label>
                  <input type="text" name="hostName" value={formData.hostName} onChange={handleChange} placeholder="Your Name" />
                </div>
                <div className="form-group">
                  <label>Meeting Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Optional" />
                </div>
              </div>

              {/* Date & Time */}
              <div className="form-row">
                <div className="form-group">
                  <label>Meeting Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Time Zone</label>
                  <select name="timeZone" value={formData.timeZone} onChange={handleChange}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
                </div>
              </div>

              {/* Languages & Type */}
              <div className="form-row">
                <div className="form-group">
                  <label>Meeting Language</label>
                  <select name="meetingLanguage" value={formData.meetingLanguage} onChange={handleChange}>
                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Translation Language</label>
                  <select name="translationLanguage" value={formData.translationLanguage} onChange={handleChange}>
                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Meeting Type</label>
                <div className="radio-group">
                  {['Video', 'Voice', 'Webinar'].map(type => (
                    <label key={type} className="radio-label">
                      <input type="radio" name="meetingType" value={type} checked={formData.meetingType === type} onChange={handleChange} />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              {/* Participants */}
              <div className="form-group">
                <label>Participants (Email Invite / Add Contacts)</label>
                <input type="text" name="participants" value={formData.participants} onChange={handleChange} placeholder="comma, separated, emails" />
              </div>

              {/* Send Invitations */}
              <div className="form-group">
                <label>Send Invitations (Automatically send)</label>
                <div className="checkbox-grid">
                  <label className="checkbox-label">
                    <input type="checkbox" name="inviteEmail" checked={formData.inviteEmail} onChange={handleChange} /> Email invitation
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" name="inviteInApp" checked={formData.inviteInApp} onChange={handleChange} /> In-app notification
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" name="invitePush" checked={formData.invitePush} onChange={handleChange} /> Push notification
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" name="inviteWhatsapp" checked={formData.inviteWhatsapp} onChange={handleChange} /> WhatsApp link (optional)
                  </label>
                </div>
              </div>

              {/* AI & Features Toggles */}
              <div className="form-group">
                <label>Features & Settings</label>
                <div className="checkbox-grid">
                  <label className="checkbox-label">
                    <input type="checkbox" name="waitingRoom" checked={formData.waitingRoom} onChange={handleChange} /> Waiting Room
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" name="recording" checked={formData.recording} onChange={handleChange} /> Recording
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" name="liveTranslation" checked={formData.liveTranslation} onChange={handleChange} /> Live Translation
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" name="liveCaptions" checked={formData.liveCaptions} onChange={handleChange} /> Live Captions
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" name="aiSummary" checked={formData.aiSummary} onChange={handleChange} /> AI Meeting Summary
                  </label>
                </div>
              </div>

              {/* Scheduling Details */}
              <div className="form-row">
                <div className="form-group">
                  <label>Recurring Meeting</label>
                  <select name="recurring" value={formData.recurring} onChange={handleChange}>
                    <option value="None">None</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Reminder</label>
                  <select name="reminder" value={formData.reminder} onChange={handleChange}>
                    <option value="None">None</option>
                    <option value="15 Minutes">15 Minutes</option>
                    <option value="30 Minutes">30 Minutes</option>
                    <option value="1 Hour">1 Hour</option>
                    <option value="1 Day">1 Day</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="schedule-modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-schedule">Schedule</button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ScheduleMeetingModal;
