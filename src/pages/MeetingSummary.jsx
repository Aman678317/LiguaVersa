import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Download, Play, Users, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import './Dashboard.css'; // Reuse dashboard styles for layout

const MeetingSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Meeting Ended</h1>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>ID: {id} | Duration: 45m | 4 Participants</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><FileText /> AI Generated Notes</h3>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
              <p><strong>Action Items:</strong></p>
              <ul>
                <li>Priya to share the finalized Q3 marketing slide deck.</li>
                <li>Alex to confirm the Japanese localization budget by Friday.</li>
              </ul>
              <p><strong>Summary:</strong></p>
              <p>The team discussed the upcoming product launch in Tokyo. The translation engine performed flawlessly, allowing seamless communication between the English and Japanese teams. Budget constraints were addressed, and a follow-up meeting is scheduled.</p>
            </div>
            
            <button className="btn-primary" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}><Download size={18} /> Download Transcript</button>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ padding: '24px', borderRadius: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><Play /> Recording</h3>
              <div style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Play size={32} color="var(--primary-color)" />
              </div>
            </motion.div>

            <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ padding: '24px', borderRadius: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}><Users /> Attendance</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-muted)' }}>
                <li>Priya (Host)</li>
                <li>Alex Johnson</li>
                <li>Maria Garcia</li>
                <li>Kenji Sato</li>
              </ul>
            </motion.div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MeetingSummary;
