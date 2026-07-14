import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    // Extract token from query params: ?token=xxxxxx
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      login(token);
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [location, login, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: 'white' }}>
      <h2>Authenticating...</h2>
    </div>
  );
};

export default OAuthCallback;
