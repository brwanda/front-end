import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
  BellIcon, 
  CalendarIcon, 
  ClockIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import http from '../../services/http';

const Notifications = () => {
  // State management
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, meetings
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // WebSocket connection for real-time updates
  const [ws, setWs] = useState(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : {};
      if (!parsed.id) {
        setNotifications([]);
        setFilteredNotifications([]);
        return;
      }
      const { data } = await http.get(`/api/notifications/user/${parsed.id}`);
      const notifArray = Array.isArray(data) ? data : [];
      setNotifications(notifArray);
      setFilteredNotifications(notifArray);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
    
    try {
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('WebSocket connected for notifications');
        setWs(websocket);
      };
      
      websocket.onmessage = (event) => {
        try {
          const newNotification = JSON.parse(event.data);
          setNotifications(prev => [newNotification, ...prev]);
          toast.info('New notification received!');
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      websocket.onclose = () => {
        console.log('WebSocket connection closed');
        setWs(null);
      };
      
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      // Fallback to polling if WebSocket fails
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [fetchNotifications]);

  // Initial data fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Filter notifications based on selected filter
  useEffect(() => {
    let filtered = notifications;
    
    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.isRead);
        break;
      case 'meetings':
        filtered = notifications.filter(n => n.type === 'meeting');
        break;
      default:
        filtered = notifications;
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await http.patch(`/api/notifications/${notificationId}/read`);
      
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await http.patch('/api/notifications/mark-all-read');
      
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor((now - date) / (1000 * 60));
      return `${minutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type, isRead) => {
    const iconClass = `h-6 w-6 ${isRead ? 'text-gray-400' : 'text-blue-600'}`;
    
    switch (type) {
      case 'meeting':
        return <CalendarIcon className={iconClass} />;
      case 'report':
        return <DocumentTextIcon className={iconClass} />;
      default:
        return isRead ? <BellIcon className={iconClass} /> : <BellSolidIcon className={iconClass} />;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading notifications">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BellIcon className="h-8 w-8 text-white mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
              <p className="text-blue-100 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications read'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={fetchNotifications}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Refresh notifications"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Refresh
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                aria-label="Mark all as read"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 flex space-x-1">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'meetings', label: 'Meetings', count: notifications.filter(n => n.type === 'meeting').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === tab.key
                  ? 'bg-white text-blue-700'
                  : 'text-blue-100 hover:text-white hover:bg-blue-500'
              }`}
              aria-label={`Filter ${tab.label} notifications`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  filter === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-blue-500 text-white'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'unread' 
                ? 'You\'re all caught up!' 
                : 'New notifications will appear here when available.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                }`}
                onClick={() => {
                  setSelectedNotification(notification);
                  setShowModal(true);
                  if (!notification.isRead) {
                    markAsRead(notification.id);
                  }
                }}
              >
                <div className="flex items-start space-x-4">
                  {/* Notification Icon */}
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type, notification.isRead)}
                  </div>
                  
                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        notification.isRead ? 'text-gray-900' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        {notification.priority && (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                            getPriorityBadge(notification.priority)
                          }`}>
                            {notification.priority}
                          </span>
                        )}
                        
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.date || notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`mt-1 text-sm ${
                      notification.isRead ? 'text-gray-600' : 'text-gray-700'
                    }`}>
                      {notification.message || notification.agenda}
                    </p>
                    
                    {notification.type === 'meeting' && notification.meetingDate && (
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Meeting: {new Date(notification.meetingDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={`View notification: ${notification.title}`}
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Details Modal */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" role="dialog" aria-modal="true">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center">
                {getNotificationIcon(selectedNotification.type, true)}
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  {selectedNotification.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedNotification(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {formatDate(selectedNotification.date || selectedNotification.createdAt)}
                </span>
                {selectedNotification.priority && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                    getPriorityBadge(selectedNotification.priority)
                  }`}>
                    {selectedNotification.priority} priority
                  </span>
                )}
              </div>
              
              <div>
                <p className="text-gray-900">
                  {selectedNotification.message || selectedNotification.agenda}
                </p>
              </div>
              
              {selectedNotification.type === 'meeting' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Meeting Details</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    {selectedNotification.meetingDate && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <span>
                          {new Date(selectedNotification.meetingDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {selectedNotification.location && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{selectedNotification.location}</span>
                      </div>
                    )}
                    
                    {selectedNotification.agenda && (
                      <div className="mt-3">
                        <p className="font-medium">Agenda:</p>
                        <p className="mt-1">{selectedNotification.agenda}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedNotification.actionUrl && (
                <div className="flex justify-end">
                  <a
                    href={selectedNotification.actionUrl}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Details
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-4 border-t mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedNotification(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WebSocket Status Indicator */}
      <div className="px-6 py-2 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {ws ? (
              <span className="flex items-center">
                <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                Real-time updates active
              </span>
            ) : (
              <span className="flex items-center">
                <span className="h-2 w-2 bg-yellow-400 rounded-full mr-2"></span>
                Using periodic updates
              </span>
            )}
          </span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
