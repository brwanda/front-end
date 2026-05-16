import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaEnvelope, 
  FaCheck, 
  FaTimes, 
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBuilding,
  FaUserTie,
  FaFileAlt
} from 'react-icons/fa';

const QuickTestInterface = () => {
  // Meeting Invitation State
  const [meetings, setMeetings] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [subcommittees, setSubcommittees] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedCommittees, setSelectedCommittees] = useState([]);
  const [selectedSubcommittees, setSelectedSubcommittees] = useState([]);

  // Resolution Assignment State
  const [resolutions, setResolutions] = useState([]);
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [assignments, setAssignments] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState('invitations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all required data
      const [meetingsRes, committeesRes, subcommitteesRes, resolutionsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BASE_URL}/meetings`).catch(() => ({ ok: false })),
        fetch(`${process.env.REACT_APP_BASE_URL}/committees`).catch(() => ({ ok: false })),
        fetch(`${process.env.REACT_APP_BASE_URL}/sub-committees`).catch(() => ({ ok: false })),
        fetch(`${process.env.REACT_APP_BASE_URL}/resolutions`).catch(() => ({ ok: false }))
      ]);

      // Process responses with fallbacks
      const meetingsData = meetingsRes.ok ? await meetingsRes.json() : [];
      const committeesData = committeesRes.ok ? await committeesRes.json() : [];
      const subcommitteesData = subcommitteesRes.ok ? await subcommitteesRes.json() : [];
      const resolutionsData = resolutionsRes.ok ? await resolutionsRes.json() : [];

      setMeetings(meetingsData.filter(m => ['SCHEDULED', 'DRAFT'].includes(m.status)) || []);
      setCommittees(committeesData || []);
      setSubcommittees(subcommitteesData || []);
      setResolutions(resolutionsData.filter(r => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)) || []);

      // Add sample data if APIs are not working
      if (meetingsData.length === 0) {
        setMeetings([
          { id: 1, title: 'Sample Meeting 1', meetingDate: new Date().toISOString(), location: 'Conference Room A', status: 'SCHEDULED' },
          { id: 2, title: 'Sample Meeting 2', meetingDate: new Date(Date.now() + 86400000).toISOString(), location: 'Conference Room B', status: 'DRAFT' }
        ]);
      }

      if (committeesData.length === 0) {
        setCommittees([
          { id: 1, name: 'Technical Committee', description: 'Handles technical matters' },
          { id: 2, name: 'Finance Committee', description: 'Manages financial affairs' },
          { id: 3, name: 'Planning Committee', description: 'Strategic planning and development' }
        ]);
      }

      if (subcommitteesData.length === 0) {
        setSubcommittees([
          { id: 1, name: 'IT Subcommittee', description: 'Information Technology matters' },
          { id: 2, name: 'HR Subcommittee', description: 'Human Resources management' },
          { id: 3, name: 'Research Subcommittee', description: 'Research and development' },
          { id: 4, name: 'Audit Subcommittee', description: 'Internal audit and compliance' }
        ]);
      }

      if (resolutionsData.length === 0) {
        setResolutions([
          { id: 1, title: 'Budget Approval Resolution', description: 'Approve annual budget allocation', status: 'ASSIGNED' },
          { id: 2, title: 'Policy Update Resolution', description: 'Update organizational policies', status: 'IN_PROGRESS' }
        ]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Using sample data for testing.');
      // Set sample data for testing
      setMeetings([
        { id: 1, title: 'Test Meeting 1', meetingDate: new Date().toISOString(), location: 'Room A', status: 'SCHEDULED' }
      ]);
      setCommittees([
        { id: 1, name: 'Test Committee', description: 'Test committee for demo' }
      ]);
      setSubcommittees([
        { id: 1, name: 'Test Subcommittee', description: 'Test subcommittee for demo' }
      ]);
      setResolutions([
        { id: 1, title: 'Test Resolution', description: 'Test resolution for demo', status: 'ASSIGNED' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Meeting Invitation Functions
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

  const handleSendInvitations = async () => {
    if (!selectedMeeting) {
      setError('Please select a meeting first.');
      return;
    }

    if (selectedCommittees.length === 0 && selectedSubcommittees.length === 0) {
      setError('Please select at least one committee or subcommittee.');
      return;
    }

    setLoading(true);
    setError('');

    try {
              const response = await fetch(`${process.env.REACT_APP_BASE_URL}/committee-invitations/send/${selectedMeeting.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          committees: selectedCommittees,
          subcommittees: selectedSubcommittees,
          sendEmail: true
        })
      });

      if (response.ok) {
        await response.json();
        setSuccess(`✅ Invitations sent successfully to ${selectedCommittees.length} committees and ${selectedSubcommittees.length} subcommittees!`);
        setSelectedCommittees([]);
        setSelectedSubcommittees([]);
      } else {
        throw new Error('Failed to send invitations');
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      setError('Failed to send invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resolution Assignment Functions
  const handleResolutionSelect = (resolution) => {
    setSelectedResolution(resolution);
    setAssignments([{ id: Date.now(), subcommitteeId: '', contributionPercentage: 100 }]);
  };

  const addAssignment = () => {
    const totalUsed = assignments.reduce((sum, a) => sum + (a.contributionPercentage || 0), 0);
    const remaining = Math.max(0, 100 - totalUsed);
    
    setAssignments([...assignments, {
      id: Date.now(),
      subcommitteeId: '',
      contributionPercentage: remaining
    }]);
  };

  const updateAssignment = (id, field, value) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id ? { ...assignment, [field]: value } : assignment
      )
    );
  };

  const removeAssignment = (id) => {
    if (assignments.length > 1) {
      setAssignments(prev => prev.filter(a => a.id !== id));
    }
  };

  const getTotalPercentage = () => {
    return assignments.reduce((sum, assignment) => sum + (parseInt(assignment.contributionPercentage) || 0), 0);
  };

  const handleAssignResolution = async () => {
    if (!selectedResolution) {
      setError('Please select a resolution first.');
      return;
    }

    const totalPercentage = getTotalPercentage();
    if (totalPercentage !== 100) {
      setError(`Total percentage must equal 100%. Current total: ${totalPercentage}%`);
      return;
    }

    const validAssignments = assignments.filter(a => a.subcommitteeId && a.contributionPercentage > 0);
    if (validAssignments.length === 0) {
      setError('Please assign at least one subcommittee with a valid percentage.');
      return;
    }

    setLoading(true);
    setError('');

    try {
              const response = await fetch(`${process.env.REACT_APP_BASE_URL}/resolutions/${selectedResolution.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: validAssignments })
      });

      if (response.ok) {
        setSuccess(`✅ Resolution assigned successfully to ${validAssignments.length} subcommittees!`);
        setAssignments([{ id: Date.now(), subcommitteeId: '', contributionPercentage: 100 }]);
      } else {
        throw new Error('Failed to assign resolution');
      }
    } catch (error) {
      console.error('Error assigning resolution:', error);
      setError('Failed to assign resolution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && meetings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading Secretary Interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Secretary Test Interface</h1>
          <p className="text-gray-600">Test committee/subcommittee selection and task assignment functionality</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              activeTab === 'invitations' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <FaEnvelope className={`text-lg ${activeTab === 'invitations' ? 'text-white' : 'text-blue-600'}`} />
            Meeting Invitations
          </button>
          <button
            onClick={() => setActiveTab('resolutions')}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              activeTab === 'resolutions' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <FaFileAlt className={`text-lg ${activeTab === 'resolutions' ? 'text-white' : 'text-blue-600'}`} />
            Task Assignment
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaCheckCircle />
            <span>{success}</span>
          </div>
        )}

        {/* Meeting Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Send Meeting Invitations</h2>
              <p className="text-gray-600">Select committees and subcommittees to invite to your meeting</p>
            </div>
            <div className="p-6">
            
            {/* Meeting Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Meeting</label>
              <select
                value={selectedMeeting?.id || ''}
                onChange={(e) => {
                  const meeting = meetings.find(m => m.id === parseInt(e.target.value));
                  setSelectedMeeting(meeting || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">Choose a meeting...</option>
                {meetings.map(meeting => (
                  <option key={meeting.id} value={meeting.id}>
                    {meeting.title} - {new Date(meeting.meetingDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedMeeting && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Committees */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FaBuilding className="text-blue-600" />
                    Committees ({committees.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {committees.map(committee => (
                      <div
                        key={committee.id}
                        className={`border rounded-lg p-3 cursor-pointer ${
                          selectedCommittees.includes(committee.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleCommitteeToggle(committee.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedCommittees.includes(committee.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedCommittees.includes(committee.id) && (
                              <FaCheck className="text-white text-xs" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{committee.name}</h4>
                            <p className="text-sm text-gray-600">{committee.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subcommittees */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FaUserTie className="text-green-600" />
                    Subcommittees ({subcommittees.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {subcommittees.map(subcommittee => (
                      <div
                        key={subcommittee.id}
                        className={`border rounded-lg p-3 cursor-pointer ${
                          selectedSubcommittees.includes(subcommittee.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSubcommitteeToggle(subcommittee.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedSubcommittees.includes(subcommittee.id)
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedSubcommittees.includes(subcommittee.id) && (
                              <FaCheck className="text-white text-xs" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{subcommittee.name}</h4>
                            <p className="text-sm text-gray-600">{subcommittee.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

                          {/* Send Button */}
            {selectedMeeting && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Selected: <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{selectedCommittees.length} committees</span>, <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">{selectedSubcommittees.length} subcommittees</span>
                  </div>
                  <button
                    onClick={handleSendInvitations}
                    disabled={loading || (selectedCommittees.length === 0 && selectedSubcommittees.length === 0)}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                      loading ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                    } ${(selectedCommittees.length === 0 && selectedSubcommittees.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaEnvelope />}
                    Send Invitations
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Resolution Assignment Tab */}
        {activeTab === 'resolutions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Assign Tasks to Subcommittees</h2>
              <p className="text-gray-600">Distribute resolution tasks with contribution percentages</p>
            </div>
            <div className="p-6">
            
            {/* Resolution Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Resolution</label>
              <select
                value={selectedResolution?.id || ''}
                onChange={(e) => {
                  const resolution = resolutions.find(r => r.id === parseInt(e.target.value));
                  handleResolutionSelect(resolution || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">Choose a resolution...</option>
                {resolutions.map(resolution => (
                  <option key={resolution.id} value={resolution.id}>
                    {resolution.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedResolution && (
              <div>
                {/* Percentage Summary */}
                <div className={`mb-6 p-4 rounded-lg border-2 ${
                  getTotalPercentage() === 100 
                    ? 'bg-green-50 border-green-300 text-green-800' 
                    : getTotalPercentage() > 100
                    ? 'bg-red-50 border-red-300 text-red-800'
                    : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Total Assignment:</span>
                    <span className={`text-2xl font-bold px-3 py-1 rounded-full ${
                      getTotalPercentage() === 100 ? 'bg-green-200 text-green-900' : 
                      getTotalPercentage() > 100 ? 'bg-red-200 text-red-900' : 'bg-yellow-200 text-yellow-900'
                    }`}>
                      {getTotalPercentage()}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        getTotalPercentage() === 100 ? 'bg-green-500' :
                        getTotalPercentage() > 100 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(getTotalPercentage(), 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Assignments */}
                <div className="space-y-4 mb-6">
                  {assignments.map((assignment, index) => (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg bg-white">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-semibold text-gray-900">Assignment {index + 1}</h4>
                          {assignments.length > 1 && (
                            <button
                              onClick={() => removeAssignment(assignment.id)}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                            >
                              <FaTimes />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Subcommittee</label>
                          <select
                            value={assignment.subcommitteeId}
                            onChange={(e) => updateAssignment(assignment.id, 'subcommitteeId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          >
                            <option value="">Select subcommittee...</option>
                            {subcommittees.map(sub => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contribution %</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={assignment.contributionPercentage}
                            onChange={(e) => updateAssignment(assignment.id, 'contributionPercentage', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            placeholder="Enter percentage"
                          />
                        </div>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={addAssignment}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <FaUsers />
                      Add Subcommittee
                    </button>
                    
                    <button
                      onClick={handleAssignResolution}
                      disabled={loading || getTotalPercentage() !== 100}
                      className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                        loading || getTotalPercentage() !== 100 
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {loading ? <FaSpinner className="animate-spin" /> : <FaFileAlt />}
                      Assign Tasks
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickTestInterface;