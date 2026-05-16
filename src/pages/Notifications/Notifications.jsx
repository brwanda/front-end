import React, { useState, useEffect, useMemo } from 'react';
import { FaBell, FaCalendar, FaFileAlt, FaUsers, FaTimes, FaHistory } from 'react-icons/fa';
import http from '../../services/http';
import './Notifications.css';

const RECENT_DAYS = 30; // Show notifications from last 30 days by default

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOlder, setShowOlder] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const { data } = await http.get(`/api/notifications/user/${user.id}`);

      if (Array.isArray(data)) {
        // Normalize isRead field (backend may send 'read' or 'isRead')
        const normalized = data.map(n => ({
          ...n,
          isRead: n.isRead === true || n.read === true
        }));
        setNotifications(normalized);
        setUnreadCount(normalized.filter(n => !n.isRead).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('You are not authorized to view notifications. Please log in with the correct account.');
      } else {
        setError('Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await http.post(`/api/notifications/${notificationId}/mark-read`, null);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      await http.post(`/api/notifications/user/${user.id}/mark-all-read`, null);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await http.del(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'MEETING_INVITATION':
        return <FaCalendar className="notification-icon meeting" />;
      case 'TASK_ASSIGNMENT':
        return <FaFileAlt className="notification-icon task" />;
      case 'REPORT_SUBMISSION':
      case 'REPORT_COMMENT':
        return <FaFileAlt className="notification-icon report" />;
      default:
        return <FaBell className="notification-icon general" />;
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'MEETING_INVITATION':
        return 'Meeting Invitation';
      case 'TASK_ASSIGNMENT':
        return 'Task Assignment';
      case 'REPORT_SUBMISSION':
        return 'Report Submission';
      case 'REPORT_COMMENT':
        return 'Report Comment';
      case 'REPORT_APPROVAL':
        return 'Report Approval';
      case 'REPORT_REJECTION':
        return 'Report Rejection';
      case 'CREDENTIALS_SENT':
        return 'Credentials Sent';
      case 'GENERAL_ANNOUNCEMENT':
        return 'General Announcement';
      default:
        return 'Notification';
    }
  };

  // Data retention: split notifications into recent and older
  const { recentNotifications, olderNotifications } = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RECENT_DAYS);

    const recent = [];
    const older = [];
    notifications.forEach(n => {
      const createdAt = n.createdAt ? new Date(n.createdAt) : new Date();
      if (createdAt >= cutoffDate) {
        recent.push(n);
      } else {
        older.push(n);
      }
    });
    return { recentNotifications: recent, olderNotifications: older };
  }, [notifications]);

  const displayedNotifications = showOlder
    ? notifications
    : recentNotifications;

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="loading">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="header-left">
          <h1>Notifications</h1>
          <div className="notification-badge">
            <FaBell />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-secondary">
            Mark All as Read
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="notifications-content">
        {displayedNotifications.length === 0 && !showOlder ? (
          <div className="empty-state">
            <FaBell className="empty-icon" />
            <h3>No recent notifications</h3>
            <p>You're all caught up! New notifications will appear here.</p>
            {olderNotifications.length > 0 && (
              <button
                onClick={() => setShowOlder(true)}
                className="btn btn-secondary"
                style={{ marginTop: '12px' }}
              >
                <FaHistory style={{ marginRight: '6px' }} />
                Show {olderNotifications.length} older notification{olderNotifications.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="empty-state">
            <FaBell className="empty-icon" />
            <h3>No notifications</h3>
            <p>You're all caught up! New notifications will appear here.</p>
          </div>
        ) : (
          <>
            {!showOlder && olderNotifications.length > 0 && (
              <div style={{
                padding: '10px 16px', marginBottom: '12px', borderRadius: '8px',
                background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ color: '#0369a1' }}>
                  Showing notifications from the last {RECENT_DAYS} days ({recentNotifications.length} of {notifications.length})
                </span>
                <button
                  onClick={() => setShowOlder(true)}
                  style={{
                    background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer',
                    fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <FaHistory /> Show all ({notifications.length})
                </button>
              </div>
            )}
            {showOlder && olderNotifications.length > 0 && (
              <div style={{
                padding: '10px 16px', marginBottom: '12px', borderRadius: '8px',
                background: '#fefce8', border: '1px solid #fde68a', fontSize: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ color: '#92400e' }}>
                  Showing all {notifications.length} notifications including {olderNotifications.length} older
                </span>
                <button
                  onClick={() => setShowOlder(false)}
                  style={{
                    background: 'none', border: 'none', color: '#92400e', cursor: 'pointer',
                    fontWeight: 600, fontSize: '13px'
                  }}
                >
                  Show recent only
                </button>
              </div>
            )}
            <div className="notifications-list">
              {displayedNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              >
                <div className="notification-icon-wrapper">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h4>{notification.title}</h4>
                    <div className="notification-meta">
                      <span className="notification-type">
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                      <span className="notification-time">
                        {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="btn btn-sm btn-primary"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="btn btn-sm btn-danger"
                    >
                      <FaTimes /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications; 