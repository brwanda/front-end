import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import http from '../services/http';
import './AppTopBar.css';

const AppTopBar = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUnread = async () => {
      if (!user?.id) return;
      try {
        const { data } = await http.get(`/api/notifications/user/${user.id}/unread-count`);
        if (isMounted) {
          setUnreadCount(Number(data?.count || 0));
        }
      } catch (error) {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    };

    fetchUnread();
    const intervalId = setInterval(fetchUnread, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user?.id]);

  return (
    <header className="app-topbar">
      <div className="app-topbar-spacer" />
      <div className="app-topbar-actions">
        <button
          type="button"
          className="topbar-notification-btn"
          onClick={() => navigate('/notifications')}
          aria-label="Open notifications"
          title="Notifications"
        >
          <FaBell />
          {unreadCount > 0 && (
            <span className="topbar-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        <button
          type="button"
          className="topbar-user-btn"
          onClick={() => navigate('/profile')}
          title="View profile"
        >
          <span className="topbar-user-name">{user?.name || 'User'}</span>
          <span className="topbar-user-role">{(user?.role || 'Member').replace(/_/g, ' ')}</span>
        </button>
      </div>
    </header>
  );
};

export default AppTopBar;
