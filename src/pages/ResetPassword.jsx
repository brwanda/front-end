import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import http from '../services/http';
import './Login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data } = await http.post('/auth/reset-password', { token, password });

      if (data && data.message) {
        setMessage(data.message);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError('Reset failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="error-message">Invalid reset link.</div>
          <Link to="/login" className="login-button" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Set New Password</h1>
          <p>Please enter your new password</p>
        </div>

        {!message ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter new password"
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          <div className="success-message" style={{ textAlign: 'center' }}>
            <div style={{ color: 'green', marginBottom: '20px', padding: '10px', background: '#dcfce7', borderRadius: '8px' }}>
              {message}
            </div>
            <p>Redirecting to login...</p>
            <Link to="/login" className="login-button" style={{ display: 'inline-block', textDecoration: 'none', lineHeight: '20px' }}>
              Login Now
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

export default ResetPassword;
