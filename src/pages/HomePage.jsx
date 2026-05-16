import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

import EaracgRealLogo from '../assets/earacg-faceted-peak.svg';
import RwandaLogo from '../assets/Rwanda.jpeg';
import KenyaLogo from '../assets/Kenya.jpeg';
import UgandaLogo from '../assets/Uganda.jpeg';
import TanzaniaLogo from '../assets/Tanzania.png';
import BurundiLogo from '../assets/Burundi.jpeg';
import SouthSudanLogo from '../assets/South Sudan.jpeg';
import ZanzibarLogo from '../assets/Zanzibar.jpeg';

const COUNTRY_LOGOS = {
  'Rwanda': RwandaLogo,
  'Kenya': KenyaLogo,
  'Uganda': UgandaLogo,
  'Tanzania': TanzaniaLogo,
  'Burundi': BurundiLogo,
  'South Sudan': SouthSudanLogo,
  'Zanzibar': ZanzibarLogo,
};

const LANDING_LOGOS = [
  { name: 'EARACG', src: EaracgRealLogo },
  { name: 'Rwanda', src: RwandaLogo },
  { name: 'Kenya', src: KenyaLogo },
  { name: 'Uganda', src: UgandaLogo },
  { name: 'Tanzania', src: TanzaniaLogo },
  { name: 'Burundi', src: BurundiLogo },
  { name: 'South Sudan', src: SouthSudanLogo },
  { name: 'Zanzibar', src: ZanzibarLogo }
];

