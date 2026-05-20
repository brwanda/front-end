import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-toastify';
import http from '../services/http';

// Initial state
const initialState = {
  user: null,
  reports: [],
  notifications: [],
  dashboardData: null,
  loading: false,
  error: null,
  unreadCount: 0
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USER: 'SET_USER',
  SET_REPORTS: 'SET_REPORTS',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_DASHBOARD_DATA: 'SET_DASHBOARD_DATA',
  UPDATE_REPORT: 'UPDATE_REPORT',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  MARK_ALL_NOTIFICATIONS_READ: 'MARK_ALL_NOTIFICATIONS_READ',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_UNREAD_COUNT: 'UPDATE_UNREAD_COUNT'
};

// Reducer function
const hodReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case actionTypes.SET_USER:
      return { ...state, user: action.payload };
    
    case actionTypes.SET_REPORTS:
      return { ...state, reports: action.payload };
    
    case actionTypes.SET_NOTIFICATIONS:
      return { 
        ...state, 
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length
      };
    
    case actionTypes.SET_DASHBOARD_DATA:
      return { ...state, dashboardData: action.payload };
    
    case actionTypes.UPDATE_REPORT:
      return {
        ...state,
        reports: state.reports.map(report =>
          report.id === action.payload.id ? action.payload : report
        )
      };
    
    case actionTypes.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    
    case actionTypes.MARK_ALL_NOTIFICATIONS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0
      };
    
    case actionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    
    case actionTypes.UPDATE_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };
    
    default:
      return state;
  }
};

// Create context
const HODContext = createContext();

// Custom hook to use HOD context
export const useHOD = () => {
  const context = useContext(HODContext);
  if (!context) {
    throw new Error('useHOD must be used within a HODProvider');
  }
  return context;
};

// HOD Provider component
export const HODProvider = ({ children }) => {
  const [state, dispatch] = useReducer(hodReducer, initialState);

  // API functions
  const api = {
    // Fetch user profile
    fetchProfile: async () => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          dispatch({ type: actionTypes.SET_USER, payload: parsed });
          // Also try to get fresh data from backend
          try {
            const { data } = await http.get(`/api/auth/profile?email=${encodeURIComponent(parsed.email)}`);
            dispatch({ type: actionTypes.SET_USER, payload: data });
            return data;
          } catch {
            return parsed;
          }
        }
        return null;
      } catch (error) {
        console.error('Error fetching profile:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: 'Failed to load profile' });
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },

    // Update user profile
    updateProfile: async (profileData) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const stored = localStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : {};
        const { data } = await http.put(`/api/auth/profile?email=${encodeURIComponent(parsed.email)}`, profileData);
        dispatch({ type: actionTypes.SET_USER, payload: data });
        toast.success('Profile updated successfully!');
        return data;
      } catch (error) {
        console.error('Error updating profile:', error);
        const errorMessage = error.response?.data?.message || 'Failed to update profile';
        dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
        toast.error(errorMessage);
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },

    // Fetch reports (all statuses for overview stats)
    fetchReports: async () => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const { data } = await http.get('/api/reports');
        dispatch({ type: actionTypes.SET_REPORTS, payload: Array.isArray(data) ? data : [] });
        return data;
      } catch (error) {
        console.error('Error fetching reports:', error);
        dispatch({ type: actionTypes.SET_REPORTS, payload: [] });
        // Don't throw - allow dashboard to load even if reports fail
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },

    // Review report
    reviewReport: async (reportId, approved, comments) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const stored = localStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : {};
        const { data } = await http.post(`/api/reports/${reportId}/hod-review`, {
          hodId: parsed.id,
          approved,
          comments
        });
        
        dispatch({ type: actionTypes.UPDATE_REPORT, payload: data });
        
        const successMessage = approved 
          ? 'Report approved successfully! Forwarded to Commissioner General.'
          : 'Report rejected and feedback sent to Chair.';
        
        toast.success(successMessage);
        return data;
      } catch (error) {
        console.error('Error reviewing report:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to review report';
        dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
        toast.error(errorMessage);
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },

    // Fetch notifications
    fetchNotifications: async () => {
      try {
        const stored = localStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : {};
        if (!parsed.id) {
          dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: [] });
          return [];
        }
        const { data } = await http.get(`/api/notifications/user/${parsed.id}`);
        dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: Array.isArray(data) ? data : [] });
        return data;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: [] });
        // Don't throw - allow dashboard to load even if notifications fail
      }
    },

    // Mark notification as read
    markNotificationAsRead: async (notificationId) => {
      try {
        await http.patch(`/api/notifications/${notificationId}/read`);
        dispatch({ type: actionTypes.MARK_NOTIFICATION_READ, payload: notificationId });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        toast.error('Failed to mark notification as read');
        throw error;
      }
    },

    // Mark all notifications as read
    markAllNotificationsAsRead: async () => {
      try {
        await http.patch('/api/notifications/mark-all-read');
        dispatch({ type: actionTypes.MARK_ALL_NOTIFICATIONS_READ });
        toast.success('All notifications marked as read');
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        toast.error('Failed to mark all notifications as read');
        throw error;
      }
    },

    // Fetch dashboard data
    fetchDashboardData: async (filters = {}) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const params = new URLSearchParams(filters);
        const { data } = await http.get(`/api/performance/data?${params}`);
        dispatch({ type: actionTypes.SET_DASHBOARD_DATA, payload: data });
        return data;
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: 'Failed to load dashboard data' });
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    }
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
    
    let websocket;
    
    try {
      websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('WebSocket connected for HOD context');
      };
      
      websocket.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          dispatch({ type: actionTypes.ADD_NOTIFICATION, payload: notification });
          toast.info('New notification received!');
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
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

  // Periodic refresh for notifications and reports
  useEffect(() => {
    const interval = setInterval(() => {
      api.fetchNotifications().catch(() => {
        // Silently handle errors for periodic updates
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Context value
  const contextValue = {
    ...state,
    ...api,
    dispatch
  };

  return (
    <HODContext.Provider value={contextValue}>
      {children}
    </HODContext.Provider>
  );
};

export default HODContext;
