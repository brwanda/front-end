import React, { useState, useEffect } from 'react';
import { 
  getMeetingsForInvitations, 
  getPotentialInvitees, 
  sendInvitations,
  getInvitationHistory,
  getCountries,
  checkAuthentication
} from '../../services/invitationService';
import { 
  FaEnvelope, 
  FaUsers, 
  FaCalendar, 
  FaCheck, 
  FaTimes, 
  FaSpinner,
  FaSearch,
  FaFilter,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaGlobe,
  FaEye,
  FaDownload
} from 'react-icons/fa';
import './InvitationManager.css';

const InvitationManager = () => {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [invitationHistory, setInvitationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customMessage, setCustomMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('send'); // 'send' or 'history'

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Check authentication first
      const { isAuthenticated } = checkAuthentication();
      if (!isAuthenticated) {
        throw new Error('User not authenticated. Please log in again.');
      }

      const [meetingsData, countriesData] = await Promise.all([
        getMeetingsForInvitations(),
        getCountries()
      ]);
      
      setMeetings(meetingsData);
      setCountries(countriesData);
      
      // Fetch invitation history
      const historyData = await getInvitationHistory();
      setInvitationHistory(historyData);
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
      if (error.message.includes('not authenticated')) {
        setError('Please log in again to continue.');
        setTimeout(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          window.location.href = '/login';
        }, 2000);
      } else {
        setError('Failed to load meetings and countries. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingsWithErrorHandling = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/meetings`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      
      if (!responseText.trim()) {
        console.warn('Empty response from meetings API');
        return [];
      }
      
      try {
        const data = JSON.parse(responseText);
        return Array.isArray(data) ? data : [];
      } catch (parseError) {
        console.error('JSON Parse Error for meetings:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Invalid response format from meetings API');
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  };

  const fetchCountriesWithErrorHandling = async () => {
    try {
      return await getCountries();
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  };

  const fetchInvitationHistory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/invitations/history`, {
        credentials: 'include',
      });
      if (response.ok) {
        const history = await response.json();
        setInvitationHistory(Array.isArray(history) ? history : []);
      }
    } catch (error) {
      console.error('Error fetching invitation history:', error);
      setInvitationHistory([]);
    }
  };

  const handleMeetingSelect = async (meeting) => {
    if (selectedMeeting?.id === meeting.id) return; // Prevent duplicate selection
    
    setSelectedMeeting(meeting);
    setSelectedUsers([]);
    setError('');
    setSuccess('');
    setLoadingUsers(true);
    generateCustomMessage(meeting);

    try {
      const users = await getPotentialInvitees(meeting.id);
      setAvailableUsers(users);
      
    } catch (error) {
      console.error('Error fetching potential invitees:', error);
      setError('Failed to load potential invitees. Please try again.');
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filterUsersByMeetingType = (users, meetingType) => {
    if (!Array.isArray(users)) return [];
    
    const activeUsers = users.filter(user => user.active);
    
    switch (meetingType) {
      case 'COMMISSIONER_GENERAL_MEETING':
        return activeUsers.filter(user => 
          user.roles?.includes('COMMISSIONER_GENERAL') ||
          user.roles?.includes('CHAIR') ||
          user.roles?.includes('VICE_CHAIR') ||
          user.role === 'COMMISSIONER_GENERAL'
        );
      case 'TECHNICAL_MEETING':
        return activeUsers.filter(user => 
          user.roles?.includes('COMMITTEE_MEMBER') ||
          user.roles?.includes('COMMITTEE_SECRETARY') ||
          user.roles?.includes('CHAIR') ||
          user.role?.includes('COMMITTEE')
        );
      case 'SUBCOMMITTEE_MEETING':
        return activeUsers.filter(user => 
          user.roles?.includes('SUBCOMMITTEE_MEMBER') ||
          user.role === 'SUBCOMMITTEE_MEMBER'
        );
      default:
        return activeUsers;
    }
  };

  const generateCustomMessage = (meeting) => {
    const meetingDate = new Date(meeting.meetingDate);
    const dateStr = meetingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = meetingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `Dear Committee Member,

You are cordially invited to attend the ${meeting.title}.

Meeting Details:
📅 Date: ${dateStr}
⏰ Time: ${timeStr}
📍 Location: ${meeting.location || 'To be announced'}
🏛️ Host: ${meeting.hostingCountry?.name || 'TBD'}
📋 Type: ${getMeetingTypeLabel(meeting.meetingType)}

${meeting.agenda ? `Agenda:\n${meeting.agenda}\n` : ''}${meeting.description ? `Description:\n${meeting.description}\n` : ''}
Please confirm your attendance by replying to this invitation.

Best regards,
EARA Secretariat`;

    setCustomMessage(message);
  };

  const getMeetingTypeLabel = (type) => {
    const labels = {
      'COMMISSIONER_GENERAL_MEETING': 'Commissioner General Meeting',
      'TECHNICAL_MEETING': 'Technical Committee Meeting', 
      'SUBCOMMITTEE_MEETING': 'Subcommittee Meeting'
    };
    return labels[type] || type;
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const filteredUsers = getFilteredUsers();
    const allFilteredIds = filteredUsers.map(user => user.id);
    
    if (selectedUsers.length === allFilteredIds.length && 
        selectedUsers.every(id => allFilteredIds.includes(id))) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(allFilteredIds);
    }
  };

  const handleSendInvitations = async () => {
    if (!selectedMeeting || selectedUsers.length === 0) {
      setError('Please select a meeting and at least one recipient');
      return;
    }

    if (!customMessage.trim()) {
      setError('Please enter an invitation message');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const { isAuthenticated, user } = checkAuthentication();
      if (!isAuthenticated) {
        throw new Error('User not authenticated. Please log in again.');
      }

      const invitationData = {
        meetingId: selectedMeeting.id,
        recipientIds: selectedUsers,
        message: customMessage.trim(),
        senderId: user.id
      };

      console.log('Sending invitations with data:', invitationData);

      const result = await sendInvitations(invitationData);
      
      setSuccess(`✅ Invitations sent successfully to ${selectedUsers.length} recipient${selectedUsers.length > 1 ? 's' : ''}!`);
      setSelectedUsers([]);
      
      // Refresh data
      await fetchInitialData();
      
      // Auto-switch to history tab to show results
      setTimeout(() => setActiveTab('history'), 1500);

    } catch (error) {
      console.error('Error sending invitations:', error);
      if (error.message.includes('not authenticated')) {
        setError('Please log in again to continue.');
        setTimeout(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(`Failed to send invitations: ${error.message}`);
      }
    } finally {
      setSending(false);
    }
  };

  const getFilteredUsers = () => {
    if (!Array.isArray(availableUsers)) return [];
    
    return availableUsers.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const userRoles = user.roles || [user.role];
      const matchesRole = roleFilter === 'ALL' || 
                         userRoles.some(role => role === roleFilter);
      
      const matchesCountry = countryFilter === 'ALL' || 
                            (user.country && user.country.id.toString() === countryFilter);
      
      const matchesStatus = statusFilter === 'ALL' ||
                           (statusFilter === 'ACTIVE' && user.active) ||
                           (statusFilter === 'INACTIVE' && !user.active);
      
      return matchesSearch && matchesRole && matchesCountry && matchesStatus;
    });
  };

  const getRoleColor = (role) => {
    const colors = {
      'ADMIN': '#ef4444',
      'SECRETARY': '#3b82f6',
      'CHAIR': '#f59e0b',
      'VICE_CHAIR': '#f59e0b',
      'HOD': '#8b5cf6',
      'COMMISSIONER_GENERAL': '#10b981',
      'COMMITTEE_SECRETARY': '#06b6d4',
      'DELEGATION_SECRETARY': '#06b6d4',
      'COMMITTEE_MEMBER': '#6b7280',
      'SUBCOMMITTEE_MEMBER': '#6b7280',
      'BOARD_MEMBER': '#ec4899'
    };
    return colors[role] || '#6b7280';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  };

  const exportInvitationList = () => {
    if (selectedUsers.length === 0) return;
    
    const selectedUserData = availableUsers.filter(user => 
      selectedUsers.includes(user.id)
    );
    
    const csvContent = [
      ['Name', 'Email', 'Role', 'Country'].join(','),
      ...selectedUserData.map(user => [
        user.name,
        user.email,
        Array.isArray(user.roles) ? user.roles.join(';') : user.role,
        user.country?.name || 'N/A'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitation-list-${selectedMeeting?.title || 'meeting'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = getFilteredUsers();
  const uniqueRoles = [...new Set(availableUsers.flatMap(user => 
    user.roles || [user.role]
  ))].filter(Boolean);

  if (loading) {
    return (
      <div className="invitation-manager-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading invitation manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-manager-container">
      <div className="header">
        <div className="header-content">
          <h2 className="page-title">
            <FaEnvelope className="title-icon" />
            Meeting Invitations
          </h2>
          <p className="page-subtitle">Send and manage meeting invitations</p>
        </div>
        
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => setActiveTab('send')}
          >
            <FaEnvelope /> Send Invitations
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FaCheck /> History ({invitationHistory.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      {success && (
        <div className="success-banner">
          <FaCheck />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="close-btn">×</button>
        </div>
      )}

      {activeTab === 'send' ? (
        <div className="invitation-content">
          {/* Meeting Selection */}
          <div className="meeting-selection">
            <h3>
              <FaCalendar /> Select Meeting
              {meetings.length > 0 && <span className="count">({meetings.length})</span>}
            </h3>
            {meetings.length === 0 ? (
              <div className="empty-state">
                <FaCalendar className="empty-icon" />
                <h4>No Meetings Available</h4>
                <p>No scheduled meetings are available for sending invitations.</p>
                <p>Create a meeting first or check if meetings are properly scheduled.</p>
              </div>
            ) : (
              <div className="meetings-list">
                {meetings.map(meeting => {
                  const { date, time, full } = formatDateTime(meeting.meetingDate);
                  const hasInvitations = invitationHistory.some(inv => inv.meetingId === meeting.id);
                  
                  return (
                    <div
                      key={meeting.id}
                      className={`meeting-item ${selectedMeeting?.id === meeting.id ? 'selected' : ''}`}
                      onClick={() => handleMeetingSelect(meeting)}
                    >
                      <div className="meeting-info">
                        <h4>{meeting.title}</h4>
                        <div className="meeting-type">
                          {getMeetingTypeLabel(meeting.meetingType)}
                        </div>
                        <div className="meeting-details">
                          <span className="meeting-date">
                            <FaCalendar className="detail-icon" />
                            {full} at {time}
                          </span>
                          {meeting.location && (
                            <span className="meeting-location">
                              <FaMapMarkerAlt className="detail-icon" />
                              {meeting.location}
                            </span>
                          )}
                          <span className="meeting-host">
                            <FaGlobe className="detail-icon" />
                            {meeting.hostingCountry?.name || 'Host TBD'}
                          </span>
                        </div>
                      </div>
                      <div className="invitation-status">
                        {hasInvitations ? (
                          <span className="status-sent">
                            <FaCheck /> Invitations Sent
                          </span>
                        ) : (
                          <span className="status-pending">
                            <FaEnvelope /> Ready to Send
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Selection */}
          {selectedMeeting && (
            <div className="user-selection">
              <div className="selection-header">
                <h3>
                  <FaUsers /> Select Recipients
                </h3>
                <div className="selection-stats">
                  <span>{selectedUsers.length} of {filteredUsers.length} selected</span>
                  {selectedUsers.length > 0 && (
                    <button
                      onClick={exportInvitationList}
                      className="btn btn-secondary btn-sm"
                      title="Export selected recipients"
                    >
                      <FaDownload /> Export List
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="filters-section">
                <div className="search-filter">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="filter-controls">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="ALL">All Roles</option>
                    {uniqueRoles.map(role => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>

                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="ALL">All Countries</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id.toString()}>
                        {country.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="INACTIVE">Inactive Only</option>
                  </select>

                  <button
                    onClick={handleSelectAll}
                    className="btn btn-secondary btn-sm"
                    disabled={filteredUsers.length === 0}
                  >
                    {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* Users List */}
              {loadingUsers ? (
                <div className="loading-users">
                  <FaSpinner className="spinner-icon" />
                  <p>Loading potential invitees...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="empty-users">
                  <FaUsers className="empty-icon" />
                  <h4>No Recipients Found</h4>
                  <p>
                    {availableUsers.length === 0 
                      ? 'No potential invitees found for this meeting type.'
                      : 'No users match your current filter criteria.'
                    }
                  </p>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="btn btn-secondary btn-sm"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="users-list">
                  {filteredUsers.map(user => {
                    const userRoles = user.roles || [user.role];
                    return (
                      <div 
                        key={user.id} 
                        className={`user-item ${selectedUsers.includes(user.id) ? 'selected' : ''} ${!user.active ? 'inactive' : ''}`}
                        onClick={() => handleUserToggle(user.id)}
                      >
                        <div className="user-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserToggle(user.id)}
                            disabled={!user.active}
                          />
                        </div>
                        <div className="user-info">
                          <div className="user-name">
                            {user.name}
                            {!user.active && <span className="inactive-badge">Inactive</span>}
                          </div>
                          <div className="user-email">{user.email}</div>
                          <div className="user-meta">
                            {userRoles.map(role => (
                              <span 
                                key={role}
                                className="user-role"
                                style={{ backgroundColor: getRoleColor(role) }}
                              >
                                {role.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {user.country && (
                              <span className="user-country">{user.country.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Custom Message Section */}
              {selectedUsers.length > 0 && (
                <div className="message-section">
                  <div className="message-header">
                    <h4>Customize Invitation Message</h4>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="btn btn-secondary btn-sm"
                    >
                      <FaEye /> {showPreview ? 'Hide' : 'Show'} Preview
                    </button>
                  </div>
                  
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter your invitation message..."
                    className="message-textarea"
                    rows={showPreview ? 6 : 10}
                  />
                  
                  {showPreview && (
                    <div className="message-preview">
                      <h5>Preview:</h5>
                      <div className="preview-content">
                        {customMessage.split('\n').map((line, index) => (
                          <p key={index}>{line || '\u00A0'}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Send Section */}
              {selectedUsers.length > 0 && (
                <div className="send-section">
                  <div className="send-summary">
                    <h4>Ready to Send</h4>
                    <p>
                      Send invitation emails for "<strong>{selectedMeeting.title}</strong>" 
                      to <strong>{selectedUsers.length}</strong> recipient{selectedUsers.length > 1 ? 's' : ''}
                    </p>
                    <div className="recipient-summary">
                      {selectedUsers.slice(0, 3).map(userId => {
                        const user = availableUsers.find(u => u.id === userId);
                        return user ? (
                          <span key={userId} className="recipient-tag">
                            {user.name}
                          </span>
                        ) : null;
                      })}
                      {selectedUsers.length > 3 && (
                        <span className="recipient-tag more">
                          +{selectedUsers.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleSendInvitations}
                    className="btn btn-primary btn-large"
                    disabled={sending || !customMessage.trim()}
                  >
                    {sending ? (
                      <>
                        <FaSpinner className="btn-icon spinning" />
                        Sending Invitations...
                      </>
                    ) : (
                      <>
                        <FaEnvelope className="btn-icon" />
                        Send {selectedUsers.length} Invitation{selectedUsers.length > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Invitation History Tab */
        <div className="history-content">
          <div className="history-header">
            <h3>
              <FaCheck /> Invitation History
              <span className="count">({invitationHistory.length})</span>
            </h3>
          </div>
          
          {invitationHistory.length === 0 ? (
            <div className="empty-state">
              <FaEnvelope className="empty-icon" />
              <h4>No Invitation History</h4>
              <p>No invitations have been sent yet.</p>
            </div>
          ) : (
            <div className="history-list">
              {invitationHistory.map(record => {
                const { date, time } = formatDateTime(record.sentAt);
                return (
                  <div key={record.id} className="history-item">
                    <div className="history-info">
                      <h4>{record.meetingTitle}</h4>
                      <p>Sent to {record.recipientCount} recipients</p>
                      <span className="history-date">{date} at {time}</span>
                    </div>
                    <div className="history-status">
                      <span className="status-sent">
                        <FaCheck /> Sent
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvitationManager;