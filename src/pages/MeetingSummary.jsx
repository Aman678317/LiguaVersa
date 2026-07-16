import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Download, Play, Users, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import './Dashboard.css'; // Reuse dashboard styles for layout
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../config';

const MeetingSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/meetings/summary/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMeeting(data.meeting);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (token && id) fetchSummary();
  }, [id, token]);

  if (loading) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Loading summary...</div>;
  }

  if (!meeting) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Meeting not found.</div>;
  }

  const latestRecording = meeting.recordings && meeting.recordings.length > 0 ? meeting.recordings[meeting.recordings.length - 1] : null;
  const summaryJson = latestRecording?.summaryJson || {};

  return (
    <div className="dashboard-container">
      <div className="dash-main" style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        
        <button className="btn-secondary small" onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <motion.div 
          className="summary-header glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '30px', borderRadius: '20px', marginBottom: '30px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <CheckCircle color="#00FFA3" size={28} />
            <h1 style={{ margin: 0, fontSize: '2rem' }}>{meeting.title || 'Meeting'} Ended</h1>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>ID: {id} | Host: {meeting.host?.email}</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><FileText /> AI Generated Notes</h3>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
              {summaryJson.summary ? (
                <>
                  <p><strong>Action Items:</strong></p>
                  <ul>
                    {(summaryJson.actionItems || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  <p><strong>Key Points:</strong></p>
                  <ul>
                    {(summaryJson.keyPoints || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  <p><strong>Summary:</strong></p>
                  <p>{summaryJson.summary}</p>
                </>
              ) : (
                <p>AI Summary is being generated or no recording was saved.</p>
              )}
            </div>
            
            <button className="btn-primary" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}><Download size={18} /> Download Transcript</button>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ padding: '24px', borderRadius: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><Play /> Recording</h3>
              {latestRecording ? (
                <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                  <video src={`${BACKEND_URL}${latestRecording.url}`} controls style={{ width: '100%' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p>No recording available.</p>
                </div>
              )}
            </motion.div>

            <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ padding: '24px', borderRadius: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}><Users /> Attendance</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-muted)' }}>
                <li>{meeting.host?.profile?.firstName || meeting.host?.email} (Host)</li>
                {(meeting.participants || []).map(p => (
                  <li key={p.id}>{p.user?.profile?.firstName || p.user?.email}</li>
                ))}
              </ul>
            </motion.div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MeetingSummary;
