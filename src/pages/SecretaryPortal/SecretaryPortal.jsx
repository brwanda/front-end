import React, { useState, useEffect } from 'react';
import { 
  FaCalendar, 
  FaFileAlt, 
  FaUsers, 
  FaEnvelope,
  FaPlus,
  FaTasks,
  FaChartBar,
  FaBell,
  FaSearch,
  FaFilter,
  FaRoute,
  FaExclamationCircle
} from 'react-icons/fa';
import EnhancedMeetingInvitations from '../Meetings/EnhancedMeetingInvitations';
import EnhancedResolutionWorkflow from '../Resolutions/EnhancedResolutionWorkflow';

const SecretaryPortal = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [meetings, setMeetings] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showResolutionWorkflow, setShowResolutionWorkflow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [meetingsRes, resolutionsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BASE_URL}/meetings`, { credentials: 'include' }),
        fetch(`${process.env.REACT_APP_BASE_URL}/resolutions`, { credentials: 'include' })
      ]);

      if (meetingsRes.ok && resolutionsRes.ok) {
        const [meetingsData, resolutionsData] = await Promise.all([
          meetingsRes.json(),
          resolutionsRes.json()
        ]);
        
        // Filter recent meetings
        setMeetings(meetingsData.slice(0, 5));
        setResolutions(resolutionsData.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitations = (meeting) => {
    setSelectedMeeting(meeting);
    setShowInvitationModal(true);
  };

  const stats = {
    totalMeetings: meetings.length,
    pendingInvitations: meetings.filter(m => m.status === 'SCHEDULED').length,
    activeResolutions: resolutions.filter(r => r.status === 'IN_PROGRESS').length,
    completedTasks: resolutions.filter(r => r.status === 'COMPLETED').length
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'ASSIGNED': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Secretary Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Secretary Portal</h1>
              <p className="text-gray-600">Manage meetings, invitations, and resolution assignments</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <FaBell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: FaChartBar },
              { id: 'meetings', name: 'Meeting Invitations', icon: FaCalendar },
              { id: 'resolutions', name: 'Resolution Assignment', icon: FaFileAlt }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaCalendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalMeetings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaEnvelope className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Invitations</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pendingInvitations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaTasks className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Resolutions</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeResolutions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaFileAlt className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.completedTasks}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('meetings')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="text-center">
                      <FaEnvelope className="mx-auto h-8 w-8 text-gray-400 group-hover:text-blue-500" />
                      <span className="mt-2 block text-sm font-medium text-gray-900">Send Meeting Invitations</span>
                      <span className="block text-xs text-gray-500">Select committees and subcommittees</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('resolutions')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                  >
                    <div className="text-center">
                      <FaFileAlt className="mx-auto h-8 w-8 text-gray-400 group-hover:text-purple-500" />
                      <span className="mt-2 block text-sm font-medium text-gray-900">Assign Resolution</span>
                      <span className="block text-xs text-gray-500">Set contribution percentages</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Meetings */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Meetings</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{meeting.title}</h3>
                          <p className="text-sm text-gray-500">{formatDate(meeting.meetingDate)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                          </span>
                          {meeting.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleSendInvitations(meeting)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Send Invitations
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Resolutions */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Resolutions</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {resolutions.map((resolution) => (
                    <div key={resolution.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{resolution.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{resolution.description}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(resolution.status)}`}>
                          {resolution.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Meeting Invitation Management</h2>
                <p className="text-sm text-gray-600">Select committees and subcommittees to invite to meetings</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                          <p className="text-sm text-gray-500">{formatDate(meeting.meetingDate)}</p>
                          <p className="text-sm text-gray-600">{meeting.location}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                          </span>
                          <button
                            onClick={() => handleSendInvitations(meeting)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <FaEnvelope />
                            Send Invitations
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resolutions' && (
          <div>
            <EnhancedResolutionWorkflow />
          </div>
        )}
      </div>

      {/* Meeting Invitation Modal */}
      {showInvitationModal && selectedMeeting && (
        <EnhancedMeetingInvitations
          meetingId={selectedMeeting.id}
          meetingTitle={selectedMeeting.title}
          onClose={() => {
            setShowInvitationModal(false);
            setSelectedMeeting(null);
          }}
        />
      )}
    </div>
  );
};

export default SecretaryPortal;