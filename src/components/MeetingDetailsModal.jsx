import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Languages, Settings2, X, Video, Edit2, Trash2, Link as LinkIcon } from 'lucide-react';
import './MeetingDetailsModal.css';

const MeetingDetailsModal = ({ isOpen, onClose, meeting, onStart, onDelete, onEdit }) => {
  if (!isOpen || !meeting) return null;

  const handleCopyLink = () => {
    // Mock link copying
    navigator.clipboard.writeText(`https://linguaverse.app/meet/${meeting.id || 'demo'}`);
    alert('Meeting link copied to clipboard!');
  };

  return (
    <AnimatePresence>
      <div className="meeting-details-overlay" onClick={onClose}>
        <motion.div 
          className="meeting-details-modal"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-btn" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
            <X size={20} />
          </button>

          <div className="meeting-details-header">
            <div>
              <h2>{meeting.title || 'Marketing Team'}</h2>
              <span className="meeting-badge">Upcoming</span>
            </div>
          </div>

          <div className="meeting-details-body">
            <div className="detail-row">
              <div className="detail-icon"><Calendar size={18} /></div>
              <span>{meeting.date || 'Today'}</span>
            </div>
            
            <div className="detail-row">
              <div className="detail-icon"><Clock size={18} /></div>
              <span>{meeting.time || '10:00 AM'}</span>
            </div>
            
            <div className="detail-row">
              <div className="detail-icon"><Languages size={18} /></div>
              <span>{meeting.languageFlow || 'en-US → ja-JP'}</span>
            </div>
            
            <div className="detail-row">
              <div className="detail-icon"><Users size={18} /></div>
              <span>{meeting.participants || '4 Participants'}</span>
            </div>

            <div className="detail-row">
              <div className="detail-icon"><Settings2 size={18} /></div>
              <span style={{ color: '#00FFA3' }}>{meeting.translationStatus || 'Translation Enabled'}</span>
            </div>
          </div>

          <div className="meeting-details-footer">
            <button className="btn-start" onClick={() => onStart && onStart(meeting.id)}>
              <Video size={18} /> Start
            </button>
            
            <button className="btn-action" onClick={() => onEdit && onEdit(meeting.raw)}>
              <Edit2 size={16} /> Edit
            </button>
            
            <button className="btn-action" onClick={handleCopyLink}>
              <LinkIcon size={16} /> Copy Link
            </button>
            
            <button className="btn-action btn-delete" style={{ gridColumn: 'span 2' }} onClick={() => onDelete && onDelete(meeting.rawId)}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MeetingDetailsModal;
