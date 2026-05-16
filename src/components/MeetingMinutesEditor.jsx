import React, { useState, useEffect } from 'react';
import { 
  FaSave, 
  FaSpinner, 
  FaCheck, 
  FaExclamationTriangle, 
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaFileAlt
} from 'react-icons/fa';
import http from '../services/http';
import './MeetingMinutesEditor.css';

const MeetingMinutesEditor = ({ meetingId, onSave, onCancel }) => {
  const [meeting, setMeeting] = useState(null);
  const [minutes, setMinutes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationValidation, setLocationValidation] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadMeetingData();
  }, [meetingId]);

  const loadMeetingData = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);

      if (!userData) {
        setError('User not authenticated');
        return;
      }

      // Load meeting details
      const { data: meetingData } = await http.get(`/meetings/${meetingId}`);
      if (!meetingData) {
        setError('Failed to load meeting details');
        return;
      }

      setMeeting(meetingData);
      setMinutes(meetingData.minutes || '');

      // Validate secretary access
      await validateSecretaryAccess(userData.id, meetingId);
    } catch (error) {
      console.error('Error loading meeting:', error);
      setError('Failed to load meeting data');
    } finally {
      setLoading(false);
    }
  };

  const validateSecretaryAccess = async (secretaryId, meetingId) => {
    try {
      const { data: result } = await http.get(`/secretary/meetings/${secretaryId}/validate/${meetingId}`);
      if (result) {
        setLocationValidation(result);

        if (!result.hasAccess) {
          setError('Access denied: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error validating access:', error);
      setLocationValidation({
        hasAccess: false,
        message: 'Unable to validate access'
      });
    }
  };

  const handleSave = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!locationValidation?.hasAccess) {
      setError('You do not have permission to edit minutes for this meeting');
      return;
    }

    if (!minutes.trim()) {
      setError('Meeting minutes cannot be empty');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: result } = await http.put(`/secretary/meetings/${meetingId}/minutes`, {
        minutes: minutes.trim(),
        secretaryId: user.id
      });

      if (result && result.success) {
        setSuccess('Meeting minutes saved successfully!');
        setTimeout(() => {
          if (onSave) {
            onSave(result.meeting);
          }
        }, 2000);
      } else {
        setError(result.error || 'Failed to save meeting minutes');
      }
    } catch (error) {
      console.error('Error saving minutes:', error);
      setError('Failed to save meeting minutes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  const getMinutesTemplate = () => {
    if (!meeting) return '';
    
    return `MEETING MINUTES

Meeting: ${meeting.title}
Date: ${formatDate(meeting.meetingDate)}
Location: ${meeting.location}
Hosting Country: ${meeting.hostingCountry?.name || 'Not specified'}

ATTENDEES:
[List attendees here]

AGENDA ITEMS:
${meeting.agenda ? meeting.agenda.split('\n').map((item, index) => `${index + 1}. ${item}`).join('\n') : '[Add agenda items]'}

DISCUSSIONS:
[Record key discussions and decisions]

ACTION ITEMS:
[List action items with responsible parties and deadlines]

RESOLUTIONS:
[Record any resolutions passed during the meeting]

NEXT MEETING:
[Date and location of next meeting if applicable]

Meeting adjourned at: [Time]

Secretary: ${user?.name || '[Name]'}
Date of minutes: ${new Date().toLocaleDateString()}`;
  };

  const useTemplate = () => {
    if (!minutes.trim()) {
      setMinutes(getMinutesTemplate());
    } else {
      const confirmed = window.confirm('This will replace your current minutes with a template. Are you sure?');
      if (confirmed) {
        setMinutes(getMinutesTemplate());
      }
    }
  };

  if (loading) {
    return (
      <div className="minutes-editor loading">
        <FaSpinner className="loading-spinner" />
        <p>Loading meeting details...</p>
      </div>
    );
  }

  if (error && !meeting) {
    return (
      <div className="minutes-editor error">
        <FaExclamationTriangle className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        {onCancel && (
          <button onClick={onCancel} className="btn-cancel">
            Go Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="meeting-minutes-editor">
      <div className="editor-header">
        <div className="meeting-info">
          <h1>{meeting?.title}</h1>
          <div className="meeting-details">
            <div className="detail-item">
              <FaCalendarAlt />
              <span>{meeting ? formatDate(meeting.meetingDate) : 'Loading...'}</span>
            </div>
            <div className="detail-item">
              <FaMapMarkerAlt />
              <span>{meeting?.location} ({meeting?.hostingCountry?.name})</span>
            </div>
            <div className="detail-item">
              <FaUsers />
              <span>{meeting?.meetingType?.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {locationValidation && (
          <div className={`access-validation ${locationValidation.hasAccess ? 'valid' : 'invalid'}`}>
            {locationValidation.hasAccess ? (
              <>
                <FaCheck /> Access granted: You can edit minutes for this meeting
              </>
            ) : (
              <>
                <FaExclamationTriangle /> {locationValidation.message}
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <FaCheck /> {success}
        </div>
      )}

      <div className="editor-content">
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <button 
              onClick={useTemplate}
              className="btn-template"
              disabled={saving}
            >
              <FaFileAlt /> Use Template
            </button>
          </div>
          <div className="toolbar-right">
            <span className="word-count">
              {minutes.trim().split(/\s+/).filter(word => word.length > 0).length} words
            </span>
          </div>
        </div>

        <div className="editor-main">
          <textarea
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="Enter meeting minutes here... Click 'Use Template' for a structured format."
            className="minutes-textarea"
            disabled={saving || !locationValidation?.hasAccess}
          />
        </div>

        <div className="editor-actions">
          <button
            onClick={onCancel}
            className="btn-cancel"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-save"
            disabled={saving || !locationValidation?.hasAccess || !minutes.trim()}
          >
            {saving ? (
              <>
                <FaSpinner className="loading-spinner" />
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                Save Minutes
              </>
            )}
          </button>
        </div>
      </div>

      {meeting?.status === 'COMPLETED' && (
        <div className="completion-notice">
          <FaCheck />
          <span>This meeting has been marked as completed with saved minutes.</span>
        </div>
      )}
    </div>
  );
};

export default MeetingMinutesEditor;
