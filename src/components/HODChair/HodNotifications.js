import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  BellIcon, 
  CalendarIcon, 
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  EyeIcon,
  MapPinIcon,
  VideoCameraIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  BellIcon as BellSolidIcon,
  CalendarDaysIcon,
  ClockIcon as ClockSolidIcon 
} from '@heroicons/react/24/solid';
import http from '../../services/http';

const HodNotifications = () => {
  // State management
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, meetings, urgent
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  // WebSocket connection
  const [ws, setWs] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Auto-scroll ref for new notifications
  const notificationsEndRef = useRef(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await http.get('/api/hod/notifications/meetings');
      setNotifications(data);
      setFilteredNotifications(data);
    } catch (error) {
      console.error('Error fetching HOD notifications:', error);
      toast.error('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/hod-notifications`;
    
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectInterval = 5000;

    const connectWebSocket = () => {
      try {
        setConnectionStatus('connecting');
        const websocket = new WebSocket(wsUrl);
        
        websocket.onopen = () => {
          console.log('HOD Notifications WebSocket connected');
          setWs(websocket);
          setConnectionStatus('connected');
          reconnectAttempts = 0;
        };
        
        websocket.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data);
            
            // Add new notification to the list
            setNotifications(prev => [notification, ...prev]);
            
            // Show toast notification
            const notificationTitle = notification.title || 'New Notification';
            toast.info(
              <div className="flex items-center space-x-2">
                <BellSolidIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{notificationTitle}</p>
                  {notification.meetingDate && (
                    <p className="text-sm text-gray-600">
                      {new Date(notification.meetingDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>,
              {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              }
            );

            // Auto-scroll to show new notification
            setTimeout(() => {
              notificationsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        websocket.onerror = (error) => {
          console.error('HOD Notifications WebSocket error:', error);
          setConnectionStatus('error');
        };
        
        websocket.onclose = (event) => {
          console.log('HOD Notifications WebSocket connection closed');
          setWs(null);
          setConnectionStatus('disconnected');
          
          // Attempt to reconnect
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
            setTimeout(connectWebSocket, reconnectInterval);
          } else {
            setConnectionStatus('failed');
            toast.error('Real-time notifications unavailable. Please refresh the page.');
          }
        };
        
      } catch (error) {
        console.error('Failed to establish HOD Notifications WebSocket connection:', error);
        setConnectionStatus('failed');
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

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
      case 'urgent':
        filtered = notifications.filter(n => n.priority === 'high' || n.priority === 'urgent');
        break;
      default:
        filtered = notifications;
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (markingAsRead) return;
    
    try {
      setMarkingAsRead(true);
      await http.patch(`/api/hod/notifications/${notificationId}/read`);
      
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
    } finally {
      setMarkingAsRead(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await http.patch('/api/hod/notifications/mark-all-read');
      
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
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Format meeting date and time
  const formatMeetingDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get notification icon based on type and priority
  const getNotificationIcon = (type, priority, isRead) => {
    const baseClass = `h-6 w-6 ${isRead ? 'text-gray-400' : 'text-blue-600'}`;
    
    if (priority === 'urgent' || priority === 'high') {
      return <ExclamationTriangleIcon className={`h-6 w-6 ${isRead ? 'text-red-400' : 'text-red-600'}`} />;
    }
    
    switch (type) {
      case 'meeting':
        return <CalendarDaysIcon className={baseClass} />;
      case 'report':
        return <DocumentTextIcon className={baseClass} />;
      case 'system':
        return <InformationCircleIcon className={baseClass} />;
      default:
        return isRead ? <BellIcon className={baseClass} /> : <BellSolidIcon className={baseClass} />;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get connection status indicator
  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'bg-green-400', text: 'Real-time updates active', icon: '🟢' };
      case 'connecting':
        return { color: 'bg-yellow-400', text: 'Connecting...', icon: '🟡' };
      case 'disconnected':
        return { color: 'bg-orange-400', text: 'Reconnecting...', icon: '🟠' };
      case 'error':
      case 'failed':
        return { color: 'bg-red-400', text: 'Connection failed', icon: '🔴' };
      default:
        return { color: 'bg-gray-400', text: 'Unknown status', icon: '⚪' };
    }
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentCount = notifications.filter(n => (n.priority === 'high' || n.priority === 'urgent') && !n.isRead).length;

  const connectionInfo = getConnectionStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Loading HOD notifications">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200 h-full max-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <BellSolidIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-blue-100 text-sm">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
                {urgentCount > 0 && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                    {urgentCount} urgent
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchNotifications}
              className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 transition-all"
              aria-label="Refresh notifications"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 transition-all"
                aria-label="Mark all as read"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 flex space-x-1">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'meetings', label: 'Meetings', count: notifications.filter(n => n.type === 'meeting').length },
            { key: 'urgent', label: 'Urgent', count: urgentCount }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === tab.key
                  ? 'bg-white text-blue-700'
                  : 'text-blue-100 hover:text-white hover:bg-blue-600'
              }`}
              aria-label={`Filter ${tab.label} notifications`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  filter === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-blue-600 text-white'
                }`}>
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Connection Status */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-blue-100">
            <div className={`h-2 w-2 rounded-full ${connectionInfo.color}`}></div>
            <span>{connectionInfo.text}</span>
          </div>
          <span className="text-blue-200">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <BellIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'urgent' ? 'No urgent notifications' : 
               filter === 'meetings' ? 'No meeting notifications' : 
               'No notifications'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? 'You\'re all caught up! New notifications will appear here.' 
                : filter === 'urgent'
                ? 'No urgent notifications at this time.'
                : filter === 'meetings'
                ? 'Meeting notifications will appear here when available.'
                : 'New notifications will appear here when available.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                } ${
                  (notification.priority === 'urgent' || notification.priority === 'high') && !notification.isRead
                    ? 'bg-red-50 border-l-4 border-red-400' : ''
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
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority, notification.isRead)}
                  </div>
                  
                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-medium ${
                        notification.isRead ? 'text-gray-900' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </p>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {notification.priority && notification.priority !== 'low' && (
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
                    
                    <p className={`text-sm ${
                      notification.isRead ? 'text-gray-600' : 'text-gray-700'
                    } line-clamp-2`}>
                      {notification.message || notification.agenda}
                    </p>
                    
                    {/* Meeting Details Preview */}
                    {notification.type === 'meeting' && notification.meetingDate && (
                      <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(notification.meetingDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        
                        {notification.location && (
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {notification.location}
                          </div>
                        )}
                        
                        {notification.attendees && (
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            {notification.attendees.length} attendees
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    <button
                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                      aria-label={`View notification: ${notification.title}`}
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div ref={notificationsEndRef} />
          </div>
        )}
      </div>

      {/* Notification Details Modal */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50" role="dialog" aria-modal="true">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-3xl shadow-2xl rounded-2xl bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {getNotificationIcon(selectedNotification.type, selectedNotification.priority, false)}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedNotification.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(selectedNotification.date || selectedNotification.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedNotification.priority && selectedNotification.priority !== 'low' && (
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${
                    getPriorityBadge(selectedNotification.priority)
                  }`}>
                    {selectedNotification.priority} priority
                  </span>
                )}
                
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedNotification(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="py-6 space-y-6">
              <div>
                <p className="text-gray-900 leading-relaxed">
                  {selectedNotification.message || selectedNotification.agenda}
                </p>
              </div>
              
              {selectedNotification.type === 'meeting' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 mr-2" />
                    Meeting Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedNotification.meetingDate && (
                      <div className="flex items-start space-x-3">
                        <ClockSolidIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Date & Time</p>
                          <p className="text-blue-800">
                            {formatMeetingDateTime(selectedNotification.meetingDate)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedNotification.location && (
                      <div className="flex items-start space-x-3">
                        <MapPinIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Location</p>
                          <p className="text-blue-800">{selectedNotification.location}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedNotification.meetingLink && (
                      <div className="flex items-start space-x-3">
                        <VideoCameraIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Meeting Link</p>
                          <a
                            href={selectedNotification.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex items-center"
                          >
                            Join Meeting
                            <LinkIcon className="h-4 w-4 ml-1" />
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {selectedNotification.attendees && (
                      <div className="flex items-start space-x-3">
                        <UserGroupIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Attendees ({selectedNotification.attendees.length})</p>
                          <div className="text-blue-800">
                            {selectedNotification.attendees.slice(0, 3).map((attendee, index) => (
                              <span key={index}>
                                {attendee.name}
                                {index < Math.min(2, selectedNotification.attendees.length - 1) && ', '}
                              </span>
                            ))}
                            {selectedNotification.attendees.length > 3 && (
                              <span> and {selectedNotification.attendees.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedNotification.agenda && (
                    <div className="mt-6">
                      <p className="font-medium text-blue-900 mb-2">Agenda:</p>
                      <p className="text-blue-800 leading-relaxed">{selectedNotification.agenda}</p>
                    </div>
                  )}
                </div>
              )}
              
              {selectedNotification.actionUrl && (
                <div className="flex justify-end">
                  <a
                    href={selectedNotification.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    View Details
                    <LinkIcon className="h-4 w-4 ml-2" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedNotification(null);
                }}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodNotifications;
