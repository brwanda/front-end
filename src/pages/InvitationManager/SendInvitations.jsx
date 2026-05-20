import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaUsers, FaCalendar, FaCheck, FaTimes, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import './SendInvitations.css';

const SendInvitations = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [potentialInvitees, setPotentialInvitees] = useState([]);
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [fetchingMeetings, setFetchingMeetings] = useState(true);

  useEffect(() => {
    // Get current user
    const userData = localStorage.getItem('user');
    if (!userData) {
      setError('User not authenticated. Please log in again.');
      return;
    }
    
    try {
      const user = JSON.parse(userData);
      if (!user || !user.id) {
        setError('Invalid user data. Please log in again.');
        return;
      }
      setCurrentUser(user);
      fetchMeetings();
    } catch (parseError) {
      setError('Failed to parse user data. Please log in again.');
    }
  }, []);

  useEffect(() => {
    if (selectedMeeting && currentUser) {
      fetchPotentialInvitees();
    }
  }, [selectedMeeting, currentUser]);

  const fetchMeetings = async () => {
    setFetchingMeetings(true);
    setError('');
    
    try {
      console.log('🔄 Fetching meetings for sending invitations...');
      
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/meetings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
      });

      console.log(`📥 API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      // Get response text first to debug JSON issues
      const responseText = await response.text();
      console.log('📄 Raw response preview:', responseText.substring(0, 200));
      
      // Check for malformed JSON patterns
      if (responseText.includes('}]}}]}}]}}')) {
        throw new Error('Detected malformed JSON with circular references. Please contact your administrator.');
      }

      const data = JSON.parse(responseText);
      console.log('✅ Meetings fetched successfully:', data?.length || 0, 'meetings');
      
      if (!data || !Array.isArray(data)) {
        console.warn('⚠️ Invalid data format received');
        setMeetings([]);
        return;
      }

      // Filter meetings to only show SCHEDULED ones for sending invitations
      // AND only meetings that the current secretary can manage (same country)
      const scheduledMeetings = data.filter(meeting => {
        const status = meeting.status?.toUpperCase();
        const isScheduled = status === 'SCHEDULED';
        
        // Check if secretary can manage this meeting (same country)
        const canManage = currentUser && 
                         meeting.hostingCountry && 
                         currentUser.country && 
                         meeting.hostingCountry.id === currentUser.country.id;
        
        console.log(`Meeting ${meeting.id} (${meeting.title}): Scheduled=${isScheduled}, CanManage=${canManage}, SecretaryCountry=${currentUser?.country?.name}, MeetingCountry=${meeting.hostingCountry?.name}`);
        
        return isScheduled && canManage;
      });
      
      console.log(`📧 Schedulable meetings: ${scheduledMeetings.length} out of ${data.length}`);
      setMeetings(scheduledMeetings);
      
    } catch (error) {
      console.error('❌ Error fetching meetings:', error);
      
      if (error.message.includes('circular references')) {
        setError('Server configuration error detected. Please contact your administrator about JSON serialization issues.');
      } else if (error.message.includes('JSON')) {
        setError('Server returned invalid data format. Please try again or contact support.');
      } else {
        setError(`Failed to fetch meetings: ${error.message}`);
      }
      setMeetings([]);
    } finally {
      setFetchingMeetings(false);
    }
  };

  const fetchPotentialInvitees = async () => {
    try {
      console.log('🔄 Fetching potential invitees for meeting:', selectedMeeting.id);
      
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/meetings/${selectedMeeting.id}/potential-invitees`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const responseText = await response.text();
      
      // Check for malformed JSON
      if (responseText.includes('}]}}]}}]}}')) {
        throw new Error('Server returned malformed JSON data');
      }

      const data = JSON.parse(responseText);
      console.log('✅ Potential invitees fetched:', data?.length || 0, 'users');
      
      setPotentialInvitees(Array.isArray(data) ? data : []);
      setSelectedInvitees([]); // Reset selections when meeting changes
      
    } catch (error) {
      console.error('❌ Error fetching potential invitees:', error);
      setError(`Failed to fetch potential invitees: ${error.message}`);
      setPotentialInvitees([]);
    }
  };

  const handleMeetingSelect = (meeting) => {
    console.log('📋 Meeting selected:', meeting.title);
    setSelectedMeeting(meeting);
    setError('');
    setSuccess('');
  };

  const toggleInviteeSelection = (userId) => {
    setSelectedInvitees(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const selectAllInvitees = () => {
    const filteredInvitees = getFilteredInvitees();
    const allIds = filteredInvitees.map(user => user.id);
    setSelectedInvitees(allIds);
  };

  const deselectAllInvitees = () => {
    setSelectedInvitees([]);
  };

  const sendInvitations = async () => {
    console.log('🔘 Send button clicked!');
    
    if (!selectedMeeting) {
      console.log('❌ No meeting selected');
      setError('Please select a meeting first');
      return;
    }

    if (selectedInvitees.length === 0) {
      console.log('❌ No invitees selected');
      setError('Please select at least one person to invite');
      return;
    }

    if (!currentUser || !currentUser.id) {
      console.log('❌ User authentication error');
      setError('User authentication error. Please log in again.');
      return;
    }

    console.log('✅ Validation passed, starting invitation process...');
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📧 Sending invitations for meeting:', selectedMeeting.id);
      console.log('👥 Selected invitees:', selectedInvitees);
      console.log('👤 Current user:', currentUser);
      
      const requestUrl = `${process.env.REACT_APP_BASE_URL}/meetings/${selectedMeeting.id}/invitations/send?secretaryId=${currentUser.id}`;
      console.log('🌐 Request URL:', requestUrl);
      console.log('📤 Request body:', selectedInvitees);
      
      // Use the correct API endpoint from the documentation
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(selectedInvitees),
      });

      console.log(`📥 Invitation response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const textError = await response.text();
            errorMessage = textError || errorMessage;
          }
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError);
        }
        
        // Provide more specific error messages
        if (errorMessage.includes('Secretary can only manage meetings in their country')) {
          errorMessage = 'You can only send invitations for meetings in your country. Please select a meeting hosted by your country.';
        } else if (errorMessage.includes('Meeting not found')) {
          errorMessage = 'The selected meeting could not be found. Please refresh and try again.';
        } else if (errorMessage.includes('User not found')) {
          errorMessage = 'One or more selected users could not be found. Please refresh and try again.';
        }
        
        throw new Error(errorMessage);
      }

      // Check if there's a response body
      const contentLength = response.headers.get('content-length');
      if (contentLength !== '0') {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const responseText = await response.text();
          if (responseText) {
            const result = JSON.parse(responseText);
            console.log('✅ Invitation result:', result);
            
            // Show more detailed success message
            setSuccess(`Invitations sent successfully to ${selectedInvitees.length} people! ${result.message || ''}`);
          }
        }
      } else {
        console.log('✅ Invitations sent successfully (no response body)');
        setSuccess(`Invitations sent successfully to ${selectedInvitees.length} people!`);
      }
      
      // Reset selections
      setSelectedInvitees([]);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (error) {
      console.error('❌ Error sending invitations:', error);
      setError(`Failed to send invitations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredInvitees = () => {
    if (!searchTerm.trim()) {
      return potentialInvitees;
    }
    
    const term = searchTerm.toLowerCase();
    return potentialInvitees.filter(user =>
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      (user.country && user.country.name?.toLowerCase().includes(term))
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Time';
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  const getMeetingTypeLabel = (type) => {
    switch (type) {
      case 'COMMISSIONER_GENERAL_MEETING':
        return 'Commissioner General Meeting';
      case 'TECHNICAL_MEETING':
        return 'Technical Committee Meeting';
      case 'SUBCOMMITTEE_MEETING':
        return 'Subcommittee Meeting';
      default:
        return type || 'Unknown Meeting Type';
    }
  };

  const filteredInvitees = getFilteredInvitees();

  if (fetchingMeetings) {
    return (
      <div className="send-invitations-container">
        <div className="loading-container" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '60px 20px',
          minHeight: '400px'
        }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <p>Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="send-invitations-container">
      <div className="send-invitations-header">
        <h1>Send Meeting Invitations</h1>
        <p>Send invitations to meeting participants</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message" style={{ 
          backgroundColor: '#fee', 
          color: '#c33', 
          padding: '12px 16px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          border: '1px solid #fcc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="success-message" style={{ 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          padding: '12px 16px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          border: '1px solid #c3e6cb',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FaEnvelope />
          <span>{success}</span>
        </div>
      )}

      <div className="send-invitations-content">
        {/* Meeting Selection */}
        <div className="meeting-selection">
          <h3>Select Meeting</h3>
          {meetings.length === 0 ? (
            <div className="no-meetings" style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px dashed #dee2e6'
            }}>
              <FaCalendar size={48} style={{ marginBottom: '16px', color: '#adb5bd' }} />
              <h4 style={{ marginBottom: '8px', color: '#6c757d' }}>No Scheduled Meetings</h4>
              <p>Only scheduled meetings can have invitations sent.</p>
              <p style={{ fontSize: '14px', marginTop: '12px' }}>
                Create a meeting first, then return here to send invitations.
              </p>
            </div>
          ) : (
            <div className="meetings-list">
              {meetings.map(meeting => (
                <div
                  key={meeting.id}
                  className={`meeting-item ${selectedMeeting?.id === meeting.id ? 'selected' : ''}`}
                  onClick={() => handleMeetingSelect(meeting)}
                  style={{ 
                    cursor: 'pointer',
                    border: selectedMeeting?.id === meeting.id ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '16px',
                    backgroundColor: selectedMeeting?.id === meeting.id ? '#f8f9ff' : '#fff',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedMeeting?.id === meeting.id ? '0 4px 12px rgba(0,123,255,0.15)' : '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="meeting-info">
                    <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>{meeting.title}</h4>
                    <p className="meeting-type" style={{ 
                      margin: '0 0 8px 0', 
                      color: '#7c8088', 
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {getMeetingTypeLabel(meeting.meetingType)}
                    </p>
                    <p className="meeting-date" style={{ margin: '0 0 4px 0', color: '#5a6c7d', fontSize: '14px' }}>
                      📅 {formatDate(meeting.meetingDate)} at {formatTime(meeting.meetingDate)}
                    </p>
                    <p className="meeting-location" style={{ margin: '0', color: '#5a6c7d', fontSize: '14px' }}>
                      📍 {meeting.location || 'Location not specified'}
                    </p>
                    {meeting.hostingCountry && (
                      <p className="meeting-host" style={{ margin: '8px 0 0 0', color: '#5a6c7d', fontSize: '13px' }}>
                        🏛️ Hosted by {meeting.hostingCountry.name}
                      </p>
                    )}
                  </div>
                  <div className="meeting-status" style={{ marginTop: '12px' }}>
                    <span className={`status-badge ${meeting.status?.toLowerCase()}`} style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: '#17a2b8'
                    }}>
                      {meeting.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedMeeting && (
          <div className="invitees-section" style={{ marginTop: '30px' }}>
            <div className="section-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>
                Select Invitees ({selectedInvitees.length} selected)
              </h3>
              <div className="selection-controls" style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={selectAllInvitees}
                  className="btn btn-sm btn-secondary"
                  disabled={filteredInvitees.length === 0}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: filteredInvitees.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllInvitees}
                  className="btn btn-sm btn-secondary"
                  disabled={selectedInvitees.length === 0}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedInvitees.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="search-bar" style={{ marginBottom: '20px' }}>
              <div className="search-input-container" style={{ position: 'relative' }}>
                <FaSearch style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#666' 
                }} />
                <input
                  type="text"
                  placeholder="Search by name, email, or country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 40px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Invitees List */}
            {filteredInvitees.length === 0 ? (
              <div className="no-invitees" style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '2px dashed #dee2e6'
              }}>
                <FaUsers size={48} style={{ marginBottom: '16px', color: '#adb5bd' }} />
                <h4 style={{ marginBottom: '8px', color: '#6c757d' }}>No Invitees Found</h4>
                {searchTerm ? (
                  <p>No users match your search criteria. Try adjusting your search terms.</p>
                ) : (
                  <p>No potential invitees found for this meeting type and location.</p>
                )}
              </div>
            ) : (
              <div className="invitees-list" style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff'
              }}>
                {filteredInvitees.map(user => (
                  <div
                    key={user.id}
                    className={`invitee-item ${selectedInvitees.includes(user.id) ? 'selected' : ''}`}
                    onClick={() => toggleInviteeSelection(user.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedInvitees.includes(user.id) ? '#e3f2fd' : '#fff',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div className="invitee-info">
                      <div className="invitee-name" style={{ fontWeight: '500', marginBottom: '4px', color: '#2c3e50' }}>
                        {user.name}
                      </div>
                      <div className="invitee-email" style={{ color: '#666', fontSize: '14px', marginBottom: '2px' }}>
                        {user.email}
                      </div>
                      {user.country && (
                        <div className="invitee-country" style={{ color: '#888', fontSize: '12px' }}>
                          {user.country.name}
                        </div>
                      )}
                    </div>
                    <div className="invitee-checkbox" style={{ marginLeft: 'auto' }}>
                      <input
                        type="checkbox"
                        checked={selectedInvitees.includes(user.id)}
                        onChange={() => toggleInviteeSelection(user.id)}
                        style={{ transform: 'scale(1.2)' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Send Invitations Button */}
            {selectedInvitees.length > 0 && (
              <div className="send-invitations-actions" style={{ marginTop: '20px' }}>
                <button
                  onClick={() => {
                    console.log('🔘 Send button clicked!');
                    console.log('Button disabled state:', loading);
                    console.log('Selected invitees count:', selectedInvitees.length);
                    console.log('Selected meeting:', selectedMeeting);
                    console.log('Current user:', currentUser);
                    
                    // Test if the function is callable
                    if (typeof sendInvitations === 'function') {
                      console.log('✅ sendInvitations function is callable');
                      sendInvitations();
                    } else {
                      console.error('❌ sendInvitations is not a function:', typeof sendInvitations);
                      setError('Internal error: sendInvitations function not found');
                    }
                  }}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  <FaEnvelope /> 
                  {loading ? 'Sending...' : `Send Invitations (${selectedInvitees.length} selected)`}
                </button>
                
                {/* Test Button */}
                <button
                  onClick={() => {
                    console.log('🧪 Test button clicked!');
                    alert('Test button works! Component is functional.');
                  }}
                  style={{
                    marginLeft: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🧪 Test Button
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SendInvitations;