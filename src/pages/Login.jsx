import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import HODPermissionService from '../services/hodPermissionService';
import http from '../services/http';
import './Login.css';

import EaracgRealLogo from '../assets/earacg-faceted-peak.svg';
import RwandaLogo from '../assets/Rwanda.jpeg';
import KenyaLogo from '../assets/Kenya.jpeg';
import UgandaLogo from '../assets/Uganda.jpeg';
import TanzaniaLogo from '../assets/Tanzania.png';
import BurundiLogo from '../assets/Burundi.jpeg';
import SouthSudanLogo from '../assets/South Sudan.jpeg';
import ZanzibarLogo from '../assets/Zanzibar.jpeg';

const loginLogos = [
  { src: RwandaLogo, alt: 'Rwanda Revenue Authority' },
  { src: KenyaLogo, alt: 'Kenya Revenue Authority' },
  { src: UgandaLogo, alt: 'Uganda Revenue Authority' },
  { src: TanzaniaLogo, alt: 'Tanzania Revenue Authority' },
  { src: BurundiLogo, alt: 'Office Burundais des Recettes' },
  { src: SouthSudanLogo, alt: 'National Revenue Authority' },
  { src: ZanzibarLogo, alt: 'Zanzibar Revenue Authority' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await http.post('/auth/login', { email, password });

      if (data && data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('lastActivity', Date.now().toString());

        // Redirect based on user role and HoD privileges
        const user = data.user;
        let redirectPath = '/dashboard'; // Default to general dashboard

        // Check if user has HoD privileges first (Chair of Head of Delegation)
        const hasHODPrivileges = HODPermissionService.hasHODPrivileges(user);

        if (hasHODPrivileges) {
          redirectPath = '/hod/dashboard';
        } else {
          const userRole = user.role;
          switch (userRole) {
            case 'ADMIN':
              redirectPath = '/admin/dashboard';
              break;
            case 'SECRETARY':
              redirectPath = '/secretary/dashboard';
              break;
            case 'CHAIR':
              redirectPath = '/chair/dashboard';
              break;
            case 'VICE_CHAIR':
              redirectPath = '/chair/dashboard';
              break;
            case 'COMMISSIONER_GENERAL':
              redirectPath = '/commissioner/dashboard';
              break;
            case 'HOD':
              redirectPath = '/hod/dashboard';
              break;
            case 'SUBCOMMITTEE_MEMBER':
            case 'COMMITTEE_MEMBER':
              redirectPath = '/member/dashboard';
              break;
            case 'COMMITTEE_SECRETARY':
            case 'DELEGATION_SECRETARY':
              redirectPath = '/secretary/dashboard';
              break;
            default:
              redirectPath = '/dashboard';
          }
        }

        // Use React Router style redirect
        window.location.href = redirectPath;
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      // Show correct backend error message instead of generic network error
      const backendError = err?.response?.data?.error;
      if (backendError) {
        setError(backendError);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <button 
        className="login-back-to-home"
        onClick={() => navigate('/')}
        aria-label="Back to home"
        title="Back to Home Page"
      >
        <FaArrowLeft />
        <span>Back to Home</span>
      </button>
      
      <div className="login-floating-logos">
        {loginLogos.map((logo, i) => (
          <div
            className="login-floating-orb"
            key={i}
            style={{ '--orb-index': i }}
          >
            <img src={logo.src} alt={logo.alt} />
          </div>
        ))}
      </div>
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-ring">
            <img src={EaracgRealLogo} alt="EARACG official logo" />
          </div>
          <h1>EARA Connect</h1>
          <p>East Africa Revenue Authorities Commissioner General</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group login-anim-field" style={{ '--field-index': 0 }}>
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

          <div className="form-group login-anim-field" style={{ '--field-index': 1 }}>
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <Link to="/forgot-password" style={{ color: '#60a5fa', fontSize: '14px', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button login-anim-field" style={{ '--field-index': 2 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Copyright © 2025 EARACONNECT. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 