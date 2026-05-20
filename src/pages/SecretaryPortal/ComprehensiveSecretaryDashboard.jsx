import React, { useState, useEffect } from 'react';
import {
  FaCalendarCheck,
  FaFileAlt,
  FaChartLine,
  FaUsers,
  FaEnvelope,
  FaCog,
  FaBell,
  FaEye,
  FaSpinner,
  FaClock,
  FaMapMarkerAlt,
  FaUserTie,
  FaBuilding,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle
} from 'react-icons/fa';
import EnhancedMeetingInvitationManager from '../Meetings/EnhancedMeetingInvitationManager';
import EnhancedResolutionWorkflow from '../Resolutions/EnhancedResolutionWorkflow';
import './EnhancedSecretaryDashboard.css';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/authService';
import ProfileService from '../../services/profileService';
import http from '../../services/http';
import { formatResolutionStatusLabel, normalizeResolutionStatus } from '../../utils/resolutionStatus';

const ComprehensiveSecretaryDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    upcomingMeetings: [],
    assignedResolutions: [],
    pendingResolutions: [],
    recentInvitations: [],
    statistics: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [subcommitteePerformance, setSubcommitteePerformance] = useState([]);
  const [lateMinutesMeetings, setLateMinutesMeetings] = useState([]);
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const userRole = user?.role || 'SECRETARY';

  // Role-specific dashboard configuration
  const getRoleConfig = () => {
    switch (userRole) {
      case 'COMMITTEE_SECRETARY':
        return {
          title: 'Committee Secretary Dashboard',
          subtitle: 'Manage your subcommittee meetings, minutes, and attendance'
        };
      case 'DELEGATION_SECRETARY':
        return {
          title: 'EARA TC Secretary Dashboard',
          subtitle: 'Manage CG meetings and all technical subcommittee meetings & minutes'
        };
      default:
        return {
          title: 'Secretary Dashboard',
          subtitle: 'East African Community Management System'
        };
    }
  };

  const roleConfig = getRoleConfig();

  // State for user profile data including profile picture
  const [userProfile, setUserProfile] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch user profile and profile picture
  const fetchUserProfile = async () => {
    if (!user?.email) return;

    try {
      setLoadingProfile(true);

      // Fetch user profile from database
      const profileData = await ProfileService.getUserProfile(user.email);
      setUserProfile(profileData);

      // If profile has a profile picture, get the full URL
      if (profileData.profilePicture) {
        const fullPictureUrl = ProfileService.getFullProfilePictureUrl(profileData.profilePicture);
        setProfilePictureUrl(fullPictureUrl);
      }
    } catch (error) {
      console.warn('Failed to fetch user profile, using fallback data:', error);
      // Use fallback data from localStorage
      setUserProfile(user);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
    fetchSubcommitteePerformance();
  }, []);

  const fetchDashboardData = async () => {
    try {
      let meetings = { upcoming: [], pendingMinutes: [], archived: [] };
      let resolutions = [];
      let stats = {};

      try {
        const userId = AuthService.getCurrentUser()?.id;
        if (!userId) {
          console.warn('No authenticated user found, skipping data fetch');
          setIsOfflineMode(true);
          return;
        }

        // Use http service so auth cookies/JWT are sent automatically
        const [meetingsRes, resolutionsRes, statsRes] = await Promise.all([
          http.get(`/meetings/secretary/${userId}/categorized`),
          http.get(`/secretary/resolutions/${userId}`).catch(() => ({ data: [] })),
          http.get(`/secretary/dashboard/${userId}`).catch(() => ({ data: {} }))
        ]);

        meetings = meetingsRes.data || { upcoming: [], pendingMinutes: [], archived: [] };
        resolutions = Array.isArray(resolutionsRes.data) ? resolutionsRes.data : [];
        stats = statsRes.data || {};
      } catch (apiError) {
        console.warn('API connection failed, using fallback data:', apiError.message);
        setIsOfflineMode(true);
        // Retain fallback data in offline mode
        stats = {
          totalMeetings: 0, upcomingMeetings: 0, pendingResolutions: 0,
          completedTasks: 0, totalInvitationsSent: 0, responseRate: 0
        };
      }

      setDashboardData({
        upcomingMeetings: Array.isArray(meetings.upcoming) ? meetings.upcoming : [],
        pendingMinutes: Array.isArray(meetings.pendingMinutes) ? meetings.pendingMinutes : [],
        archivedMeetings: Array.isArray(meetings.archived) ? meetings.archived : [],
        assignedResolutions: resolutions
          .filter(r => ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes((r.status || '').toUpperCase()))
          .slice(0, 5),
        pendingResolutions: resolutions.filter(r =>
          ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)
        ).slice(0, 5),
        statistics: {
          ...stats,
          upcomingCount: Array.isArray(meetings.upcoming) ? meetings.upcoming.length : 0,
          pendingMinutesCount: Array.isArray(meetings.pendingMinutes) ? meetings.pendingMinutes.length : 0,
        }
      });

      // Detect meetings with late minutes (pending for 3+ days)
      const now = new Date();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const pendingList = Array.isArray(meetings.pendingMinutes) ? meetings.pendingMinutes : [];
      const lateMeetings = pendingList.filter(m => {
        if (!m.meetingDate) return false;
        const meetingDate = new Date(m.meetingDate);
        return (now - meetingDate) > threeDaysMs && (!m.minutes || m.minutes.trim() === '');
      });
      setLateMinutesMeetings(lateMeetings);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcommitteePerformance = async () => {
    try {
      const year = new Date().getFullYear();
      const { data } = await http.get('/dashboard/performance/simple', { params: { year } });
      if (data && Array.isArray(data.subcommittees)) {
        setSubcommitteePerformance(data.subcommittees);
      }
    } catch (err) {
      console.warn('Failed to fetch subcommittee performance:', err.message);
      // Try fallback endpoint
      try {
        const { data } = await http.get('/api/dashboard/subcommittee-performance');
        if (data && Array.isArray(data.subcommitteePerformance)) {
          setSubcommitteePerformance(data.subcommitteePerformance);
        }
      } catch (fallbackErr) {
        console.warn('Subcommittee performance fallback also failed:', fallbackErr.message);
      }
    }
  };

  const TabButton = ({ id, label, icon: Icon, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`nav-tab ${activeTab === id ? 'active' : ''}`}
    >
      <Icon />
      <span>{label}</span>
      {count !== undefined && (
        <span className="tab-count">
          {count}
        </span>
      )}
    </button>
  );

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="stat-card fade-in">
      <div className="stat-header">
        <div className="stat-icon-wrapper">
          <Icon className="stat-icon" />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>
      {change && (
        <div className={`stat-change ${change.type === 'increase' ? 'positive' : 'negative'}`}>
          {change.type === 'increase' ? <FaArrowUp /> : <FaArrowDown />}
          {change.value}% from last month
        </div>
      )}
    </div>
  );

  const MeetingCard = ({ meeting }) => (
    <div className="item-card slide-in">
      <div className="item-header">
        <h4 className="item-title">{meeting.title}</h4>
        <span className={`item-status ${meeting.status === 'SCHEDULED' ? 'status-scheduled' : 'status-draft'
          }`}>
          {meeting.status}
        </span>
      </div>
      <div className="item-details">
        <div className="item-detail">
          <FaClock />
          {new Date(meeting.meetingDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div className="item-detail">
          <FaMapMarkerAlt />
          {meeting.location}
        </div>
      </div>
    </div>
  );

  const ResolutionCard = ({ resolution }) => (
    <div className="item-card slide-in">
      <div className="item-header">
        <h4 className="item-title">{resolution.title}</h4>
        <span className={`item-status ${
          normalizeResolutionStatus(resolution.status) === 'COMPLETED'
            ? 'status-completed'
            : normalizeResolutionStatus(resolution.status) === 'IN_PROGRESS'
              ? 'status-in-progress'
              : 'status-assigned'
        }`}>
          {formatResolutionStatusLabel(resolution.status)}
        </span>
      </div>
      <div className="item-details">
        <p>{resolution.description}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Secretary Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-secretary-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1 className="main-title" style={{ color: '#60a5fa', fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{roleConfig.title}</h1>
            <p className="subtitle">{roleConfig.subtitle}</p>
            {isOfflineMode && (
              <div className="offline-indicator">
                <FaBell style={{ color: '#f59e0b' }} />
                <span>Running in offline mode - Demo data displayed</span>
              </div>
            )}
          </div>
          <div className="header-actions">
            <div
              className="profile-avatar"
              onClick={() => navigate('/profile')}
              title="Click to view profile"
            >
              {loadingProfile ? (
                <div className="avatar-loading">
                  <FaSpinner className="loading-spinner" />
                </div>
              ) : profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={`${userProfile?.name || user?.name || 'User'}'s profile`}
                  className="avatar-image"
                  onError={(e) => {
                    // Hide image on error and show placeholder
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}

              {(!profilePictureUrl || loadingProfile) && (
                <div className="avatar-placeholder">
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() :
                    user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Navigation Tabs */}
        <div className="tab-navigation">
          <TabButton
            id="overview"
            label="Overview"
            icon={FaChartLine}
          />
          <TabButton
            id="meeting-invitations"
            label="Send Invitations"
            icon={FaEnvelope}
            count={dashboardData.upcomingMeetings.length}
          />
          <TabButton
            id="resolution-assignment"
            label="Task Assignment"
            icon={FaFileAlt}
            count={dashboardData.pendingResolutions.length}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <FaBell />
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Statistics Cards */}
            <div className="stats-grid">
              <StatCard
                title="Upcoming Meetings"
                value={dashboardData.upcomingMeetings.length}
                icon={FaCalendarCheck}
                change={{ type: 'increase', value: 12 }}
              />
              <StatCard
                title="Assigned Resolutions"
                value={dashboardData.assignedResolutions.length}
                icon={FaFileAlt}
                change={{ type: 'decrease', value: 5 }}
              />
              <StatCard
                title="Active Committees"
                value={
                  dashboardData.statistics?.activeCommittees
                  ?? dashboardData.activeCommittees
                  ?? 0
                }
                icon={FaBuilding}
                change={{ type: 'increase', value: 3 }}
              />
              <StatCard
                title="Subcommittees"
                value={
                  dashboardData.statistics?.subcommittees
                  ?? dashboardData.subcommittees
                  ?? 0
                }
                icon={FaUserTie}
                change={{ type: 'increase', value: 8 }}
              />
            </div>

            {/* Late Minutes Alert */}
            {lateMinutesMeetings.length > 0 && (
              <div className="late-minutes-alert" style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(180, 83, 9, 0.18) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(255, 152, 0, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <FaExclamationTriangle style={{ color: 'var(--warning, #f59e0b)', fontSize: '20px' }} />
                  <h3 style={{ margin: 0, color: 'var(--theme-text-1, #f8fafc)', fontSize: '16px' }}>
                    ⚠️ Late Minutes Alert — {lateMinutesMeetings.length} meeting{lateMinutesMeetings.length > 1 ? 's' : ''} overdue
                  </h3>
                </div>
                <p style={{ margin: '0 0 10px 0', color: 'var(--theme-text-2, #b8c5da)', fontSize: '13px' }}>
                  The following meetings have not had their minutes recorded within 3 days of the meeting date:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lateMinutesMeetings.map((m, idx) => {
                    const daysOverdue = Math.floor((new Date() - new Date(m.meetingDate)) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={m.id || idx} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(15, 23, 42, 0.45)', borderRadius: '8px', padding: '10px 14px'
                      }}>
                        <div>
                          <strong style={{ color: 'var(--theme-text-1, #f8fafc)' }}>{m.title || 'Untitled Meeting'}</strong>
                          <span style={{ marginLeft: '10px', color: 'var(--theme-text-2, #b8c5da)', fontSize: '12px' }}>
                            {m.meetingDate ? new Date(m.meetingDate).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <span style={{
                          background: daysOverdue > 7 ? '#d32f2f' : '#ff9800',
                          color: '#fff', borderRadius: '12px', padding: '3px 10px', fontSize: '12px', fontWeight: 600
                        }}>
                          {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <div className="section-header">
                <h2 className="section-title">Quick Actions</h2>
              </div>
              <div className="quick-actions-grid">
                <button
                  onClick={() => setActiveTab('meeting-invitations')}
                  className="quick-action-card"
                >
                  <div className="quick-action-content">
                    <div className="quick-action-icon blue">
                      <FaEnvelope />
                    </div>
                    <div className="quick-action-text">
                      <h3>Send Meeting Invitations</h3>
                      <p>Invite subcommittee members</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('resolution-assignment')}
                  className="quick-action-card"
                >
                  <div className="quick-action-content">
                    <div className="quick-action-icon green">
                      <FaFileAlt />
                    </div>
                    <div className="quick-action-text">
                      <h3>Assign Tasks</h3>
                      <p>Distribute tasks to subcommittees</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Subcommittee Performance Section */}
            <div className="content-section" style={{ marginBottom: '24px' }}>
              <div className="content-section-header">
                <h2 className="content-section-title">
                  <FaChartLine style={{ marginRight: '8px' }} />
                  Subcommittee Performance
                </h2>
              </div>
              <div className="content-section-body">
                {subcommitteePerformance.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FaChartLine />
                    </div>
                    <p>No subcommittee performance data available yet.</p>
                    <small>Data will appear once reports are submitted and reviewed.</small>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--theme-surface-3, #162132)', color: 'var(--theme-text-1, #f8fafc)' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Subcommittee</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>Reports</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>Performance</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>Approval Rate</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subcommitteePerformance.map((sc, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--theme-border, #24344c)', background: idx % 2 === 0 ? 'var(--theme-surface-2, #101826)' : 'var(--theme-surface-3, #162132)' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--theme-text-1, #f8fafc)' }}>{sc.name}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--theme-text-2, #b8c5da)' }}>{sc.reports || sc.reportCount || 0}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem',
                                background: (sc.performancePercentage || sc.avgPerformance || 0) >= 80 ? '#d1fae5' : (sc.performancePercentage || sc.avgPerformance || 0) >= 60 ? '#fef3c7' : '#fee2e2',
                                color: (sc.performancePercentage || sc.avgPerformance || 0) >= 80 ? '#065f46' : (sc.performancePercentage || sc.avgPerformance || 0) >= 60 ? '#92400e' : '#991b1b'
                              }}>
                                {sc.performancePercentage || sc.avgPerformance || 0}%
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--theme-text-2, #b8c5da)' }}>{sc.approvalRate || 0}%</td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 500,
                                color: sc.trend === 'up' ? '#10b981' : sc.trend === 'down' ? '#ef4444' : '#3b82f6'
                              }}>
                                {sc.trend === 'up' ? '▲' : sc.trend === 'down' ? '▼' : '●'} {sc.trend || 'stable'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="content-grid">
              {/* Upcoming Meetings */}
              <div className="content-section">
                <div className="content-section-header">
                  <h2 className="content-section-title">Upcoming Meetings</h2>
                  <button
                    onClick={() => setActiveTab('meeting-invitations')}
                    className="view-all-btn"
                  >
                    View All
                  </button>
                </div>
                <div className="content-section-body">
                  {dashboardData.upcomingMeetings.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <FaCalendarCheck />
                      </div>
                      <p>No upcoming meetings</p>
                    </div>
                  ) : (
                    <div className="items-list">
                      {dashboardData.upcomingMeetings.map(meeting => (
                        <MeetingCard key={meeting.id} meeting={meeting} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Resolutions */}
              <div className="content-section">
                <div className="content-section-header">
                  <h2 className="content-section-title">Assigned Resolutions</h2>
                  <button
                    onClick={() => setActiveTab('resolution-assignment')}
                    className="view-all-btn"
                  >
                    View All
                  </button>
                </div>
                <div className="content-section-body">
                  {dashboardData.assignedResolutions.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <FaFileAlt />
                      </div>
                      <p>No assigned resolutions</p>
                    </div>
                  ) : (
                    <div className="items-list">
                      {dashboardData.assignedResolutions.map(resolution => (
                        <ResolutionCard key={resolution.id} resolution={resolution} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meeting-invitations' && (
          <EnhancedMeetingInvitationManager />
        )}

        {activeTab === 'resolution-assignment' && (
          <EnhancedResolutionWorkflow />
        )}

        {activeTab === 'committee-management' && (
          <div className="content-section">
            <div className="content-section-body">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FaUsers />
                </div>
                <h2>Committee Management</h2>
                <p>
                  This feature is coming soon. You'll be able to manage committee memberships,
                  create new committees, and organize subcommittees.
                </p>
                <button className="item-action">
                  Request Early Access
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveSecretaryDashboard;