import React, { useState, useEffect } from 'react';
import { FaCalendar, FaEdit, FaTrash, FaPlus, FaMapMarkerAlt, FaUsers, FaEye, FaPlay, FaStop, FaCheck, FaSpinner } from 'react-icons/fa';
import http from '../services/http';

const MeetingList = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Mock current user - replace with actual auth service
  const currentUser = { role: 'SECRETARY', country: { id: 1, name: 'Kenya' } };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data } = await http.get('/meetings');
      setMeetings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await http.del(`/meetings/${id}`);
        setMeetings(meetings.filter(meeting => meeting.id !== id));
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('Failed to delete meeting. Please try again.');
      }
    }
  };

  const handleStatusChange = async (meetingId, newStatus) => {
    try {
      await http.put(`/meetings/${meetingId}/status`, { status: newStatus });
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
        return <FaCalendar className="status-icon text-blue-500" />;
      case 'IN_PROGRESS':
        return <FaPlay className="status-icon text-yellow-500" />;
      case 'COMPLETED':
        return <FaCheck className="status-icon text-green-500" />;
      case 'CANCELLED':
        return <FaStop className="status-icon text-red-500" />;
      default:
        return <FaCalendar className="status-icon text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'SCHEDULED': '#3b82f6',    
      'IN_PROGRESS': '#f59e0b',  
      'COMPLETED': '#10b981',    
      'CANCELLED': '#ef4444'     
    };
    return colors[status] || '#6b7280';
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

  const canManageMeeting = (meeting) => {
    // Only secretaries can manage meetings, and only in their country
    if (currentUser?.role !== 'SECRETARY') return false;
    return currentUser.country?.id === meeting.hostingCountry?.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading meetings...</p>
        </div>
      </div>
    );
  }

  const filteredMeetings = getFilteredMeetings();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FaCalendar className="text-blue-600" />
                Meetings
              </h1>
              <p className="mt-2 text-gray-600">Manage meetings and their details</p>
            </div>
            {currentUser?.role === 'SECRETARY' && (
              <button
                onClick={() => window.location.href = '/meetings/new'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FaPlus />
                New Meeting
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All', count: meetings.length },
              { key: 'scheduled', label: 'Scheduled', count: meetings.filter(m => m.status === 'SCHEDULED').length },
              { key: 'in_progress', label: 'In Progress', count: meetings.filter(m => m.status === 'IN_PROGRESS').length },
              { key: 'completed', label: 'Completed', count: meetings.filter(m => m.status === 'COMPLETED').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FaCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Meetings Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'all' 
                ? 'Start by creating your first meeting.'
                : `No ${activeTab.replace('_', ' ')} meetings found.`
              }
            </p>
            {currentUser?.role === 'SECRETARY' && activeTab === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/meetings/new'}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FaPlus className="mr-2" />
                  Create First Meeting
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredMeetings.map(meeting => (
              <div key={meeting.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  {/* Meeting Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(meeting.status)}
                      <span
                        className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: getStatusColor(meeting.status) }}
                      >
                        {meeting.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Meeting Info */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {meeting.title}
                  </h3>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    {getMeetingTypeLabel(meeting.meetingType)}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FaCalendar className="text-gray-400" />
                      <span>{formatDate(meeting.meetingDate)} at {formatTime(meeting.meetingDate)}</span>
                    </div>
                    
                    {meeting.location && (
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-400" />
                        <span>{meeting.location}</span>
                      </div>
                    )}
                    
                    {meeting.hostingCountry && (
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-gray-400" />
                        <span>Hosted by {meeting.hostingCountry.name}</span>
                      </div>
                    )}
                  </div>

                  {meeting.description && (
                    <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                      {meeting.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        <FaEye className="inline mr-1" />
                        View
                      </button>
                      
                      {canManageMeeting(meeting) && (
                        <>
                          <button
                            onClick={() => window.location.href = `/meetings/${meeting.id}/edit`}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            <FaEdit className="inline mr-1" />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleDelete(meeting.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            <FaTrash className="inline mr-1" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>

                    {/* Status Change Buttons */}
                    {canManageMeeting(meeting) && (
                      <div className="flex space-x-2">
                        {meeting.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleStatusChange(meeting.id, 'IN_PROGRESS')}
                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                          >
                            Start
                          </button>
                        )}
                        
                        {meeting.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleStatusChange(meeting.id, 'COMPLETED')}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingList;