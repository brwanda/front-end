import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import http from '../services/http';

// Custom hook for HOD-specific functionality
export const useHODReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await http.get('/api/reports/pending');
      setReports(data);
    } catch (err) {
      setError('Failed to fetch reports');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  const reviewReport = useCallback(async (reportId, status, comment) => {
    try {
      setLoading(true);
      await http.post('/api/reports/review', {
        reportId,
        status,
        comment
      });
      
      // Update local state
      setReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, status, hodComments: comment }
            : report
        )
      );
      
      toast.success(
        status === 'approve' 
          ? 'Report approved successfully!' 
          : 'Report rejected with feedback'
      );
    } catch (err) {
      setError('Failed to review report');
      toast.error('Failed to review report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    fetchReports,
    reviewReport
  };
};

// Custom hook for HOD profile management
export const useHODProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await http.get('/api/users/profile');
      setProfile(data);
    } catch (err) {
      setError('Failed to fetch profile');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await http.put('/api/users/profile/update', profileData);
      setProfile(data);
      toast.success('Profile updated successfully!');
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    fetchProfile
  };
};

// Custom hook for HOD notifications
export const useHODNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await http.get('/api/notifications/meetings');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      setError('Failed to fetch notifications');
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await http.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await http.patch('/api/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all notifications as read');
    }
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
    
    let websocket;
    
    try {
      websocket = new WebSocket(wsUrl);
      
      websocket.onmessage = (event) => {
        try {
          const newNotification = JSON.parse(event.data);
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.info('New notification received!');
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    // Set up periodic refresh
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
};

// Custom hook for HOD dashboard
export const useHODDashboard = (initialFilters = {}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchDashboardData = useCallback(async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ ...filters, ...customFilters });
      const { data } = await http.get(`/api/performance/data?${params}`);
      setDashboardData(data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const exportData = useCallback(() => {
    if (!dashboardData) return;
    
    try {
      const csvData = [];
      
      // Add subcommittee performance data
      csvData.push(['Subcommittee Performance']);
      csvData.push(['Subcommittee', 'Performance %', 'Reports Count']);
      
      dashboardData.subcommitteePerformance?.forEach(item => {
        csvData.push([item.name, item.performance, item.reportCount]);
      });
      
      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (err) {
      toast.error('Failed to export data');
    }
  }, [dashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    filters,
    fetchDashboardData,
    updateFilters,
    exportData
  };
};

// Main useHOD hook that combines all functionality
export const useHOD = () => {
  const reports = useHODReports();
  const profile = useHODProfile();
  const notifications = useHODNotifications();
  const dashboard = useHODDashboard();

  return {
    reports,
    profile,
    notifications,
    dashboard
  };
};

export default useHOD;
