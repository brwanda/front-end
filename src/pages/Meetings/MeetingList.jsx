import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMeetings, deleteMeeting, changeMeetingStatus } from '../../services/meetingService';
import { FaCalendar, FaEdit, FaTrash, FaPlus, FaMapMarkerAlt, FaUsers, FaEye, FaPlay, FaStop, FaCheck } from 'react-icons/fa';
import './Meetings.css';

const MeetingList = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await getMeetings();
        setMeetings(data);
      } catch (error) {
        console.error('Error fetching meetings:', error);
        setError('Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await deleteMeeting(id);
        setMeetings(meetings.filter(meeting => meeting.id !== id));
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('Failed to delete meeting. Please try again.');
      }
    }
  };

  const handleStatusChange = async (meetingId, newStatus) => {
    try {
      await changeMeetingStatus(meetingId, newStatus);
      setMeetings(meetings.map(meeting => 
        meeting.id === meetingId 
          ? { ...meeting, status: newStatus }
          : meeting
      ));
    } catch (error) {
      console.error('Error changing meeting status:', error);
      alert('Failed to change meeting status. Please try again.');
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
        return type;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <FaCalendar className="status-icon scheduled" />;
      case 'IN_PROGRESS':
        return <FaPlay className="status-icon in-progress" />;
      case 'COMPLETED':
        return <FaCheck className="status-icon completed" />;
      case 'CANCELLED':
        return <FaStop className="status-icon cancelled" />;
      default:
        return <FaCalendar className="status-icon" />;
    }
  };

  const getFilteredMeetings = () => {
    switch (activeTab) {
      case 'scheduled':
        return meetings.filter(meeting => meeting.status === 'SCHEDULED');
      case 'in_progress':
        return meetings.filter(meeting => meeting.status === 'IN_PROGRESS');
      case 'completed':
        return meetings.filter(meeting => meeting.status === 'COMPLETED');
      case 'cancelled':
        return meetings.filter(meeting => meeting.status === 'CANCELLED');
      default:
        return meetings;
    }
  };

  const getTotalCount = () => {
    const filtered = getFilteredMeetings();
    return filtered.length;
  };

  if (loading) {
    return (
      <div className="meeting-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading meetings...</p>
        </div>
      </div>
    );
  }

  const filteredMeetings = getFilteredMeetings();
  const totalCount = getTotalCount();

  return (
    <div className="meeting-container">
      <div className="header">
        <div className="header-content">
          <h2 className="page-title">
            <FaCalendar className="title-icon" />
            Meetings
          </h2>
          <p className="page-subtitle">Manage meetings and their details</p>
        </div>
        <Link to="/meetings/new" className="btn btn-primary">
          <FaPlus className="btn-icon" />
          New Meeting
        </Link>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({meetings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Scheduled ({meetings.filter(m => m.status === 'SCHEDULED').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'in_progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('in_progress')}
        >
          In Progress ({meetings.filter(m => m.status === 'IN_PROGRESS').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({meetings.filter(m => m.status === 'COMPLETED').length})
        </button>
      </div>

      {totalCount === 0 ? (
        <div className="empty-state">
          <FaCalendar className="empty-icon" />
          <h3>No Meetings Found</h3>
          <p>Start by creating your first meeting.</p>
          <Link to="/meetings/new" className="btn btn-primary">
            <FaPlus className="btn-icon" />
            Create First Meeting
          </Link>
        </div>
      ) : (
        <>
          <div className="results-header">
            <span className="results-count">
              {totalCount} {totalCount === 1 ? 'Meeting' : 'Meetings'} Found
            </span>
          </div>

          <div className="meetings-grid">
            {filteredMeetings.map(meeting => (
              <div key={meeting.id} className="meeting-card">
                <div className="card-header">
                  <div className="meeting-info">
                    <div className="meeting-title-row">
                      <h3 className="meeting-name">
                        <FaCalendar className="meeting-icon" />
                        {meeting.title}
                      </h3>
                      <div className="meeting-status">
                        {getStatusIcon(meeting.status)}
                        <span className={`status-badge ${meeting.status.toLowerCase()}`}>
                          {meeting.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="meeting-type">
                      {getMeetingTypeLabel(meeting.meetingType)}
                    </div>
                    
                    <div className="meeting-details">
                      <div className="meeting-date">
                        <FaCalendar className="detail-icon" />
                        <span>{formatDate(meeting.meetingDate)} at {formatTime(meeting.meetingDate)}</span>
                      </div>
                      
                      {meeting.location && (
                        <div className="meeting-location">
                          <FaMapMarkerAlt className="detail-icon" />
                          <span>{meeting.location}</span>
                        </div>
                      )}
                      
                      {meeting.hostingCountry && (
                        <div className="meeting-host">
                          <FaUsers className="detail-icon" />
                          <span>Hosted by {meeting.hostingCountry.name}</span>
                        </div>
                      )}
                    </div>

                    {meeting.description && (
                      <div className="meeting-description">
                        {meeting.description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-actions">
                  <Link
                    to={`/meetings/${meeting.id}`}
                    className="btn btn-view"
                    title="View Meeting Details"
                  >
                    <FaEye />
                    <span>View</span>
                  </Link>
                  
                  <Link
                    to={`/meetings/${meeting.id}/edit`}
                    className="btn btn-edit"
                    title="Edit Meeting"
                  >
                    <FaEdit />
                    <span>Edit</span>
                  </Link>
                  
                  {meeting.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleStatusChange(meeting.id, 'IN_PROGRESS')}
                      className="btn btn-start"
                      title="Start Meeting"
                    >
                      <FaPlay />
                      <span>Start</span>
                    </button>
                  )}
                  
                  {meeting.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleStatusChange(meeting.id, 'COMPLETED')}
                      className="btn btn-complete"
                      title="Complete Meeting"
                    >
                      <FaCheck />
                      <span>Complete</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(meeting.id)}
                    className="btn btn-delete"
                    title="Delete Meeting"
                  >
                    <FaTrash />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MeetingList;