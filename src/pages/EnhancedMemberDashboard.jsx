import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUser, FaBell, FaFileAlt, FaChartLine, FaClock, FaExclamationTriangle,
  FaCheckCircle, FaEye, FaEdit, FaSpinner, FaTasks, FaCalendarAlt,
  FaEnvelope, FaPhone, FaUserTie, FaBuilding, FaPercent, FaComment,
  FaTimes, FaCheck, FaFilter, FaClear, FaSearch, FaSort,
  FaChevronDown, FaChevronUp, FaThumbsUp, FaThumbsDown, FaHistory,
  FaArrowUp, FaArrowDown, FaArrowRight, FaLock, FaUsers, FaMapMarkerAlt,
  FaPlay, FaPause, FaStop, FaCalendarCheck, FaHandPaper, FaQuestionCircle,
  FaInfoCircle
} from 'react-icons/fa';
import MemberService from '../services/memberService';
import AuthService from '../services/authService';
import ProfileService from '../services/profileService';
import PDFService from '../services/pdfService';
import ReportExportBar from '../components/ReportExportBar';
import { formatResolutionStatusLabel, normalizeResolutionStatus } from '../utils/resolutionStatus';
import './MemberDashboard.css';
import { useNavigate } from 'react-router-dom';

const EnhancedMemberDashboard = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [subMembers, setSubMembers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    assignedTasks: 0,
    completedTasks: 0,
    upcomingMeetings: 0,
    unreadNotifications: 0,
    subcommitteePerformance: 0,
    myContributions: [],
    recentTasks: []
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter state
  const [notificationFilter, setNotificationFilter] = useState('all');

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

  // Meeting response state
  const [respondingToMeeting, setRespondingToMeeting] = useState(null);
  const [updatingSubTaskId, setUpdatingSubTaskId] = useState(null);

  // State for user profile data including profile picture
  const [userProfile, setUserProfile] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [progressNote, setProgressNote] = useState('');
  const [taskModalError, setTaskModalError] = useState('');
  const [taskModalSuccess, setTaskModalSuccess] = useState('');

  // Show-all toggles for list limiting
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const DISPLAY_LIMIT = 6;
  const [pdfLoading, setPdfLoading] = useState(false);

  const memberReportTypes = [
    { value: 'my_tasks', label: 'My Tasks Report' },
    { value: 'my_meetings', label: 'My Meetings Report' },
  ];

  const handleExportPDF = ({ fromDate, toDate, reportType }) => {
    setPdfLoading(true);
    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59);
      if (reportType === 'my_meetings') {
        const filtered = meetings.filter(m => {
          const d = new Date(m.meetingDate || m.createdAt);
          return d >= from && d <= to;
        });
        PDFService.generateMeetingsReport(filtered, fromDate, toDate);
      } else {
        // Tasks — use resolutions report format
        const formatted = tasks.filter(t => {
          const d = new Date(t.createdAt || t.assignedDate);
          return d >= from && d <= to;
        });
        PDFService.generateResolutionsReport(formatted, fromDate, toDate);
      }
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  // Get actual authenticated user from AuthService
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());

  // Store resolved subcommitteeId so handlers can access it without params
  const [resolvedSubcommitteeId, setResolvedSubcommitteeId] = useState(null);

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
      // Use fallback data from currentUser
      setUserProfile(currentUser);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      console.log('🔄 EnhancedMemberDashboard: User authenticated, initializing dashboard');
      initializeDashboard();
    } else {
      console.warn('⚠️ EnhancedMemberDashboard: No authenticated user found');
    }

    // Set up polling intervals
    const notificationInterval = setInterval(() => {
      if (currentUser?.id) {
        fetchNotifications();
      }
    }, 30000);

    // Stats polling - fetch profile to get subcommitteeId since interval is independent
    const statsInterval = setInterval(async () => {
      if (currentUser?.id) {
        try {
          const profile = await ProfileService.getUserProfile(currentUser.email);
          const subId = profile?.subcommitteeId || profile?.subcommittee?.id;
          fetchDashboardStats(subId);
        } catch (e) {
          // Silently skip stats refresh if profile fails
        }
      }
    }, 300000);

    return () => {
      clearInterval(notificationInterval);
      clearInterval(statsInterval);
    };
  }, [currentUser?.id]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);

      // Fetch profile ONCE and derive subcommitteeId for all subsequent calls
      let profile = null;
      let subcommitteeId = null;
      try {
        profile = await ProfileService.getUserProfile(currentUser.email);
        setUserProfile(profile);
        setUser(profile); // Populate user state for header/profile modal
        subcommitteeId = profile?.subcommitteeId || profile?.subcommittee?.id;
        setResolvedSubcommitteeId(subcommitteeId);

        if (profile.profilePicture) {
          setProfilePictureUrl(ProfileService.getFullProfilePictureUrl(profile.profilePicture));
        }
      } catch (err) {
        console.warn('Failed to fetch user profile:', err);
        setUserProfile(currentUser);
        setUser(currentUser);
      } finally {
        setLoadingProfile(false);
      }

      await Promise.all([
        fetchTasks(subcommitteeId),
        fetchNotifications(),
        fetchMeetings(subcommitteeId),
        fetchDashboardStats(subcommitteeId),
        fetchSubMembers(subcommitteeId)
      ]);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (subcommitteeId) => {
    if (!currentUser?.id) return;

    try {
      if (!subcommitteeId) {
        console.warn('No subcommittee ID found for user');
        setTasks([]);
        return;
      }

      // Fetch both subcommittee resolutions AND specific sub-tasks assigned to this member
      const [resolutionsData, subTasksData] = await Promise.all([
        MemberService.getAssignedTasks(subcommitteeId),
        MemberService.getSubTasks()
      ]);

      // Combine them or label them
      // For now, let's combine them into the tasks state
      // We can add a type property to distinguish
      const combinedTasks = [
        ...resolutionsData.map(r => ({ ...r, taskType: 'RESOLUTION' })),
        ...subTasksData.map(t => ({ ...t, taskType: 'SUBTASK' }))
      ];

      setTasks(combinedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const [notificationsData, unreadCountData] = await Promise.all([
        MemberService.getNotifications(currentUser.id),
        MemberService.getUnreadCount(currentUser.id)
      ]);
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser?.id]);

  const fetchMeetings = async (subcommitteeId) => {
    if (!currentUser?.id) return;

    try {
      if (!subcommitteeId) {
        console.warn('No subcommittee ID found for user');
        setMeetings([]);
        return;
      }

      // Fetch both meeting invitations and all meetings for the subcommittee
      const [invitationsData, allMeetingsData] = await Promise.all([
        MemberService.getMeetingInvitations(currentUser.id),
        MemberService.getAllMeetings(subcommitteeId)
      ]);

      // Combine and deduplicate meetings
      const allMeetings = [...invitationsData];

      // Add meetings that are not in invitations
      allMeetingsData.forEach(meeting => {
        const exists = allMeetings.find(inv => inv.meeting?.id === meeting.id);
        if (!exists) {
          allMeetings.push({
            id: `meeting-${meeting.id}`,
            meeting: meeting,
            status: 'NO_INVITATION',
            respondedAt: null
          });
        }
      });

      setMeetings(allMeetings);
      console.log('Combined meetings data:', allMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setMeetings([]);
    }
  };

  const fetchDashboardStats = async (subcommitteeId) => {
    if (!currentUser?.id) return;

    try {
      if (!subcommitteeId) {
        console.warn('No subcommittee ID found for user');
        setDashboardStats({
          assignedTasks: 0,
          completedTasks: 0,
          upcomingMeetings: 0,
          unreadNotifications: 0,
          subcommitteePerformance: 0,
          myContributions: [],
          recentTasks: []
        });
        return;
      }

      const stats = await MemberService.getDashboardStats(currentUser.id, subcommitteeId);
      // Ensure stats has proper structure with defaults
      // Supplement with locally loaded data if backend returns 0
      const safeStats = {
        assignedTasks: stats.assignedTasks || 0,
        completedTasks: stats.completedTasks || 0,
        upcomingMeetings: stats.upcomingMeetings || 0,
        unreadNotifications: stats.unreadNotifications || 0,
        subcommitteePerformance: stats.subcommitteePerformance || 0,
        myContributions: Array.isArray(stats.myContributions) ? stats.myContributions : [],
        recentTasks: Array.isArray(stats.recentTasks) ? stats.recentTasks : []
      };
      setDashboardStats(safeStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set fallback stats in case of error
      setDashboardStats({
        assignedTasks: 0,
        completedTasks: 0,
        upcomingMeetings: 0,
        unreadNotifications: 0,
        subcommitteePerformance: 0,
        myContributions: [],
        recentTasks: []
      });
    }
  };

  const fetchSubMembers = async (subcommitteeId) => {
    if (!currentUser?.id) return;

    try {
      if (!subcommitteeId) {
        console.warn('No subcommittee ID found for user');
        setSubMembers([]);
        return;
      }

      const subMembersData = await MemberService.getSubCommitteeMembers(subcommitteeId);
      setSubMembers(subMembersData);
      console.log('Fetched sub-members data:', subMembersData);
    } catch (error) {
      console.error('Error fetching sub-members:', error);
      setSubMembers([]);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setError('');

    try {
      await MemberService.updateProfile(currentUser.email, profileForm);

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
        await MemberService.markNotificationAsRead(notification.id);
        await fetchNotifications();
      }

      // Handle different notification types
      if (notification.type === 'TASK_ASSIGNMENT') {
        setActiveTab('tasks');
      } else if (notification.type === 'MEETING_INVITATION') {
        setActiveTab('meetings');
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMeetingResponse = async (invitationId, response) => {
    try {
      setRespondingToMeeting(invitationId);
      await MemberService.respondToInvitation(invitationId, response, '');
      setSuccess(`Meeting invitation ${response.toLowerCase()}!`);
      await fetchMeetings(resolvedSubcommitteeId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to respond to meeting invitation');
      setTimeout(() => setError(''), 3000);
    } finally {
      setRespondingToMeeting(null);
    }
  };

  const handleSubmitProgressNote = async (subTaskId) => {
    try {
      setTaskModalError('');
      setTaskModalSuccess('');

      if (!progressNote.trim()) {
        const message = 'Progress Note to Chair of the Subcommittee is required.';
        setTaskModalError(message);
        setError(message);
        setTimeout(() => setError(''), 4000);
        return;
      }

      setUpdatingSubTaskId(subTaskId);
      const updatedSubTask = await MemberService.updateMySubTaskStatus(subTaskId, progressNote);

      setTasks((prev) => prev.map((task) =>
        task.taskType === 'SUBTASK' && task.id === updatedSubTask.id
          ? { ...task, ...updatedSubTask }
          : task
      ));
      setSelectedTask((prev) =>
        prev && prev.taskType === 'SUBTASK' && prev.id === updatedSubTask.id
          ? { ...prev, ...updatedSubTask }
          : prev
      );

      setSuccess('Progress note submitted to Chair');
      setTaskModalSuccess('Progress note submitted to Chair successfully.');
      setProgressNote('');
      await fetchTasks(resolvedSubcommitteeId);
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => setTaskModalSuccess(''), 3000);
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to submit progress note';
      setTaskModalError(message);
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingSubTaskId(null);
    }
  };

  const getFilteredNotifications = () => {
    if (notificationFilter === 'all') return notifications;
    if (notificationFilter === 'unread') return notifications.filter(n => !n.isRead);
    return notifications.filter(n => n.type === notificationFilter);
  };

  const getTaskPriorityClass = (task) => {
    return task.priority ? `${task.priority}-priority` : '';
  };

  const getDeadlineBadgeClass = (deadline) => {
    const urgency = MemberService.getDeadlineUrgency(deadline);
    return `deadline-badge ${urgency}`;
  };

  const getResolutionReportStatuses = (task) => {
    if (!task || task.taskType !== 'RESOLUTION') return [];
    const reports = Array.isArray(task.reports) ? task.reports : [];
    return reports
      .map((r) => (r?.status || '').toString().toUpperCase())
      .filter(Boolean);
  };

  const getEffectiveTaskStatus = (task) => {
    if (!task || task.taskType !== 'RESOLUTION') return task?.status || 'TODO';

    const reportStatuses = getResolutionReportStatuses(task);
    if (reportStatuses.some((s) => s === 'APPROVED_BY_COMMISSIONER' || s === 'APPROVED_BY_HOD')) {
      return 'COMPLETED';
    }
    if (reportStatuses.some((s) => s === 'SUBMITTED')) {
      return 'SUBMITTED';
    }
    if (reportStatuses.some((s) => s === 'REJECTED_BY_HOD' || s === 'REJECTED_BY_COMMISSIONER')) {
      return 'IN_PROGRESS';
    }

    return task?.status || 'TODO';
  };

  const getTaskProgress = (task) => {
    const status = (getEffectiveTaskStatus(task) || '').toUpperCase();
    if (status === 'COMPLETED' || status === 'APPROVED_BY_HOD' || status === 'APPROVED_BY_COMMISSIONER') return 100;
    if (status === 'SUBMITTED') return 80;
    if (status === 'IN_PROGRESS') return 65;
    if (status === 'TODO' || status === 'ASSIGNED') return 10;
    return MemberService.getTaskProgress({ ...task, status });
  };

  const calculateLocalSubcommitteePerformance = (taskList) => {
    const source = (taskList || []).filter((t) => t?.taskType === 'RESOLUTION' || t?.taskType === 'SUBTASK');
    if (!source.length) return 0;
    const avg = source.reduce((sum, t) => sum + getTaskProgress(t), 0) / source.length;
    return Math.round(avg);
  };

  useEffect(() => {
    if ((dashboardStats?.subcommitteePerformance || 0) > 0) return;
    const localPerf = calculateLocalSubcommitteePerformance(tasks);
    if (localPerf > 0) {
      setDashboardStats((prev) => ({
        ...prev,
        subcommitteePerformance: localPerf,
      }));
    }
  }, [tasks, dashboardStats?.subcommitteePerformance]);

  const getTaskAssignedDateValue = (task) => {
    return task?.assignedDate || task?.createdAt || task?.updatedAt || task?.assignedAt || null;
  };

  const getTaskAssignedDateText = (task) => {
    const assignedDate = getTaskAssignedDateValue(task);
    return assignedDate ? MemberService.formatDate(assignedDate) : 'Date not available';
  };

  const getTaskDurationText = (task) => {
    const assignedDate = getTaskAssignedDateValue(task);
    const deadline = task?.deadline;
    if (!assignedDate || !deadline) return 'N/A';
    const assigned = new Date(assignedDate);
    const due = new Date(deadline);
    if (Number.isNaN(assigned.getTime()) || Number.isNaN(due.getTime()) || due < assigned) return 'N/A';
    return MemberService.formatTaskDuration(assignedDate, deadline);
  };

  const handleViewMember = (member) => {
    console.log('Viewing member details:', member);
    // TODO: Implement member detail view modal
    setSuccess(`Viewing details for ${member.name}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleContactMember = (member) => {
    console.log('Contacting member:', member);
    // TODO: Implement contact functionality
    setSuccess(`Contacting ${member.name}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  if (!currentUser?.id) {
    return (
      <div className="member-dashboard">
        <div className="loading-container">
          <div className="error-message">
            <h2>Authentication Required</h2>
            <p>Please log in to access the Sub-Committee Member dashboard.</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="member-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="member-dashboard">
      <div className="member-container">
        {/* Header */}
        <div className="member-header">
          <div className="member-title-section">
            <div className="member-icon">
              <FaUsers />
            </div>
            <div>
              <h1 className="member-title">
                Subcommittee Member
              </h1>
              <p className="member-subtitle">
                {user?.subcommittee?.name || userProfile?.subcommittee?.name || ''} • {user?.name || userProfile?.name || currentUser?.name || ''}
                {(userProfile?.position || user?.position || currentUser?.position) && (
                  <span className="position-badge"> — {userProfile?.position || user?.position || currentUser?.position}</span>
                )}
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="notification-btn"
              onClick={() => navigate('/notifications')}
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
              <div className="stat-icon tasks">
                <FaTasks />
              </div>
              <div className="stat-info">
                <p className="stat-label">Assigned Tasks</p>
                <p className="stat-value">{dashboardStats.assignedTasks || tasks.length}</p>
                <p className="stat-trend">
                  {dashboardStats.completedTasks || tasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length} completed
                </p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon meetings">
                <FaCalendarAlt />
              </div>
              <div className="stat-info">
                <p className="stat-label">Upcoming Meetings</p>
                <p className="stat-value">{dashboardStats.upcomingMeetings || meetings.filter(m => m.meeting && new Date(m.meeting.meetingDate) > new Date()).length}</p>
                <p className="stat-trend">
                  This month
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
                <p className="stat-label">Unread Notifications</p>
                <p className="stat-value">{unreadCount}</p>
                <p className="stat-trend">
                  Requires attention
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
                <p className="stat-label">Subcommittee Performance</p>
                <p className="stat-value">{dashboardStats.subcommitteePerformance}%</p>
                <p className="stat-trend">
                  Team average
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Export Bar */}
        <ReportExportBar
          reportTypes={memberReportTypes}
          onExport={handleExportPDF}
          loading={pdfLoading}
        />

        {/* Main Content */}
        <div className="member-main-content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              <FaTasks />
              My Tasks
            </button>
            <button
              className={`tab-button ${activeTab === 'meetings' ? 'active' : ''}`}
              onClick={() => setActiveTab('meetings')}
            >
              <FaCalendarAlt />
              Meetings
            </button>
            <button
              className={`tab-button ${activeTab === 'sub-members' ? 'active' : ''}`}
              onClick={() => setActiveTab('sub-members')}
            >
              <FaUsers />
              Sub-Members
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
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div>
                {tasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FaTasks />
                    </div>
                    <h3 className="empty-state-title">No Tasks Assigned</h3>
                    <p className="empty-state-description">
                      You don't have any tasks assigned to your subcommittee yet.
                    </p>
                  </div>
                ) : (
                  <>
                  <div className="tasks-grid">
                    {(showAllTasks ? tasks : tasks.slice(0, DISPLAY_LIMIT)).map(task => (
                      <div
                        key={task.id || `${task.taskType}-${task.id}`}
                        className={`task-card ${getTaskPriorityClass(task)}`}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskDetail(true);
                          setProgressNote(task.progressNote || '');
                          setTaskModalError('');
                          setTaskModalSuccess('');
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="task-header">
                          <div>
                            <div className="task-type-badge">
                              {task.taskType === 'SUBTASK' ? 'My Direct Assignment' : 'Team Resolution'}
                            </div>
                            <h3 className="task-title">{task.title}</h3>
                            <div className="task-meta">
                              <span>{task.taskType === 'SUBTASK' ? 'Assigned By Chair' : `Assigned: ${getTaskAssignedDateText(task)}`}</span>
                              {task.taskType !== 'SUBTASK' && <span>Duration: {getTaskDurationText(task)}</span>}
                            </div>
                          </div>
                          <span className={`task-status ${(getEffectiveTaskStatus(task) || 'TODO').toLowerCase().replace('_', '-')}`}>
                            {formatResolutionStatusLabel(normalizeResolutionStatus(getEffectiveTaskStatus(task) || 'TODO'))}
                          </span>
                        </div>

                        <p className="task-description">{task.description}</p>

                        {task.taskType === 'SUBTASK' && (
                          <div className="task-actions">
                            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                              Progress Note to Chair of the Subcommittee
                            </label>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setShowTaskDetail(true);
                                setProgressNote(task.progressNote || '');
                                setTaskModalError('');
                                setTaskModalSuccess('');
                              }}
                              style={{
                                marginTop: 8, width: '100%', padding: '8px 12px',
                                borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: 'var(--warning, #f59e0b)', color: 'var(--theme-text-1, #f8fafc)', fontWeight: 600,
                                fontSize: '0.85rem', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: 6
                              }}
                            >
                              <FaEdit /> Submit Progress Note
                            </button>
                          </div>
                        )}

                        <div className="task-progress">
                          <div className="progress-label">
                            <span>Progress</span>
                            <span>{getTaskProgress(task)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${getTaskProgress(task)}%` }}
                            />
                          </div>
                        </div>

                        {(task.deadline || task.taskType === 'RESOLUTION') && (
                          <div className="task-deadline">
                            <FaClock className="deadline-icon" />
                            <div className="deadline-info">
                              <p className="deadline-date">
                                Due: {task.deadline ? MemberService.formatDate(task.deadline) : 'No deadline set'}
                              </p>
                              <p className="deadline-days">
                                {(task.deadline && MemberService.getDaysUntilDeadline(task.deadline) > 0)
                                  ? `${MemberService.getDaysUntilDeadline(task.deadline)} days remaining`
                                  : task.deadline ? 'Overdue' : 'No deadline set'
                                }
                              </p>
                            </div>
                            {task.deadline && (
                              <span className={getDeadlineBadgeClass(task.deadline)}>
                                {MemberService.getDeadlineUrgency(task.deadline)}
                              </span>
                            )}
                          </div>
                        )}

                        {task.taskType === 'RESOLUTION' && (
                          <div className="task-contribution">
                            <div className="contribution-circle">
                              {task.contributionPercentage || 0}%
                            </div>
                            <div className="contribution-info">
                              <p className="contribution-label">Subcommittee Weight</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {tasks.length > DISPLAY_LIMIT && (
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <button
                        onClick={() => setShowAllTasks(!showAllTasks)}
                        style={{ padding: '6px 20px', fontSize: '0.85rem', background: 'var(--theme-accent, #3b82f6)', color: 'var(--theme-text-1, #f8fafc)', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      >
                        {showAllTasks ? 'Show Less' : `Show All (${tasks.length})`}
                      </button>
                    </div>
                  )}
                  </>
                )}
              </div>
            )}

            {/* Meetings Tab */}
            {activeTab === 'meetings' && (
              <div>
                {meetings.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FaCalendarAlt />
                    </div>
                    <h3 className="empty-state-title">No Meeting Invitations</h3>
                    <p className="empty-state-description">
                      You don't have any meeting invitations at this time.
                    </p>
                  </div>
                ) : (
                  <>
                  <div className="meetings-grid">
                    {(showAllMeetings ? meetings : meetings.slice(0, DISPLAY_LIMIT)).map(meeting => (
                      <div key={meeting.id} className="meeting-card">
                        <div className="meeting-header">
                          <div>
                            <h3 className="meeting-title">{meeting.meeting.title}</h3>
                            <p className="meeting-organizer">Organized by: {meeting.meeting.organizer}</p>
                          </div>
                          <span className={`meeting-status ${meeting.status.toLowerCase().replace('_', '-')}`}>
                            {meeting.status === 'NO_INVITATION' ? 'SCHEDULED' : meeting.status}
                          </span>
                        </div>

                        <div className="meeting-details">
                          <div className="meeting-detail">
                            <FaCalendarAlt />
                            <span>{MemberService.formatDate(meeting.meeting.meetingDate)}</span>
                          </div>
                          <div className="meeting-detail">
                            <FaMapMarkerAlt />
                            <span>{meeting.meeting.location}</span>
                          </div>
                        </div>

                        {meeting.meeting.description && (
                          <div className="meeting-description">
                            {meeting.meeting.description}
                          </div>
                        )}

                        {meeting.status === 'PENDING' && (
                          <div className="meeting-actions">
                            <button
                              className="btn-primary btn-accept"
                              onClick={() => handleMeetingResponse(meeting.id, 'ACCEPTED')}
                              disabled={respondingToMeeting === meeting.id}
                            >
                              {respondingToMeeting === meeting.id ? (
                                <FaSpinner className="loading-spinner" />
                              ) : (
                                <FaCheck />
                              )}
                              Accept
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => handleMeetingResponse(meeting.id, 'MAYBE')}
                              disabled={respondingToMeeting === meeting.id}
                            >
                              <FaQuestionCircle />
                              Maybe
                            </button>
                            <button
                              className="btn-primary btn-decline"
                              onClick={() => handleMeetingResponse(meeting.id, 'DECLINED')}
                              disabled={respondingToMeeting === meeting.id}
                            >
                              <FaTimes />
                              Decline
                            </button>
                          </div>
                        )}

                        {meeting.status === 'NO_INVITATION' && (
                          <div className="meeting-actions">
                            <div className="alert alert-info">
                              <FaInfoCircle />
                              Meeting scheduled for your subcommittee
                            </div>
                          </div>
                        )}

                        {meeting.status !== 'PENDING' && meeting.respondedAt && (
                          <div className="meeting-actions">
                            <div className="alert alert-info">
                              <FaCheckCircle />
                              Responded on {MemberService.formatDate(meeting.respondedAt)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {meetings.length > DISPLAY_LIMIT && (
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <button
                        onClick={() => setShowAllMeetings(!showAllMeetings)}
                        style={{ padding: '6px 20px', fontSize: '0.85rem', background: 'var(--theme-accent, #3b82f6)', color: 'var(--theme-text-1, #f8fafc)', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      >
                        {showAllMeetings ? 'Show Less' : `Show All (${meetings.length})`}
                      </button>
                    </div>
                  )}
                  </>
                )}
              </div>
            )}

            {/* Sub-Members Tab */}
            {activeTab === 'sub-members' && (
              <div>
                <div className="sub-members-header">
                  <h2 className="sub-members-title">
                    <FaUsers className="sub-members-icon" />
                    Subcommittee Members
                  </h2>
                  <p className="sub-members-subtitle">
                    View all members of your subcommittee and their associated information
                  </p>
                </div>

                {subMembers.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FaUsers />
                    </div>
                    <h3 className="empty-state-title">No Subcommittee Members Found</h3>
                    <p className="empty-state-description">
                      There are currently no members assigned to this subcommittee.
                    </p>
                  </div>
                ) : (
                  <div className="sub-members-container">
                    <div className="sub-members-summary">
                      <div className="summary-card">
                        <div className="summary-icon">
                          <FaUsers />
                        </div>
                        <div className="summary-content">
                          <h3>Total Members</h3>
                          <p className="summary-number">{subMembers.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="sub-members-table-container">
                      <table className="sub-members-table">
                        <thead>
                          <tr>
                            <th className="member-name-header">Member Name</th>
                            <th className="member-role-header">Role</th>
                            <th className="member-number-header">Member ID</th>
                            <th className="member-status-header">Status</th>
                            <th className="member-actions-header">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subMembers.map((member, index) => (
                            <tr key={member.id || index} className="member-row">
                              <td className="member-name">
                                <div className="member-info">
                                  <div className="member-avatar">
                                    {member.profilePicture ? (
                                      <img
                                        src={member.profilePicture}
                                        alt={`${member.name}'s profile`}
                                        className="member-avatar-image"
                                      />
                                    ) : (
                                      <div className="member-avatar-placeholder">
                                        {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                                      </div>
                                    )}
                                  </div>
                                  <div className="member-details">
                                    <span className="member-full-name">{member.name || 'Unknown Member'}</span>
                                    <span className="member-email">{member.email || 'No email'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="member-role">
                                <span className={`role-badge ${(member.role || 'MEMBER').toLowerCase()}`}>
                                  {member.role || 'MEMBER'}
                                </span>
                              </td>
                              <td className="member-number">
                                <span className="member-id-number">{member.id || 'N/A'}</span>
                              </td>
                              <td className="member-status">
                                <span className={`status-badge ${(member.status || 'ACTIVE').toLowerCase()}`}>
                                  {member.status || 'ACTIVE'}
                                </span>
                              </td>
                              <td className="member-actions">
                                <button
                                  className="btn-action btn-view"
                                  title="View member details"
                                  onClick={() => handleViewMember(member)}
                                >
                                  <FaEye />
                                </button>
                                <button
                                  className="btn-action btn-contact"
                                  title="Contact member"
                                  onClick={() => handleContactMember(member)}
                                >
                                  <FaEnvelope />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                {/* Filter Bar */}
                <div className="filter-bar">
                  <div className="filter-group">
                    <label className="filter-label">Filter by Type</label>
                    <select
                      className="filter-select"
                      value={notificationFilter}
                      onChange={(e) => setNotificationFilter(e.target.value)}
                    >
                      <option value="all">All Notifications</option>
                      <option value="unread">Unread Only</option>
                      <option value="TASK_ASSIGNMENT">Task Assignments</option>
                      <option value="MEETING_INVITATION">Meeting Invitations</option>
                    </select>
                  </div>

                  <div className="filter-actions">
                    <button
                      className="btn-clear"
                      onClick={() => MemberService.markAllNotificationsAsRead(currentUser.id).then(fetchNotifications)}
                    >
                      <FaCheck />
                      Mark All Read
                    </button>
                  </div>
                </div>

                {getFilteredNotifications().length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FaBell />
                    </div>
                    <h3 className="empty-state-title">No Notifications</h3>
                    <p className="empty-state-description">
                      {notificationFilter === 'all'
                        ? "You don't have any notifications at this time."
                        : `No ${notificationFilter.replace('_', ' ').toLowerCase()} notifications found.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {getFilteredNotifications().map(notification => (
                      <div
                        key={notification.id}
                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-header">
                          <h4 className="notification-title">
                            {MemberService.getNotificationIcon(notification.type)}
                            {notification.title}
                          </h4>
                          <span className="notification-time">
                            {MemberService.formatDate(notification.createdAt)}
                          </span>
                        </div>

                        <p className="notification-message">{notification.message}</p>

                        <div className="notification-actions">
                          {notification.type === 'TASK_ASSIGNMENT' && notification.resolution && (
                            <button
                              className="btn-notification btn-view-task"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('tasks');
                              }}
                            >
                              <FaEye />
                              View Task ({notification.resolution.contributionPercentage}% contribution)
                            </button>
                          )}

                          {notification.type === 'MEETING_INVITATION' && notification.meeting && (
                            <>
                              <button
                                className="btn-notification btn-accept-meeting"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab('meetings');
                                }}
                              >
                                <FaCalendarAlt />
                                View Meeting
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Task Detail Modal */}
        {showTaskDetail && selectedTask && (
          <div className="modal-overlay" onClick={() => { setShowTaskDetail(false); setTaskModalError(''); setTaskModalSuccess(''); }}>
            <div className="modal-content task-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">
                    {selectedTask.taskType === 'SUBTASK' ? 'Task Details' : 'Resolution Details'}
                  </h3>
                  <p className="modal-subtitle">
                    {selectedTask.taskType === 'SUBTASK' ? 'My Direct Assignment' : 'Team Resolution'}
                  </p>
                </div>
                <button className="close-btn" onClick={() => { setShowTaskDetail(false); setTaskModalError(''); setTaskModalSuccess(''); }}>
                  <FaTimes />
                </button>
              </div>

              <div className="task-detail-body">
                {taskModalError && (
                  <div className="alert alert-error" style={{ marginBottom: 10 }}>
                    <FaExclamationTriangle />
                    <strong>Error:</strong> {taskModalError}
                  </div>
                )}

                {taskModalSuccess && (
                  <div className="alert alert-success" style={{ marginBottom: 10 }}>
                    <FaCheckCircle />
                    {taskModalSuccess}
                  </div>
                )}

                <div className="task-detail-section">
                  <h4 className="task-detail-label">Title</h4>
                  <p className="task-detail-value">{selectedTask.title}</p>
                </div>

                <div className="task-detail-section">
                  <h4 className="task-detail-label">Description</h4>
                  <p className="task-detail-value">{selectedTask.description || 'No description provided'}</p>
                </div>

                <div className="task-detail-row">
                  <div className="task-detail-section">
                    <h4 className="task-detail-label">Status</h4>
                    <span className={`task-status ${(selectedTask.status || 'TODO').toLowerCase().replace('_', '-')}`}>
                      {formatResolutionStatusLabel(normalizeResolutionStatus(selectedTask.status || 'TODO'))}
                    </span>
                  </div>

                  <div className="task-detail-section">
                    <h4 className="task-detail-label">Progress</h4>
                    <div className="task-progress" style={{ marginTop: 4 }}>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${getTaskProgress(selectedTask)}%` }}
                        />
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--theme-text-2, #b8c5da)', marginTop: 4 }}>{getTaskProgress(selectedTask)}%</span>
                    </div>
                  </div>
                </div>

                {selectedTask.deadline && (
                  <div className="task-detail-section">
                    <h4 className="task-detail-label">Deadline</h4>
                    <p className="task-detail-value">
                      <FaClock style={{ marginRight: 6, color: 'var(--success, #22c55e)' }} />
                      {MemberService.formatDate(selectedTask.deadline)}
                      {MemberService.getDaysUntilDeadline(selectedTask.deadline) > 0
                        ? ` (${MemberService.getDaysUntilDeadline(selectedTask.deadline)} days remaining)`
                        : ' (Overdue)'}
                    </p>
                  </div>
                )}

                {selectedTask.assignedDate && (
                  <div className="task-detail-section">
                    <h4 className="task-detail-label">Assigned Date</h4>
                    <p className="task-detail-value">{MemberService.formatDate(selectedTask.assignedDate)}</p>
                  </div>
                )}

                {selectedTask.taskType === 'RESOLUTION' && (
                  <div className="task-detail-section">
                    <h4 className="task-detail-label">Subcommittee Contribution</h4>
                    <p className="task-detail-value" style={{ fontSize: 20, fontWeight: 700, color: 'var(--success, #22c55e)' }}>
                      {selectedTask.contributionPercentage || 0}%
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--theme-text-2, #b8c5da)', marginTop: 4 }}>
                      <FaLock style={{ marginRight: 4 }} />
                      Resolution status can only be changed when approved by the Chair
                    </p>
                  </div>
                )}

                {selectedTask.taskType === 'SUBTASK' && (
                  <div className="task-detail-section">
                    <h4 className="task-detail-label">Progress Note to Chair of the Subcommittee *</h4>
                    <textarea
                      value={progressNote}
                      onChange={(e) => setProgressNote(e.target.value)}
                      placeholder="Report your progress here so the Chair can follow up... (e.g., what you've accomplished, blockers, next steps)"
                      rows="3"
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        border: '1px solid var(--theme-border, #24344c)', fontSize: '0.9rem', resize: 'vertical',
                        fontFamily: 'inherit', lineHeight: 1.5
                      }}
                    />
                    {selectedTask.progressNote && (
                      <p style={{ fontSize: 12, color: 'var(--theme-text-2, #b8c5da)', marginTop: 4 }}>
                        Last note: {selectedTask.progressNote}
                      </p>
                    )}
                    <p style={{ fontSize: 12, color: 'var(--theme-text-2, #b8c5da)', marginTop: 6 }}>
                      Ranking and status updates are handled by the Chair during review.
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                {selectedTask.taskType === 'SUBTASK' && (
                  <button
                    className="btn-primary"
                    onClick={() => handleSubmitProgressNote(selectedTask.id)}
                    disabled={updatingSubTaskId === selectedTask.id}
                  >
                    {updatingSubTaskId === selectedTask.id ? <FaSpinner className="loading-spinner" /> : <FaCheckCircle />}
                    {updatingSubTaskId === selectedTask.id ? ' Submitting...' : ' Submit Progress Note'}
                  </button>
                )}
                <button className="btn-secondary" onClick={() => { setShowTaskDetail(false); setTaskModalError(''); setTaskModalSuccess(''); }}>
                  Close
                </button>
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
                    <span className="profile-view-value">{user?.role || userProfile?.role || currentUser?.role || 'SUBCOMMITTEE_MEMBER'}</span>
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
                    value={user?.role || userProfile?.role || currentUser?.role || 'SUBCOMMITTEE_MEMBER'}
                    disabled
                  />
                  <p className="readonly-notice">
                    <FaLock />
                    Role cannot be changed. Contact your administrator if needed.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Subcommittee</label>
                  <input
                    type="text"
                    className="form-input"
                    value={user?.subcommittee?.name || userProfile?.subcommittee?.name || ''}
                    disabled
                  />
                  <p className="readonly-notice">
                    <FaLock />
                    Subcommittee assignment is managed by administrators.
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

export default EnhancedMemberDashboard;
