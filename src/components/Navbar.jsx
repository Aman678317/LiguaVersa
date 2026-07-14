import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

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
        </div>

        <div className="nav-actions">
          <button className="btn-secondary nav-login">Login</button>
          <button className="btn-primary nav-signup">Sign Up</button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
