import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SessionTimeoutWarning.css';

const SessionTimeoutWarning = ({ sessionTimeout = 30 * 60 * 1000 }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const navigate = useNavigate();
  const WARNING_THRESHOLD = 5 * 60 * 1000; // Show warning 5 minutes before timeout

  useEffect(() => {
    const checkSession = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (!lastActivity) return;

      const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
      const remaining = sessionTimeout - timeSinceLastActivity;

      if (remaining <= 0) {
        // Session expired
        handleLogout();
      } else if (remaining <= WARNING_THRESHOLD) {
        // Show warning
        setShowWarning(true);
        setTimeRemaining(Math.floor(remaining / 1000)); // Convert to seconds
      } else {
        setShowWarning(false);
      }
    };

    const interval = setInterval(checkSession, 1000); // Check every second
    checkSession(); // Initial check

    return () => clearInterval(interval);
  }, [sessionTimeout]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
    navigate('/login');
  };

  const handleStayLoggedIn = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
    setShowWarning(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <div className="session-timeout-overlay">
      <div className="session-timeout-modal">
        <div className="session-timeout-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h2>Session Expiring Soon</h2>
        <p>Your session will expire in <strong>{formatTime(timeRemaining)}</strong></p>
        <p className="session-timeout-subtitle">For security reasons, you'll be logged out due to inactivity.</p>
        <div className="session-timeout-actions">
          <button 
            className="session-timeout-btn session-timeout-btn-primary"
            onClick={handleStayLoggedIn}
          >
            Stay Logged In
          </button>
          <button 
            className="session-timeout-btn session-timeout-btn-secondary"
            onClick={handleLogout}
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;
