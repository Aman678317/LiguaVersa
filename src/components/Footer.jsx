import React from 'react';
import './Footer.css';
import { Globe, Mail, MessageSquare, Share2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer glass">
      <div className="container footer-container">
        <div className="footer-brand">
          <div className="logo-container">
            <Globe className="logo-icon" size={24} />
            <span className="logo-text">LinguaVerse<span className="logo-highlight">.AI</span></span>
          </div>
          <p className="footer-description">
            Breaking language barriers with real-time AI translation in spatial environments.
          </p>
          <div className="social-links">
            <a href="#" className="social-icon"><Mail size={20} /></a>
            <a href="#" className="social-icon"><MessageSquare size={20} /></a>
            <a href="#" className="social-icon"><Share2 size={20} /></a>
          </div>
        </div>

        <div className="footer-links-group">
          <h4>Product</h4>
          <a href="#">Translation</a>
          <a href="#">Video Calling</a>
          <a href="#">Enterprise</a>
          <a href="#">Pricing</a>
        </div>

        <div className="footer-links-group">
          <h4>Company</h4>
          <a href="#">About</a>
          <a href="#">Blog</a>
          <a href="#">Careers</a>
          <a href="#">Contact</a>
        </div>

        <div className="footer-links-group">
          <h4>Legal</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} LinguaVerse AI. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
