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
  const [activeFilter, setActiveFilter] = useState('Past Meetings');

  const filters = [
    "Today's Meetings",
    "Upcoming Meetings",
    "Past Meetings",
    "Recurring Meetings",
    "Cancelled Meetings"
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/meetings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
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
    const titleMatch = (item.title || '').toLowerCase().includes(q);
    
    // Check if recording summaries have matching keywords
    const summaries = item.summaries || [];
    const summaryMatch = summaries.some(s => {
      return (
        (s.summary || '').toLowerCase().includes(q) ||
        (s.actionItems || []).some(a => (a || '').toLowerCase().includes(q)) ||
        (s.keyPoints || []).some(k => (k || '').toLowerCase().includes(q))
      );
    });

    let matchesFilter = true;
    const now = new Date();
    const scheduledFor = new Date(item.scheduledFor || item.createdAt);
    
    if (activeFilter === 'Upcoming Meetings') {
      matchesFilter = item.status === 'SCHEDULED' || scheduledFor > now;
    } else if (activeFilter === 'Past Meetings') {
      matchesFilter = item.status === 'COMPLETED' || scheduledFor < now;
    } else if (activeFilter === 'Cancelled Meetings') {
      matchesFilter = item.status === 'CANCELLED';
    } else if (activeFilter === "Today's Meetings") {
      matchesFilter = scheduledFor.toDateString() === now.toDateString();
    } else if (activeFilter === 'Recurring Meetings') {
      matchesFilter = item.recurringType && item.recurringType !== 'None';
    }

    return (titleMatch || summaryMatch) && matchesFilter;
  });

  return (
    <div className="history-tab">
      <div className="history-header">
        <h2>Meetings</h2>
        <p>Manage and review your meetings and AI summaries.</p>
        
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

        <div className="filter-chips">
          {filters.map(f => (
            <button 
              key={f}
              className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
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
          <div className="table-responsive">
            <table className="meetings-table">
              <thead>
                <tr>
                  <th>Meeting Name</th>
                  <th>Host</th>
                  <th>Participants</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Translation Language</th>
                  <th>Recording</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(item => {
                  const meetingName = item.title || 'Team Sync';
                  const host = 'You (Host)';
                  const participantsCount = item.participants?.length || 0;
                  const transLang = item.translationSettings 
                    ? `${item.translationSettings.meetingLanguage} → ${item.translationSettings.translationLanguage}` 
                    : 'en-US → ja-JP';
                  const hasRecording = item.settings?.recording ? 'Yes' : 'No';
                  
                  let status = 'Completed';
                  if (item.status) {
                    status = item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase();
                  } else {
                    const now = new Date();
                    const scheduledFor = new Date(item.scheduledFor || item.createdAt);
                    if (scheduledFor > now) status = 'Scheduled';
                  }

                  const statusClass = `status-chip ${status.toLowerCase()}`;
                  const durationStr = item.duration ? formatDuration(item.duration) : '60m 0s';

                  return (
                    <tr key={item.id} onClick={() => navigate(`/summary/${item.meetingCode}`)}>
                      <td className="font-medium text-white">{meetingName}</td>
                      <td>{host}</td>
                      <td>{participantsCount} Users</td>
                      <td>{formatDate(item.scheduledFor || item.createdAt)}</td>
                      <td>{durationStr}</td>
                      <td>{transLang}</td>
                      <td>{hasRecording}</td>
                      <td><span className={statusClass}>{status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
