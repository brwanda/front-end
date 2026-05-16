import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaUser, FaBell, FaFileAlt, FaChartLine, FaClock, FaExclamationTriangle, 
  FaCheckCircle, FaEye, FaEdit, FaSpinner, FaTasks, FaCalendarAlt,
  FaEnvelope, FaPhone, FaUserTie, FaBuilding, FaPercent, FaComment,
  FaTimes, FaCheck, FaFilter, FaClear, FaSearch, FaSort,
  FaChevronDown, FaChevronUp, FaThumbsUp, FaThumbsDown, FaHistory,
  FaArrowUp, FaArrowDown, FaArrowRight, FaLock, FaUsers
} from 'react-icons/fa';
import HODService from '../services/hodService';
import HODPermissionService from '../services/hodPermissionService';
import AuthService from '../services/authService';
import ProfileService from '../services/profileService';
import PDFService from '../services/pdfService';
import ReportExportBar from '../components/ReportExportBar';
import './HODDashboard.css';
import { useNavigate } from 'react-router-dom';

const EnhancedHODDashboard = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  // Check if current user has HOD privileges
  const [currentUser] = useState(AuthService.getCurrentUser());
  const hasHODPrivileges = HODPermissionService.hasHODPrivileges(currentUser);
  const canApproveOrRejectReports = HODPermissionService.canReviewReports(currentUser);
  const canCommentOnReports = HODPermissionService.canCommentOnReports(currentUser);
  
  // State for user profile data including profile picture
  const [userProfile, setUserProfile] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
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
    status: '',
    subcommitteeId: '',
    resolutionId: '',
    searchTerm: ''
  });

  // Report review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    approved: null,
    hodComments: '',
    hodRanking: ''
  });
  const [pdfLoading, setPdfLoading] = useState(false);

  const hodReportTypes = [
    { value: 'all_reports', label: 'All Reports' },
    { value: 'pending_reports', label: 'Pending Reports' },
    { value: 'approved_reports', label: 'Approved by HOD' },
    { value: 'rejected_reports', label: 'Rejected by HOD' },
  ];

  const handleExportPDF = ({ fromDate, toDate, reportType }) => {
    setPdfLoading(true);
    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59);
      let filtered = (allReports || []).filter(r => {
        const d = new Date(r.submittedAt);
        return d >= from && d <= to;
      });
      if (reportType === 'pending_reports') {
        filtered = filtered.filter(r => HODService.matchesSelectedStatus(r.status, 'SUBMITTED'));
      } else if (reportType === 'approved_reports') {
        filtered = filtered.filter(r => HODService.matchesSelectedStatus(r.status, 'APPROVED_BY_HOD'));
      } else if (reportType === 'rejected_reports') {
        filtered = filtered.filter(r => HODService.matchesSelectedStatus(r.status, 'REJECTED_BY_HOD'));
      }
      const titles = { all_reports: 'All Reports (HOD)', pending_reports: 'Pending Reports', approved_reports: 'HOD Approved Reports', rejected_reports: 'HOD Rejected Reports' };
      PDFService.generateReportsListPDF(filtered, fromDate, toDate, titles[reportType] || 'Reports');
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setPdfLoading(false);
    }
  };
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



  const fetchReports = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      // HOD sees reports from their country across statuses (scoped by backend)
      const reportsData = await HODService.getReportsForHodReview(currentUser.id);
      const safeReportsData = Array.isArray(reportsData) ? reportsData : [];
      const normalizedReportsData = safeReportsData.map((report) => ({
        ...report,
        status: HODService.normalizeStatus(report?.status)
      }));
      setAllReports(normalizedReportsData);
      const filtered = HODService.filterReports(normalizedReportsData, filters);
      const sorted = HODService.sortReports(filtered, 'submittedAt', 'desc');
      setReports(sorted);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setAllReports([]);
      setReports([]);
    }
  }, [currentUser?.id, filters]);

  const fetchNotifications = useCallback(async () => {
    try {
      if (!currentUser?.id) return;
      
      const [notificationsData, unreadCountData] = await Promise.all([
        HODService.getHODNotifications(currentUser.id),
        HODService.getUnreadNotificationCount(currentUser.id)
      ]);
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setUnreadCount(typeof unreadCountData === 'number' ? unreadCountData : 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser?.id]);

  const fetchDashboardStats = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const stats = await HODService.getDashboardStats(currentUser.id);
      // Ensure stats has proper structure with defaults
      const safeStats = {
        pendingReports: stats.pendingReports || 0,
        approvedThisMonth: stats.approvedThisMonth || 0,
        rejectedThisMonth: stats.rejectedThisMonth || 0,
        averagePerformance: stats.averagePerformance || 0,
        activeResolutions: stats.activeResolutions || 0,
        totalSubcommittees: stats.totalSubcommittees || 0,
        subcommitteePerformance: Array.isArray(stats.subcommitteePerformance) ? stats.subcommitteePerformance : [],
        monthlyTrend: stats.monthlyTrend || {}
      };
      setDashboardStats(safeStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set fallback stats in case of error
      setDashboardStats({
        pendingReports: 0,
        approvedThisMonth: 0,
        rejectedThisMonth: 0,
        averagePerformance: 0,
        activeResolutions: 0,
        totalSubcommittees: 0,
        subcommitteePerformance: []
      });
    }
  }, [currentUser?.id]);

  const initializeDashboard = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      await Promise.all([
        fetchReports(),
        fetchNotifications(),
        fetchDashboardStats()
      ]);
    } catch (error) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, fetchReports, fetchNotifications, fetchDashboardStats]);

  // Fetch user profile and profile picture
  const fetchUserProfile = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      setLoadingProfile(true);
      const profileData = await ProfileService.getUserProfile(currentUser.email);
      setUserProfile(profileData);
      
      if (profileData.profilePicture) {
        const fullPictureUrl = ProfileService.getFullProfilePictureUrl(profileData.profilePicture);
        setProfilePictureUrl(fullPictureUrl);
      }
    } catch (error) {
      // Use fallback data from localStorage
      setUserProfile(currentUser);
    } finally {
      setLoadingProfile(false);
    }
  }, [currentUser?.email, currentUser]);

  // Redirect if user doesn't have HOD privileges (use React Router, not window.location)
  useEffect(() => {
    if (!hasHODPrivileges) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasHODPrivileges, navigate]);

  // Load user profile on component mount
  useEffect(() => {
    if (currentUser?.email) {
      fetchUserProfile();
    }
  }, [currentUser?.email, fetchUserProfile]);

  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    initializeDashboard();
  }, [currentUser?.id, initializeDashboard]);

  useEffect(() => {
    if (!currentUser?.id) return;
    
    // Set up polling intervals only if user exists
    const notificationInterval = setInterval(() => {
      if (currentUser?.id) {
        fetchNotifications();
      }
    }, 30000);

    const reportsInterval = setInterval(() => {
      if (currentUser?.id) {
        fetchReports();
      }
    }, 120000);

    const statsInterval = setInterval(() => {
      if (currentUser?.id) {
        fetchDashboardStats();
      }
    }, 300000);

    return () => {
      clearInterval(notificationInterval);
      clearInterval(reportsInterval);
      clearInterval(statsInterval);
    };
  }, [currentUser?.id, fetchNotifications, fetchReports, fetchDashboardStats]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Apply filters directly
    const filtered = HODService.filterReports(allReports, newFilters);
    const sorted = HODService.sortReports(filtered, 'submittedAt', 'desc');
    setReports(sorted);
  };

  const clearFilters = () => {
    const emptyFilters = {
      status: '',
      subcommitteeId: '',
      resolutionId: '',
      searchTerm: ''
    };
    setFilters(emptyFilters);
    
    // Apply empty filters directly
    const filtered = HODService.filterReports(allReports, emptyFilters);
    const sorted = HODService.sortReports(filtered, 'submittedAt', 'desc');
    setReports(sorted);
  };

  const openReviewModal = (report) => {
    setSelectedReport(report);
    setShowReviewModal(true);
    setReviewForm({
      approved: null,
      hodComments: '',
      hodRanking: ''
    });
    setError('');
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedReport(null);
    setReviewForm({
      approved: null,
      hodComments: '',
      hodRanking: ''
    });
    setError('');
  };

  const handleReportReview = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!canCommentOnReports) {
        setError('You do not have permission to comment on reports.');
        return;
      }

      if (!canApproveOrRejectReports) {
        if (!reviewForm.hodComments || !reviewForm.hodComments.trim()) {
          setError('Comment is required.');
          return;
        }
      } else {
        const validationErrors = HODService.validateReportReview(
          reviewForm.approved,
          reviewForm.hodComments
        );

        if (validationErrors.length > 0) {
          setError(validationErrors.join('. '));
          return;
        }

        const selectedPerformance = HODService.getEffectiveReportPerformance(selectedReport);
        if (reviewForm.approved === true && selectedPerformance <= 0 && !reviewForm.hodRanking) {
          setError('Please provide an HOD rating (1-5) when performance is 0%.');
          return;
        }
      }

      const confirmationMessage = !canApproveOrRejectReports
        ? 'Are you sure you want to submit this comment?'
        : reviewForm.approved
          ? 'Are you sure you want to approve?'
          : 'Are you sure you want to reject?';

      if (!window.confirm(confirmationMessage)) {
        return;
      }

      setSubmitting(true);

      await HODService.reviewReport(
        selectedReport?.id,
        canApproveOrRejectReports ? reviewForm.approved : null,
        reviewForm.hodComments,
        currentUser?.id,
        reviewForm.hodRanking ? Number(reviewForm.hodRanking) : null
      );

      if (canApproveOrRejectReports) {
        const action = reviewForm.approved ? 'approved' : 'rejected';
        setSuccess(`Report ${action} successfully!`);
      } else {
        setSuccess('Comment submitted successfully!');
      }
      
      closeReviewModal();
      await Promise.all([fetchReports(), fetchNotifications(), fetchDashboardStats()]);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to review report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAction = async (reportId, approved) => {
    if (!canApproveOrRejectReports) {
      setError('Only Chair of HOD can approve or reject reports.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!approved) {
      setError('Please use Review/Reject to provide feedback to the Chair.');
      return;
    }

    if (!window.confirm('Are you sure you want to approve?')) {
      return;
    }

    const targetReport = allReports.find((r) => r.id === reportId);
    const targetPerformance = HODService.getEffectiveReportPerformance(targetReport);
    if (targetPerformance <= 0) {
      setSelectedReport(targetReport || null);
      setShowReviewModal(true);
      setReviewForm({ approved: true, hodComments: '', hodRanking: '' });
      setError('Set HOD rating (1-5) before approving this 0% report.');
      return;
    }

    try {
      setSubmitting(true);
      await HODService.reviewReport(reportId, true, 'Approved', currentUser?.id);
      setSuccess('Report approved successfully!');
      await Promise.all([fetchReports(), fetchNotifications(), fetchDashboardStats()]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to process quick action');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setError('');

    try {
      await HODService.updateHODProfile(currentUser.email, profileForm);

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

    if (!window.confirm('Delete your profile photo?')) {
      return;
    }

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
      console.error('Error handling notification click:', error);
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
    const urgency = HODService.getReportUrgency(submittedAt);
    return urgency === 'overdue' || urgency === 'urgent' ? urgency : '';
  };

  const getUniqueSubcommittees = () => {
    const subcommittees = new Map();
    allReports.forEach(report => {
      if (report.subcommittee) {
        subcommittees.set(report.subcommittee.id, report.subcommittee);
      }
    });
    return Array.from(subcommittees.values());
  };

  const getUniqueResolutions = () => {
    const resolutions = new Map();
    allReports.forEach(report => {
      if (report.resolution) {
        resolutions.set(report.resolution.id, report.resolution);
      }
    });
    return Array.from(resolutions.values());
  };

  if (loading) {
    return (
      <div className="hod-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="hod-dashboard">
      <div className="hod-container">
        {/* Header */}
        <div className="hod-header">
          <div className="hod-title-section">
            <div className="hod-icon">
              <FaUserTie />
            </div>
            <div>
              <h1 className="hod-title">{HODPermissionService.getUserRoleDisplay(currentUser)}</h1>
              <p className="hod-subtitle">
                {currentUser?.subcommittee?.name || 'Head of Delegation'} • {currentUser?.name}
                {(userProfile?.position || currentUser?.position) && (
                  <span className="position-badge"> — {userProfile?.position || currentUser?.position}</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="header-actions">
            <button
              className="notification-btn"
              onClick={() => navigate('/hod/notifications')}
              title="Notifications"
            >
              <FaBell />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
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
                  Requires Review
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
                <p className="stat-label">Avg Performance</p>
                <p className="stat-value">{dashboardStats.averagePerformance || 0}%</p>
                <p className="stat-trend">
                  Across all subcommittees
                </p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon resolutions">
                <FaTasks />
              </div>
              <div className="stat-info">
                <p className="stat-label">Active Resolutions</p>
                <p className="stat-value">{dashboardStats.activeResolutions || 0}</p>
                <p className="stat-trend">
                  {dashboardStats.totalSubcommittees || 0} subcommittees
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Export Bar */}
        <ReportExportBar
          reportTypes={hodReportTypes}
          onExport={handleExportPDF}
          loading={pdfLoading}
        />

        {/* Main Content */}
        <div className="hod-main-content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <FaFileAlt />
              Reports Review
            </button>
            <button
              className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
              aria-label="Notifications"
              title="Notifications"
            >
              <FaBell />
              {unreadCount > 0 && ` (${unreadCount})`}
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
                      <option value="">All Statuses</option>
                      <option value="SUBMITTED">Submitted (Any Stage)</option>
                      <option value="APPROVED_BY_HOD">Approved</option>
                      <option value="REJECTED_BY_HOD">Rejected (Any Level)</option>
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
                      placeholder="Search by title or chair..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    />
                  </div>

                  <div className="filter-actions">
                    <button className="btn-clear" onClick={clearFilters}>
                      <FaTimes />
                      Clear
                    </button>
                  </div>
                </div>

                {/* Reports Grid */}
                {reports.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FaFileAlt />
                    </div>
                    <h3 className="empty-state-title">No Reports Found</h3>
                    <p className="empty-state-description">
                      {Object.values(filters).some(f => f) 
                        ? 'No reports match your current filters.' 
                        : 'No reports have been submitted yet.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="reports-grid">
                    {reports.map(report => {
                      const reportPerformance = HODService.getEffectiveReportPerformance(report);
                      return (
                      <div 
                        key={report.id} 
                        className={`report-card ${getReportUrgencyClass(report.submittedAt)}`}
                      >
                        <div className="report-header">
                          <div>
                            <h3 className="report-title">{report.resolution?.title || 'Untitled Resolution'}</h3>
                            <div className="report-meta">
                              <span>By: {report.submittedBy?.name || 'Unknown'}</span>
                              <span>Subcommittee: {report.subcommittee?.name || 'Unknown'}</span>
                              <span>Submitted: {HODService.formatDate(report.submittedAt)}</span>
                            </div>
                          </div>
                          <span className={`report-status ${(report.status || '').toLowerCase().replace('_', '-')}`}>
                            {(report.status || 'Unknown').replace('_', ' ')}
                          </span>
                        </div>

                        <div className="report-content">
                          <div className="report-section">
                            <h5 className="report-section-title">Progress Details</h5>
                            <p className={`report-text ${expandedReports.has(report.id) ? 'expanded' : ''}`}>
                              {report.progressDetails || 'No progress details provided'}
                            </p>
                            {(report.progressDetails || '').length > 150 && (
                              <button 
                                className="expand-btn"
                                onClick={() => toggleReportExpansion(report.id)}
                              >
                                {expandedReports.has(report.id) ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </div>

                          {report.hindrances && (
                            <div className="report-section">
                              <h5 className="report-section-title">Hindrances</h5>
                              <p className="report-text">{report.hindrances}</p>
                            </div>
                          )}
                        </div>

                        <div className="performance-indicator">
                          <div 
                            className="performance-circle"
                            style={{
                              backgroundColor: HODService.getPerformanceColor(reportPerformance)
                            }}
                          >
                            {reportPerformance}%
                          </div>
                          <div className="performance-info">
                            <h5 className="performance-label">Performance Rating</h5>
                            <p className="performance-description">Self-assessed completion</p>
                          </div>
                        </div>

                        {report.status === 'REJECTED_BY_HOD' && report.hodComments && (
                          <div className="detail-section">
                            <h5 className="detail-section-title">
                              <FaComment />
                              HOD Comments
                            </h5>
                            <p className="detail-content">{report.hodComments || 'No comments provided'}</p>
                          </div>
                        )}

                        <div className="report-actions">
                          {report.status === 'SUBMITTED' && (
                            <>
                              {canApproveOrRejectReports && (
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
                            </>
                          )}
                          {!canApproveOrRejectReports && canCommentOnReports && (
                            <button
                              className="btn-primary"
                              onClick={() => openReviewModal(report)}
                            >
                              <FaComment />
                              Add Comment
                            </button>
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
                    )})}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <div className="filter-bar">
                  <div className="filter-actions">
                    <button 
                      className="btn-filter"
                      onClick={() => currentUser?.id && HODService.markAllNotificationsAsRead(currentUser.id).then(fetchNotifications)}
                    >
                      <FaCheck />
                      Mark All Read
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FaBell />
                    </div>
                    <h3 className="empty-state-title">No Notifications</h3>
                    <p className="empty-state-description">
                      You're all caught up! No new notifications at this time.
                    </p>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-header">
                          <h4 className="notification-title">
                            {HODService.getNotificationIcon(notification.type)}
                            {notification.title}
                          </h4>
                          <span className="notification-time">
                            {HODService.formatDate(notification.createdAt)}
                          </span>
                        </div>
                        
                        <p className="notification-message">{notification.message}</p>
                        
                        {notification.type === 'REPORT_SUBMISSION' && notification.report && (
                          <div className="notification-actions">
                            {canApproveOrRejectReports && (
                              <button
                                className="btn-notification btn-quick-approve"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(notification.relatedEntityId, true);
                                }}
                              >
                                <FaThumbsUp />
                                Quick Approve
                              </button>
                            )}
                            <button 
                              className="btn-notification btn-view-report"
                              onClick={(e) => {
                                e.stopPropagation();
                                const report = allReports.find(r => r.id === notification.relatedEntityId);
                                if (report) openReviewModal(report);
                              }}
                            >
                              <FaEye />
                              Review Report
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3 className="analytics-title">
                    <FaUsers />
                    Subcommittee Performance
                  </h3>
                  <table className="performance-table">
                    <thead>
                      <tr>
                        <th>Subcommittee</th>
                        <th>Avg Performance</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(dashboardStats.subcommitteePerformance) && dashboardStats.subcommitteePerformance.length > 0 ? (
                        dashboardStats.subcommitteePerformance.map((sub, index) => (
                          <tr key={index}>
                            <td>{sub.name}</td>
                            <td className="performance-value">{sub.avgPerformance || 0}%</td>
                            <td>
                              <span className="trend-indicator">
                                {HODService.getTrendIcon(sub.trend)}
                                <span className={sub.trend === 'up' ? 'trend-up' : sub.trend === 'down' ? 'trend-down' : ''}>
                                  {sub.trend}
                                </span>
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                            No subcommittee performance data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="analytics-card">
                  <h3 className="analytics-title">
                    <FaChartLine />
                    Monthly Overview
                  </h3>
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-label">Approval Rate</p>
                      <p className="stat-value">
                        {HODService.calculateApprovalRate(
                          dashboardStats.approvedThisMonth || 0,
                          dashboardStats.rejectedThisMonth || 0
                        )}%
                      </p>
                    </div>
                  </div>
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-label">Total Reviews</p>
                      <p className="stat-value">
                        {(dashboardStats.approvedThisMonth || 0) + (dashboardStats.rejectedThisMonth || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report Review Modal */}
        {showReviewModal && selectedReport && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Review Report</h3>
                  <p className="modal-subtitle">{selectedReport?.resolution?.title || 'Untitled Report'}</p>
                </div>
                <button className="close-btn" onClick={closeReviewModal}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <div className="detail-section">
                  <h4 className="detail-section-title">
                    <FaUser />
                    Report Information
                  </h4>
                  <div className="detail-content">
                    <p><strong>Chair:</strong> {selectedReport?.submittedBy?.name || 'Unknown'}</p>
                    <p><strong>Subcommittee:</strong> {selectedReport?.subcommittee?.name || 'Unknown'}</p>
                    <p><strong>Submitted:</strong> {selectedReport?.submittedAt ? HODService.formatDate(selectedReport.submittedAt) : 'Unknown'}</p>
                    <p><strong>Performance:</strong> {selectedReport?.performancePercentage || 0}%</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4 className="detail-section-title">
                    <FaFileAlt />
                    Progress Details
                  </h4>
                  <p className="detail-content">{selectedReport?.progressDetails || 'No progress details provided'}</p>
                </div>

                {selectedReport?.hindrances && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">
                      <FaExclamationTriangle />
                      Hindrances
                    </h4>
                    <p className="detail-content">{selectedReport.hindrances}</p>
                  </div>
                )}

                {((canApproveOrRejectReports && selectedReport?.status === 'SUBMITTED') ||
                  (!canApproveOrRejectReports && canCommentOnReports)) && (
                  <form onSubmit={handleReportReview} className="review-form">
                    {canApproveOrRejectReports && (
                      <div className="form-group">
                        <label className="form-label">Review Decision</label>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                          <button
                            type="button"
                            className={`btn-primary btn-approve ${reviewForm.approved === true ? 'active' : ''}`}
                            onClick={() => setReviewForm(prev => ({ ...prev, approved: true }))}
                          >
                            <FaCheck />
                            Approve
                          </button>
                          <button
                            type="button"
                            className={`btn-primary btn-reject ${reviewForm.approved === false ? 'active' : ''}`}
                            onClick={() => setReviewForm(prev => ({ ...prev, approved: false }))}
                          >
                            <FaTimes />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {canApproveOrRejectReports && reviewForm.approved === true && (
                      <div className="form-group">
                        <label className="form-label">
                          HOD Rating (1-5){(Number(selectedReport?.performancePercentage) || 0) <= 0 ? ' *' : ''}
                        </label>
                        <select
                          className="form-select"
                          value={reviewForm.hodRanking}
                          onChange={(e) => setReviewForm((prev) => ({ ...prev, hodRanking: e.target.value }))}
                          required={(Number(selectedReport?.performancePercentage) || 0) <= 0}
                        >
                          <option value="">Select rating</option>
                          <option value="1">1 - Poor</option>
                          <option value="2">2 - Fair</option>
                          <option value="3">3 - Good</option>
                          <option value="4">4 - Very Good</option>
                          <option value="5">5 - Excellent</option>
                        </select>
                        <small className="form-help">
                          Used as fallback performance when Chair data is missing.
                        </small>
                      </div>
                    )}

                    {(reviewForm.approved === false || !canApproveOrRejectReports) && (
                      <div className="form-group">
                        <label className="form-label">
                          {canApproveOrRejectReports ? 'Rejection Comments *' : 'Comment *'}
                        </label>
                        <textarea
                          className="form-textarea"
                          value={reviewForm.hodComments}
                          onChange={(e) => setReviewForm(prev => ({
                            ...prev,
                            hodComments: e.target.value
                          }))}
                          placeholder={canApproveOrRejectReports
                            ? 'Explain why this report is being rejected...'
                            : 'Add your comment for this report...'}
                          required={reviewForm.approved === false || !canApproveOrRejectReports}
                          minLength={10}
                        />
                      </div>
                    )}

                    <div className="modal-actions">
                      <button
                        type="button"
                        onClick={closeReviewModal}
                        className="btn-secondary"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={submitting || (canApproveOrRejectReports && reviewForm.approved === null)}
                      >
                        {submitting ? (
                          <>
                            <FaSpinner className="loading-spinner" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaCheck />
                            {canApproveOrRejectReports ? 'Submit Review' : 'Submit Comment'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Update Modal */}
        {showProfileViewModal && (
          <div className="modal-overlay">
            <div className="modal-content profile-view-modal-content">
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">View Profile</h3>
                  <p className="modal-subtitle">Profile details</p>
                </div>
                <button className="close-btn" onClick={closeProfileViewModal}>
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
                    <span className="profile-view-value">{HODPermissionService.getUserRoleDisplay(currentUser)}</span>
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
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Update Profile</h3>
                  <p className="modal-subtitle">Edit your personal information</p>
                </div>
                <button className="close-btn" onClick={() => setShowProfileModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({
                      ...prev,
                      phone: e.target.value
                    }))}
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
                    <p className="readonly-notice">Selected: {selectedProfilePicture.name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    className="form-input"
                    value={HODPermissionService.getUserRoleDisplay(currentUser)}
                    disabled
                  />
                  <p className="readonly-notice">
                    <FaLock />
                    Role cannot be changed. Contact admin if needed.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={user?.department?.name || ''}
                    disabled
                  />
                  <p className="readonly-notice">
                    <FaLock />
                    Department assignment is managed by admin.
                  </p>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="btn-secondary"
                    disabled={updatingProfile}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={updatingProfile}
                  >
                    {updatingProfile ? (
                      <>
                        <FaSpinner className="loading-spinner" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaUser />
                        Update Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedHODDashboard;
