import React, { useState, useEffect } from 'react';
import {
  FaEnvelope, FaCalendarAlt, FaBuilding, FaUserTie, FaUsers,
  FaSearch, FaClock, FaMapMarkerAlt, FaCheckCircle, FaExclamationTriangle,
  FaSpinner, FaEye, FaTimes
} from 'react-icons/fa';
import CommitteeMemberService from '../../services/committeeMemberService';
import SubcommitteeMemberService from '../../services/subcommitteeMemberService';
import AuthService from '../../services/authService';
import http from '../../services/http';
import './EnhancedMeetingInvitationManager.css';

const EnhancedMeetingInvitationManager = () => {
  const [meetings, setMeetings] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [subcommittees, setSubcommittees] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedCommittees, setSelectedCommittees] = useState([]);
  const [selectedSubcommittees, setSelectedSubcommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Email tracking states
  const [emailResults, setEmailResults] = useState(null);
  const [showEmailResults, setShowEmailResults] = useState(false);
  const [emailStatus, setEmailStatus] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      let meetingsData = [];
      let committeesData = [];
      let subcommitteesData = [];

      try {
        // Fetch meetings - use secretary scoped endpoint
        const userId = AuthService.getCurrentUser()?.id || 1;
        console.log(`🔍 EnhancedMeetingInvitationManager: Fetching meetings for secretary ${userId}`);
        const { data: meetingsResult } = await http.get(`/secretary/meetings/${userId}`);
        meetingsData = Array.isArray(meetingsResult) ? meetingsResult : [];

        // Fetch committees with member counts using the service
        console.log('🔍 EnhancedMeetingInvitationManager: Fetching committees with member counts...');
        committeesData = await CommitteeMemberService.getAllCommitteesWithMembers();
        console.log('✅ EnhancedMeetingInvitationManager: Committees with member counts:', committeesData);

        // Fetch subcommittees with member counts using the service
        console.log('🔍 EnhancedMeetingInvitationManager: Fetching subcommittees with member counts...');
        subcommitteesData = await SubcommitteeMemberService.getAllSubcommitteesWithMembers();
        console.log('✅ EnhancedMeetingInvitationManager: Subcommittees with member counts:', subcommitteesData);

      } catch (apiError) {
        console.warn('API connection failed, using fallback data:', apiError.message);

        // Provide fallback data when API is not available
        meetingsData = [
          {
            id: 1,
            title: "Monthly Committee Review",
            meetingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: "Conference Room A",
            status: "SCHEDULED",
            description: "Review of monthly committee activities and upcoming initiatives."
          },
          {
            id: 2,
            title: "Budget Planning Session",
            meetingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            location: "Main Hall",
            status: "DRAFT",
            description: "Planning session for next quarter's budget allocation."
          },
          {
            id: 3,
            title: "Strategic Planning Workshop",
            meetingDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            location: "Board Room",
            status: "SCHEDULED",
            description: "Workshop for developing long-term strategic initiatives."
          }
        ];

        // Use fallback data with zero member counts to indicate no data
        committeesData = [
          {
            id: 1,
            name: "Commissioner General",
            description: "Senior leadership and strategic decision making",
            memberCount: 0
          },
          {
            id: 2,
            name: "Head Of Delegation",
            description: "Day-to-day operational oversight and management",
            memberCount: 0
          }
        ];

        subcommitteesData = [
          {
            id: 1,
            name: "Head Of Delegation",
            description: "Responsible for delegation leadership",
            memberCount: 0
          },
          {
            id: 2,
            name: "Domestic Revenue Sub Committee",
            description: "Handles domestic revenue matters",
            memberCount: 0
          },
          {
            id: 3,
            name: "Customs Revenue Sub Committee",
            description: "Manages customs revenue operations",
            memberCount: 0
          },
          {
            id: 4,
            name: "IT Sub Committee",
            description: "Oversees IT infrastructure and systems",
            memberCount: 0
          },
          {
            id: 5,
            name: "Legal Sub Committee",
            description: "Handles legal matters and compliance",
            memberCount: 0
          },
          {
            id: 6,
            name: "HR Sub Committee",
            description: "Manages human resources and personnel",
            memberCount: 0
          },
          {
            id: 7,
            name: "Research Sub Committee",
            description: "Conducts research and analysis",
            memberCount: 0
          }
        ];
      }

      // Filter upcoming meetings
      const upcomingMeetings = meetingsData.filter(meeting =>
        new Date(meeting.meetingDate) > new Date() &&
        ['SCHEDULED', 'DRAFT'].includes(meeting.status)
      );

      setMeetings(upcomingMeetings);
      setCommittees(committeesData);
      setSubcommittees(subcommitteesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingSelect = (meeting) => {
    setSelectedMeeting(meeting);
    setSelectedCommittees([]);
    setSelectedSubcommittees([]);
    setError('');
    setSuccess('');
  };

  const handleCommitteeToggle = (committeeId) => {
    setSelectedCommittees(prev =>
      prev.includes(committeeId)
        ? prev.filter(id => id !== committeeId)
        : [...prev, committeeId]
    );
  };

  const handleSubcommitteeToggle = (subcommitteeId) => {
    setSelectedSubcommittees(prev =>
      prev.includes(subcommitteeId)
        ? prev.filter(id => id !== subcommitteeId)
        : [...prev, subcommitteeId]
    );
  };

  const getFilteredCommittees = () => {
    return committees.filter(committee =>
      committee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      committee.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredSubcommittees = () => {
    return subcommittees.filter(subcommittee =>
      subcommittee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcommittee.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getEstimatedRecipients = () => {
    const committeeMembers = selectedCommittees.reduce((total, committeeId) => {
      const committee = committees.find(c => c.id === committeeId);
      return total + (committee?.memberCount || 0);
    }, 0);

    const subcommitteeMembers = selectedSubcommittees.reduce((total, subcommitteeId) => {
      const subcommittee = subcommittees.find(s => s.id === subcommitteeId);
      return total + (subcommittee?.memberCount || 0);
    }, 0);

    return committeeMembers + subcommitteeMembers;
  };

  const processEmailResults = (result) => {
    const emailResults = {
      successfulEmails: [],
      failedEmails: [],
      pendingEmails: [],
      committeeResults: [],
      subcommitteeResults: []
    };

    // Process committee and subcommittee results
    if (result.results && Array.isArray(result.results)) {
      result.results.forEach(item => {
        if (item.type === 'committee') {
          emailResults.committeeResults.push({
            id: item.id,
            name: item.name,
            memberCount: item.memberCount,
            status: item.status,
            error: item.error
          });
        } else if (item.type === 'subcommittee') {
          emailResults.subcommitteeResults.push({
            id: item.id,
            name: item.name,
            memberCount: item.memberCount,
            status: item.status,
            error: item.error
          });
        }
      });
    }

    // Categorize results based on status
    emailResults.committeeResults.forEach(committee => {
      if (committee.status === 'success') {
        emailResults.successfulEmails.push({
          type: 'Committee',
          name: committee.name,
          memberCount: committee.memberCount,
          status: 'Email sent successfully'
        });
      } else {
        emailResults.failedEmails.push({
          type: 'Committee',
          name: committee.name,
          error: committee.error,
          status: 'Failed to send emails'
        });
      }
    });

    emailResults.subcommitteeResults.forEach(subcommittee => {
      if (subcommittee.status === 'success') {
        emailResults.successfulEmails.push({
          type: 'Subcommittee',
          name: subcommittee.name,
          memberCount: subcommittee.memberCount,
          status: 'Email sent successfully'
        });
      } else {
        emailResults.failedEmails.push({
          type: 'Subcommittee',
          name: subcommittee.name,
          error: subcommittee.error,
          status: 'Failed to send emails'
        });
      }
    });

    return emailResults;
  };

  const handleRetryFailedEmails = async () => {
    if (!emailResults || emailResults.failedEmails.length === 0) {
      setError('No failed emails to retry');
      return;
    }

    setSending(true);
    setError('');

    try {
      console.log('🔍 EnhancedMeetingInvitationManager: Retrying failed emails');

      // Get the failed committees and subcommittees
      const failedCommittees = emailResults.committeeResults
        .filter(c => c.status !== 'success')
        .map(c => c.id);

      const failedSubcommittees = emailResults.subcommitteeResults
        .filter(s => s.status !== 'success')
        .map(s => s.id);

      if (failedCommittees.length === 0 && failedSubcommittees.length === 0) {
        setError('No failed invitations to retry');
        return;
      }

      // Retry sending invitations to failed groups
      const retryData = {
        meetingId: selectedMeeting.id,
        committees: failedCommittees,
        subcommittees: failedSubcommittees,
        message: generateInvitationPreview(),
        sendEmail: true
      };

      const { data: result } = await http.post('/invitations/bulk', retryData);

      if (result.success) {
        // Update email results with retry results
        const updatedResults = processEmailResults(result);
        setEmailResults(updatedResults);
        setEmailStatus({
          total: result.totalRecipients || 0,
          sent: updatedResults.successfulEmails.length,
          failed: updatedResults.failedEmails.length,
          pending: updatedResults.pendingEmails.length
        });

        setSuccess(`Retry completed! ${updatedResults.successfulEmails.length} emails sent successfully.`);
      } else {
        throw new Error(result.error || 'Failed to retry invitations');
      }
    } catch (error) {
      console.error('❌ EnhancedMeetingInvitationManager: Error retrying emails:', error);
      setError('Failed to retry emails: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleSendInvitations = () => {
    if (!selectedMeeting) {
      setError('Please select a meeting first.');
      return;
    }

    if (selectedCommittees.length === 0 && selectedSubcommittees.length === 0) {
      setError('Please select at least one committee or subcommittee.');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    setSending(true);
    setError('');
    setSuccess('');
    setEmailResults(null);
    setShowEmailResults(false);

    try {
      console.log('🔍 EnhancedMeetingInvitationManager: Sending bulk invitations');
      console.log('🔍 EnhancedMeetingInvitationManager: Selected committees:', selectedCommittees);
      console.log('🔍 EnhancedMeetingInvitationManager: Selected subcommittees:', selectedSubcommittees);

      // Generate invitation message
      const invitationMessage = generateInvitationPreview();

      // Use the bulk invitation endpoint which is more appropriate for committees/subcommittees
      const bulkInvitationData = {
        meetingId: selectedMeeting.id,
        committees: selectedCommittees,
        subcommittees: selectedSubcommittees,
        message: invitationMessage,
        sendEmail: true
      };

      console.log('🔍 EnhancedMeetingInvitationManager: Bulk invitation data:', bulkInvitationData);

      // Send bulk invitations using the bulk endpoint
      const { data: result } = await http.post('/invitations/bulk', bulkInvitationData);
      console.log('✅ EnhancedMeetingInvitationManager: Bulk invitations sent successfully:', result);

      if (result.success) {
        // Process email results for detailed feedback
        const emailResults = processEmailResults(result);
        setEmailResults(emailResults);

        // Get email delivery statistics from backend
        const emailStats = result.emailDeliveryStats || {};
        setEmailStatus({
          total: result.totalRecipients || 0,
          sent: emailStats.emailsSentSuccessfully || 0,
          failed: emailStats.emailsFailed || 0,
          pending: (result.totalRecipients || 0) - (emailStats.emailsSentSuccessfully || 0) - (emailStats.emailsFailed || 0)
        });

        // Show success message with detailed email statistics
        const successMessage = `Invitations processed successfully! 📧\n\n` +
          `📊 Email Delivery Summary:\n` +
          `✅ Sent Successfully: ${emailStats.emailsSentSuccessfully || 0}\n` +
          `❌ Failed: ${emailStats.emailsFailed || 0}\n` +
          `⏳ Pending: ${emailStatus.pending}\n` +
          `📈 Success Rate: ${emailStats.emailSuccessRate || '0%'}\n\n` +
          `Total Recipients: ${result.totalRecipients || 0}`;

        setSuccess(successMessage);
        setShowEmailResults(true);

        // Reset selections
        setSelectedMeeting(null);
        setSelectedCommittees([]);
        setSelectedSubcommittees([]);
        setShowConfirmDialog(false);
      } else {
        throw new Error(result.error || 'Failed to send invitations');
      }
    } catch (error) {
      console.error('❌ EnhancedMeetingInvitationManager: Error sending invitations:', error);
      setError('Failed to send invitations: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const generateInvitationPreview = () => {
    if (!selectedMeeting) return '';

    const meetingDate = new Date(selectedMeeting.meetingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `Subject: Meeting Invitation - ${selectedMeeting.title}

Dear Committee/Subcommittee Members,

You are cordially invited to attend the following meeting:

Meeting: ${selectedMeeting.title}
Date & Time: ${meetingDate}
Location: ${selectedMeeting.location}

${selectedMeeting.description || ''}

Please confirm your attendance by replying to this email.

Best regards,
Meeting Organizer`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading meetings and committees...</p>
        </div>
      </div>
    );
  }

  const estimatedRecipients = getEstimatedRecipients();

  return (
    <div className="enhanced-meeting-invitation-manager">
      <div className="meeting-invitation-content">
        {/* Header */}
        <div className="meeting-invitation-header">
          <h1 className="meeting-invitation-title">
            <FaEnvelope />
            Meeting Invitation Manager
          </h1>
          <p className="meeting-invitation-subtitle">
            Select committees and subcommittees to send meeting invitations with comprehensive recipient management
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="invitation-alert invitation-alert-error">
            <FaExclamationTriangle />
            <div className="invitation-alert-content">
              <strong>Error</strong>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="invitation-alert invitation-alert-success">
            <FaCheckCircle />
            <div className="invitation-alert-content">
              <strong>Success!</strong>
              {success}
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="alert alert-success">
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{success}</pre>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error}</pre>
          </div>
        )}

        {/* Email Results Display */}
        {showEmailResults && emailResults && (
          <div className="email-results-panel">
            <div className="panel-header">
              <h3>📧 Email Delivery Results</h3>
              <div className="email-status-summary">
                <span className="status-item success">✅ Sent: {emailStatus.sent}</span>
                <span className="status-item error">❌ Failed: {emailStatus.failed}</span>
                <span className="status-item pending">⏳ Pending: {emailStatus.pending}</span>
                <span className="status-item total">📊 Total: {emailStatus.total}</span>
              </div>
            </div>

            <div className="panel-body">
              {/* Email Delivery Statistics */}
              {emailResults && (
                <div className="email-stats-section">
                  <h4>📊 Email Delivery Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-card total">
                      <div className="stat-number">{emailStatus.total}</div>
                      <div className="stat-label">Total Recipients</div>
                    </div>
                    <div className="stat-card success">
                      <div className="stat-number">{emailStatus.sent}</div>
                      <div className="stat-label">Emails Sent</div>
                    </div>
                    <div className="stat-card error">
                      <div className="stat-number">{emailStatus.failed}</div>
                      <div className="stat-label">Emails Failed</div>
                    </div>
                    <div className="stat-card pending">
                      <div className="stat-number">{emailStatus.pending}</div>
                      <div className="stat-label">Pending</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Successful Emails */}
              {emailResults.successfulEmails.length > 0 && (
                <div className="email-section success">
                  <h4>✅ Successfully Sent Emails</h4>
                  <div className="email-list">
                    {emailResults.successfulEmails.map((email, index) => (
                      <div key={index} className="email-item success">
                        <span className="email-type">{email.type}</span>
                        <span className="email-name">{email.name}</span>
                        <span className="email-count">{email.memberCount} members</span>
                        <span className="email-status">{email.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed Emails */}
              {emailResults.failedEmails.length > 0 && (
                <div className="email-section error">
                  <h4>❌ Failed Email Deliveries</h4>
                  <div className="email-list">
                    {emailResults.failedEmails.map((email, index) => (
                      <div key={index} className="email-item error">
                        <span className="email-type">{email.type}</span>
                        <span className="email-name">{email.name}</span>
                        <span className="email-error">{email.error}</span>
                        <span className="email-status">{email.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="retry-section">
                    <button
                      onClick={handleRetryFailedEmails}
                      disabled={sending}
                      className="retry-btn"
                    >
                      {sending ? (
                        <>
                          <FaSpinner className="loading-spinner" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <FaEnvelope />
                          Retry Failed Emails
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Committee Results Summary */}
              {emailResults.committeeResults.length > 0 && (
                <div className="results-summary">
                  <h4>📋 Committee Results</h4>
                  <div className="results-grid">
                    {emailResults.committeeResults.map((committee, index) => (
                      <div key={index} className={`result-item ${committee.status}`}>
                        <span className="result-name">{committee.name}</span>
                        <span className="result-status">{committee.status}</span>
                        <span className="result-count">{committee.memberCount} members</span>
                        {committee.error && (
                          <span className="result-error">{committee.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subcommittee Results Summary */}
              {emailResults.subcommitteeResults.length > 0 && (
                <div className="results-summary">
                  <h4>📋 Subcommittee Results</h4>
                  <div className="results-grid">
                    {emailResults.subcommitteeResults.map((subcommittee, index) => (
                      <div key={index} className={`result-item ${subcommittee.status}`}>
                        <span className="result-name">{subcommittee.name}</span>
                        <span className="result-status">{subcommittee.status}</span>
                        <span className="result-count">{subcommittee.memberCount} members</span>
                        {subcommittee.error && (
                          <span className="result-error">{subcommittee.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="invitation-content-grid">
          {/* Meeting Selection */}
          <div className="meeting-selection-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <FaCalendarAlt />
                Select Meeting
              </h2>
              <p className="panel-subtitle">Choose a meeting to send invitations for</p>
            </div>

            <div className="panel-body">
              {meetings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FaCalendarAlt />
                  </div>
                  <h3 className="empty-state-title">No Meetings Available</h3>
                  <p className="empty-state-description">No upcoming meetings are available for invitations.</p>
                </div>
              ) : (
                <div className="meetings-list">
                  {meetings.map(meeting => (
                    <div
                      key={meeting.id}
                      className={`meeting-selection-card ${selectedMeeting?.id === meeting.id ? 'selected' : ''
                        }`}
                      onClick={() => handleMeetingSelect(meeting)}
                    >
                      <div className="meeting-card-header">
                        <div className="meeting-title-container">
                          <h3 className="meeting-card-title">
                            {meeting.title || `Meeting ${meeting.id}`}
                          </h3>
                          <p className="meeting-card-description">
                            {meeting.description || 'No description available'}
                          </p>
                        </div>
                        <div className="meeting-status-container">
                          <span className={`meeting-status-badge ${meeting.status === 'SCHEDULED' ? 'meeting-status-scheduled' : 'meeting-status-draft'
                            }`}>
                            {meeting.status}
                          </span>
                        </div>
                      </div>

                      <div className="meeting-card-details">
                        <div className="meeting-card-detail">
                          <FaClock className="detail-icon" />
                          <span className="detail-text">
                            {new Date(meeting.meetingDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="meeting-card-detail">
                          <FaClock className="detail-icon" />
                          <span className="detail-text">
                            {new Date(meeting.meetingDate).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {meeting.location && (
                          <div className="meeting-card-detail">
                            <FaMapMarkerAlt className="detail-icon" />
                            <span className="detail-text">{meeting.location}</span>
                          </div>
                        )}
                      </div>

                      {selectedMeeting?.id === meeting.id && (
                        <div className="meeting-selection-indicator">
                          <FaCheckCircle className="selection-icon" />
                          <span className="selection-text">Selected for invitations</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Committee/Subcommittee Selection */}
          <div className="committee-selection-panel">
            <div className="panel-header">
              <h2 className="panel-title">Select Recipients</h2>
              <p className="panel-subtitle">Choose committees and subcommittees to invite</p>
            </div>
            <div className="panel-body">
              {!selectedMeeting ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FaUsers />
                  </div>
                  <h3 className="empty-state-title">Select a Meeting First</h3>
                  <p className="empty-state-description">Choose a meeting from the left panel to start selecting recipients</p>
                </div>
              ) : (
                <div className="recipients-section">
                  <div className="selection-controls">
                    <div className="search-container">
                      <FaSearch className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search committees/subcommittees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                    </div>

                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Groups</option>
                      <option value="committees">Committees Only</option>
                      <option value="subcommittees">Subcommittees Only</option>
                    </select>
                  </div>

                  <div className="recipients-summary">
                    <div className="summary-stats">
                      <span>Committees: <strong>{selectedCommittees.length}</strong></span>
                      <span>Subcommittees: <strong>{selectedSubcommittees.length}</strong></span>
                      <span>Est. Recipients: <strong>{estimatedRecipients}</strong></span>
                    </div>
                    <button
                      onClick={handleSendInvitations}
                      disabled={sending || !selectedMeeting || (selectedCommittees.length === 0 && selectedSubcommittees.length === 0)}
                      className="send-invitations-btn"
                    >
                      {sending ? (
                        <>
                          <FaSpinner className="loading-spinner" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FaEnvelope />
                          Send Invitations
                        </>
                      )}
                    </button>
                  </div>

                  <div className="selection-lists">
                    {/* Committees */}
                    {(filterType === 'all' || filterType === 'committees') && (
                      <div className="selection-section">
                        <h3 className="selection-section-title">
                          <FaBuilding />
                          Committees ({getFilteredCommittees().length})
                        </h3>

                        {getFilteredCommittees().length === 0 ? (
                          <div className="empty-state">
                            <p className="empty-state-description">No committees found</p>
                          </div>
                        ) : (
                          <div className="selection-list">
                            {getFilteredCommittees().map(committee => (
                              <div
                                key={committee.id}
                                className={`selection-item ${selectedCommittees.includes(committee.id) ? 'selected' : ''
                                  }`}
                                onClick={() => handleCommitteeToggle(committee.id)}
                              >
                                <div className={`selection-checkbox ${selectedCommittees.includes(committee.id) ? 'checked' : ''
                                  }`}></div>
                                <div className="selection-item-content">
                                  <h4 className="selection-item-name">{committee.name}</h4>
                                  {committee.description && (
                                    <p className="selection-item-description">{committee.description}</p>
                                  )}
                                  <div className="selection-item-meta">
                                    <span className="member-count">{committee.memberCount || 0} members</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subcommittees */}
                    {(filterType === 'all' || filterType === 'subcommittees') && (
                      <div className="selection-section">
                        <h3 className="selection-section-title">
                          <FaUserTie />
                          Subcommittees ({getFilteredSubcommittees().length})
                        </h3>

                        {getFilteredSubcommittees().length === 0 ? (
                          <div className="empty-state">
                            <p className="empty-state-description">No subcommittees found</p>
                          </div>
                        ) : (
                          <div className="selection-list">
                            {getFilteredSubcommittees().map(subcommittee => (
                              <div
                                key={subcommittee.id}
                                className={`selection-item ${selectedSubcommittees.includes(subcommittee.id) ? 'selected' : ''
                                  }`}
                                onClick={() => handleSubcommitteeToggle(subcommittee.id)}
                              >
                                <div className={`selection-checkbox ${selectedSubcommittees.includes(subcommittee.id) ? 'checked' : ''
                                  }`}></div>
                                <div className="selection-item-content">
                                  <h4 className="selection-item-name">{subcommittee.name}</h4>
                                  {subcommittee.description && (
                                    <p className="selection-item-description">{subcommittee.description}</p>
                                  )}
                                  <div className="selection-item-meta">
                                    <span className="member-count">{subcommittee.memberCount || 0} members</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMeetingInvitationManager;