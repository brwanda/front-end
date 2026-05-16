import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaFileAlt, FaUsers, FaCalendar, FaSave, FaArrowLeft,
  FaCheckCircle, FaEnvelope, FaSpinner, FaClock, FaArchive,
  FaUpload
} from 'react-icons/fa';
import http from '../../services/http';
import './TakeMinutes.css';

const TakeMinutes = () => {
  const navigate = useNavigate();

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  // Step: 1 = select, 2 = write minutes
  const [currentStep, setCurrentStep] = useState(1);

  // Categorized meetings
  const [upcoming, setUpcoming] = useState([]);
  const [ongoing, setOngoing] = useState([]);
  const [pendingMinutes, setPendingMinutes] = useState([]);
  // Active tab on meeting list: 'pending' | 'ongoing' | 'upcoming'
  const [activeTab, setActiveTab] = useState('pending');

  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [minutes, setMinutes] = useState('');
  const [minutesDocuments, setMinutesDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingMinutes, setSavingMinutes] = useState(false);

  const currentRole = currentUser?.role || '';
  const isDelegationSecretary = currentRole === 'DELEGATION_SECRETARY';

  // Inline invitation state per meeting
  const [invitationStatus, setInvitationStatus] = useState({});
  useEffect(() => { fetchMeetings(); }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      if (!currentUser?.id) throw new Error('User not authenticated');

      // Use the categorized endpoint so we get proper groups
      const { data } = await http.get(`/meetings/secretary/${currentUser.id}/categorized`);

      const upcomingList = Array.isArray(data.upcoming) ? data.upcoming : [];
      const ongoingList = Array.isArray(data.ongoing) ? data.ongoing : [];
      const pendingList = Array.isArray(data.pendingMinutes) ? data.pendingMinutes : [];
      setUpcoming(upcomingList);
      setOngoing(ongoingList);
      setPendingMinutes(pendingList);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError(`Failed to load meetings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Send Invitations ────────────────────────────────────────────────────────
  const handleSendInvitations = async (meeting) => {
    const mid = meeting.id;
    setInvitationStatus(prev => ({ ...prev, [mid]: { sending: true } }));
    try {
      const committeeIds = meeting.committee ? [meeting.committee.id] : [];
      const subcommitteeIds = meeting.subCommittee ? [meeting.subCommittee.id] : [];

      if (committeeIds.length === 0 && subcommitteeIds.length === 0) {
        const [cr, sr] = await Promise.all([http.get('/committees'), http.get('/sub-committees')]);
        if (Array.isArray(cr.data)) committeeIds.push(...cr.data.map(c => c.id));
        if (Array.isArray(sr.data)) subcommitteeIds.push(...sr.data.map(s => s.id));
      }

      const body = {
        committees: committeeIds,
        subcommittees: subcommitteeIds,
        sendEmail: true,
        message: `You are invited to: "${meeting.title}" on ${formatDate(meeting.meetingDate)}.`,
      };

      const { data: result } = await http.post(`/committee-invitations/send/${mid}`, body);
      const total = result.totalInvitations ?? result.totalRecipients ?? 'all';
      setInvitationStatus(prev => ({ ...prev, [mid]: { status: 'sent', message: `Invitations sent ✓ (${total})` } }));
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message;
      setInvitationStatus(prev => ({
        ...prev, [mid]: { status: 'failed', message: `Failed: ${msg}` }
      }));
    }
  };

  // ── Meeting selection (only pending-minutes meetings can be selected) ───────
  const handleMeetingSelect = async (meeting) => {
    setError('');

    setSelectedMeeting(meeting);
    setMinutes(meeting.minutes || '');
    setMinutesDocuments([]);
    setCurrentStep(2);

    // Fetch actual invitation status from backend
    try {
      const { data } = await http.get(`/committee-invitations/status/${meeting.id}`);
      if (data && data.totalInvitations > 0) {
        setInvitationStatus(prev => ({
          ...prev,
          [meeting.id]: { status: 'sent', message: `Invitations sent ✓ (${data.totalInvitations})` }
        }));
      }
    } catch (err) {
      console.warn('Could not fetch invitation status:', err);
    }
  };

  const goBackToMeetings = () => {
    setCurrentStep(1);
    setSelectedMeeting(null);
    setMinutes('');
    setMinutesDocuments([]);
    setError('');
  };

  const parseMinutesDocumentNames = (rawValue) => {
    if (!rawValue || typeof rawValue !== 'string') return [];
    return rawValue
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  };

  const removeSelectedMinutesDocument = (fileName) => {
    setMinutesDocuments(prev => prev.filter(file => file.name !== fileName));
  };

  const getNextStepConfig = (meeting) => {
    if (!meeting) {
      return {
        path: '/minutes/take',
        ctaLabel: 'Save Minutes & Continue'
      };
    }

    if (isDelegationSecretary && meeting.meetingType === 'COMMISSIONER_GENERAL_MEETING') {
      return {
        path: `/meetings/${meeting.id}/resolutions`,
        ctaLabel: 'Save Minutes & Continue to Create Resolution'
      };
    }

    if (isDelegationSecretary && meeting.meetingType === 'TECHNICAL_MEETING') {
      return {
        path: `/meetings/${meeting.id}/tasks`,
        ctaLabel: 'Save Minutes & Continue to Create Task'
      };
    }

    // Committee Secretary - Subcommittee Meeting
    // They should go to task management page to add descriptions and create sub-tasks
    if (currentRole === 'COMMITTEE_SECRETARY' && meeting.meetingType === 'SUBCOMMITTEE_MEETING') {
      return {
        path: `/meetings/${meeting.id}/task-management`,
        ctaLabel: 'Save Minutes & Continue to Task Management'
      };
    }

    return {
      path: `/meetings/${meeting.id}/resolutions`,
      ctaLabel: 'Save Minutes & Continue to Resolutions'
    };
  };

  // ── Save minutes ─────────────────────────────────────────────────────────────
  const saveMinutes = async () => {
    if (!selectedMeeting) { setError('Please select a meeting first'); return; }
    if (!minutes.trim() && minutesDocuments.length === 0) {
      setError('Please provide minutes text or upload a minutes document');
      return;
    }

    const inv = invitationStatus[selectedMeeting.id];
    if (!inv || inv.status !== 'sent') {
      const confirmSave = window.confirm('Notice: Meeting invitations have not been marked as "Sent" for this meeting. Do you want to continue saving minutes anyway?');
      if (!confirmSave) return;
    }

    setSavingMinutes(true);
    setError('');
    try {
      if (minutes.trim()) {
        console.log('Saving minutes to:', `/meetings/${selectedMeeting.id}/minutes`);
        const response = await http.put(`/meetings/${selectedMeeting.id}/minutes`, { minutes: minutes.trim() });
        console.log('Minutes saved successfully:', response);
      }

      if (minutesDocuments.length > 0) {
        try {
          console.log('Uploading documents to:', `/meetings/${selectedMeeting.id}/minutes-document`);
          const formData = new FormData();
          minutesDocuments.forEach(file => formData.append('minutesDocument', file));
          const response = await http.post(`/meetings/${selectedMeeting.id}/minutes-document`, formData);
          console.log('Documents uploaded successfully:', response);
        } catch (docErr) {
          console.error('Document upload failed:', docErr);
          // Continue anyway - minutes text was saved
          setError('Minutes saved, but document upload failed. You can try uploading documents later.');
          setTimeout(() => {
            const nextStep = getNextStepConfig(selectedMeeting);
            navigate(nextStep.path);
          }, 2000);
          return;
        }
      }

      const nextStep = getNextStepConfig(selectedMeeting);
      navigate(nextStep.path);
    } catch (err) {
      console.error('Error saving minutes:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        stack: err.stack
      });
      // Special handling for auth failures
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const msg = err?.response?.data?.error || err.message || 'Unknown error';
        setError(`Failed to save minutes: ${msg}`);
      }
    } finally {
      setSavingMinutes(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getMeetingTypeLabel = (type) => {
    const labels = {
      COMMISSIONER_GENERAL_MEETING: 'Commissioner General Meeting',
      TECHNICAL_MEETING: 'Technical Committee Meeting',
      SUBCOMMITTEE_MEETING: 'Subcommittee Meeting',
    };
    return labels[type] || type || '';
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }) : '';
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

  const isFuture = (meeting) => meeting.meetingDate && new Date(meeting.meetingDate) > new Date();

  // ── Meeting card ─────────────────────────────────────────────────────────────
  const renderMeetingCard = (meeting, canTakeMinutes = true) => {
    const mid = meeting.id;
    const inv = invitationStatus[mid];
    const meetingIsInFuture = isFuture(meeting);

    return (
      <div key={mid} className="meeting-card">
        {/* Card header / click area */}
        <div
          className={`meeting-card-clickable ${!canTakeMinutes ? 'disabled-card' : ''}`}
          onClick={() => canTakeMinutes && handleMeetingSelect(meeting)}
          style={{ cursor: canTakeMinutes ? 'pointer' : 'default' }}
        >
          <div className="meeting-card-header">
            <h3>{meeting.title}</h3>
            <span className={`status-badge ${meeting.status?.toLowerCase() || 'unknown'}`}>
              {meeting.status?.replace('_', ' ') || 'UNKNOWN'}
            </span>
          </div>
          <div className="meeting-card-content">
            <div className="meeting-type">{getMeetingTypeLabel(meeting.meetingType)}</div>
            <div className="meeting-details">
              <div className="detail-item">
                <FaCalendar />
                <span>{formatDate(meeting.meetingDate)} at {formatTime(meeting.meetingDate)}</span>
              </div>
              {meeting.location && (
                <div className="detail-item"><FaUsers /><span>{meeting.location}</span></div>
              )}
              {meeting.hostingCountry && (
                <div className="detail-item"><FaUsers /><span>Hosted by {meeting.hostingCountry.name}</span></div>
              )}
            </div>

            {/* Time-gate notice for upcoming */}
            {meetingIsInFuture && canTakeMinutes && (
              <div className="time-gate-notice" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)' }}>
                <FaClock style={{ marginRight: 6 }} />
                Pre-meeting preparation mode active
              </div>
            )}

            {/* Already has minutes */}
            {!canTakeMinutes && meeting.minutes && (
              <div className="minutes-recorded-badge">
                <FaCheckCircle style={{ marginRight: 6 }} />
                Minutes already recorded
              </div>
            )}

            {/* Attendance check indicator */}
            {(meeting.minutesDocument || meeting.minutes) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)',
                padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', marginTop: '6px'
              }}>
                <FaCheckCircle style={{ fontSize: '12px' }} />
                Minutes already available
              </div>
            )}
          </div>
        </div>

        {/* Send Invitations action */}
        <div className="meeting-card-actions" style={{ padding: '0.5rem 1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {!inv || (!inv.sending && !inv.status) ? (
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={(e) => { e.stopPropagation(); handleSendInvitations(meeting); }}
            >
              <FaEnvelope style={{ marginRight: 4 }} /> Send Invitations
            </button>
          ) : inv.sending ? (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}><FaSpinner style={{ marginRight: 4 }} /> Sending…</span>
          ) : inv.status === 'sent' ? (
            <span style={{ fontSize: '0.8rem', color: '#4ade80' }}><FaCheckCircle style={{ marginRight: 4 }} />{inv.message}</span>
          ) : (
            <span style={{ fontSize: '0.8rem', color: '#f87171' }}>
              {inv.message}
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', marginLeft: 8, padding: '0.2rem 0.5rem' }}
                onClick={(e) => { e.stopPropagation(); handleSendInvitations(meeting); }}
              >Retry</button>
            </span>
          )}
        </div>
      </div>
    );
  };

  // ── Step 1: Meeting Selection ─────────────────────────────────────────────────
  const renderMeetingSelection = () => (
    <div className="step-container meeting-selection-step">
      <div className="step-header">
        <h1>Take Minutes</h1>
        <p>Select a meeting to record its minutes</p>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Tab navigation */}
      <div className="meeting-tabs">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <FaFileAlt style={{ marginRight: 6 }} />
          Pending Minutes ({pendingMinutes.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'ongoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('ongoing')}
        >
          <FaCalendar style={{ marginRight: 6 }} />
          Ongoing ({ongoing.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <FaClock style={{ marginRight: 6 }} />
          Upcoming ({upcoming.length})
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading meetings…</p></div>
      ) : activeTab === 'pending' ? (
        pendingMinutes.length === 0 ? (
          <div className="empty-state">
            <FaFileAlt className="empty-icon" />
            <p>No meetings need minutes recorded right now.</p>
            <small>Meetings appear here once their scheduled time has passed.</small>
          </div>
        ) : (
          <div className="meetings-grid">
            {pendingMinutes.map(m => renderMeetingCard(m, true))}
          </div>
        )
      ) : activeTab === 'ongoing' ? (
        ongoing.length === 0 ? (
          <div className="empty-state">
            <FaCalendar className="empty-icon" />
            <p>No ongoing meetings found.</p>
          </div>
        ) : (
          <div className="meetings-grid">
            {ongoing.map(m => renderMeetingCard(m, true))}
          </div>
        )
      ) : (
        upcoming.length === 0 ? (
          <div className="empty-state">
            <FaClock className="empty-icon" />
            <p>No upcoming meetings found.</p>
          </div>
        ) : (
          <div className="meetings-grid">
            {upcoming.map(m => renderMeetingCard(m, true))}
          </div>
        )
      )}
    </div >
  );

  // ── Step 2: Minutes Editor ────────────────────────────────────────────────────
  const renderMinutesStep = () => {
    const meetingIsInFuture = selectedMeeting && isFuture(selectedMeeting);
    const nextStep = getNextStepConfig(selectedMeeting);

    return (
      <div className="step-container minutes-step">
        <div className="step-header">
          <button className="back-button" onClick={goBackToMeetings}>
            <FaArrowLeft /> Back to Meetings
          </button>
          <h1>Meeting Minutes</h1>
          <div className="selected-meeting-info">
            <h2>{selectedMeeting?.title}</h2>
            <p>{formatDate(selectedMeeting?.meetingDate)} at {formatTime(selectedMeeting?.meetingDate)}</p>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {meetingIsInFuture && (
          <div className="preparation-mode-banner">
            <FaClock /> <strong>Preparation Mode:</strong> You are recording minutes for a future meeting. These will be saved as draft content.
          </div>
        )}

        <div className="minutes-form">
          <div className="form-group">
            <label htmlFor="minutes">Minutes Content</label>
            <textarea
              id="minutes"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="Record the meeting minutes here..."
              rows="15"
              disabled={savingMinutes}
            />
          </div>
          <div className="form-group">
            <label htmlFor="minutesDocument">Minutes Documents (optional)</label>
            <input
              id="minutesDocument"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setMinutesDocuments(prev => {
                  const existing = new Set(prev.map(file => `${file.name}-${file.size}-${file.lastModified}`));
                  const uniqueNewFiles = files.filter(file => !existing.has(`${file.name}-${file.size}-${file.lastModified}`));
                  return [...prev, ...uniqueNewFiles];
                });
              }}
              disabled={savingMinutes}
            />
            {minutesDocuments.length > 0 && (
              <div style={{ color: '#94a3b8', display: 'block', marginTop: 6 }}>
                <small style={{ display: 'block', marginBottom: 6 }}>
                  <FaUpload style={{ marginRight: 6 }} />
                  Selected files: {minutesDocuments.length}
                </small>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {minutesDocuments.map(file => (
                    <li key={`${file.name}-${file.size}-${file.lastModified}`} style={{ marginBottom: 4 }}>
                      {file.name}
                      <button
                        type="button"
                        onClick={() => removeSelectedMinutesDocument(file.name)}
                        disabled={savingMinutes}
                        style={{ marginLeft: 8, fontSize: '0.75rem' }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedMeeting && parseMinutesDocumentNames(selectedMeeting.minutesDocument).length > 0 && (
              <div style={{ marginTop: 10 }}>
                <small style={{ color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                  Existing uploaded documents
                </small>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {parseMinutesDocumentNames(selectedMeeting.minutesDocument).map((fileName, index) => (
                    <li key={`${fileName}-${index}`}>
                      <a href={`/files/${fileName}`} target="_blank" rel="noreferrer">
                        {fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button
              onClick={saveMinutes}
              className="btn btn-primary"
              disabled={savingMinutes || (!minutes.trim() && minutesDocuments.length === 0)}
            >
              {savingMinutes ? <FaSpinner className="fa-spin" /> : <FaSave />}
              {savingMinutes ? ' Saving...' : ` ${nextStep.ctaLabel}`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <div className="take-minutes-container">
      {currentStep === 1 && renderMeetingSelection()}
      {currentStep === 2 && renderMinutesStep()}
    </div>
  );
};

export default TakeMinutes;