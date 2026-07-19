import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      className={`navbar ${scrolled ? 'glass' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="container nav-container">
        <div className="logo-container">
          <Globe className="logo-icon" size={32} />
          <span className="logo-text">LinguaVerse<span className="logo-highlight">.AI</span></span>
        </div>
        
        <div className="nav-links">
          <a href="#meet">Meet</a>
          <a href="#translate">Translate</a>
          <a href="#pricing">Pricing</a>
          <a href="#enterprise">Enterprise</a>
          <a href="#blog">Blog</a>
          <Link to="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
          <Link to="/settings" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Settings</Link>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="text-blue-400 hover:text-blue-300 px-3 py-2 rounded-md text-sm font-medium border border-blue-500/30 bg-blue-500/10">Admin</Link>
          )}
          <button onClick={handleLogout} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Logout</button>
        </div>

        <div className="nav-actions">
          {!user ? (
            <>
              <Link to="/auth" className="btn-secondary nav-login">Login</Link>
              <Link to="/auth" className="btn-primary nav-signup">Sign Up</Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn-primary">Go to App</Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
