import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUser, FaBell, FaFileAlt, FaChartLine, FaClock, FaExclamationTriangle,
  FaCheckCircle, FaEye, FaEdit, FaSpinner, FaTasks, FaCalendarAlt,
  FaEnvelope, FaPhone, FaUserTie, FaBuilding, FaPercent, FaComment,
  FaPlus, FaTimes, FaSave, FaTrash, FaArrowLeft, FaInfoCircle,
  FaUsers, FaCalendar, FaCheckDouble, FaDownload, FaStar, FaGavel, FaCamera
} from 'react-icons/fa';
import ChairService from '../../services/chairService';
import ProfileService from '../../services/profileService';
import PDFService from '../../services/pdfService';
import ReportExportBar from '../../components/ReportExportBar';
import ChairmanTaskAssignment from './ChairmanTaskAssignment';
import { formatResolutionStatusLabel } from '../../utils/resolutionStatus';
import './EnhancedChairDashboard.css';

const EnhancedChairDashboard = () => {
  const [activeTab, setActiveTab] = useState('resolutions');
  const [user, setUser] = useState(null);
  const [resolutions, setResolutions] = useState([]);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Show-all toggles for list limiting
  const [showAllResolutions, setShowAllResolutions] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [showAllResolutionReports, setShowAllResolutionReports] = useState(false);
  const DISPLAY_LIMIT = 5;

  // Resolution details view state
  const [showResolutionDetails, setShowResolutionDetails] = useState(false);
  const [selectedResolutionDetails, setSelectedResolutionDetails] = useState(null);
  const [resolutionDetailsLoading, setResolutionDetailsLoading] = useState(false);

  // Task assignment state
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);

  // Report submission state
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [reportForm, setReportForm] = useState({
    progressDetails: '',
    performancePercentage: 75,
    updateStatus: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [pendingReportFiles, setPendingReportFiles] = useState([]);

  // Report resubmission state
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [selectedRejectedReport, setSelectedRejectedReport] = useState(null);
  const [resubmitForm, setResubmitForm] = useState({
    progressDetails: '',
    performancePercentage: 75,
    updateStatus: ''
  });
  const [resubmitting, setResubmitting] = useState(false);
  const [pendingResubmitFiles, setPendingResubmitFiles] = useState([]);

  const mergeUniqueFiles = (existingFiles, newFiles) => {
    const existingKeys = new Set(
      (existingFiles || []).map((file) => `${file.name}-${file.size}-${file.lastModified}`)
    );
    const uniqueNewFiles = (newFiles || []).filter(
      (file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`)
    );
    return [...(existingFiles || []), ...uniqueNewFiles];
  };

  const removePendingReportFile = (fileToRemove) => {
    setPendingReportFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  const removePendingResubmitFile = (fileToRemove) => {
    setPendingResubmitFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };
  const [pdfLoading, setPdfLoading] = useState(false);

  const [attachmentsByReport, setAttachmentsByReport] = useState({});
  const [attachmentViewer, setAttachmentViewer] = useState({
    open: false,
    url: '',
    filename: '',
    contentType: '',
    reportId: null,
    attachmentId: null,
  });
  const [attachmentPreview, setAttachmentPreview] = useState({
    loading: false,
    error: '',
    blobUrl: '',
    contentType: '',
  });

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    const loadPreview = async () => {
      if (!attachmentViewer.open || !attachmentViewer.reportId || !attachmentViewer.attachmentId) {
        return;
      }

      setAttachmentPreview({ loading: true, error: '', blobUrl: '', contentType: '' });
      try {
        const preview = await ChairService.getReportAttachmentPreview(
          attachmentViewer.reportId,
          attachmentViewer.attachmentId
        );
        objectUrl = URL.createObjectURL(preview.blob);
        if (!active) return;

        setAttachmentPreview({
          loading: false,
          error: '',
          blobUrl: objectUrl,
          contentType: preview.contentType || attachmentViewer.contentType || '',
        });
      } catch (err) {
        if (!active) return;
        setAttachmentPreview({
          loading: false,
          error: 'Unable to preview this file in the platform. You can still download it.',
          blobUrl: '',
          contentType: '',
        });
      }
    };

    loadPreview();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [attachmentViewer.open, attachmentViewer.reportId, attachmentViewer.attachmentId, attachmentViewer.contentType]);

  const chairReportTypes = [
    { value: 'my_reports', label: 'My Reports' },
    { value: 'resolutions', label: 'Resolutions Report' },
    { value: 'comprehensive', label: 'Comprehensive Activities Report' },
  ];

  // Helper: check if a resolution already has a submitted/approved report by this chair
  const getResolutionReportStatus = (resolutionId) => {
    const resReport = reports.find(r => r.resolution?.id === resolutionId);
    if (!resReport) return null;
    return resReport.status;
  };

  // Helper: get human-readable status label with colour
  const getStatusLabel = (status) => {
    const map = {
      'SUBMITTED': 'Submitted (Pending HOD Review)',
      'APPROVED_BY_HOD': 'Approved by HOD',
      'REJECTED_BY_HOD': 'Rejected by HOD',
      'APPROVED_BY_COMMISSIONER': 'Completed',
      'REJECTED_BY_COMMISSIONER': 'Rejected by Commissioner',
      'PENDING_CHAIR_REVIEW': 'Pending Your Review',
      'DRAFT': 'Draft',
    };
    return map[status] || status?.replace(/_/g, ' ') || 'Unknown';
  };

  const formatPerformanceCalculation = (report) => {
    return null;
  };

  const getResolutionStatusLabel = (status) => {
    return formatResolutionStatusLabel(status);
  };

  const isViewableAttachment = (contentType = '') => {
    const ct = String(contentType || '').toLowerCase();
    return ct.startsWith('image/') || ct.includes('pdf') || ct.startsWith('text/') || ct.includes('json');
  };

  const loadReportAttachments = async (reportList) => {
    try {
      const entries = await Promise.all(
        (reportList || []).map(async (report) => {
          const attachments = await ChairService.getReportAttachments(report.id);
          return [report.id, attachments];
        })
      );
      const nextMap = {};
      entries.forEach(([reportId, attachments]) => {
        nextMap[reportId] = attachments;
      });
      setAttachmentsByReport(nextMap);
    } catch (e) {
      console.warn('Failed loading report attachments:', e);
    }
  };

  // Resolution reports = reports that have been approved by HOD (i.e. resolution reports)
  const resolutionReports = reports.filter(r =>
    r.status === 'APPROVED_BY_HOD' || r.status === 'APPROVED_BY_COMMISSIONER'
  );

  const approvedResolutionIds = new Set(
    reports
      .filter(r => r.status === 'APPROVED_BY_HOD' || r.status === 'APPROVED_BY_COMMISSIONER')
      .map(r => r.resolution?.id)
      .filter(Boolean)
  );

  const visibleAssignedResolutions = resolutions.filter(r => !approvedResolutionIds.has(r.id));

  const meetings = Array.from(
    new Map(
      resolutions
        .map((resolution) => resolution?.meeting)
        .filter((meeting) => meeting?.id)
        .map((meeting) => [meeting.id, meeting])
    ).values()
  );

  const handleExportPDF = ({ fromDate, toDate, reportType }) => {
    setPdfLoading(true);
    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59);
      if (reportType === 'my_reports') {
        const filtered = reports.filter(r => {
          const d = new Date(r.submittedAt || r.createdAt);
          return d >= from && d <= to;
        });
        PDFService.generateReportsListPDF(filtered, fromDate, toDate, 'Chair Reports');
      } else if (reportType === 'comprehensive') {
        const filteredMeetings = meetings.filter(m => {
          const d = new Date(m.meetingDate || m.date);
          return d >= from && d <= to;
        });
        const filteredReports = reports.filter(r => {
          const d = new Date(r.submittedAt || r.createdAt);
          return d >= from && d <= to;
        });
        PDFService.generateComprehensiveReport({
          meetings: filteredMeetings,
          attendance: [],
          reports: filteredReports,
          fromDate,
          toDate,
        });
      } else {
        const filtered = resolutions.filter(r => {
          const d = new Date(r.createdAt);
          return d >= from && d <= to;
        });
        PDFService.generateResolutionsReport(filtered, fromDate, toDate);
      }
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setPdfLoading(false);
    }
  };

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
        // Ensure subcommitteeId is resolved from the nested subcommittee object if needed
        if (!user.subcommitteeId && user.subcommittee?.id) {
          user.subcommitteeId = user.subcommittee.id;
        }
        console.log('🔍 EnhancedChairDashboard: Current user:', user);
        return user;
      }
    } catch (error) {
      console.error('❌ EnhancedChairDashboard: Error getting current user:', error);
    }

    return null;
  };

  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser?.id) {
      console.warn('⚠️ EnhancedChairDashboard: No authenticated user found');
      setLoading(false);
      setError('Not logged in. Please log in as a Chair to access this dashboard.');
      return;
    }

    initializeDashboard();

    // Set up notification polling every 30 seconds
    const notificationInterval = setInterval(() => {
      if (currentUser?.id) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(notificationInterval);
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 EnhancedChairDashboard: Initializing dashboard for user:', currentUser);

      await Promise.all([
        fetchUserProfile(),
        fetchResolutions(),
        fetchReports(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('❌ EnhancedChairDashboard: Error initializing dashboard:', error);
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      console.log('🔍 EnhancedChairDashboard: Fetching user profile for:', currentUser.email);
      const profile = await ChairService.getUserProfile(currentUser.email);
      setUser(profile);
      setUserProfile(profile);
      setProfileForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      });

      // Resolve subcommitteeId from profile if not already set on currentUser
      if (!currentUser.subcommitteeId && profile.subcommittee?.id) {
        currentUser.subcommitteeId = profile.subcommittee.id;
      }

      // If profile has a profile picture, get the full URL
      if (profile.profilePicture) {
        const fullPictureUrl = ProfileService.getFullProfilePictureUrl(profile.profilePicture);
        setProfilePictureUrl(fullPictureUrl);
      }

      console.log('✅ EnhancedChairDashboard: User profile loaded:', profile);
    } catch (error) {
      console.error('❌ EnhancedChairDashboard: Error fetching profile:', error);
      // Use fallback data
      setUser(currentUser);
      setUserProfile(currentUser);
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchResolutions = async () => {
    try {
      console.log('🔍 EnhancedChairDashboard: Fetching assigned resolutions for chair:', currentUser.id);
      const resolutions = await ChairService.getAssignedResolutions(currentUser.id);
      console.log('✅ EnhancedChairDashboard: Loaded resolutions:', resolutions);
      setResolutions(resolutions);
    } catch (error) {
      console.error('❌ EnhancedChairDashboard: Error fetching resolutions:', error);

      // Check if it's a user validation error
      if (error.message && error.message.includes('User validation failed')) {
        setError('User validation failed. Please ensure you are logged in as a Chair and have proper permissions.');
      } else if (error.message && error.message.includes('Network error')) {
        setError('Backend server is not available. Please check if the server is running.');
      } else {
        setError('Failed to load assigned resolutions: ' + error.message);
      }
    }
  };

  const fetchReports = async () => {
    try {
      console.log('🔍 EnhancedChairDashboard: Fetching reports for chair:', currentUser.id);
      const reports = await ChairService.getChairReports(currentUser.id);
      console.log('✅ EnhancedChairDashboard: Loaded reports:', reports);
      setReports(reports);
      await loadReportAttachments(reports);
    } catch (error) {
      console.error('❌ EnhancedChairDashboard: Error fetching reports:', error);
      setError('Failed to load reports');
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      console.log('🔍 EnhancedChairDashboard: Fetching notifications for user:', currentUser.id);
      const [notificationsData, unreadCountData] = await Promise.all([
        ChairService.getUserNotifications(currentUser.id),
        ChairService.getUnreadNotificationCount(currentUser.id)
      ]);
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
      console.log('✅ EnhancedChairDashboard: Notifications loaded:', notificationsData.length, 'unread:', unreadCountData);
    } catch (error) {
      console.error('❌ EnhancedChairDashboard: Error fetching notifications:', error);
    }
  }, [currentUser.id]);

  const handleResolutionDetailsView = async (resolution) => {
    try {
      setResolutionDetailsLoading(true);
      setError('');

      console.log('🔍 EnhancedChairDashboard: Fetching detailed resolution:', resolution.id);
      const detailedResolution = await ChairService.getResolutionDetails(resolution.id, currentUser.id);

      if (detailedResolution) {
        setSelectedResolutionDetails(detailedResolution);
        setShowResolutionDetails(true);
        console.log('✅ EnhancedChairDashboard: Resolution details loaded:', detailedResolution);
      } else {
        setError('Failed to load resolution details');
      }
    } catch (error) {
      console.error('❌ EnhancedChairDashboard: Error fetching resolution details:', error);
      setError('Failed to load resolution details: ' + error.message);
    } finally {
      setResolutionDetailsLoading(false);
    }
  };

  const closeResolutionDetails = () => {
    setShowResolutionDetails(false);
    setSelectedResolutionDetails(null);
    setShowTaskAssignment(false);
    setError('');
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError('');

      // Validate report data
      const validationErrors = ChairService.validateReportData(reportForm);
      if (validationErrors.length > 0) {
        setError('Validation failed: ' + validationErrors.join(', '));
        return;
      }

      console.log('🔍 EnhancedChairDashboard: Submitting report for resolution:', selectedResolution.id);

      // Resolve subcommitteeId from multiple sources
      const resolvedSubcommitteeId = currentUser.subcommitteeId
        || currentUser.subcommittee?.id
        || userProfile?.subcommitteeId
        || userProfile?.subcommittee?.id
        || user?.subcommitteeId
        || user?.subcommittee?.id;

      if (!resolvedSubcommitteeId) {
        setError('Unable to determine your subcommittee. Please refresh the page and try again.');
        return;
      }

      const reportData = {
        resolutionId: selectedResolution.id,
        subcommitteeId: resolvedSubcommitteeId,
        chairId: currentUser.id,
        progressDetails: reportForm.updateStatus || reportForm.progressDetails,
        hindrances: '',
        performancePercentage: reportForm.performancePercentage
      };

      const savedReport = await ChairService.submitReport(reportData);
      console.log('✅ EnhancedChairDashboard: Report submitted successfully:', savedReport);

      const optimisticReport = {
        id: savedReport.id,
        status: savedReport.status || 'SUBMITTED',
        submittedAt: savedReport.submittedAt || new Date().toISOString(),
        performancePercentage: savedReport.performancePercentage ?? reportForm.performancePercentage,
        progressDetails: savedReport.progressDetails ?? (reportForm.updateStatus || reportForm.progressDetails),
        resolution: selectedResolution ? { id: selectedResolution.id, title: selectedResolution.title } : null,
        subcommittee: { id: resolvedSubcommitteeId }
      };

      setReports((prev) => {
        const withoutSameResolution = (prev || []).filter(
          (r) => r?.resolution?.id !== optimisticReport?.resolution?.id
        );
        return [optimisticReport, ...withoutSameResolution];
      });

      if (savedReport?.id && pendingReportFiles.length > 0) {
        try {
          await ChairService.uploadReportAttachments(savedReport.id, pendingReportFiles);
        } catch (uploadError) {
          console.error('❌ EnhancedChairDashboard: Attachment upload failed:', uploadError);
          setError(`Report submitted, but attachment upload failed: ${uploadError.message}`);
        }
      }

      // Show success message with HOD confirmation
      const successMessage = savedReport.successMessage || 'Report submitted successfully! It has been sent to HOD for review.';
      setSuccess(successMessage);
      setShowReportModal(false);
      setReportForm({
        progressDetails: '',
        performancePercentage: 75,
        updateStatus: ''
      });
      setPendingReportFiles([]);

      // Refresh reports list from backend for authoritative data.
      try {
        await fetchReports();
      } catch (_) {
        // Keep optimistic state if refresh fails; error is shown by fetchReports path.
      }

    } catch (error) {
      console.error('❌ EnhancedChairDashboard: Error submitting report:', error);
      // Extract detailed error message from backend response if available
      const backendError = error.response?.data?.error || error.response?.data?.message;
      const validationDetails = error.response?.data?.details;
      let errorMessage = 'Failed to submit report: ' + (backendError || error.message);
      if (validationDetails && Array.isArray(validationDetails) && validationDetails.length > 0) {
        errorMessage += '\n' + validationDetails.join('\n');
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setError('');

    try {
      console.log('🔍 EnhancedChairDashboard: Updating profile for:', currentUser.email);
      await ChairService.updateUserProfile(currentUser.email, profileForm);

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
      setSelectedProfilePicture(null);
      await fetchUserProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('❌ EnhancedChairDashboard: Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!currentUser?.id) return;

    const confirmed = window.confirm('Delete your profile photo?');
    if (!confirmed) return;

    try {
      setDeletingProfilePicture(true);
      setError('');
      await ProfileService.deleteProfilePicture(currentUser.id);
      setSuccess('Profile photo deleted successfully!');
      await fetchUserProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('❌ EnhancedChairDashboard: Error deleting profile photo:', error);
      setError(error.message || 'Failed to delete profile photo');
    } finally {
      setDeletingProfilePicture(false);
    }
  };

  const openReportModal = (resolution) => {
    setSelectedResolution(resolution);
    setShowReportModal(true);
    setError('');
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedResolution(null);
    setReportForm({
      progressDetails: '',
      performancePercentage: 75,
      updateStatus: ''
    });
    setPendingReportFiles([]);
    setError('');
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfilePicture(null);
    setError('');
  };

  const openProfileModal = () => {
    setShowProfileViewModal(true);
    setError('');
  };

  const closeProfileViewModal = () => {
    setShowProfileViewModal(false);
    setError('');
  };

  const openResubmitModal = (report) => {
    setSelectedRejectedReport(report);
    setResubmitForm({
      progressDetails: report.progressDetails || '',
      performancePercentage: report.performancePercentage || 75,
      updateStatus: report.progressDetails || ''
    });
    setPendingResubmitFiles([]);
    setShowResubmitModal(true);
    setError('');
  };

  const closeResubmitModal = () => {
    setShowResubmitModal(false);
    setSelectedRejectedReport(null);
    setResubmitForm({
      progressDetails: '',
      performancePercentage: 75,
      updateStatus: ''
    });
    setPendingResubmitFiles([]);
    setError('');
  };

  const handleReportResubmit = async (e) => {
    e.preventDefault();

    try {
      setResubmitting(true);
      setError('');

      // Validate report data
      const validationErrors = ChairService.validateReportData(resubmitForm);
      if (validationErrors.length > 0) {
        setError('Validation failed: ' + validationErrors.join(', '));
        return;
      }

      console.log('🔍 EnhancedChairDashboard: Resubmitting report:', selectedRejectedReport.id);

      const reportData = {
        reportId: selectedRejectedReport.id,
        chairId: currentUser.id,
        resolutionId: selectedRejectedReport.resolution?.id,
        subcommitteeId: selectedRejectedReport.subcommittee?.id,
        progressDetails: resubmitForm.updateStatus || resubmitForm.progressDetails,
        hindrances: '',
        performancePercentage: resubmitForm.performancePercentage
      };

      const updatedReport = await ChairService.updateReport(selectedRejectedReport.id, reportData);
      console.log('✅ EnhancedChairDashboard: Report resubmitted successfully:', updatedReport);

      if (updatedReport?.id && pendingResubmitFiles.length > 0) {
        try {
          await ChairService.uploadReportAttachments(updatedReport.id, pendingResubmitFiles);
        } catch (uploadError) {
          console.error('❌ EnhancedChairDashboard: Resubmit attachment upload failed:', uploadError);
          setError(`Report resubmitted, but attachment upload failed: ${uploadError.message}`);
        }
      }

      setSuccess('Report resubmitted successfully! It has been sent to HOD for review.');
      setShowResubmitModal(false);
      setResubmitForm({
        progressDetails: '',
        performancePercentage: 75,
        updateStatus: ''
      });
      setPendingResubmitFiles([]);

      // Refresh reports list
      await fetchReports();

    } catch (error) {
      console.error('❌ EnhancedChairDashboard: Error resubmitting report:', error);
      setError('Failed to resubmit report: ' + error.message);
    } finally {
      setResubmitting(false);
    }
  };

  const openResubmitFromNotification = async (relatedEntityId) => {
    if (!relatedEntityId) {
      setError('This notification has no report reference.');
      return;
    }

    const matchesId = (report) => String(report?.id) === String(relatedEntityId);
    let rejectedReport = (reports || []).find(matchesId);

    // Fallback: refresh reports once in case local state is stale.
    if (!rejectedReport) {
      try {
        const latestReports = await ChairService.getChairReports(currentUser.id);
        setReports(latestReports);
        rejectedReport = (latestReports || []).find(matchesId);
      } catch (_) {
        // Ignore here; fetchReports already handles errors.
      }
    }

    if (!rejectedReport) {
      setError('Unable to open resubmit form for this notification. Please open it from My Reports.');
      return;
    }

    openResubmitModal(rejectedReport);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <FaSpinner className="loading-spinner" />
        <p>Loading Chair Dashboard...</p>
      </div>
    );
  }

  // Resolution Details View
  if (showResolutionDetails && selectedResolutionDetails) {
    if (showTaskAssignment) {
      return (
        <ChairmanTaskAssignment
          resolution={selectedResolutionDetails}
          onBack={() => setShowTaskAssignment(false)}
          currentUser={currentUser}
        />
      );
    }

    return (
      <div className="enhanced-chair-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="user-info">
              <button
                className="back-btn"
                onClick={closeResolutionDetails}
              >
                <FaArrowLeft />
                Back to Dashboard
              </button>
              <div>
                <h1>Resolution Details</h1>
                <p>Viewing: {selectedResolutionDetails.title}</p>
              </div>
            </div>
            <div className="header-actions">
              {(() => {
                const rStatus = getResolutionReportStatus(selectedResolutionDetails.id);
                const canEditResolution = !(rStatus === 'APPROVED_BY_HOD' || rStatus === 'APPROVED_BY_COMMISSIONER');
                if (rStatus === 'APPROVED_BY_HOD' || rStatus === 'APPROVED_BY_COMMISSIONER') {
                  return (
                    <span className="btn" style={{ background: '#10b981', color: '#fff', borderRadius: 6, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, border: 'none' }}>
                      <FaCheckCircle /> Report Completed
                    </span>
                  );
                } else if (rStatus === 'SUBMITTED') {
                  return (
                    <span className="btn" style={{ background: '#d97706', color: '#fff', borderRadius: 6, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, border: 'none' }}>
                      <FaClock /> Submitted — Pending HOD
                    </span>
                  );
                } else {
                  return (<>
                    {canEditResolution && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowTaskAssignment(true)}
                        style={{ marginRight: '10px' }}
                      >
                        <FaTasks />
                        Assign Tasks to Members
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={() => openReportModal(selectedResolutionDetails)}
                    >
                      <FaFileAlt />
                      Submit Report to HOD
                    </button>
                  </>);
                }
              })()}
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <FaCheckCircle />
            <span>{success}</span>
          </div>
        )}

        {/* Resolution Details Content */}
        <div className="resolution-details-content">
          <div className="resolution-details-card">
            <div className="resolution-details-header">
              <h2>{selectedResolutionDetails.title}</h2>
              <span className={`status ${selectedResolutionDetails.status?.toLowerCase() || 'assigned'}`}>
                {getResolutionStatusLabel(selectedResolutionDetails.status)}
              </span>
            </div>

            <div className="resolution-details-body">
              <div className="detail-section">
                <h3><FaFileAlt /> Description</h3>
                <p>{selectedResolutionDetails.description}</p>
              </div>

              <div className="detail-section">
                <h3><FaInfoCircle /> Basic Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Created:</span>
                    <span className="info-value">{ChairService.formatDate(selectedResolutionDetails.createdAt)}</span>
                  </div>
                  {selectedResolutionDetails.meeting && (
                    <div className="info-item">
                      <span className="info-label">Meeting:</span>
                      <span className="info-value">{selectedResolutionDetails.meeting.title}</span>
                    </div>
                  )}
                  {selectedResolutionDetails.createdBy && (
                    <div className="info-item">
                      <span className="info-label">Created By:</span>
                      <span className="info-value">{selectedResolutionDetails.createdBy.name}</span>
                    </div>
                  )}
                  {selectedResolutionDetails.assignments && selectedResolutionDetails.assignments.length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Your Contribution:</span>
                      <span className="info-value">
                        {selectedResolutionDetails.assignments.find(a => a.subcommittee?.id === currentUser.subcommitteeId)?.contributionPercentage || 0}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedResolutionDetails.assignments && selectedResolutionDetails.assignments.length > 0 && (
                <div className="detail-section">
                  <h3><FaUsers /> Subcommittee Assignments</h3>
                  <div className="assignments-list">
                    {selectedResolutionDetails.assignments.map((assignment, index) => (
                      <div key={index} className="assignment-item">
                        <div className="assignment-header">
                          <span className="subcommittee-name">{assignment.subcommittee?.name}</span>
                          <span className="contribution-percentage">{assignment.contributionPercentage}%</span>
                        </div>
                        {assignment.subcommittee?.chair && (
                          <div className="assignment-chair">
                            <FaUserTie />
                            <span>Chair: {assignment.subcommittee.chair.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedResolutionDetails.reports && selectedResolutionDetails.reports.length > 0 && (
                <div className="detail-section">
                  <h3><FaFileAlt /> Reports History</h3>
                  <div className="reports-history">
                    {selectedResolutionDetails.reports.map((report, index) => (
                      <div key={index} className="report-history-item">
                        <div className="report-history-header">
                          <span className="report-date">{ChairService.formatDate(report.submittedAt)}</span>
                          <span className={`report-status ${report.status.toLowerCase()}`}>
                            {report.status}
                          </span>
                        </div>
                        <div className="report-history-content">
                          <p><strong>Progress:</strong> {report.progressDetails}</p>
                          {report.hindrances && (
                            <p><strong>Hindrances:</strong> {report.hindrances}</p>
                          )}
                          <p><strong>Performance:</strong> {report.performancePercentage}%</p>
                          {report.hodComments && (
                            <div className="hod-comments">
                              <FaComment />
                              <strong>HOD Comments:</strong> {report.hodComments}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="resolution-details-actions">
              {(() => {
                const rStatus = getResolutionReportStatus(selectedResolutionDetails.id);
                const canEditResolution = !(rStatus === 'APPROVED_BY_HOD' || rStatus === 'APPROVED_BY_COMMISSIONER');
                if (rStatus === 'APPROVED_BY_HOD' || rStatus === 'APPROVED_BY_COMMISSIONER') {
                  return (
                    <span className="btn" style={{ background: '#10b981', color: '#fff', borderRadius: 6, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, border: 'none' }}>
                      <FaCheckCircle /> Report Completed
                    </span>
                  );
                } else if (rStatus === 'SUBMITTED') {
                  return (
                    <span className="btn" style={{ background: '#d97706', color: '#fff', borderRadius: 6, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, border: 'none' }}>
                      <FaClock /> Submitted — Pending HOD
                    </span>
                  );
                } else {
                  return (<>
                    {canEditResolution && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowTaskAssignment(true)}
                      >
                        <FaTasks />
                        Assign Tasks to Members
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={() => openReportModal(selectedResolutionDetails)}
                    >
                      <FaFileAlt />
                      Submit Report to HOD
                    </button>
                  </>);
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-chair-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <FaUserTie className="user-icon" />
            <div>
              <h1>{currentUser?.subcommittee?.name || 'Subcommittee'} Chair Dashboard</h1>
              <p>Welcome back, {user?.name || currentUser?.name || 'Chair'}
                {(userProfile?.position || user?.position || currentUser?.position) && (
                  <span className="position-badge"> — {userProfile?.position || user?.position || currentUser?.position}</span>
                )}
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="notification-btn"
              onClick={() => setActiveTab('notifications')}
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
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-error">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <FaCheckCircle />
          <span>{success}</span>
        </div>
      )}

      {/* Report Export Bar */}
      <ReportExportBar
        reportTypes={chairReportTypes}
        onExport={handleExportPDF}
        loading={pdfLoading}
      />

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'resolutions' ? 'active' : ''}`}
          onClick={() => setActiveTab('resolutions')}
        >
          <FaTasks />
          <span>Assigned Resolutions ({visibleAssignedResolutions.length})</span>
        </button>
        <button
          className={`tab ${activeTab === 'resolution_reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('resolution_reports')}
        >
          <FaGavel />
          <span>Resolution Reports ({resolutionReports.length})</span>
        </button>
        <button
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FaFileAlt />
          <span>My Reports ({reports.length})</span>
        </button>
        <button
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
          aria-label="Notifications"
          title="Notifications"
        >
          <FaBell />
          {notifications.length > 0 && <span>{notifications.length}</span>}
        </button>
      </div>

      {/* Content Area */}
      <div className="dashboard-content">
        {activeTab === 'resolutions' && (
          <div className="resolutions-tab">
            <div className="tab-header">
              <h2>Assigned Resolutions</h2>
              <p>Manage and report on your assigned resolution tasks</p>
            </div>

            {visibleAssignedResolutions.length === 0 ? (
              <div className="empty-state">
                <FaTasks className="empty-icon" />
                <h3>No Resolutions Assigned</h3>
                <p>You don't have any resolutions assigned to your subcommittee at this time.</p>
              </div>
            ) : (
              <>
              <div className="resolutions-grid">
                {(showAllResolutions ? visibleAssignedResolutions : visibleAssignedResolutions.slice(0, DISPLAY_LIMIT)).map(resolution => (
                  <div key={resolution.id} className="resolution-card">
                    <div className="resolution-header">
                      <h3>{resolution.title}</h3>
                      <span className={`status ${resolution.status?.toLowerCase() || 'assigned'}`}>
                        {getResolutionStatusLabel(resolution.status)}
                      </span>
                    </div>
                    <p className="resolution-description">{resolution.description}</p>
                    <div className="resolution-details">
                      <div className="detail">
                        <FaCalendarAlt />
                        <span>Created: {ChairService.formatDate(resolution.createdAt)}</span>
                      </div>
                      {resolution.assignments && resolution.assignments.length > 0 && (
                        <div className="detail">
                          <FaPercent />
                          <span>Your Contribution: {resolution.assignments.find(a => a.subcommittee?.id === currentUser.subcommitteeId)?.contributionPercentage || 0}%</span>
                        </div>
                      )}
                      {resolution.meeting && (
                        <div className="detail">
                          <FaBuilding />
                          <span>Meeting: {resolution.meeting.title}</span>
                        </div>
                      )}
                    </div>
                    <div className="resolution-actions">
                      {(() => {
                        const reportStatus = getResolutionReportStatus(resolution.id);
                        if (reportStatus === 'APPROVED_BY_HOD' || reportStatus === 'APPROVED_BY_COMMISSIONER') {
                          return (
                            <span className="btn btn-completed" style={{ padding: '8px 16px', background: '#10b981', color: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', border: 'none', cursor: 'default' }}>
                              <FaCheckCircle /> Completed
                            </span>
                          );
                        } else if (reportStatus === 'SUBMITTED') {
                          return (
                            <span className="btn btn-pending" style={{ padding: '8px 16px', background: '#d97706', color: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', border: 'none', cursor: 'default' }}>
                              <FaClock /> Submitted — Pending HOD Review
                            </span>
                          );
                        } else if (reportStatus === 'REJECTED_BY_HOD') {
                          return (
                            <button
                              className="btn btn-warning"
                              onClick={() => {
                                const rejReport = reports.find(r => r.resolution?.id === resolution.id);
                                if (rejReport) openResubmitModal(rejReport);
                              }}
                              style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}
                            >
                              <FaEdit /> Resubmit Report
                            </button>
                          );
                        } else {
                          return (
                            <button
                              className="btn btn-primary"
                              onClick={() => openReportModal(resolution)}
                            >
                              <FaFileAlt />
                              Submit Report to HOD
                            </button>
                          );
                        }
                      })()}
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleResolutionDetailsView(resolution)}
                        disabled={resolutionDetailsLoading}
                      >
                        {resolutionDetailsLoading ? <FaSpinner className="spinner" /> : <FaEye />}
                        {resolutionDetailsLoading ? 'Loading...' : 'View Details'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {visibleAssignedResolutions.length > DISPLAY_LIMIT && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button
                    onClick={() => setShowAllResolutions(!showAllResolutions)}
                    style={{ padding: '6px 20px', fontSize: '0.85rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  >
                    {showAllResolutions ? 'Show Less' : `Show All (${visibleAssignedResolutions.length})`}
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        )}

        {activeTab === 'resolution_reports' && (
          <div className="reports-tab">
            <div className="tab-header">
              <h2>Resolution Reports</h2>
              <p>Reports that have been submitted and approved by the HOD</p>
            </div>

            {resolutionReports.length === 0 ? (
              <div className="empty-state">
                <FaGavel className="empty-icon" />
                <h3>No Approved Resolution Reports</h3>
                <p>Reports will appear here once they are approved by the Head of Delegation.</p>
              </div>
            ) : (
              <>
              <div className="reports-list">
                {(showAllResolutionReports ? resolutionReports : resolutionReports.slice(0, DISPLAY_LIMIT)).map(report => (
                  <div key={report.id} className="report-card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div className="report-header">
                      <h3>{report.resolution?.title || 'Unknown Resolution'}</h3>
                      <span className="status" style={{
                        background: report.status === 'APPROVED_BY_COMMISSIONER' ? '#059669' : '#10b981',
                        color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem'
                      }}>
                        {report.status === 'APPROVED_BY_COMMISSIONER' ? 'Completed' : 'Approved by HOD'}
                      </span>
                    </div>
                    <div className="report-content">
                      <div className="report-details">
                        <div className="detail">
                          <FaPercent />
                          <span>Performance: {report.performancePercentage}%</span>
                        </div>
                        {formatPerformanceCalculation(report) && (
                          <div className="detail" style={{ marginLeft: 22 }}>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                              {formatPerformanceCalculation(report)}
                            </span>
                          </div>
                        )}
                        <div className="detail">
                          <FaClock />
                          <span>Submitted: {ChairService.formatDate(report.submittedAt)}</span>
                        </div>
                        {report.hodReviewedAt && (
                          <div className="detail">
                            <FaCheckCircle style={{ color: '#10b981' }} />
                            <span>Approved: {ChairService.formatDate(report.hodReviewedAt)}</span>
                          </div>
                        )}
                        {report.hodRanking && (
                          <div className="detail">
                            <FaStar style={{ color: '#f59e0b' }} />
                            <span>HOD Rating: {report.hodRanking}/5</span>
                          </div>
                        )}
                      </div>
                      <div className="report-text">
                        <div><strong>Progress:</strong> {report.progressDetails}</div>
                        {report.hindrances && (
                          <div><strong>Hindrances:</strong> {report.hindrances}</div>
                        )}
                      </div>
                      {report.hodComments && (
                        <div className="hod-comments">
                          <FaComment />
                          <strong>HOD Comments:</strong> {report.hodComments}
                        </div>
                      )}
                      {report.commissionerComments && (
                        <div className="hod-comments" style={{ borderLeftColor: '#059669' }}>
                          <FaComment />
                          <strong>Commissioner Comments:</strong> {report.commissionerComments}
                        </div>
                      )}
                      {attachmentsByReport[report.id]?.length > 0 && (
                        <div className="hod-comments" style={{ borderLeftColor: '#0284c7', display: 'block' }}>
                          <strong>Attached Files</strong>
                          <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
                            {attachmentsByReport[report.id].map((attachment) => (
                              <div key={attachment.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.82rem' }}>{attachment.filename}</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {isViewableAttachment(attachment.contentType) && (
                                    <button
                                      className="btn btn-sm"
                                      onClick={() => setAttachmentViewer({
                                        open: true,
                                        url: ChairService.getReportAttachmentViewUrl(report.id, attachment.id),
                                        filename: attachment.filename,
                                        contentType: attachment.contentType || '',
                                        reportId: report.id,
                                        attachmentId: attachment.id,
                                      })}
                                      style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                    >
                                      <FaEye /> View
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-sm"
                                    onClick={() => ChairService.downloadReportAttachment(report.id, attachment).catch(() => {})}
                                    style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#475569', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                  >
                                    <FaDownload /> Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="report-actions" style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => PDFService.generateReportPDF(report)}
                          style={{ padding: '5px 12px', fontSize: '0.8rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <FaDownload /> PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {resolutionReports.length > DISPLAY_LIMIT && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button
                    onClick={() => setShowAllResolutionReports(!showAllResolutionReports)}
                    style={{ padding: '6px 20px', fontSize: '0.85rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  >
                    {showAllResolutionReports ? 'Show Less' : `Show All (${resolutionReports.length})`}
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-tab">
            <div className="tab-header">
              <h2>My Reports</h2>
              <p>Track your submitted reports and their status</p>
            </div>

            {reports.length === 0 ? (
              <div className="empty-state">
                <FaFileAlt className="empty-icon" />
                <h3>No Reports Submitted</h3>
                <p>You haven't submitted any reports yet. Submit your first report for an assigned resolution.</p>
              </div>
            ) : (
              <>
              <div className="reports-list">
                {(showAllReports ? reports : reports.slice(0, DISPLAY_LIMIT)).map(report => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <h3>{report.resolution?.title || 'Unknown Resolution'}</h3>
                      <span className={`status ${report.status?.toLowerCase()}`} style={{
                        background: report.status === 'APPROVED_BY_COMMISSIONER' ? '#059669' :
                                    report.status === 'APPROVED_BY_HOD' ? '#10b981' :
                                    report.status === 'REJECTED_BY_HOD' ? '#dc2626' :
                                    report.status === 'SUBMITTED' ? '#d97706' : '#6b7280',
                        color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem'
                      }}>
                        {getStatusLabel(report.status)}
                      </span>
                    </div>
                    <div className="report-content">
                      <div className="report-details">
                        <div className="detail">
                          <FaPercent />
                          <span>Performance: {report.performancePercentage}%</span>
                        </div>
                        {formatPerformanceCalculation(report) && (
                          <div className="detail" style={{ marginLeft: 22 }}>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                              {formatPerformanceCalculation(report)}
                            </span>
                          </div>
                        )}
                        <div className="detail">
                          <FaClock />
                          <span>Submitted: {ChairService.formatDate(report.submittedAt)}</span>
                        </div>
                      </div>
                      <div className="report-text">
                        <div>
                          <strong>Progress:</strong> {report.progressDetails}
                        </div>
                        {report.hindrances && (
                          <div>
                            <strong>Hindrances:</strong> {report.hindrances}
                          </div>
                        )}
                      </div>
                      {report.hodComments && (
                        <div className="hod-comments">
                          <FaComment />
                          <strong>HOD Comments:</strong> {report.hodComments}
                        </div>
                      )}
                      {attachmentsByReport[report.id]?.length > 0 && (
                        <div className="hod-comments" style={{ borderLeftColor: '#0284c7', display: 'block' }}>
                          <strong>Attached Files</strong>
                          <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
                            {attachmentsByReport[report.id].map((attachment) => (
                              <div key={attachment.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.82rem' }}>{attachment.filename}</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {isViewableAttachment(attachment.contentType) && (
                                    <button
                                      className="btn btn-sm"
                                      onClick={() => setAttachmentViewer({
                                        open: true,
                                        url: ChairService.getReportAttachmentViewUrl(report.id, attachment.id),
                                        filename: attachment.filename,
                                        contentType: attachment.contentType || '',
                                        reportId: report.id,
                                        attachmentId: attachment.id,
                                      })}
                                      style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                    >
                                      <FaEye /> View
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-sm"
                                    onClick={() => ChairService.downloadReportAttachment(report.id, attachment).catch(() => {})}
                                    style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#475569', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                  >
                                    <FaDownload /> Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="report-actions" style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => PDFService.generateReportPDF(report)}
                          style={{ padding: '5px 12px', fontSize: '0.8rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <FaDownload /> PDF
                        </button>
                        {report.status === 'REJECTED_BY_HOD' && (
                          <button
                            className="btn btn-warning"
                            onClick={() => openResubmitModal(report)}
                          >
                            <FaEdit />
                            Resubmit Report
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {reports.length > DISPLAY_LIMIT && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button
                    onClick={() => setShowAllReports(!showAllReports)}
                    style={{ padding: '6px 20px', fontSize: '0.85rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  >
                    {showAllReports ? 'Show Less' : `Show All (${reports.length})`}
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-tab">
            <div className="tab-header">
              <h2>Notifications</h2>
              <p>Stay updated with important messages and updates</p>
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state">
                <FaBell className="empty-icon" />
                <h3>No Notifications</h3>
                <p>You're all caught up! No new notifications at this time.</p>
              </div>
            ) : (
              <>
              <div className="notifications-list">
                {(showAllNotifications ? notifications : notifications.slice(0, DISPLAY_LIMIT)).map(notification => (
                  <div key={notification.id} className="notification-card">
                    <div className="notification-icon">
                      {ChairService.getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        {ChairService.formatDate(notification.createdAt)}
                      </span>
                      {notification.type === 'REPORT_REJECTION' && notification.relatedEntityId && (
                        <div className="notification-actions">
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => openResubmitFromNotification(notification.relatedEntityId)}
                          >
                            <FaEdit />
                            Resubmit Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {notifications.length > DISPLAY_LIMIT && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button
                    onClick={() => setShowAllNotifications(!showAllNotifications)}
                    style={{ padding: '6px 20px', fontSize: '0.85rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  >
                    {showAllNotifications ? 'Show Less' : `Show All (${notifications.length})`}
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Report Submission Modal */}
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Submit Report to HOD</h2>
              <button onClick={closeReportModal} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <div className="modal-info">
              <div className="info-alert">
                <FaExclamationTriangle />
                <span>This report will be submitted directly to the Head of Delegation (HOD) for review.</span>
              </div>
            </div>
            <form onSubmit={handleReportSubmit}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 10 }}>
                  <FaExclamationTriangle />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label>Resolution</label>
                <input
                  type="text"
                  value={selectedResolution?.title || ''}
                  readOnly
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Update Status *</label>
                <textarea
                  value={reportForm.updateStatus}
                  onChange={(e) => setReportForm({ ...reportForm, updateStatus: e.target.value, progressDetails: e.target.value })}
                  placeholder="Provide status update on this resolution. Include key achievements, milestones reached, and current progress..."
                  required
                  className="form-control"
                  rows="4"
                />
                <small className="form-help">Minimum 10 characters required</small>
              </div>
              <div className="form-group">
                <label>Attach Files (Multiple)</label>
                <input
                  type="file"
                  multiple
                  className="form-control"
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files || []);
                    setPendingReportFiles((prev) => mergeUniqueFiles(prev, selectedFiles));
                    // Allow selecting the same file again later if removed.
                    e.target.value = '';
                  }}
                />
                {pendingReportFiles.length > 0 && (
                  <div className="form-help" style={{ marginTop: 6 }}>
                    <div style={{ marginBottom: 6 }}>{pendingReportFiles.length} file(s) selected</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {pendingReportFiles.map((file) => (
                        <li key={`${file.name}-${file.size}-${file.lastModified}`} style={{ marginBottom: 4 }}>
                          {file.name}
                          <button
                            type="button"
                            onClick={() => removePendingReportFile(file)}
                            style={{ marginLeft: 8, fontSize: '0.75rem' }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Ranking *</label>
                <div className="percentage-input">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reportForm.performancePercentage}
                    onChange={(e) => setReportForm({ ...reportForm, performancePercentage: parseInt(e.target.value) || 0 })}
                    required
                    className="form-control"
                  />
                  <span className="percentage-symbol">%</span>
                </div>
                <small className="form-help">Rate your subcommittee performance (0-100%)</small>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeReportModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <FaSpinner className="spinner" /> : <FaSave />}
                  {submitting ? 'Submitting to HOD...' : 'Submit to HOD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Update Modal */}
      {showProfileViewModal && (
        <div className="modal-overlay">
          <div className="modal profile-view-modal">
            <div className="modal-header">
              <h2>View Profile</h2>
              <button onClick={closeProfileViewModal} className="close-btn">
                <FaTimes />
              </button>
            </div>

            <div className="profile-view-body">
              <div className="profile-view-hero">
                <div className="profile-view-avatar-wrap">
                  <div className="profile-view-avatar">
                    {profilePictureUrl ? (
                      <img
                        src={profilePictureUrl}
                        alt={`${userProfile?.name || currentUser?.name || 'User'} profile`}
                        className="profile-view-avatar-image"
                      />
                    ) : (
                      <span className="profile-view-avatar-fallback">
                        {(userProfile?.name || currentUser?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="profile-view-avatar-edit"
                    onClick={() => {
                      setShowProfileViewModal(false);
                      setShowProfileModal(true);
                    }}
                    title="Edit profile"
                  >
                    <FaCamera />
                  </button>
                </div>
                <h3 className="profile-view-name">{user?.name || currentUser?.name || ''}</h3>
                <p className="profile-view-email">{user?.email || currentUser?.email || ''}</p>
              </div>

              <div className="profile-view-details">
                <div className="profile-view-row">
                  <span className="profile-view-label">Phone</span>
                  <span className="profile-view-value">{user?.phone || currentUser?.phone || 'Not provided'}</span>
                </div>
                <div className="profile-view-row">
                  <span className="profile-view-label">Role</span>
                  <span className="profile-view-value">{currentUser?.role || 'CHAIR'}</span>
                </div>
                <div className="profile-view-row">
                  <span className="profile-view-label">Subcommittee</span>
                  <span className="profile-view-value">{currentUser?.subcommittee?.name || user?.subcommittee?.name || 'Not assigned'}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions profile-view-actions">
              {profilePictureUrl && (
                <button
                  type="button"
                  onClick={handleDeleteProfilePicture}
                  className="btn btn-secondary"
                  disabled={deletingProfilePicture}
                >
                  {deletingProfilePicture ? <FaSpinner className="spinner" /> : <FaTimes />}
                  {deletingProfilePicture ? 'Deleting...' : 'Delete Photo'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowProfileViewModal(false);
                  setShowProfileModal(true);
                }}
                className="btn btn-primary"
              >
                <FaEdit />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Update Profile</h2>
              <button onClick={closeProfileModal} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Profile Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedProfilePicture(file);
                  }}
                />
                {selectedProfilePicture && (
                  <small className="form-help">Selected: {selectedProfilePicture.name}</small>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeProfileModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={updatingProfile} className="btn btn-primary">
                  {updatingProfile ? <FaSpinner className="spinner" /> : <FaSave />}
                  {updatingProfile ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Resubmission Modal */}
      {showResubmitModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Resubmit Report to HOD</h2>
              <button onClick={closeResubmitModal} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <div className="modal-info">
              <div className="info-alert">
                <FaExclamationTriangle />
                <span>This report will be resubmitted directly to the Head of Delegation (HOD) for review.</span>
              </div>
            </div>
            <form onSubmit={handleReportResubmit}>
              <div className="form-group">
                <label>Resolution</label>
                <input
                  type="text"
                  value={selectedRejectedReport?.resolution?.title || ''}
                  readOnly
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Update Status *</label>
                <textarea
                  value={resubmitForm.updateStatus}
                  onChange={(e) => setResubmitForm({ ...resubmitForm, updateStatus: e.target.value, progressDetails: e.target.value })}
                  placeholder="Provide the updated status and improvements made since feedback..."
                  required
                  className="form-control"
                  rows="4"
                />
                <small className="form-help">Minimum 10 characters required</small>
              </div>
              <div className="form-group">
                <label>Attach Files (Multiple)</label>
                <input
                  type="file"
                  multiple
                  className="form-control"
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files || []);
                    setPendingResubmitFiles((prev) => mergeUniqueFiles(prev, selectedFiles));
                    e.target.value = '';
                  }}
                />
                {pendingResubmitFiles.length > 0 && (
                  <div className="form-help" style={{ marginTop: 6 }}>
                    <div style={{ marginBottom: 6 }}>{pendingResubmitFiles.length} file(s) selected</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {pendingResubmitFiles.map((file) => (
                        <li key={`${file.name}-${file.size}-${file.lastModified}`} style={{ marginBottom: 4 }}>
                          {file.name}
                          <button
                            type="button"
                            onClick={() => removePendingResubmitFile(file)}
                            style={{ marginLeft: 8, fontSize: '0.75rem' }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Ranking *</label>
                <div className="percentage-input">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={resubmitForm.performancePercentage}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, performancePercentage: parseInt(e.target.value) || 0 })}
                    required
                    className="form-control"
                  />
                  <span className="percentage-symbol">%</span>
                </div>
                <small className="form-help">Rate your subcommittee performance (0-100%)</small>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeResubmitModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={resubmitting} className="btn btn-primary">
                  {resubmitting ? <FaSpinner className="spinner" /> : <FaSave />}
                  {resubmitting ? 'Resubmitting to HOD...' : 'Resubmit to HOD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {attachmentViewer.open && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '900px', width: '90vw' }}>
            <div className="modal-header">
              <h2>View Attachment</h2>
              <button
                onClick={() => {
                  setAttachmentViewer({ open: false, url: '', filename: '', contentType: '', reportId: null, attachmentId: null });
                  setAttachmentPreview({ loading: false, error: '', blobUrl: '', contentType: '' });
                }}
                className="close-btn"
              >
                <FaTimes />
              </button>
            </div>
            <div style={{ marginBottom: 10, fontWeight: 600 }}>{attachmentViewer.filename}</div>
            <div style={{ marginBottom: 10 }}>
              <button
                className="btn btn-sm"
                onClick={() => {
                  if (!attachmentViewer.reportId || !attachmentViewer.attachmentId) return;
                  ChairService.downloadReportAttachment(attachmentViewer.reportId, {
                    id: attachmentViewer.attachmentId,
                    filename: attachmentViewer.filename,
                    contentType: attachmentViewer.contentType,
                  }).catch(() => {});
                }}
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#475569', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                <FaDownload /> Download
              </button>
            </div>
            <div style={{ minHeight: '60vh', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              {attachmentPreview.loading ? (
                <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <FaSpinner className="spinner" style={{ marginRight: 8 }} /> Loading preview...
                </div>
              ) : attachmentPreview.error ? (
                <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5', padding: 16, textAlign: 'center' }}>
                  {attachmentPreview.error}
                </div>
              ) : String(attachmentPreview.contentType || attachmentViewer.contentType || '').toLowerCase().startsWith('image/') ? (
                <img
                  src={attachmentPreview.blobUrl}
                  alt={attachmentViewer.filename}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0f172a' }}
                />
              ) : (
                <iframe
                  title={attachmentViewer.filename}
                  src={`${attachmentPreview.blobUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  style={{ width: '100%', height: '60vh', border: 0 }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChairDashboard;