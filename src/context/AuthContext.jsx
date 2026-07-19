import React, { createContext, useContext, useState, useEffect } from 'react';
import { BACKEND_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      
      // Fetch full user profile
      fetch(`${BACKEND_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
        } else {
          throw new Error('Failed to fetch user');
        }
      })
      .catch(err => {
        console.error(err);
        setToken(null);
        localStorage.removeItem('token');
        setUser(null);
      });

    } else {
      setUser(null);
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const updateSettings = async (newSettings) => {
    try {
      const res = await fetch(`${BACKEND_URL}/users/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => ({
          ...prev,
          settings: { ...prev.settings, ...data.settings }
        }));
        return true;
      }
    } catch (e) {
      console.error("Failed to update settings:", e);
    }
    return false;
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateSettings, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
