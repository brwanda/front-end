import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaSignOutAlt, FaCalendar, FaFileAlt, FaArchive, FaChartBar, FaGlobe, FaUsers, FaTasks } from 'react-icons/fa';
import EaracgLogo from '../../assets/earacg-faceted-peak.png';
import './Sidebar.css';

const Sidebar = () => {
  // Get user data from localStorage
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const userRole = user ? user.role : null;

  const handleLogout = () => {
    // Clear all session data immediately
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');

    // Invalidate server session (fire and forget)
    try {
      fetch(`${process.env.REACT_APP_BASE_URL || ''}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(() => { /* ignore */ });
    } catch (_) { /* ignore */ }

    // Immediate clean redirect — no setTimeout race condition
    window.location.href = '/login';
  };

  // Render menu items based on user role
  const renderMenuItems = () => {
    switch (userRole) {
      case 'SUBCOMMITTEE_MEMBER':
      case 'COMMITTEE_MEMBER':
        return (
          <>
            <li>
              <NavLink to="/simple-performance-dashboard">
                <FaChartBar /> Sub-Com Performance
              </NavLink>
            </li>
            <li>
              <NavLink to="/meetings/archive">
                <FaArchive /> Archive Meetings
              </NavLink>
            </li>
            <li>
              <NavLink to="/countries">
                <FaGlobe /> Countries
              </NavLink>
            </li>
            <li>
              <NavLink to="/committees">
                <FaUsers /> EARA Committees
              </NavLink>
            </li>
          </>
        );

      case 'SECRETARY':
        return (
          <>
            <li>
              <NavLink to="/simple-performance-dashboard">
                <FaChartBar /> Sub-Com Performance
              </NavLink>
            </li>
            <li>
              <NavLink to="/sub-committee-members">
                <FaUsers /> Sub-Committee Members
              </NavLink>
            </li>
            <li>
              <NavLink to="/meetings/create">
                <FaCalendar /> Create Meeting
              </NavLink>
            </li>
            <li>
              <NavLink to="/attendance/take">
                <FaUsers /> Take Attendance
              </NavLink>
            </li>
            <li>
              <NavLink to="/minutes/take">
                <FaFileAlt /> Take Minutes
              </NavLink>
            </li>
            <li>
              <NavLink to="/meetings/archive">
                <FaArchive /> Archive Meetings
              </NavLink>
            </li>
            <li>
              <NavLink to="/committees">
                <FaUsers /> EARA Committees
              </NavLink>
            </li>
            <li>
              <NavLink to="/countries">
                <FaGlobe /> Countries
              </NavLink>
            </li>
          </>
        );

      case 'COMMITTEE_SECRETARY':
        return (
          <>
            <li>
              <NavLink to="/simple-performance-dashboard">
                <FaChartBar /> Sub-Com Performance
              </NavLink>
            </li>
            <li>
              <NavLink to="/sub-committee-members">
                <FaUsers /> Sub-Committee Members
              </NavLink>
            </li>
            <li>
              <NavLink to="/meetings/create">
                <FaCalendar /> Create Meeting
              </NavLink>
            </li>
            <li>
              <NavLink to="/attendance/take">
                <FaUsers /> Take Attendance
              </NavLink>
            </li>
            <li>
              <NavLink to="/minutes/take">
                <FaFileAlt /> Take Minutes
              </NavLink>
            </li>
            <li>
              <NavLink to="/meetings/archive">
                <FaArchive /> Archive Meetings
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports">
                <FaFileAlt /> Reports
              </NavLink>
            </li>
            <li>
              <NavLink to="/committees">
                <FaUsers /> EARA Committees
              </NavLink>
            </li>
            <li>
              <NavLink to="/member/dashboard">
                <FaTasks /> My Tasks
              </NavLink>
            </li>
          </>
        );

      case 'DELEGATION_SECRETARY':
        return (
          <>
            <li>
              <NavLink to="/simple-performance-dashboard">
                <FaChartBar /> Sub-Com Performance
              </NavLink>
            </li>
            <li>
              <NavLink to="/sub-committee-members">
                <FaUsers /> Sub-Committee Members
              </NavLink>
            </li>
            <li>
              <NavLink to="/meetings/create">
                <FaCalendar /> Create Meeting
              </NavLink>
            </li>
            <li>
              <NavLink to="/attendance/take">
                <FaUsers /> Take Attendance
              </NavLink>
            </li>
            <li>
              <NavLink to="/minutes/take">
                <FaFileAlt /> Take Minutes
              </NavLink>
            </li>
            <li>
              <NavLink to="/meetings/archive">
                <FaArchive /> Archive Meetings
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports">
                <FaFileAlt /> Reports
              </NavLink>
            </li>
            <li>
              <NavLink to="/committees">
                <FaUsers /> EARA Committees
              </NavLink>
            </li>
            <li>
              <NavLink to="/countries">
                <FaGlobe /> Countries
              </NavLink>
            </li>
            <li>
              <NavLink to="/member/dashboard">
                <FaTasks /> My Tasks
              </NavLink>
            </li>
          </>
        );

      case 'CHAIR':
      case 'VICE_CHAIR':
        return (
          <>
            <li>
              <NavLink to="/simple-performance-dashboard">
                <FaChartBar /> Sub-Com Performance
              </NavLink>
            </li>
            <li>
              <NavLink to="/meetings/archive">
                <FaArchive /> Archive Meetings
              </NavLink>
            </li>
            <li>
              <NavLink to="/countries">
                <FaGlobe /> Countries
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports">
                <FaFileAlt /> Reports
              </NavLink>
            </li>
            <li>
              <NavLink to="/committees">
                <FaUsers /> EARA Committees
              </NavLink>
            </li>
          </>
        );

      case 'HOD':
      case 'CHAIR_OF_HOD':
        return (
          <>
            <li>
              <NavLink to="/simple-performance-dashboard">
                <FaChartBar /> Sub-Com Performance
              </NavLink>
            </li>
            <li>
              <NavLink to="/meetings/archive">
                <FaArchive /> Archive Meetings
              </NavLink>
            </li>
            <li>
              <NavLink to="/countries">
                <FaGlobe /> Countries
              </NavLink>
            </li>
            <li>
              <NavLink to="/committees">
                <FaUsers /> EARA Committees
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports">
                <FaFileAlt /> Reports
              </NavLink>
            </li>
          </>
        );

      case 'COMMISSIONER_GENERAL':
        return (
          <>
            <li>
              <NavLink to="/eara-performance-dashboard">
                <FaChartBar /> EARA Performance
              </NavLink>
            </li>
            <li>
              <NavLink to="/simple-performance-dashboard">
                <FaChartBar /> Sub-Com Performance
              </NavLink>
            </li>
            <li>
              <NavLink to="/meetings/archive">
                <FaArchive /> Archive Meetings
              </NavLink>
            </li>
            <li>
              <NavLink to="/countries">
                <FaGlobe /> Countries
              </NavLink>
            </li>
            <li>
              <NavLink to="/committees">
                <FaUsers /> EARA Committees
              </NavLink>
            </li>
          </>
        );

      case 'ADMIN':
        return (
          <>
            <li>
              <NavLink to="/eara-performance-dashboard">
                <FaChartBar /> EARA Performance
              </NavLink>
            </li>
            <li>
              <NavLink to="/simple-performance-dashboard">
                <FaChartBar /> Sub-Com Performance
              </NavLink>
            </li>
            <li>
              <NavLink to="/committees">
                <FaUsers /> Committees
              </NavLink>
            </li>
            <li>
              <NavLink to="/countries">
                <FaGlobe /> Countries
              </NavLink>
            </li>
          </>
        );

      default:
        return (
          <>
            <li>
              <NavLink to="/simple-performance-dashboard">
                <FaChartBar /> Sub-Com Performance
              </NavLink>
            </li>
          </>
        );
    }
  };

  return (
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src={EaracgLogo} alt="EARACG official logo" className="sidebar-brand-logo" />
            <h3>EARA Connect</h3>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li>
            <NavLink to="/dashboard" end>
              Dashboard
            </NavLink>
          </li>

          {renderMenuItems()}

          <li className="logout-item">
            <button onClick={handleLogout} className="logout-button">
              <FaSignOutAlt /> Logout
            </button>
          </li>
        </ul>
      </nav>
  );
};

export default Sidebar;