const MARQUEE_LOGOS = [...LANDING_LOGOS, ...LANDING_LOGOS, ...LANDING_LOGOS];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Top Navigation Bar */}
      <header className="home-navbar">
        <div className="home-navbar-brand">
          <div className="home-logo-icon">
            <img src={EaracgRealLogo} alt="EARACG official logo" />
          </div>
          <div>
            <span className="home-brand-name">EARA Connect</span>
            <span className="home-brand-sub">EARACG Platform</span>
          </div>
        </div>
        <nav className="home-navbar-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#countries">Member States</a>
          <button className="home-nav-login-btn" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-logo-bg" aria-hidden="true">
          <div className="home-hero-logo-track home-hero-logo-track--row1">
            {MARQUEE_LOGOS.map((logo, index) => (
              <div className="home-hero-logo-item" key={`row1-${logo.name}-${index}`}>
                <img src={logo.src} alt="" />
              </div>
            ))}
          </div>
          <div className="home-hero-logo-track home-hero-logo-track--row2">
            {MARQUEE_LOGOS.map((logo, index) => (
              <div className="home-hero-logo-item" key={`row2-${logo.name}-${index}`}>
                <img src={logo.src} alt="" />
              </div>
            ))}
          </div>
          <div className="home-hero-logo-track home-hero-logo-track--row3">
            {MARQUEE_LOGOS.map((logo, index) => (
              <div className="home-hero-logo-item" key={`row3-${logo.name}-${index}`}>
                <img src={logo.src} alt="" />
              </div>
            ))}
          </div>
        </div>
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <div className="home-hero-badge">
            East Africa Revenue Authorities Commissioner Generals (EARACG)
          </div>
          <h1 className="home-hero-title">
            Welcome to <span className="home-highlight">EARA Connect</span>
          </h1>
          <p className="home-hero-subtitle">
            The unified digital platform for the East Africa Revenue Authorities Commissioner Generals (EARACG). 
            Streamlining committee operations, meetings, resolutions, and cross-border collaboration 
            among East African revenue authorities.
          </p>
          <div className="home-hero-actions">
            <button className="home-cta-primary" onClick={() => navigate('/login')}>
              Sign In
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="home-cta-secondary" onClick={() => navigate('/login')}>
              Get Started
            </button>
          </div>
          <div className="home-hero-stats">
            <div className="home-stat">
              <span className="home-stat-number">7</span>
              <span className="home-stat-label">Member States</span>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat">
              <span className="home-stat-number">6</span>
              <span className="home-stat-label">Subcommittees</span>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat">
              <span className="home-stat-number">1</span>
              <span className="home-stat-label">Unified Platform</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="home-about">
        <div className="home-section-container">
          <div className="home-section-header">
            <span className="home-section-badge">About EARACG</span>
            <h2>Strengthening Governance Across East Africa</h2>
            <p>
              The East Africa Revenue Authorities Commissioner Generals (EARACG) 
              brings together revenue authorities from seven East African countries to foster 
              cooperation, share best practices, and drive regional growth.
            </p>
          </div>
          <div className="home-about-grid">
            <div className="home-about-card">
              <div className="home-about-icon home-about-icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Collaborative Governance</h3>
              <p>Facilitating dialogue and cooperation among Commissioner Generals and Heads of Delegation from each member state.</p>
            </div>
            <div className="home-about-card">
              <div className="home-about-icon home-about-icon-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3>Meeting Management</h3>
              <p>Organize and track committee meetings with automated attendance, minutes, and resolution workflows.</p>
            </div>
            <div className="home-about-card">
              <div className="home-about-icon home-about-icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3>Performance Tracking</h3>
              <p>Monitor resolution implementation, task completion, and subcommittee performance with real-time dashboards.</p>
            </div>
            <div className="home-about-card">
              <div className="home-about-icon home-about-icon-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3>Report Generation</h3>
              <p>Generate comprehensive reports with full audit trails, from task assignments through HoD and CG approvals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="home-features">
        <div className="home-section-container">
          <div className="home-section-header">
            <span className="home-section-badge">Platform Features</span>
            <h2>Built for Enterprise-Grade Committee Operations</h2>
          </div>
          <div className="home-features-grid">
            <div className="home-feature-item">
              <div className="home-feature-number">01</div>
              <h4>Meeting Lifecycle</h4>
              <p>Schedule, invite, record attendance, capture minutes, and track follow-up resolutions — all in one place.</p>
            </div>
            <div className="home-feature-item">
              <div className="home-feature-number">02</div>
              <h4>Resolution Tracking</h4>
              <p>Assign resolutions to subcommittees, break them into tasks, and monitor implementation progress.</p>
            </div>
            <div className="home-feature-item">
              <div className="home-feature-number">03</div>
              <h4>Role-Based Dashboards</h4>
              <p>Dedicated dashboards for Chairs, Secretaries, Members, Heads of Delegation, and Commissioner Generals.</p>
            </div>
            <div className="home-feature-item">
              <div className="home-feature-number">04</div>
              <h4>Multi-Level Approvals</h4>
              <p>Structured approval workflows: Member → Chair Review → HoD Approval → CG Final Approval.</p>
            </div>
            <div className="home-feature-item">
              <div className="home-feature-number">05</div>
              <h4>Deadline Management</h4>
              <p>Automated deadline tracking with notifications for overdue tasks and upcoming deadlines.</p>
            </div>
            <div className="home-feature-item">
              <div className="home-feature-number">06</div>
              <h4>Cross-Border Collaboration</h4>
              <p>Connect seven national revenue authorities with secure, unified communication tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="home-workflow">
        <div className="home-section-container">
          <div className="home-section-header">
            <span className="home-section-badge">System Workflow</span>
            <h2>Structured Committee Process</h2>
            <p>Every committee action follows a strict, auditable governance workflow.</p>
          </div>
          <div className="home-workflow-steps">
            <div className="home-workflow-step">
              <div className="home-step-icon">1</div>
              <div className="home-step-content">
                <h4>Meeting</h4>
                <p>Schedule and organize</p>
              </div>
            </div>
            <div className="home-workflow-connector" />
            <div className="home-workflow-step">
              <div className="home-step-icon">2</div>
              <div className="home-step-content">
                <h4>Attendance</h4>
                <p>Record participation</p>
              </div>
            </div>
            <div className="home-workflow-connector" />
            <div className="home-workflow-step">
              <div className="home-step-icon">3</div>
              <div className="home-step-content">
                <h4>Minutes</h4>
                <p>Capture proceedings</p>
              </div>
            </div>
            <div className="home-workflow-connector" />
            <div className="home-workflow-step">
              <div className="home-step-icon">4</div>
              <div className="home-step-content">
                <h4>Resolution</h4>
                <p>Create action items</p>
              </div>
            </div>
            <div className="home-workflow-connector" />
            <div className="home-workflow-step">
              <div className="home-step-icon">5</div>
              <div className="home-step-content">
                <h4>Tasks</h4>
                <p>Assign to members</p>
              </div>
            </div>
            <div className="home-workflow-connector" />
            <div className="home-workflow-step">
              <div className="home-step-icon">6</div>
              <div className="home-step-content">
                <h4>Review & Approve</h4>
                <p>Chair → HoD → CG</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section id="countries" className="home-countries">
        <div className="home-section-container">
          <div className="home-section-header">
            <span className="home-section-badge">Member States</span>
            <h2>East African Revenue Authorities</h2>
            <p>Uniting revenue administrations across the East African Community.</p>
          </div>
          <div className="home-countries-grid">
            {[
              { name: 'Rwanda', authority: 'Rwanda Revenue Authority (RRA)' },
              { name: 'Kenya', authority: 'Kenya Revenue Authority (KRA)' },
              { name: 'Uganda', authority: 'Uganda Revenue Authority (URA)' },
              { name: 'Tanzania', authority: 'Tanzania Revenue Authority (TRA)' },
              { name: 'Burundi', authority: 'Office Burundais des Recettes (OBR)' },
              { name: 'South Sudan', authority: 'National Revenue Authority (NRA)' },
              { name: 'Zanzibar', authority: 'Zanzibar Revenue Authority (ZRA)' },
            ].map((country) => (
              <div className="home-country-card" key={country.name}>
                <div className="home-country-flag">
                  <img src={COUNTRY_LOGOS[country.name] || EaracgRealLogo} alt={`${country.name} logo`} />
                </div>
                <h4>{country.name}</h4>
                <p>{country.authority}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-section-container">
          <div className="home-footer-grid">
            <div className="home-footer-brand">
              <div className="home-logo-icon home-footer-logo">
                <img src={EaracgRealLogo} alt="EARACG official logo" />
              </div>
              <div>
                <strong>EARA Connect</strong>
                <p>East African Revenue Authorities Commissioner Generals</p>
              </div>
            </div>
            <div className="home-footer-links">
              <h5>Platform</h5>
              <a href="#about">About EARACG</a>
              <a href="#features">Features</a>
              <a href="#countries">Member States</a>
            </div>
            <div className="home-footer-links">
              <h5>Access</h5>
              <button onClick={() => navigate('/login')} className="home-footer-link-btn">Sign In</button>
              <button onClick={() => navigate('/forgot-password')} className="home-footer-link-btn">Reset Password</button>
            </div>
          </div>
          <div className="home-footer-bottom">
            <p>&copy; {new Date().getFullYear()} EARA Connect — EARACG. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
