import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendar, FaMapMarkerAlt, FaUsers, FaFileAlt, FaLink, FaCheckCircle } from 'react-icons/fa';
import http from '../../services/http';
import './CreateMeeting.css';

const CreateMeeting = () => {
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState({
    title: '',
    description: '',
    agenda: '',
    meetingDate: '',
    meetingTime: '',
    meetingEndDate: '',
    meetingEndTime: '',
    meetingMode: 'PHYSICAL',
    location: '',
    meetingLink: '',
    invitationPdf: null,
    meetingType: '',
    sendNotifications: true,
    hostingCountry: { id: '' },
    subCommittee: { id: '' }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();
  const userRole = currentUser?.role;
  const isDelegationSecretary = userRole === 'DELEGATION_SECRETARY' || userRole === 'SECRETARY';
  const isCommitteeSecretary = userRole === 'COMMITTEE_SECRETARY';
  const userCountryId = currentUser?.country?.id ? String(currentUser.country.id) : '';
  const userSubcommitteeId = currentUser?.subcommittee?.id
    ? String(currentUser.subcommittee.id)
    : currentUser?.subCommittee?.id
      ? String(currentUser.subCommittee.id)
      : currentUser?.subcommitteeId
        ? String(currentUser.subcommitteeId)
        : '';

  useEffect(() => {
    if (userCountryId) {
      setMeeting(prev => ({
        ...prev,
        hostingCountry: { id: userCountryId }
      }));
    }
    if (isCommitteeSecretary) {
      setMeeting(prev => ({
        ...prev,
        meetingType: 'SUBCOMMITTEE_MEETING',
        subCommittee: { id: userSubcommitteeId }
      }));
    }
  }, [userCountryId, isCommitteeSecretary, userSubcommitteeId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMeeting(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setMeeting(prev => ({
        ...prev,
        invitationPdf: file
      }));
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const clearFile = () => {
    setMeeting(prev => ({
      ...prev,
      invitationPdf: null
    }));
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!meeting.title.trim()) {
      setError('Meeting title is required');
      setLoading(false);
      return;
    }
    if (!meeting.meetingDate) {
      setError('Meeting date is required');
      setLoading(false);
      return;
    }
    if (!meeting.meetingTime) {
      setError('Meeting time is required');
      setLoading(false);
      return;
    }
    if (!meeting.meetingEndDate || !meeting.meetingEndTime) {
      setError('Meeting end date and time are required');
      setLoading(false);
      return;
    }
    if (!isCommitteeSecretary && !meeting.meetingType) {
      setError('Meeting type is required');
      setLoading(false);
      return;
    }
    if (!userCountryId) {
      setError('Your account has no country assigned. Please contact admin before creating a meeting.');
      setLoading(false);
      return;
    }

    if (meeting.meetingMode === 'ONLINE') {
      if (!meeting.meetingLink.trim()) {
        setError('Meeting link is required for online meetings');
        setLoading(false);
        return;
      }
      if (!isValidUrl(meeting.meetingLink)) {
        setError('Please enter a valid meeting link URL');
        setLoading(false);
        return;
      }
    }

    if (meeting.meetingMode === 'PHYSICAL' && !meeting.location.trim()) {
      setError('Location is required for physical meetings');
      setLoading(false);
      return;
    }

    // ── Frontend future-date+time validation ──────────────────────────────────
    const combinedDateTime = new Date(`${meeting.meetingDate}T${meeting.meetingTime}`);
    if (combinedDateTime <= new Date()) {
      setError('Meeting date and time must be in the future.');
      setLoading(false);
      return;
    }

    const combinedEndDateTime = new Date(`${meeting.meetingEndDate}T${meeting.meetingEndTime}`);
    if (combinedEndDateTime < combinedDateTime) {
      setError('Meeting end date/time must be after start date/time.');
      setLoading(false);
      return;
    }

    if (isCommitteeSecretary && !userSubcommitteeId) {
      setError('Your account has no assigned subcommittee. Please contact admin before creating a meeting.');
      setLoading(false);
      return;
    }

    try {
      // Get current user for createdBy field
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Combine date and time
      const dateTime = `${meeting.meetingDate}T${meeting.meetingTime}`;
      const endDateTime = `${meeting.meetingEndDate}T${meeting.meetingEndTime}`;
      const resolvedMeetingType = isCommitteeSecretary ? 'SUBCOMMITTEE_MEETING' : meeting.meetingType;
      const resolvedSubcommittee = isCommitteeSecretary
        ? { id: userSubcommitteeId }
        : (meeting.subCommittee?.id ? meeting.subCommittee : null);

      // Create meeting data as JSON
      const meetingData = {
        title: meeting.title,
        description: meeting.description,
        agenda: meeting.agenda,
        meetingDate: dateTime,
        meetingEndDate: endDateTime,
        meetingMode: meeting.meetingMode,
        location: meeting.meetingMode === 'PHYSICAL' ? meeting.location : null,
        meetingLink: meeting.meetingMode === 'ONLINE' ? meeting.meetingLink : null,
        meetingType: resolvedMeetingType,
        sendNotifications: meeting.sendNotifications,
        hostingCountry: { id: userCountryId },
        subCommittee: resolvedSubcommittee,
        createdBy: { id: user.id }
      };

      const { data: createdMeeting } = await http.post('/meetings', meetingData);

      // Upload PDF invitation if selected
      if (meeting.invitationPdf) {
        try {
          const pdfFormData = new FormData();
          pdfFormData.append('invitationPdf', meeting.invitationPdf);
          await http.post(`/meetings/${createdMeeting.id}/upload-invitation`, pdfFormData);
        } catch (pdfError) {
          console.warn('PDF upload error, but meeting was created:', pdfError);
        }
      }

      alert('Meeting created successfully!');
      navigate('/secretary/dashboard');
    } catch (error) {
      console.error('Error creating meeting:', error);

      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else if (error.message && error.message.includes('User not authenticated')) {
        setError('Please log in again to continue.');
        setTimeout(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(error.message || 'Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-meeting-container">
      <div className="create-meeting-header">
        <h1>Create Meeting</h1>
        <p>
          {isCommitteeSecretary
            ? 'Schedule a new meeting for your assigned subcommittee'
            : 'Schedule new Commissioner General or Technical Committee meetings'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="create-meeting-form">
        <div className="form-section">
          <h3>Meeting Details</h3>

          <div className="form-group">
            <label htmlFor="title">Meeting Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={meeting.title}
              onChange={handleChange}
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={meeting.description}
              onChange={handleChange}
              placeholder="Enter meeting description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="agenda">Agenda Items</label>
            <textarea
              id="agenda"
              name="agenda"
              value={meeting.agenda}
              onChange={handleChange}
              placeholder="Enter agenda items (one per line)"
              rows="5"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Meeting Schedule</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="meetingDate">Meeting Date *</label>
              <input
                type="date"
                id="meetingDate"
                name="meetingDate"
                value={meeting.meetingDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="meetingTime">Meeting Time *</label>
              <input
                type="time"
                id="meetingTime"
                name="meetingTime"
                value={meeting.meetingTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="meetingEndDate">End Date *</label>
              <input
                type="date"
                id="meetingEndDate"
                name="meetingEndDate"
                value={meeting.meetingEndDate}
                onChange={handleChange}
                min={meeting.meetingDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="meetingEndTime">End Time *</label>
              <input
                type="time"
                id="meetingEndTime"
                name="meetingEndTime"
                value={meeting.meetingEndTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {!isCommitteeSecretary && (
            <div className="form-group">
              <label htmlFor="meetingType">Meeting Type *</label>
              <select
                id="meetingType"
                name="meetingType"
                value={meeting.meetingType}
                onChange={handleChange}
                required
              >
                <option value="">Select meeting type</option>
                {(isDelegationSecretary || !userRole) && (
                  <>
                    <option value="COMMISSIONER_GENERAL_MEETING">Commissioner General Meeting (CG)</option>
                    <option value="TECHNICAL_MEETING">Technical Committee Meeting (TC)</option>
                  </>
                )}
                {!isDelegationSecretary && !isCommitteeSecretary && (
                  <>
                    <option value="COMMISSIONER_GENERAL_MEETING">Commissioner General Meeting (CG)</option>
                    <option value="TECHNICAL_MEETING">Technical Committee Meeting (TC)</option>
                    <option value="SUBCOMMITTEE_MEETING">Subcommittee Meeting</option>
                  </>
                )}
              </select>
            </div>
          )}

        </div>

        <div className="form-section">
          <h3>Location</h3>

          <div className="form-group">
            <label htmlFor="meetingMode">Meeting Mode *</label>
            <select
              id="meetingMode"
              name="meetingMode"
              value={meeting.meetingMode}
              onChange={handleChange}
              required
            >
              <option value="PHYSICAL">Physical</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location">Meeting Location {meeting.meetingMode === 'PHYSICAL' ? '*' : ''}</label>
            <input
              type="text"
              id="location"
              name="location"
              value={meeting.location}
              onChange={handleChange}
              placeholder="Enter meeting location"
              disabled={meeting.meetingMode !== 'PHYSICAL'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="meetingLink">Meeting Link {meeting.meetingMode === 'ONLINE' ? '*' : ''}</label>
            <div className="input-with-icon">
              <input
                type="url"
                id="meetingLink"
                name="meetingLink"
                value={meeting.meetingLink}
                onChange={handleChange}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                className={meeting.meetingLink && isValidUrl(meeting.meetingLink) ? 'valid-url' : ''}
                disabled={meeting.meetingMode !== 'ONLINE'}
              />
              {meeting.meetingLink && isValidUrl(meeting.meetingLink) && (
                <FaCheckCircle className="valid-icon" />
              )}
            </div>
            <small className="form-help">Add a meeting link if this is an online/virtual meeting</small>
          </div>

          <div className="form-group">
            <label htmlFor="invitationPdf">Invitation PDF</label>
            <input
              type="file"
              id="invitationPdf"
              name="invitationPdf"
              onChange={handleFileChange}
              accept=".pdf"
              className="file-input"
            />
            {meeting.invitationPdf && (
              <div className="file-selected">
                <span>Selected: {meeting.invitationPdf.name}</span>
                <button type="button" onClick={clearFile} className="clear-file-btn">
                  Clear
                </button>
              </div>
            )}
            <small className="form-help">Upload a PDF invitation document (optional)</small>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="sendNotifications"
              name="sendNotifications"
              checked={meeting.sendNotifications}
              onChange={handleChange}
            />
            <label htmlFor="sendNotifications" style={{ margin: 0 }}>
              Send invitations/notifications immediately after creating meeting
            </label>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/meetings/manage')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Meeting'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMeeting;