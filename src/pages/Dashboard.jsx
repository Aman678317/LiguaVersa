import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Calendar, Users, Clock, Settings, Search, Plus, Sparkles, Hash } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import MeetingCreatedModal from '../components/MeetingCreatedModal';
import IncomingCallModal from '../components/IncomingCallModal';
import ContactsTab from '../components/ContactsTab';
import HistoryTab from '../components/HistoryTab';
import SettingsTab from '../components/SettingsTab';
import ScheduleMeetingModal from '../components/ScheduleMeetingModal';
import CalendarTab from '../components/CalendarTab';
import MeetingDetailsModal from '../components/MeetingDetailsModal';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { token, user } = useAuth();
  const [createdMeetingCode, setCreatedMeetingCode] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [allMeetings, setAllMeetings] = useState([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingToEdit, setMeetingToEdit] = useState(null);

  const fetchMeetings = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${BACKEND_URL}/meetings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setAllMeetings(data);
        const upcoming = data.filter(m => m.status === 'SCHEDULED' || new Date(m.scheduledFor) > new Date());
        setUpcomingMeetings(upcoming);
      }
    } catch (err) {
      console.error("Failed to fetch meetings", err);
    }
  };

  React.useEffect(() => {
    fetchMeetings();
  }, [token]);

  React.useEffect(() => {
    // Request notification permissions
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    if (!user?.id) return;

    const socket = io(BACKEND_URL, { 
      transports: ['websocket'],
      query: { userId: user.id }
    });
    
    // Presence tracking
    socket.emit('get-online-users');
    
    socket.on('online-users-list', (users) => {
      setOnlineUsers(new Set(users));
    });

    socket.on('user-online', ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    });

    socket.on('user-offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // Handle incoming calls globally
    socket.onAny((eventName, ...args) => {
      if (eventName.startsWith('invite-received-')) {
        setIncomingCall(args[0]);
        
        // Native OS Notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Incoming Video Call 📞', {
            body: 'Someone is calling you on LinguaVerse!',
          });
        }
      }
    });

    return () => socket.disconnect();
  }, [user]);

  const handleCreateMeeting = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/meetings/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title: 'Instant Meeting' })
      });
      const data = await response.json();
      if (data.meetingCode) {
        setCreatedMeetingCode(data.meetingCode);
      }
    } catch (err) {
      console.error('Failed to create meeting', err);
      alert('Failed to connect to backend server. Ensure it is running.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCallContact = async (contactId) => {
    setIsCreating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/meetings/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title: 'Instant Meeting' })
      });
      const data = await response.json();
      if (data.meetingCode) {
        await fetch(`${BACKEND_URL}/meetings/invite`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            meetingCode: data.meetingCode, 
            receiverId: contactId 
          })
        });
        setCreatedMeetingCode(data.meetingCode);
      }
    } catch (err) {
      console.error('Failed to call contact', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    setJoinError('');
    let code = joinCode.trim();
    if (!code) return;
    
    if (code.includes('/meet/')) {
      code = code.split('/meet/').pop();
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/meetings/validate/${code}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.valid) {
        navigate(`/meet/${code}`);
      } else {
        setJoinError(data.message || 'Meeting not found.');
      }
    } catch (err) {
      setJoinError('Failed to connect to server.');
    }
  };

  const handleScheduleMeeting = async (formData) => {
    setIsCreating(true);
    try {
      const url = meetingToEdit 
        ? `${BACKEND_URL}/meetings/${meetingToEdit.id}`
        : `${BACKEND_URL}/meetings`;
      const method = meetingToEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success || data.meetingId || data.id) {
        alert(`Meeting "${formData.title}" ${meetingToEdit ? 'updated' : 'scheduled'} successfully!`);
        fetchMeetings();
      } else {
        alert(`Failed to ${meetingToEdit ? 'update' : 'schedule'} meeting.`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error ${meetingToEdit ? 'updating' : 'scheduling'} meeting.`);
    } finally {
      setIsCreating(false);
      setMeetingToEdit(null);
    }
  };

  const handleEditClick = (rawMeeting) => {
    if (!rawMeeting) return;
    
    // Parse scheduledFor back into date and time strings
    let date = '';
    let startTime = '';
    if (rawMeeting.scheduledFor) {
      const d = new Date(rawMeeting.scheduledFor);
      date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      startTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    setMeetingToEdit({
      id: rawMeeting.id,
      title: rawMeeting.title || '',
      description: rawMeeting.description || '',
      password: rawMeeting.password || '',
      date,
      startTime,
      meetingLanguage: rawMeeting.translationSettings?.meetingLanguage || 'English',
      translationLanguage: rawMeeting.translationSettings?.translationLanguage || 'Hindi',
      liveTranslation: rawMeeting.settings?.liveTranslation ?? true,
      liveCaptions: rawMeeting.settings?.liveCaptions ?? true,
      aiSummary: rawMeeting.settings?.aiSummary ?? true,
      recording: rawMeeting.settings?.recording ?? false,
      waitingRoom: rawMeeting.waitingRoom ?? false,
    });
    setSelectedMeeting(null);
    setIsScheduleModalOpen(true);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dash-sidebar glass">
        <div className="dash-logo">
          <Sparkles className="text-primary" />
          <span>LinguaVerse</span>
        </div>
        
        <nav className="dash-nav">
          <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Video size={20} /> Home
          </button>
          <button className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <Calendar size={20} /> Calendar
          </button>
          <button className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
            <Users size={20} /> Contacts
          </button>
          <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <Clock size={20} /> History
          </button>
          <button className="nav-item" onClick={() => navigate('/settings')}>
            <Settings size={20} /> Settings
          </button>
        </nav>

        <div className="dash-user">
          <div className="avatar">{user?.email?.[0]?.toUpperCase() || 'U'}</div>
          <div className="user-info">
            <span className="name">{user?.email?.split('@')[0] || 'User'}</span>
            <span className="plan">Pro Plan</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dash-main">
        <div className="dash-header">
          <div className="search-bar glass">
            <Search size={18} className="text-muted" />
            <input type="text" placeholder="Search meetings, contacts..." />
          </div>
          <div className="date-display">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="dash-content">
          {activeTab === 'home' ? (
            <>
              <div className="dash-hero">
                <div className="time-greeting">
                  <h2>Welcome back, {user?.profile?.firstName || user?.email?.split('@')[0] || 'User'}!</h2>
                <p>Ready for your next global meeting?</p>
                </div>
              </div>

          <div className="action-cards">
            <motion.div 
              className="action-card primary glass-card"
              whileHover={{ scale: 1.02 }}
              onClick={handleCreateMeeting}
              style={{ opacity: isCreating ? 0.7 : 1, pointerEvents: isCreating ? 'none' : 'auto' }}
            >
              <div className="icon-wrapper"><Video size={28} /></div>
              <h3>{isCreating ? 'Generating...' : 'New Meeting'}</h3>
              <p>Start an instant AI translated meeting</p>
            </motion.div>

            <motion.div className="action-card join glass-card" whileHover={{ scale: 1.02 }}>
              <div className="icon-wrapper"><Hash size={28} /></div>
              <h3>Join Meeting</h3>
              <form onSubmit={handleJoinMeeting} className="join-form">
                <input 
                  type="text" 
                  placeholder="Enter 12-digit code" 
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
                />
                <button type="submit">Join</button>
              </form>
              {joinError && <div style={{ color: '#ff4444', fontSize: '0.8rem', marginTop: '8px' }}>{joinError}</div>}
            </motion.div>

            <motion.div 
              className="action-card schedule glass-card" 
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setMeetingToEdit(null);
                setIsScheduleModalOpen(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="icon-wrapper"><Calendar size={28} /></div>
              <h3>Schedule</h3>
              <p>Plan a meeting for later</p>
            </motion.div>
          </div>

          <div className="upcoming-meetings">
            <h2>Upcoming Meetings</h2>
            <div className="meeting-list">
              {upcomingMeetings.length === 0 ? (
                <div style={{ color: '#888', fontStyle: 'italic', padding: '12px' }}>No upcoming meetings scheduled.</div>
              ) : (
                upcomingMeetings.map(m => (
                  <div 
                    key={m.id}
                    className="meeting-item glass" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedMeeting({
                      id: m.meetingCode,
                      rawId: m.id,
                      title: m.title,
                      date: m.scheduledFor ? new Date(m.scheduledFor).toLocaleDateString() : 'TBD',
                      time: m.scheduledFor ? new Date(m.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
                      languageFlow: `${m.translationSettings?.meetingLanguage || 'English'} → ${m.translationSettings?.translationLanguage || 'Hindi'}`,
                      participants: `${m.participants?.length || 0} Participants`,
                      translationStatus: m.settings?.liveTranslation ? 'Translation Enabled' : 'Translation Disabled',
                      raw: m
                    })}
                  >
                    <div className="m-time">
                      <span className="m-hour">{m.scheduledFor ? new Date(m.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</span>
                      <span className="m-duration">60 Min</span>
                    </div>
                    <div className="m-details">
                      <h4>{m.title}</h4>
                      <p>{m.translationSettings?.meetingLanguage || 'English'} ➔ {m.translationSettings?.translationLanguage || 'Hindi'} | {m.participants?.length || 0} Participants</p>
                    </div>
                    <button className="btn-secondary small" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/meet/${m.meetingCode}`);
                    }}>Start</button>
                  </div>
                ))
              )}
            </div>
          </div>
          </>
          ) : activeTab === 'calendar' ? (
            <CalendarTab events={allMeetings} onEventClick={(event) => setSelectedMeeting(event)} />
          ) : activeTab === 'contacts' ? (
            <ContactsTab currentUserId={user?.id} onCallContact={handleCallContact} onlineUsers={onlineUsers} />
          ) : activeTab === 'history' ? (
            <HistoryTab />
          ) : (
            <div className="coming-soon">
              <h2>Coming Soon</h2>
              <p>This feature is currently under development.</p>
            </div>
          )}
        </div>
      </div>

      <MeetingCreatedModal 
        isOpen={!!createdMeetingCode} 
        meetingCode={createdMeetingCode} 
        onClose={() => setCreatedMeetingCode(null)} 
      />

      <IncomingCallModal 
        invitation={incomingCall} 
        onAccept={() => setIncomingCall(null)} 
        onDecline={() => setIncomingCall(null)} 
      />

      <ScheduleMeetingModal 
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setMeetingToEdit(null);
        }}
        onSchedule={handleScheduleMeeting}
        initialData={meetingToEdit}
        isEdit={!!meetingToEdit}
      />

      <MeetingDetailsModal
        isOpen={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        meeting={selectedMeeting}
        onStart={(id) => navigate(`/meet/${id}`)}
        onEdit={(raw) => handleEditClick(raw)}
        onDelete={async (rawId) => {
          try {
            await fetch(`${BACKEND_URL}/meetings/${rawId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchMeetings();
            setSelectedMeeting(null);
          } catch (e) {
            console.error("Failed to delete", e);
          }
        }}
      />
    </div>
  );
};

export default Dashboard;
