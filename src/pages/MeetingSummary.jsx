import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Download, Play, Users, ArrowLeft, CheckCircle, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../config';

const MeetingSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'radial-gradient(circle at top right, #1a1a2e, #0f0f1a)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#00FFA3', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'radial-gradient(circle at top right, #1a1a2e, #0f0f1a)' }}>
        <h2 style={{ color: 'white' }}>Meeting not found.</h2>
      </div>
    );
  }

  const latestRecording = meeting.recordings && meeting.recordings.length > 0 ? meeting.recordings[meeting.recordings.length - 1] : null;
  const summaryJson = latestRecording?.summaryJson || {};
  const speechHistories = meeting.speechHistories || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #1a1a2e, #0f0f1a)', color: 'white' }}>
      <div className="dash-main" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <motion.button 
          className="btn-secondary small" 
          onClick={() => navigate('/dashboard')} 
          style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}
          whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </motion.button>

        <motion.div 
          className="summary-header glass-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          style={{ padding: '40px', borderRadius: '24px', marginBottom: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0,255,163,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
                <CheckCircle color="#00FFA3" size={40} />
              </motion.div>
              <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-0.5px' }}>{meeting.title || 'Meeting'} Ended</h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', margin: 0 }}>ID: {id} • Hosted by {meeting.host?.profile?.firstName || meeting.host?.email}</p>
          </div>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* AI Summary */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '30px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '1.4rem' }}><FileText color="#3b82f6" /> AI Generated Summary</h3>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', lineHeight: '1.8', color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem' }}>
                {summaryJson.summary ? (
                  <>
                    <p style={{ color: '#00FFA3', fontWeight: '600', marginBottom: '10px' }}>Summary:</p>
                    <p style={{ marginBottom: '20px' }}>{summaryJson.summary}</p>
                    
                    <p style={{ color: '#3b82f6', fontWeight: '600', marginBottom: '10px' }}>Key Points:</p>
                    <ul style={{ marginBottom: '20px', paddingLeft: '20px' }}>
                      {(summaryJson.keyPoints || []).map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                      ))}
                    </ul>

                    <p style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '10px' }}>Action Items:</p>
                    <ul style={{ paddingLeft: '20px' }}>
                      {(summaryJson.actionItems || []).map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p style={{ opacity: 0.6 }}>AI Summary is being generated or no recording was saved.</p>
                )}
              </div>
            </motion.div>

            {/* Transcript (Script of video) */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '30px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '1.4rem' }}><MessageSquare color="#8b5cf6" /> Meeting Transcript</h3>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                {speechHistories.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {speechHistories.map((speech) => {
                      const speakerName = speech.participant?.user?.profile?.firstName || speech.participant?.user?.email || 'Unknown User';
                      return (
                        <div key={speech.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{speakerName}</span>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '12px', borderTopLeftRadius: 0, color: 'rgba(255,255,255,0.9)' }}>
                            {speech.transcription}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>No transcript data available.</p>
                )}
              </div>
            </motion.div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Recording Video */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '30px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '1.4rem' }}><Play color="#ec4899" /> Video Recording</h3>
              {latestRecording ? (
                <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <video src={`${BACKEND_URL}${latestRecording.url}`} controls style={{ width: '100%', display: 'block' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: '160px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>No recording available.</p>
                </div>
              )}
            </motion.div>

            {/* Attendance */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '30px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '1.4rem' }}><Users color="#10b981" /> Attendance</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '12px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {(meeting.host?.profile?.firstName?.[0] || meeting.host?.email?.[0] || 'H').toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>{meeting.host?.profile?.firstName || meeting.host?.email}</div>
                    <div style={{ fontSize: '0.8rem', color: '#00FFA3' }}>Host</div>
                  </div>
                </li>
                {(meeting.participants || []).map(p => (
                  <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '12px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {(p.user?.profile?.firstName?.[0] || p.user?.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{p.user?.profile?.firstName || p.user?.email}</div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Participant</div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default MeetingSummary;
