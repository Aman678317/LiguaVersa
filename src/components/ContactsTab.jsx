import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Trash2, ShieldAlert, UserPlus, Search } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import './ContactsTab.css';

const ContactsTab = ({ currentUserId, onCallContact, onlineUsers }) => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${BACKEND_URL}/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (e) {
      console.error('Failed to fetch contacts', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) fetchContacts();
  }, [currentUserId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const res = await fetch(`${BACKEND_URL}/users/search?q=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results.filter(u => u.id !== currentUserId));
      }
    } catch (e) {
      console.error('Failed to search', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (contactId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contactId })
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(prev => prev.filter(u => u.id !== contactId));
        fetchContacts();
      } else {
        alert(data.message || 'Failed to add contact');
      }
    } catch (e) {
      console.error('Failed to add contact', e);
    }
  };

  const handleRemoveContact = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/contacts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchContacts();
    } catch (e) {
      console.error('Failed to remove contact', e);
    }
  };

  return (
    <div className="contacts-tab-container">
      <div className="contacts-header">
        <h2>Your Network</h2>
        <p>Connect and meet instantly</p>
      </div>

      <div className="contacts-search glass">
        <form onSubmit={handleSearch}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search users by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary small">Find</button>
        </form>
      </div>

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="search-results glass"
          >
            <h4>Search Results</h4>
            {searchResults.map(user => {
              const isAlreadyContact = contacts.some(c => c.contactId === user.id);
              return (
                <div key={user.id} className="search-result-item">
                  <div className="user-info">
                    <div className="avatar small">{user.email[0].toUpperCase()}</div>
                    <span>{user.email}</span>
                  </div>
                  {isAlreadyContact ? (
                    <span className="badge">Added</span>
                  ) : (
                    <button className="btn-secondary small" onClick={() => handleAddContact(user.id)}>
                      <UserPlus size={16} /> Add
                    </button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="contacts-list">
        <h3>My Contacts</h3>
        {isLoading ? (
          <p className="loading-text">Loading network...</p>
        ) : contacts.length === 0 ? (
          <div className="empty-state">
            <ShieldAlert size={40} className="text-muted" />
            <p>Your network is empty. Search above to add colleagues.</p>
          </div>
        ) : (
          <div className="contact-cards">
            {contacts.map((contact) => (
              <motion.div 
                key={contact.id} 
                className="contact-card glass-card"
                whileHover={{ scale: 1.02 }}
              >
                <div className="contact-avatar">
                  {contact.email[0].toUpperCase()}
                  <div className={`status-dot ${onlineUsers?.has(contact.contactId) ? 'online' : 'offline'}`} title={onlineUsers?.has(contact.contactId) ? 'Online' : 'Offline'}></div>
                </div>
                <div className="contact-details">
                  <h4>{contact.email.split('@')[0]}</h4>
                  <p>{contact.email}</p>
                </div>
                <div className="contact-actions">
                  <button 
                    className="btn-primary icon-btn call-btn" 
                    title="Instant Meet"
                    onClick={() => onCallContact(contact.contactId)}
                  >
                    <Phone size={18} />
                  </button>
                  <button 
                    className="btn-danger icon-btn" 
                    onClick={() => handleRemoveContact(contact.id)}
                    title="Remove Contact"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsTab;
