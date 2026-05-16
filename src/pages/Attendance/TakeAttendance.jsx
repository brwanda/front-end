import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers, FaCalendar, FaSave, FaArrowLeft,
  FaCheckCircle, FaSpinner, FaClock, FaCheck,
  FaTimes, FaExclamationTriangle, FaUserCheck,
  FaClipboardList
} from 'react-icons/fa';
import http from '../../services/http';
import './TakeAttendance.css';

const TakeAttendance = () => {
  const navigate = useNavigate();

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  // Steps: 1 = select meeting, 2 = mark attendance
  const [currentStep, setCurrentStep] = useState(1);

  // Meeting data
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Members & attendance
  const [members, setMembers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => { fetchMeetings(); }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      if (!currentUser?.id) throw new Error('User not authenticated');
      const { data } = await http.get(`/meetings/secretary/${currentUser.id}/categorized`);

      // Keep attendance independent from minutes by including completed/archived meetings too.
      const pending = Array.isArray(data.pendingMinutes) ? data.pendingMinutes : [];
      const upcoming = Array.isArray(data.upcoming) ? data.upcoming : [];
      const ongoing = Array.isArray(data.ongoing) ? data.ongoing : [];
      const archived = Array.isArray(data.archived) ? data.archived : [];
      const allScopedMeetings = [...pending, ...upcoming, ...ongoing, ...archived];
      const uniqueMeetings = Array.from(new Map(allScopedMeetings.map(m => [m.id, m])).values());
      setMeetings(uniqueMeetings);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError(`Failed to load meetings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingSelect = async (meeting) => {
    setSelectedMeeting(meeting);
    setCurrentStep(2);
    setError('');
    setSuccessMessage('');
    setLoadingMembers(true);

    try {
      // Fetch existing attendance for this meeting
      let existingRecords = [];
      try {
        const { data: attData } = await http.get(`/attendance/meeting/${meeting.id}`);
        existingRecords = Array.isArray(attData) ? attData : [];
        setExistingAttendance(existingRecords);
      } catch (e) {
        console.warn('Could not fetch existing attendance:', e);
      }

      // Fetch members from the meeting's committee/subcommittee
      let memberList = [];

      // Try to get members from subcommittee first
      if (meeting.subCommittee?.id) {
        try {
          const { data: subMembers } = await http.get(`/country-committee-members/sub-committee/${meeting.subCommittee.id}`);
          if (Array.isArray(subMembers) && subMembers.length > 0) {
            memberList = subMembers;
          }
        } catch (e) {
          console.warn('Could not fetch subcommittee members:', e);
        }
      }

      // If no subcommittee members, try committee members
      if (memberList.length === 0 && meeting.committee?.id) {
        try {
          const { data: comMembers } = await http.get(`/country-committee-members/country/${meeting.committee?.id}`);
          if (Array.isArray(comMembers)) {
            memberList = comMembers;
          }
        } catch (e) {
          console.warn('Could not fetch committee members:', e);
        }
      }

      // Fallback: try all members
      if (memberList.length === 0) {
        try {
          const { data: allMembers } = await http.get(`/country-committee-members/all`);
          if (Array.isArray(allMembers)) {
            memberList = allMembers;
          }
        } catch (e) {
          console.warn('Could not fetch all members:', e);
        }
      }

      setMembers(memberList);

      // Initialize attendance records from existing data or default to PRESENT
      // Use member.id (CSubCommitteeMembers ID) as the key
      // Match existing attendance by member email → user email
      const records = {};
      memberList.forEach(member => {
        const memberId = member.id;
        const memberEmail = (member.email || '').toLowerCase();
        const existing = existingRecords.find(a =>
          a.user?.email?.toLowerCase() === memberEmail
        );
        records[memberId] = {
          status: existing ? existing.status : 'PRESENT',
          notes: existing ? (existing.notes || '') : '',
          existingId: existing ? existing.id : null
        };
      });
      setAttendanceRecords(records);

    } catch (err) {
      console.error('Error loading meeting data:', err);
      setError(`Failed to load meeting data: ${err.message}`);
    } finally {
      setLoadingMembers(false);
    }
  };

  const goBackToMeetings = () => {
    setCurrentStep(1);
    setSelectedMeeting(null);
    setMembers([]);
    setAttendanceRecords({});
    setExistingAttendance([]);
    setError('');
    setSuccessMessage('');
  };

  const updateAttendanceStatus = (userId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [userId]: { ...prev[userId], status }
    }));
  };

  const updateAttendanceNotes = (userId, notes) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [userId]: { ...prev[userId], notes }
    }));
  };

  const markAllAs = (status) => {
    const updated = {};
    members.forEach(member => {
      const memberId = member.id;
      updated[memberId] = { ...attendanceRecords[memberId], status };
    });
    setAttendanceRecords(updated);
  };

  const saveAttendance = async () => {
    if (!selectedMeeting) { setError('Please select a meeting first'); return; }
    if (members.length === 0) { setError('No members to record attendance for'); return; }

    setSavingAttendance(true);
    setError('');
    setSuccessMessage('');

    try {
      // If there are existing records, delete them first
      if (existingAttendance.length > 0) {
        for (const existing of existingAttendance) {
          try {
            await http.delete(`/attendance/${existing.id}`);
          } catch (e) {
            console.warn('Could not delete existing attendance record:', e);
          }
        }
      }

      // Build records using CSubCommitteeMembers IDs — backend resolves to Users
      const records = members.map(member => {
        const memberId = member.id;
        const record = attendanceRecords[memberId] || { status: 'PRESENT', notes: '' };
        return {
          memberId: memberId,
          status: record.status,
          notes: record.notes || ''
        };
      });

      const { data } = await http.post('/attendance/bulk-by-members', {
        meetingId: selectedMeeting.id,
        recordedById: currentUser.id,
        records: records
      });

      const savedList = data?.attendance || data;
      const savedCount = data?.savedCount || (Array.isArray(savedList) ? savedList.length : 0);

      if (savedCount > 0) {
        setExistingAttendance(Array.isArray(savedList) ? savedList : []);
        let msg = `✅ Attendance recorded successfully for ${savedCount} member${savedCount !== 1 ? 's' : ''}!`;
        if (data?.warnings?.length > 0) {
          msg += ` (${data.warnings.length} skipped — no matching user account)`;
        }
        setSuccessMessage(msg);
      } else {
        const errMsg = data?.error || 'No attendance records could be saved';
        throw new Error(errMsg);
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      const msg = err?.response?.data?.error || err.message || 'Unknown error';
      setError(`Failed to save attendance: ${msg}`);
    } finally {
      setSavingAttendance(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PRESENT': return <FaCheck style={{ color: '#4caf50' }} />;
      case 'ABSENT': return <FaTimes style={{ color: '#f44336' }} />;
      case 'LATE': return <FaClock style={{ color: '#ff9800' }} />;
      case 'EXCUSED': return <FaExclamationTriangle style={{ color: '#2196f3' }} />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return '#4caf50';
      case 'ABSENT': return '#f44336';
      case 'LATE': return '#ff9800';
      case 'EXCUSED': return '#2196f3';
      default: return '#999';
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) : '';

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  }) : '';

  const getAttendanceSummary = () => {
    const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    Object.values(attendanceRecords).forEach(r => {
      if (summary[r.status] !== undefined) summary[r.status]++;
    });
    return summary;
  };

  // ── Render Meeting Card ─────────────────────────────────────
  const renderMeetingCard = (meeting) => {
    const hasAttendance = existingAttendance.some(a =>
      meeting.id === selectedMeeting?.id
    );

    return (
      <div
        key={meeting.id}
        className="attendance-meeting-card"
        onClick={() => handleMeetingSelect(meeting)}
      >
        <div className="meeting-card-header">
          <FaCalendar className="meeting-icon" />
          <div className="meeting-info">
            <h3>{meeting.title || 'Untitled Meeting'}</h3>
            <p className="meeting-type">
              {meeting.meetingType?.replace(/_/g, ' ') || 'Meeting'}
            </p>
          </div>
        </div>
        <div className="meeting-card-details">
          <span className="meeting-date">
            <FaClock /> {formatDate(meeting.meetingDate)}
          </span>
          {meeting.meetingDate && (
            <span className="meeting-time">{formatTime(meeting.meetingDate)}</span>
          )}
        </div>
        {meeting.committee && (
          <span className="meeting-committee">{meeting.committee.name}</span>
        )}
        {meeting.subCommittee && (
          <span className="meeting-subcommittee">{meeting.subCommittee.name}</span>
        )}
      </div>
    );
  };

  // ── Step 1: Select Meeting ──────────────────────────────────
  const renderMeetingSelection = () => (
    <div className="attendance-step attendance-step-1">
      <div className="step-header">
        <div className="step-indicator">
          <div className="step-number active">1</div>
          <span>Select Meeting</span>
          <div className="step-line"></div>
          <div className="step-number">2</div>
          <span>Mark Attendance</span>
        </div>
      </div>

      <h2><FaClipboardList /> Select a Meeting to Take Attendance</h2>

      {loading ? (
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Loading meetings...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="no-meetings">
          <FaCalendar className="empty-icon" />
          <p>No meetings available for attendance.</p>
        </div>
      ) : (
        <div className="meetings-grid">
          {meetings.map(m => renderMeetingCard(m))}
        </div>
      )}
    </div>
  );

  // ── Step 2: Mark Attendance ─────────────────────────────────
  const renderAttendanceStep = () => {
    const summary = getAttendanceSummary();

    return (
      <div className="attendance-step attendance-step-2">
        <div className="step-header">
          <div className="step-indicator">
            <div className="step-number completed"><FaCheckCircle /></div>
            <span>Select Meeting</span>
            <div className="step-line active"></div>
            <div className="step-number active">2</div>
            <span>Mark Attendance</span>
          </div>
        </div>

        <button className="btn-back" onClick={goBackToMeetings}>
          <FaArrowLeft /> Back to Meetings
        </button>

        {/* Meeting Info Banner */}
        <div className="meeting-info-banner">
          <h2>{selectedMeeting?.title || 'Meeting'}</h2>
          <div className="meeting-meta">
            <span><FaCalendar /> {formatDate(selectedMeeting?.meetingDate)}</span>
            <span><FaClock /> {formatTime(selectedMeeting?.meetingDate)}</span>
            {selectedMeeting?.committee && (
              <span><FaUsers /> {selectedMeeting.committee.name}</span>
            )}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="attendance-summary-bar">
          <div className="summary-item present">
            <FaCheck /> Present: {summary.PRESENT}
          </div>
          <div className="summary-item absent">
            <FaTimes /> Absent: {summary.ABSENT}
          </div>
          <div className="summary-item late">
            <FaClock /> Late: {summary.LATE}
          </div>
          <div className="summary-item excused">
            <FaExclamationTriangle /> Excused: {summary.EXCUSED}
          </div>
          <div className="summary-item total">
            <FaUsers /> Total: {members.length}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-mark-actions">
          <span>Quick mark all as:</span>
          <button className="btn-quick present" onClick={() => markAllAs('PRESENT')}>All Present</button>
          <button className="btn-quick absent" onClick={() => markAllAs('ABSENT')}>All Absent</button>
        </div>

        {/* Members List */}
        {loadingMembers ? (
          <div className="loading-container">
            <FaSpinner className="spinner" />
            <p>Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="no-members">
            <FaUsers className="empty-icon" />
            <p>No members found for this meeting's committee/subcommittee.</p>
            <p className="hint">You can still save attendance if members are added later.</p>
          </div>
        ) : (
          <div className="members-attendance-list">
            {members.map((member, idx) => {
              const memberId = member.id;
              const record = attendanceRecords[memberId] || { status: 'PRESENT', notes: '' };
              // CSubCommitteeMembers has 'name' directly, not user.firstName/lastName
              const memberName = member.name || member.email || `Member ${memberId}`;
              const memberRole = member.positionInYourRA || member.userRole || '';

              return (
                <div key={memberId} className={`member-attendance-row ${record.status.toLowerCase()}`}>
                  <div className="member-info">
                    <div className="member-avatar">
                      {memberName.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-details">
                      <span className="member-name">{memberName}</span>
                      {memberRole && <span className="member-role">{memberRole}</span>}
                      {member.country?.name && (
                        <span className="member-country">{member.country.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="attendance-controls">
                    {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map(status => (
                      <button
                        key={status}
                        className={`btn-status ${status.toLowerCase()} ${record.status === status ? 'active' : ''}`}
                        onClick={() => updateAttendanceStatus(memberId, status)}
                        title={status}
                      >
                        {getStatusIcon(status)}
                        <span className="status-label">{status}</span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    className="attendance-notes"
                    placeholder="Notes (optional)"
                    value={record.notes}
                    onChange={(e) => updateAttendanceNotes(memberId, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Error / Success Messages */}
        {error && <div className="attendance-error"><FaTimes /> {error}</div>}
        {successMessage && <div className="attendance-success"><FaCheckCircle /> {successMessage}</div>}

        {/* Save Button */}
        <div className="attendance-actions">
          <button
            className="btn-save-attendance"
            onClick={saveAttendance}
            disabled={savingAttendance || members.length === 0}
          >
            {savingAttendance ? (
              <><FaSpinner className="spinner" /> Saving...</>
            ) : (
              <><FaSave /> Save Attendance</>
            )}
          </button>

          {existingAttendance.length > 0 && (
            <button
              className="btn-proceed-minutes"
              onClick={() => navigate('/minutes/take')}
            >
              <FaCheckCircle /> Proceed to Take Minutes
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Main Render ─────────────────────────────────────────────
  return (
    <div className="take-attendance-container">
      <div className="page-header">
        <FaUserCheck className="header-icon" />
        <h1>Take Attendance</h1>
      </div>

      {currentStep === 1 && renderMeetingSelection()}
      {currentStep === 2 && renderAttendanceStep()}
    </div>
  );
};

export default TakeAttendance;
