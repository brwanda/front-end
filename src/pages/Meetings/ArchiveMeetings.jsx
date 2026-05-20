import React, { useState, useEffect } from 'react';
import { FaCalendar, FaSearch, FaFileAlt, FaMapMarkerAlt, FaUsers, FaArchive, FaHistory } from 'react-icons/fa';
import MeetingDetailModal from '../../components/MeetingDetailModal';
import http from '../../services/http';
import './ArchiveMeetings.css';

const ArchiveMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllTime, setShowAllTime] = useState(false);
  const [archiveMode, setArchiveMode] = useState('NEW_ARCHIVES');
  const [countries, setCountries] = useState([]);
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    meetingDate: '',
    meetingEndDate: '',
    meetingType: 'TECHNICAL_MEETING',
    meetingMode: 'PHYSICAL',
    location: '',
    meetingLink: '',
    hostingCountryId: '',
    minutes: '',
    minutesDocuments: [],
  });

  const RECENT_DAYS = 90; // Show last 90 days by default

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  useEffect(() => {
    fetchMeetings();
    fetchCountries();
  }, []);
  useEffect(() => { filterMeetings(); }, [meetings, selectedYear, searchTerm, showAllTime, archiveMode]);

  const fetchCountries = async () => {
    try {
      const { data } = await http.get('/countries');
      setCountries(Array.isArray(data) ? data : []);
      if (!uploadForm.hostingCountryId && currentUser?.country?.id) {
        setUploadForm(prev => ({ ...prev, hostingCountryId: String(currentUser.country.id) }));
      }
    } catch (err) {
      console.error('Error loading countries:', err);
    }
  };

  const fetchMeetings = async () => {
    setLoading(true);
    setError('');
    try {
      let archivedMeetings = [];

      if (currentUser?.id && (currentUser.role === 'SECRETARY'
        || currentUser.role === 'COMMITTEE_SECRETARY'
        || currentUser.role === 'DELEGATION_SECRETARY')) {
        // Use the categorized endpoint — only the archived slice
        try {
          const { data } = await http.get(`/api/meetings/secretary/${currentUser.id}/categorized`);
          archivedMeetings = Array.isArray(data.archived) ? data.archived : [];
        } catch (catErr) {
          console.warn('Categorized endpoint failed, falling back to /archived:', catErr.message);
          const { data } = await http.get('/api/meetings/archived');
          archivedMeetings = Array.isArray(data) ? data : [];
        }
      } else {
        // Use the dedicated archived endpoint that filters by date + status
        const { data } = await http.get('/api/meetings/archived');
        archivedMeetings = Array.isArray(data) ? data : [];
      }

      setMeetings(archivedMeetings);
    } catch (err) {
      console.error('Error fetching archived meetings:', err);
      setError('Failed to load archived meetings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterMeetings = () => {
    let filtered = [...meetings];

    // Apply recency filter if not showing all time
    if (!showAllTime && !selectedYear) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - RECENT_DAYS);
      filtered = filtered.filter(meeting => {
        const meetingDate = new Date(meeting.meetingDate);
        return meetingDate >= cutoffDate;
      });
    }

    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    if (archiveMode === 'OLD_ARCHIVES') {
      filtered = filtered.filter(meeting => new Date(meeting.meetingDate) < fiveYearsAgo);
    }
    if (archiveMode === 'NEW_ARCHIVES') {
      filtered = filtered.filter(meeting => new Date(meeting.meetingDate) >= fiveYearsAgo);
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(meeting => {
        const meetingYear = new Date(meeting.meetingDate).getFullYear().toString();
        return meetingYear === selectedYear;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(meeting =>
        meeting.title.toLowerCase().includes(term) ||
        meeting.description?.toLowerCase().includes(term) ||
        meeting.meetingType.toLowerCase().includes(term) ||
        meeting.location?.toLowerCase().includes(term) ||
        meeting.hostingCountry?.name?.toLowerCase().includes(term)
      );
    }

    setFilteredMeetings(filtered);
  };

  const getAvailableYears = () => {
    const years = new Set();
    meetings.forEach(meeting => {
      const year = new Date(meeting.meetingDate).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  };

  const handleMeetingClick = (meeting) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMeeting(null);
  };

  const getMeetingTypeLabel = (type) => {
    switch (type) {
      case 'COMMISSIONER_GENERAL_MEETING':
        return 'Commissioner General Meeting (CG)';
      case 'TECHNICAL_MEETING':
        return 'Technical Committee Meeting (TC)';
      case 'SUBCOMMITTEE_MEETING':
        return 'Subcommittee Meeting';
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUploadChange = (e) => {
    const { name, value, type, files } = e.target;

    if (name === 'minutesDocuments') {
      const selected = Array.from(files || []);
      setUploadForm(prev => {
        const existing = new Set(prev.minutesDocuments.map(file => `${file.name}-${file.size}-${file.lastModified}`));
        const uniqueNewFiles = selected.filter(file => !existing.has(`${file.name}-${file.size}-${file.lastModified}`));
        return {
          ...prev,
          minutesDocuments: [...prev.minutesDocuments, ...uniqueNewFiles]
        };
      });
      return;
    }

    setUploadForm(prev => ({
      ...prev,
      [name]: type === 'file' ? (files?.[0] || null) : value,
    }));
  };

  const removeSelectedMinutesFile = (fileToRemove) => {
    setUploadForm(prev => ({
      ...prev,
      minutesDocuments: prev.minutesDocuments.filter(file => file !== fileToRemove)
    }));
  };

  const handleArchivedUpload = async (e) => {
    e.preventDefault();
    setError('');
    if (!uploadForm.title.trim()) {
      setError('Archive title is required');
      return;
    }
    if (!uploadForm.meetingDate || !uploadForm.meetingEndDate) {
      setError('Start and end dates are required');
      return;
    }
    if (!uploadForm.hostingCountryId) {
      setError('Hosting country is required');
      return;
    }
    if (uploadForm.meetingMode === 'ONLINE' && !uploadForm.meetingLink.trim()) {
      setError('Meeting link is required for online records');
      return;
    }
    if (uploadForm.meetingMode === 'PHYSICAL' && !uploadForm.location.trim()) {
      setError('Location is required for physical records');
      return;
    }

    setUploadingRecord(true);
    try {
      const payload = {
        title: uploadForm.title,
        description: uploadForm.description,
        meetingDate: `${uploadForm.meetingDate}T00:00:00`,
        meetingEndDate: `${uploadForm.meetingEndDate}T23:59:00`,
        meetingType: uploadForm.meetingType,
        meetingMode: uploadForm.meetingMode,
        location: uploadForm.meetingMode === 'PHYSICAL' ? uploadForm.location : null,
        meetingLink: uploadForm.meetingMode === 'ONLINE' ? uploadForm.meetingLink : null,
        minutes: uploadForm.minutes,
        hostingCountry: { id: uploadForm.hostingCountryId }
      };

      const { data: archivedMeeting } = await http.post('/api/meetings/archived-record', payload);

      if (uploadForm.minutesDocuments.length > 0 && archivedMeeting?.id) {
        const formData = new FormData();
        uploadForm.minutesDocuments.forEach(file => formData.append('minutesDocument', file));
        await http.post(`/api/meetings/${archivedMeeting.id}/minutes-document`, formData);
      }

      setUploadForm({
        title: '',
        description: '',
        meetingDate: '',
        meetingEndDate: '',
        meetingType: 'TECHNICAL_MEETING',
        meetingMode: 'PHYSICAL',
        location: '',
        meetingLink: '',
        hostingCountryId: currentUser?.country?.id ? String(currentUser.country.id) : '',
        minutes: '',
        minutesDocuments: [],
      });

      await fetchMeetings();
      setArchiveMode('NEW_ARCHIVES');
    } catch (err) {
      const msg = err?.response?.data?.error || err.message;
      setError(`Failed to upload archive record: ${msg}`);
    } finally {
      setUploadingRecord(false);
    }
  };

  if (loading) {
    return (
      <div className="archive-meetings-container">
        <div className="loading">Loading archived meetings...</div>
      </div>
    );
  }

  return (
    <div className="archive-meetings-container">
      <div className="archive-meetings-header">
        <h1>Archive Meetings</h1>
        <p>Search and view past meetings by year</p>
      </div>

      <div className="search-filter-section" style={{ marginBottom: 14 }}>
        <div className="year-filter">
          <label htmlFor="archiveMode">Archive View:</label>
          <select
            id="archiveMode"
            value={archiveMode}
            onChange={(e) => setArchiveMode(e.target.value)}
            className="year-select"
          >
            <option value="NEW_ARCHIVES">New Archives (Last 5 years)</option>
            <option value="OLD_ARCHIVES">Old Archives (More than 5 years)</option>
            <option value="UPLOAD_DOCUMENT">Upload Archive Document</option>
          </select>
        </div>
      </div>

      {archiveMode === 'UPLOAD_DOCUMENT' && (
        <form onSubmit={handleArchivedUpload} className="search-filter-section" style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Upload Archived Meeting</h3>
          <input name="title" value={uploadForm.title} onChange={handleUploadChange} placeholder="Meeting title" required />
          <textarea name="description" value={uploadForm.description} onChange={handleUploadChange} placeholder="Description" rows={3} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input type="date" name="meetingDate" value={uploadForm.meetingDate} onChange={handleUploadChange} required />
            <input type="date" name="meetingEndDate" value={uploadForm.meetingEndDate} onChange={handleUploadChange} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select name="meetingType" value={uploadForm.meetingType} onChange={handleUploadChange}>
              <option value="COMMISSIONER_GENERAL_MEETING">Commissioner General Meeting</option>
              <option value="TECHNICAL_MEETING">Technical Meeting</option>
              <option value="SUBCOMMITTEE_MEETING">Subcommittee Meeting</option>
            </select>
            <select name="meetingMode" value={uploadForm.meetingMode} onChange={handleUploadChange}>
              <option value="PHYSICAL">Physical</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>
          {uploadForm.meetingMode === 'PHYSICAL' ? (
            <input name="location" value={uploadForm.location} onChange={handleUploadChange} placeholder="Location" required />
          ) : (
            <input name="meetingLink" value={uploadForm.meetingLink} onChange={handleUploadChange} placeholder="Meeting link" required />
          )}
          <select name="hostingCountryId" value={uploadForm.hostingCountryId} onChange={handleUploadChange} required>
            <option value="">Select hosting country</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <textarea name="minutes" value={uploadForm.minutes} onChange={handleUploadChange} placeholder="Minutes summary (optional)" rows={4} />
          <input type="file" name="minutesDocuments" accept=".pdf,.doc,.docx,.txt" onChange={handleUploadChange} multiple />
          {uploadForm.minutesDocuments.length > 0 && (
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <div style={{ marginBottom: 4 }}>Selected files ({uploadForm.minutesDocuments.length})</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {uploadForm.minutesDocuments.map(file => (
                  <li key={`${file.name}-${file.size}-${file.lastModified}`} style={{ marginBottom: 4 }}>
                    {file.name}
                    <button
                      type="button"
                      onClick={() => removeSelectedMinutesFile(file)}
                      style={{ marginLeft: 8, fontSize: '0.75rem' }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button type="submit" disabled={uploadingRecord} className="year-select" style={{ maxWidth: 220 }}>
            {uploadingRecord ? 'Uploading...' : 'Upload Archived Record'}
          </button>
        </form>
      )}

      {archiveMode !== 'UPLOAD_DOCUMENT' && (
      <div className="search-filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search meetings by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="year-filter">
          <label htmlFor="yearSelect">Filter by Year:</label>
          <select
            id="yearSelect"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="year-select"
          >
            <option value="">All Years</option>
            {getAvailableYears().map(year => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      )}

      {error && <div className="error-message">{error}</div>}

      {archiveMode === 'UPLOAD_DOCUMENT' ? null : (
      <div className="results-summary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <p style={{ margin: 0 }}>
          Showing {filteredMeetings.length} of {meetings.length} archived meetings
          {selectedYear && ` for ${selectedYear}`}
          {searchTerm && ` matching "${searchTerm}"`}
          {!showAllTime && !selectedYear && ` (last ${RECENT_DAYS} days)`}
        </p>
        {!selectedYear && meetings.length > filteredMeetings.length && !showAllTime && (
          <button
            onClick={() => setShowAllTime(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: '1px solid #94a3b8',
              borderRadius: '6px', padding: '6px 14px', fontSize: '13px',
              color: '#475569', cursor: 'pointer', fontWeight: 500
            }}
          >
            <FaHistory /> Show all {meetings.length} meetings
          </button>
        )}
        {showAllTime && !selectedYear && (
          <button
            onClick={() => setShowAllTime(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: '1px solid #94a3b8',
              borderRadius: '6px', padding: '6px 14px', fontSize: '13px',
              color: '#475569', cursor: 'pointer', fontWeight: 500
            }}
          >
            Show recent only
          </button>
        )}
      </div>

      )}

      {archiveMode === 'UPLOAD_DOCUMENT' ? null : (
      <div className="meetings-list">
        {filteredMeetings.length === 0 ? (
          <div className="empty-state">
            <FaCalendar className="empty-icon" />
            <h3>No meetings found</h3>
            <p>
              {selectedYear || searchTerm
                ? 'Try adjusting your search criteria or year filter.'
                : 'No completed meetings found in the archive.'
              }
            </p>
          </div>
        ) : (
          filteredMeetings.map(meeting => (
            <div
              key={meeting.id}
              className="meeting-card clickable"
              onClick={() => handleMeetingClick(meeting)}
            >
              <div className="meeting-header">
                <div className="meeting-type-badge">
                  {getMeetingTypeLabel(meeting.meetingType)}
                </div>
                <div className="meeting-date">
                  <FaCalendar />
                  {formatDate(meeting.meetingDate)} at {formatTime(meeting.meetingDate)}
                </div>
              </div>

              <div className="meeting-content">
                <h3 className="meeting-title">{meeting.title}</h3>

                {meeting.description && (
                  <p className="meeting-description">{meeting.description}</p>
                )}

                <div className="meeting-details">
                  {meeting.location && (
                    <div className="meeting-detail">
                      <FaMapMarkerAlt />
                      <span>{meeting.location}</span>
                    </div>
                  )}

                  {meeting.hostingCountry && (
                    <div className="meeting-detail">
                      <FaUsers />
                      <span>Hosted by {meeting.hostingCountry.name}</span>
                    </div>
                  )}
                </div>

                {meeting.agenda && (
                  <div className="meeting-agenda">
                    <h4>Agenda Items:</h4>
                    <ul>
                      {meeting.agenda.split('\n').filter(item => item.trim()).map((item, index) => (
                        <li key={index}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.minutes && (
                  <div className="meeting-minutes">
                    <h4>Minutes:</h4>
                    <p>{meeting.minutes}</p>
                  </div>
                )}
              </div>

              <div className="meeting-footer">
                <div className="meeting-stats">
                  {meeting.invitations && (
                    <span className="stat">
                      <FaUsers /> {meeting.invitations.length} Invitations
                    </span>
                  )}
                  {meeting.resolutions && (
                    <span className="stat">
                      <FaFileAlt /> {meeting.resolutions.length} Resolutions
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      )}

      {/* Meeting Detail Modal */}
      <MeetingDetailModal
        meeting={selectedMeeting}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default ArchiveMeetings; 