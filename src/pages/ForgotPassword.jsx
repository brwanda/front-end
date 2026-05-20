import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../services/http';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data } = await http.post('/auth/forgot-password', { email });

      if (data && data.message) {
        setMessage(data.message);
      } else {
        setError('Request failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Reset Password</h1>
          <p>Enter your email to receive a reset link</p>
        </div>
        
        {!message ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to="/login" style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}>Back to Login</Link>
            </div>
          </form>
        ) : (
          <div className="success-message" style={{ textAlign: 'center' }}>
            <div style={{ color: 'green', marginBottom: '20px', padding: '10px', background: '#dcfce7', borderRadius: '8px' }}>
                {message}
            </div>
            <Link to="/login" className="login-button" style={{ display: 'inline-block', textDecoration: 'none', lineHeight: '20px' }}>
                Back to Login
            </Link>
          </div>
        )}
        
        <div className="login-footer">
          <p>Copyright © 2025 EARACONNECT. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
