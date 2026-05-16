import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaUser, FaBell, FaFileAlt, FaChartLine, FaClock, FaExclamationTriangle, 
  FaCheckCircle, FaEye, FaEdit, FaSpinner, FaTasks, FaCalendarAlt,
  FaEnvelope, FaPhone, FaUserTie, FaBuilding, FaPercent, FaComment,
  FaTimes, FaCheck, FaFilter, FaClear, FaSearch, FaSort,
  FaChevronDown, FaChevronUp, FaThumbsUp, FaThumbsDown, FaHistory,
  FaArrowUp, FaArrowDown, FaArrowRight, FaLock, FaUsers, FaCrown,
  FaFlag, FaShieldAlt, FaGavel, FaUserShield
} from 'react-icons/fa';
import HODService from '../services/hodService';
import AuthService from '../services/authService';
import ProfileService from '../services/profileService';
import './ChairOfHeadOfDelegationDashboard.css';
import { useNavigate } from 'react-router-dom';

const ChairOfHeadOfDelegationDashboard = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    pendingReports: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    averagePerformance: 0,
    activeResolutions: 0,
    totalSubcommittees: 0,
    subcommitteePerformance: []
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    status: 'SUBMITTED', // Default to pending reviews
    subcommitteeId: '',
    resolutionId: '',
    searchTerm: ''
  });

  // Report review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    approved: null,
    hodComments: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Profile editing state
  const [showProfileViewModal, setShowProfileViewModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);
  const [deletingProfilePicture, setDeletingProfilePicture] = useState(false);

  useEffect(() => {
    if (!showProfileModal) {
      setSelectedProfilePicture(null);
    }
  }, [showProfileModal]);

  // Expanded report text state
  const [expandedReports, setExpandedReports] = useState(new Set());

  // State for user profile data including profile picture
  const [userProfile, setUserProfile] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Get current user from localStorage or auth context
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('🔍 ChairOfHeadOfDelegationDashboard: Current user:', user);
        return user;
      }
    } catch (error) {
      console.error('❌ ChairOfHeadOfDelegationDashboard: Error getting current user:', error);
    }
    
    // Fallback for testing - remove in production
    return {
      id: 1,
      email: "chair.headofdelegation@eara.org",
      role: "CHAIR",
      subcommitteeId: 1
    };
  };

  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  // Fetch user profile and profile picture
  const fetchUserProfile = async () => {
    if (!currentUser?.email) return;
    
    try {
      setLoadingProfile(true);
      
      // Fetch user profile from database
      const profileData = await ProfileService.getUserProfile(currentUser.email);
      setUserProfile(profileData);
      
      // If profile has a profile picture, get the full URL
      if (profileData.profilePicture) {
        const fullPictureUrl = ProfileService.getFullProfilePictureUrl(profileData.profilePicture);
        setProfilePictureUrl(fullPictureUrl);
      }
    } catch (error) {
      console.warn('Failed to fetch user profile, using fallback data:', error);
      // Use fallback data from localStorage
      setUserProfile(currentUser);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    initializeDashboard();
    fetchUserProfile();
    
    // Set up polling intervals
    const notificationInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    const reportsInterval = setInterval(() => {
      fetchReports();
    }, 120000);

    const statsInterval = setInterval(() => {
      fetchDashboardStats();
    }, 300000);

    return () => {
      clearInterval(notificationInterval);
      clearInterval(reportsInterval);
      clearInterval(statsInterval);
    };
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUserProfile(),
        fetchReports(),
        fetchNotifications(),
        fetchDashboardStats()
      ]);
    } catch (error) {
      console.error('❌ ChairOfHeadOfDelegationDashboard: Error initializing dashboard:', error);
      setError('Failed to initialize dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      console.log('🔍 ChairOfHeadOfDelegationDashboard: Fetching reports for Chair of Head of Delegation');
      const reportsData = await HODService.getReportsForHodReview(currentUser.id);
      setAllReports(reportsData);
      applyFilters(reportsData, filters);
    } catch (error) {
      console.error('❌ ChairOfHeadOfDelegationDashboard: Error fetching reports:', error);
      setError('Failed to fetch reports');
    }
  };

  const fetchNotifications = async () => {
    try {
      const notificationsData = await HODService.getNotifications(currentUser.id);
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('❌ ChairOfHeadOfDelegationDashboard: Error fetching notifications:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const stats = await HODService.getDashboardStats(currentUser.id);
      setDashboardStats(stats);
    } catch (error) {
      console.error('❌ ChairOfHeadOfDelegationDashboard: Error fetching dashboard stats:', error);
    }
  };

  const applyFilters = (reportsData, currentFilters) => {
    const filtered = HODService.filterReports(reportsData, currentFilters);
    const sorted = HODService.sortReports(filtered, 'submittedAt', 'desc');
    setReports(sorted);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(allReports, newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      status: 'SUBMITTED',
      subcommitteeId: '',
      resolutionId: '',
      searchTerm: ''
    };
    setFilters(emptyFilters);
    applyFilters(allReports, emptyFilters);
  };

  const openReviewModal = (report) => {
    setSelectedReport(report);
    setShowReviewModal(true);
    setReviewForm({
      approved: null,
      hodComments: ''
    });
    setError('');
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedReport(null);
    setReviewForm({
      approved: null,
      hodComments: ''
    });
    setError('');
  };

  const handleReportReview = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const validationErrors = HODService.validateReportReview(
        reviewForm.approved, 
        reviewForm.hodComments
      );
      
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        return;
      }

      const confirmationMessage =
        reviewForm.approved
          ? 'Are you sure you want to approve?'
          : 'Are you sure you want to reject?';

      if (!window.confirm(confirmationMessage)) {
        return;
      }

      setSubmitting(true);

      await HODService.reviewReport(
        selectedReport.id,
        reviewForm.approved,
        reviewForm.hodComments,
        currentUser?.id
      );

      const action = reviewForm.approved ? 'approved' : 'rejected';
      setSuccess(`Report ${action} successfully! The submitting chair has been notified.`);
      
      closeReviewModal();
      await Promise.all([fetchReports(), fetchNotifications(), fetchDashboardStats()]);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('❌ ChairOfHeadOfDelegationDashboard: Error reviewing report:', error);
      setError(error.response?.data?.error || error.message || 'Failed to review report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAction = async (reportId, approved) => {
    if (!approved) {
      setError('Please use the review form to reject and provide feedback to the Chair.');
      return;
    }

    if (!window.confirm('Are you sure you want to approve?')) {
      return;
    }

    try {
      setSubmitting(true);
      await HODService.reviewReport(reportId, true, 'Approved by Chair of Head of Delegation', currentUser?.id);
      setSuccess('Report approved successfully!');
      await Promise.all([fetchReports(), fetchNotifications(), fetchDashboardStats()]);
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('❌ ChairOfHeadOfDelegationDashboard: Error processing quick action:', error);
      setError(error.response?.data?.error || error.message || 'Failed to process quick action');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setError('');

    try {
      await ProfileService.updateProfile(currentUser.email, profileForm);

      if (selectedProfilePicture) {
        const validation = ProfileService.validateProfilePictureFile(selectedProfilePicture);
        if (!validation.isValid) {
          setError(validation.error || 'Invalid profile picture');
          return;
        }
        await ProfileService.uploadProfilePicture(currentUser.id, selectedProfilePicture);
      }

      setSuccess('Profile updated successfully!');
      setShowProfileModal(false);
      await fetchUserProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('❌ ChairOfHeadOfDelegationDashboard: Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const openProfileModal = () => {
    setShowProfileViewModal(true);
    setError('');
  };

  const closeProfileViewModal = () => {
    setShowProfileViewModal(false);
    setError('');
  };

  const handleDeleteProfilePicture = async () => {
    if (!currentUser?.id) return;
    if (!window.confirm('Delete your profile photo?')) return;

    try {
      setDeletingProfilePicture(true);
      setError('');
      await ProfileService.deleteProfilePicture(currentUser.id);
      setSuccess('Profile photo deleted successfully!');
      await fetchUserProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to delete profile photo');
    } finally {
      setDeletingProfilePicture(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await HODService.markNotificationAsRead(notification.id);
        await fetchNotifications();
      }
      
      // Handle different notification types
      if (notification.type === 'REPORT_SUBMISSION') {
        setActiveTab('reports');
        if (notification.relatedEntityId) {
          const report = allReports.find(r => r.id === notification.relatedEntityId);
          if (report) {
            openReviewModal(report);
          }
        }
      }
    } catch (error) {
      console.error('❌ ChairOfHeadOfDelegationDashboard: Error handling notification click:', error);
    }
  };

  const toggleReportExpansion = (reportId) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  const getReportUrgencyClass = (submittedAt) => {
    const daysSinceSubmission = Math.floor((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceSubmission > 7) return 'urgent';
    if (daysSinceSubmission > 3) return 'warning';
    return 'normal';
  };

  const getUniqueSubcommittees = () => {
    const subcommittees = new Map();
    allReports.forEach(report => {
      if (report.subcommittee) {
        subcommittees.set(report.subcommittee.id, {
          id: report.subcommittee.id,
          name: report.subcommittee.name,
          memberCount: report.subcommittee.memberCount || 0
        });
      }
    });
    return Array.from(subcommittees.values());
  };

  const getUniqueResolutions = () => {
    const resolutions = new Map();
    allReports.forEach(report => {
      if (report.resolution) {
        resolutions.set(report.resolution.id, {
          id: report.resolution.id,
          title: report.resolution.title
        });
      }
    });
    return Array.from(resolutions.values());
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="chair-of-head-of-delegation-dashboard">
      <div className="chair-of-head-of-delegation-container">
        {/* Header */}
        <div className="chair-of-head-of-delegation-header">
          <div className="chair-of-head-of-delegation-title-section">
            <div className="chair-of-head-of-delegation-icon">
              <FaCrown />
            </div>
            <div>
              <h1 className="chair-of-head-of-delegation-title">Chair of Head of Delegation</h1>
              <p className="chair-of-head-of-delegation-subtitle">
                {user?.subcommittee?.name} • {user?.name} • Strategic Oversight
              </p>
            </div>
          </div>
          
          <div className="header-actions">
            <div 
              className="profile-avatar"
              onClick={openProfileModal}
              title="Click to view profile"
            >
              {loadingProfile ? (
                <div className="avatar-loading">
                  <FaSpinner className="loading-spinner" />
                </div>
              ) : profilePictureUrl ? (
                <img 
                  src={profilePictureUrl} 
                  alt={`${userProfile?.name || currentUser?.name || 'User'}'s profile`}
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
                   currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error">
            <FaExclamationTriangle />
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <FaCheckCircle />
            {success}
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon pending">
                <FaClock />
              </div>
              <div className="stat-info">
                <p className="stat-label">Pending Reports</p>
                <p className="stat-value">{dashboardStats.pendingReports || 0}</p>
                <p className="stat-trend">
                  Awaiting Your Review
                </p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon approved">
                <FaCheckCircle />
              </div>
              <div className="stat-info">
                <p className="stat-label">Approved This Month</p>
                <p className="stat-value">{dashboardStats.approvedThisMonth || 0}</p>
                <p className="stat-trend trend-up">
                  <FaArrowUp />
                  {HODService.calculateApprovalRate(
                    dashboardStats.approvedThisMonth || 0,
                    dashboardStats.rejectedThisMonth || 0
                  )}% approval rate
                </p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon performance">
                <FaChartLine />
              </div>
              <div className="stat-info">
                <p className="stat-label">Average Performance</p>
                <p className="stat-value">{dashboardStats.averagePerformance || 0}%</p>
                <p className="stat-trend">
                  Across All Subcommittees
                </p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon notifications">
                <FaBell />
              </div>
              <div className="stat-info">
                <p className="stat-label">New Notifications</p>
                <p className="stat-value">{unreadCount}</p>
                <p className="stat-trend">
                  Report Submissions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="chair-of-head-of-delegation-main-content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <FaFileAlt />
              Reports for Review
              {dashboardStats.pendingReports > 0 && (
                <span className="tab-badge">{dashboardStats.pendingReports}</span>
              )}
            </button>
            <button
              className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
              aria-label="Notifications"
              title="Notifications"
            >
              <FaBell />
              {unreadCount > 0 && (
                <span className="tab-badge">{unreadCount}</span>
              )}
            </button>
            <button
              className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <FaChartLine />
              Analytics
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                {/* Filter Bar */}
                <div className="filter-bar">
                  <div className="filter-group">
                    <label className="filter-label">Status</label>
                    <select
                      className="filter-select"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="SUBMITTED">Pending Review</option>
                      <option value="APPROVED_BY_HOD">Approved</option>
                      <option value="REJECTED_BY_HOD">Rejected</option>
                      <option value="">All Statuses</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Subcommittee</label>
                    <select
                      className="filter-select"
                      value={filters.subcommitteeId}
                      onChange={(e) => handleFilterChange('subcommitteeId', parseInt(e.target.value) || '')}
                    >
                      <option value="">All Subcommittees</option>
                      {getUniqueSubcommittees().map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.memberCount} members)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Resolution</label>
                    <select
                      className="filter-select"
                      value={filters.resolutionId}
                      onChange={(e) => handleFilterChange('resolutionId', parseInt(e.target.value) || '')}
                    >
                      <option value="">All Resolutions</option>
                      {getUniqueResolutions().map(res => (
                        <option key={res.id} value={res.id}>
                          {res.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Search</label>
                    <input
                      type="text"
                      className="filter-input"
                      placeholder="Search reports..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    />
                  </div>

                  <button
                    className="clear-filters-btn"
                    onClick={clearFilters}
                  >
                    <FaClear />
                    Clear Filters
                  </button>
                </div>

                {/* Reports List */}
                {reports.length === 0 ? (
                  <div className="empty-state">
                    <FaFileAlt className="empty-icon" />
                    <h3>No Reports Found</h3>
                    <p>No reports match your current filters.</p>
                  </div>
                ) : (
                  <div className="reports-list">
                    {reports.map(report => (
                      <div key={report.id} className={`report-card ${getReportUrgencyClass(report.submittedAt)}`}>
                        <div className="report-header">
                          <div className="report-title-section">
                            <h3 className="report-title">
                              {report.resolution?.title || 'Untitled Resolution'}
                            </h3>
                            <div className="report-meta">
                              <span className="report-subcommittee">
                                {report.subcommittee?.name}
                              </span>
                              <span className="report-submitter">
                                Submitted by: {report.submittedBy?.name}
                              </span>
                              <span className="report-date">
                                {new Date(report.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="report-status">
                            <span className={`status-badge ${report.status.toLowerCase()}`}>
                              {report.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="report-content">
                          <div className="report-summary">
                            <div className="performance-section">
                              <span className="performance-label">Performance:</span>
                              <span className="performance-value">{report.performancePercentage}%</span>
                            </div>
                            <div className="progress-section">
                              <span className="progress-label">Progress Details:</span>
                              <p className="progress-text">
                                {expandedReports.has(report.id) 
                                  ? report.progressDetails 
                                  : report.progressDetails?.substring(0, 150) + (report.progressDetails?.length > 150 ? '...' : '')
                                }
                              </p>
                              {report.progressDetails?.length > 150 && (
                                <button
                                  className="expand-btn"
                                  onClick={() => toggleReportExpansion(report.id)}
                                >
                                  {expandedReports.has(report.id) ? 'Show Less' : 'Show More'}
                                </button>
                              )}
                            </div>
                            {report.hindrances && (
                              <div className="hindrances-section">
                                <span className="hindrances-label">Hindrances:</span>
                                <p className="hindrances-text">{report.hindrances}</p>
                              </div>
                            )}
                          </div>

                          <div className="report-actions">
                            {report.status === 'SUBMITTED' && (
                              <>
                                <button
                                  className="btn-primary btn-approve"
                                  onClick={() => handleQuickAction(report.id, true)}
                                  disabled={submitting}
                                >
                                  <FaCheck />
                                  Quick Approve
                                </button>
                                <button
                                  className="btn-primary btn-reject"
                                  onClick={() => openReviewModal(report)}
                                  disabled={submitting}
                                >
                                  <FaTimes />
                                  Review/Reject
                                </button>
                              </>
                            )}
                            <button
                              className="btn-secondary"
                              onClick={() => openReviewModal(report)}
                            >
                              <FaEye />
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="notifications-content">
                <h2>Notifications</h2>
                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <FaBell className="empty-icon" />
                    <h3>No Notifications</h3>
                    <p>You're all caught up!</p>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-icon">
                          {notification.type === 'REPORT_SUBMISSION' && <FaFileAlt />}
                          {notification.type === 'REPORT_APPROVAL' && <FaCheckCircle />}
                          {notification.type === 'REPORT_REJECTION' && <FaTimes />}
                        </div>
                        <div className="notification-content">
                          <h4 className="notification-title">{notification.title}</h4>
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-time">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {!notification.isRead && (
                          <div className="unread-indicator"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="analytics-content">
                <h2>Analytics Dashboard</h2>
                <div className="analytics-grid">
                  <div className="analytics-card">
                    <h3>Subcommittee Performance</h3>
                    <div className="performance-chart">
                      {dashboardStats.subcommitteePerformance?.map((perf, idx) => (
                        <div key={perf.subcommitteeId || idx} className="performance-item">
                          <span className="subcommittee-name">{perf.subcommitteeName || perf.name}</span>
                          <div className="performance-bar">
                            <div 
                              className="performance-fill" 
                              style={{ width: `${perf.averagePerformance || perf.avgPerformance || 0}%` }}
                            ></div>
                          </div>
                          <span className="performance-value">{perf.averagePerformance || perf.avgPerformance || 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedReport && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Review Report</h2>
                <p className="modal-subtitle">
                  {selectedReport.resolution?.title} • {selectedReport.subcommittee?.name}
                </p>
              </div>
              <button className="modal-close" onClick={closeReviewModal}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="report-details">
                <div className="detail-section">
                  <h4 className="detail-section-title">
                    <FaUser />
                    Submitted By
                  </h4>
                  <p className="detail-content">{selectedReport.submittedBy?.name}</p>
                </div>

                <div className="detail-section">
                  <h4 className="detail-section-title">
                    <FaPercent />
                    Performance
                  </h4>
                  <p className="detail-content">{selectedReport.performancePercentage}%</p>
                </div>

                <div className="detail-section">
                  <h4 className="detail-section-title">
                    <FaTasks />
                    Progress Details
                  </h4>
                  <p className="detail-content">{selectedReport.progressDetails}</p>
                </div>

                {selectedReport.hindrances && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">
                      <FaExclamationTriangle />
                      Hindrances
                    </h4>
                    <p className="detail-content">{selectedReport.hindrances}</p>
                  </div>
                )}

                {selectedReport.status === 'SUBMITTED' && (
                  <form onSubmit={handleReportReview} className="review-form">
                    <div className="form-group">
                      <label className="form-label">Your Decision</label>
                      <div className="decision-buttons">
                        <button
                          type="button"
                          className={`decision-btn ${reviewForm.approved === true ? 'active approve' : ''}`}
                          onClick={() => setReviewForm(prev => ({ ...prev, approved: true }))}
                        >
                          <FaCheck />
                          Approve
                        </button>
                        <button
                          type="button"
                          className={`decision-btn ${reviewForm.approved === false ? 'active reject' : ''}`}
                          onClick={() => setReviewForm(prev => ({ ...prev, approved: false }))}
                        >
                          <FaTimes />
                          Reject
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Comments (Required for rejection)</label>
                      <textarea
                        className="form-textarea"
                        value={reviewForm.hodComments}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, hodComments: e.target.value }))}
                        placeholder="Add your comments here..."
                        rows={4}
                      />
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={closeReviewModal}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={submitting || reviewForm.approved === null}
                      >
                        {submitting ? <FaSpinner className="spinner" /> : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileViewModal && (
        <div className="modal-overlay" onClick={closeProfileViewModal}>
          <div className="modal-content profile-view-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">View Profile</h2>
              <button className="modal-close" onClick={closeProfileViewModal}>
                <FaTimes />
              </button>
            </div>

            <div className="profile-form profile-view-body">
              <div className="profile-view-hero">
                <div className="profile-view-avatar">
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Profile" className="profile-view-avatar-image" />
                  ) : (
                    <span className="profile-view-avatar-fallback">
                      {(userProfile?.name || currentUser?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="profile-view-name">{userProfile?.name || currentUser?.name || ''}</h3>
                <p className="profile-view-email">{userProfile?.email || currentUser?.email || ''}</p>
              </div>

              <div className="profile-view-details">
                <div className="profile-view-row">
                  <span className="profile-view-label">Phone</span>
                  <span className="profile-view-value">{userProfile?.phone || currentUser?.phone || 'Not provided'}</span>
                </div>
                <div className="profile-view-row">
                  <span className="profile-view-label">Role</span>
                  <span className="profile-view-value">{currentUser?.role || 'CHAIR_HEAD_OF_DELEGATION'}</span>
                </div>
              </div>

              <div className="modal-actions profile-view-actions">
                {profilePictureUrl && (
                  <button type="button" className="btn-secondary" onClick={handleDeleteProfilePicture} disabled={deletingProfilePicture}>
                    {deletingProfilePicture ? 'Deleting...' : 'Delete Photo'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setShowProfileViewModal(false);
                    setShowProfileModal(true);
                  }}
                >
                  <FaEdit /> Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile</h2>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Profile Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => setSelectedProfilePicture(e.target.files?.[0] || null)}
                />
                {selectedProfilePicture && (
                  <small className="form-help">Selected: {selectedProfilePicture.name}</small>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowProfileModal(false)}
                  disabled={updatingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updatingProfile}
                >
                  {updatingProfile ? <FaSpinner className="spinner" /> : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChairOfHeadOfDelegationDashboard;
