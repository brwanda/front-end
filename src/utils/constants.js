// HOD-specific constants and configuration

// API Endpoints
export const API_ENDPOINTS = {
  REPORTS: {
    PENDING: '/api/reports/pending',
    REVIEW: '/api/reports/review',
    BY_ID: (id) => `/api/reports/${id}`,
    BY_STATUS: (status) => `/api/reports/status/${status}`,
  },
  PROFILE: {
    GET: '/api/users/profile',
    UPDATE: '/api/users/profile/update',
  },
  NOTIFICATIONS: {
    MEETINGS: '/api/notifications/meetings',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    UNREAD_COUNT: '/api/notifications/unread-count',
  },
  PERFORMANCE: {
    DATA: '/api/performance/data',
    SUMMARY: '/api/performance/summary',
  },
  MEETINGS: {
    INVITATIONS: '/api/meetings/invitations',
    RESPOND: (id) => `/api/meetings/invitations/${id}/respond`,
  },
};

// Report Status Options
export const REPORT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_REVIEW: 'in_review',
};

// Report Status Display Labels
export const REPORT_STATUS_LABELS = {
  [REPORT_STATUS.PENDING]: 'Pending Review',
  [REPORT_STATUS.APPROVED]: 'Approved',
  [REPORT_STATUS.REJECTED]: 'Rejected',
  [REPORT_STATUS.IN_REVIEW]: 'In Review',
};

// Report Status Colors (Tailwind CSS classes)
export const REPORT_STATUS_COLORS = {
  [REPORT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [REPORT_STATUS.APPROVED]: 'bg-green-100 text-green-800 border-green-200',
  [REPORT_STATUS.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
  [REPORT_STATUS.IN_REVIEW]: 'bg-blue-100 text-blue-800 border-blue-200',
};

// Performance Rating Colors
export const PERFORMANCE_COLORS = {
  EXCELLENT: 'bg-green-100 text-green-800',     // 90-100%
  VERY_GOOD: 'bg-blue-100 text-blue-800',      // 80-89%
  GOOD: 'bg-yellow-100 text-yellow-800',       // 70-79%
  SATISFACTORY: 'bg-orange-100 text-orange-800', // 60-69%
  POOR: 'bg-red-100 text-red-800',             // <60%
};

// Performance Rating Thresholds
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 90,
  VERY_GOOD: 80,
  GOOD: 70,
  SATISFACTORY: 60,
};

// Get performance color based on percentage
export const getPerformanceColor = (percentage) => {
  if (percentage >= PERFORMANCE_THRESHOLDS.EXCELLENT) return PERFORMANCE_COLORS.EXCELLENT;
  if (percentage >= PERFORMANCE_THRESHOLDS.VERY_GOOD) return PERFORMANCE_COLORS.VERY_GOOD;
  if (percentage >= PERFORMANCE_THRESHOLDS.GOOD) return PERFORMANCE_COLORS.GOOD;
  if (percentage >= PERFORMANCE_THRESHOLDS.SATISFACTORY) return PERFORMANCE_COLORS.SATISFACTORY;
  return PERFORMANCE_COLORS.POOR;
};

// Get performance label based on percentage
export const getPerformanceLabel = (percentage) => {
  if (percentage >= PERFORMANCE_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (percentage >= PERFORMANCE_THRESHOLDS.VERY_GOOD) return 'Very Good';
  if (percentage >= PERFORMANCE_THRESHOLDS.GOOD) return 'Good';
  if (percentage >= PERFORMANCE_THRESHOLDS.SATISFACTORY) return 'Satisfactory';
  return 'Poor';
};

// Notification Types
export const NOTIFICATION_TYPES = {
  MEETING: 'meeting',
  REPORT: 'report',
  SYSTEM: 'system',
  DEADLINE: 'deadline',
};

// Notification Priority Levels
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Notification Priority Colors
export const NOTIFICATION_PRIORITY_COLORS = {
  [NOTIFICATION_PRIORITY.LOW]: 'bg-green-100 text-green-800 border-green-200',
  [NOTIFICATION_PRIORITY.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [NOTIFICATION_PRIORITY.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
  [NOTIFICATION_PRIORITY.URGENT]: 'bg-red-100 text-red-800 border-red-200',
};

// Dashboard Filter Options
export const DASHBOARD_FILTERS = {
  SUBCOMMITTEES: [
    { value: 'all', label: 'All Subcommittees' },
    { value: 'domestic', label: 'Domestic Revenue' },
    { value: 'customs', label: 'Customs Revenue' },
    { value: 'it', label: 'IT Committee' },
    { value: 'legal', label: 'Legal Committee' },
    { value: 'hr', label: 'HR Committee' },
    { value: 'research', label: 'Research Committee' },
  ],
  RESOLUTIONS: [
    { value: 'all', label: 'All Resolutions' },
    { value: 'digital', label: 'Digital Transformation' },
    { value: 'policy', label: 'Policy Updates' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'training', label: 'Training Programs' },
    { value: 'compliance', label: 'Compliance Review' },
  ],
  TIME_PERIODS: [
    { value: '1month', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
  ],
};

// Form Validation Rules
export const VALIDATION_RULES = {
  PROFILE: {
    NAME: {
      REQUIRED: true,
      MIN_LENGTH: 2,
      MAX_LENGTH: 100,
    },
    EMAIL: {
      REQUIRED: true,
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    CONTACT_NUMBER: {
      REQUIRED: false,
      PATTERN: /^[\+]?[0-9\-\(\)\s]{10,}$/,
    },
  },
  REPORT_REVIEW: {
    COMMENT: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 1000,
    },
  },
};

// Date/Time Formatting Options
export const DATE_FORMATS = {
  SHORT: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  LONG: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  TIME_ONLY: {
    hour: '2-digit',
    minute: '2-digit',
  },
};

// Chart.js Default Configuration
export const CHART_DEFAULTS = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    DANGER: '#EF4444',
    INFO: '#6366F1',
  },
  OPTIONS: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  },
};

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  URL: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/notifications`;
  },
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 5,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_PROFILE: 'userProfile',
  DASHBOARD_FILTERS: 'hodDashboardFilters',
  NOTIFICATION_PREFERENCES: 'notificationPreferences',
};

// HOD Role Permissions
export const HOD_PERMISSIONS = {
  REVIEW_REPORTS: true,
  UPDATE_PROFILE: true,
  VIEW_DASHBOARD: true,
  RECEIVE_NOTIFICATIONS: true,
  EXPORT_DATA: true,
  MANAGE_MEETINGS: false, // HODs can respond but not create meetings
  ADMIN_FUNCTIONS: false,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  REPORT_APPROVED: 'Report approved successfully! Forwarded to Commissioner General.',
  REPORT_REJECTED: 'Report rejected and feedback sent to Chair.',
  PROFILE_UPDATED: 'Profile updated successfully!',
  NOTIFICATION_READ: 'Notification marked as read.',
  ALL_NOTIFICATIONS_READ: 'All notifications marked as read.',
  DATA_EXPORTED: 'Data exported successfully!',
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// HOD Dashboard Tabs
export const DASHBOARD_TABS = {
  OVERVIEW: 'overview',
  REPORTS: 'reports',
  PROFILE: 'profile',
  NOTIFICATIONS: 'notifications',
  PERFORMANCE: 'performance',
};

// Export utility functions
export const formatDate = (dateString, format = DATE_FORMATS.SHORT) => {
  return new Date(dateString).toLocaleDateString('en-US', format);
};

export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const minutes = Math.floor((now - date) / (1000 * 60));
    return `${minutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  } else {
    return formatDate(dateString);
  }
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validateEmail = (email) => {
  return VALIDATION_RULES.PROFILE.EMAIL.PATTERN.test(email);
};

export const validateContactNumber = (number) => {
  return !number || VALIDATION_RULES.PROFILE.CONTACT_NUMBER.PATTERN.test(number);
};

export default {
  API_ENDPOINTS,
  REPORT_STATUS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  PERFORMANCE_COLORS,
  PERFORMANCE_THRESHOLDS,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  DASHBOARD_FILTERS,
  VALIDATION_RULES,
  DATE_FORMATS,
  CHART_DEFAULTS,
  WEBSOCKET_CONFIG,
  STORAGE_KEYS,
  HOD_PERMISSIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  DASHBOARD_TABS,
  getPerformanceColor,
  getPerformanceLabel,
  formatDate,
  formatRelativeTime,
  truncateText,
  validateEmail,
  validateContactNumber,
};
