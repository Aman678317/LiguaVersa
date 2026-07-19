import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import MeetingRoom from './pages/MeetingRoom';
import MeetingSummary from './pages/MeetingSummary';
import OAuthCallback from './pages/OAuthCallback';
import SettingsPage from './pages/SettingsPage';
import Scene from './components/canvas/Scene';
import Footer from './components/Footer';

function App() {
  return (
    <AuthProvider>
      <Router>
      <Routes>
        <Route path="/" element={
          <>
            <div id="canvas-container">
              <Scene />
            </div>
            <div className="content-layer">
              <Navbar />
              <Home />
              <Footer />
            </div>
          </>
        } />
        <Route path="/auth" element={<><div id="canvas-container"><Scene /></div><div className="content-layer"><Auth /></div></>} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/meet/:id" element={<MeetingRoom />} />
        <Route path="/summary/:id" element={<MeetingSummary />} />
      </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
