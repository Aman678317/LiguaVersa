import React, { useState, useEffect } from 'react';
import { PhoneIncoming, PhoneOutgoing, Clock, Sparkles, PhoneMissed, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import './HistoryTab.css';

const HistoryTab = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredHistory = history.filter(item => {
    const q = searchQuery.toLowerCase();
    const titleMatch = (item.meeting?.title || '').toLowerCase().includes(q);
    
    // Check if recording summaries have matching keywords
    const recordings = item.meeting?.recordings || [];
    const summaryMatch = recordings.some(r => {
      const s = r.summaryJson || {};
      return (
        (s.summary || '').toLowerCase().includes(q) ||
        (s.actionItems || []).some(a => a.toLowerCase().includes(q)) ||
        (s.keyPoints || []).some(k => k.toLowerCase().includes(q))
      );
    });

    return titleMatch || summaryMatch;
  });

  return (
    <div className="history-tab">
      <div className="history-header">
        <h2>Call History</h2>
        <p>Review your past meetings and AI summaries.</p>
        
        <div style={{ marginTop: '20px', position: 'relative', maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="text" 
            placeholder="Search meetings, action items, keywords..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 16px 12px 48px', 
              borderRadius: '20px', 
              border: '1px solid var(--glass-border)', 
              background: 'var(--glass-bg)',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div className="history-list">
        {loading ? (
          <div className="empty-history">Loading history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-history">
            <Clock size={48} />
            <p>No results found for "{searchQuery}".</p>
          </div>
        ) : (
          filteredHistory.map(item => (
            <div className="history-card" key={item.id}>
              <div className="history-info">
                <div className={`history-icon ${item.type.toLowerCase()}`}>
                  {item.type === 'INCOMING' ? <PhoneIncoming size={24} /> : 
                   item.type === 'OUTGOING' ? <PhoneOutgoing size={24} /> : 
                   <PhoneMissed size={24} />}
                </div>
                <div className="history-details">
                  <h4>{item.meeting?.title || 'Meeting'}</h4>
                  <p>
                    <Clock size={14} /> {formatDate(item.createdAt)} • {formatDuration(item.duration || 0)}
                  </p>
                </div>
              </div>
              <div className="history-actions">
                <button 
                  className="summary-btn"
                  onClick={() => navigate(`/summary/${item.meeting?.meetingCode || item.meetingId}`)}
                >
                  <Sparkles size={16} /> View AI Summary
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
