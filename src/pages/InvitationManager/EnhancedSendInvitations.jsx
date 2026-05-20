import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaUsers, FaCalendar, FaCheck, FaTimes, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaBuilding, FaUserTie } from 'react-icons/fa';
import SubcommitteeMemberService from '../../services/subcommitteeMemberService';
import CommitteeMemberService from '../../services/committeeMemberService';

const EnhancedSendInvitations = () => {
  const [meetings, setMeetings] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [subcommittees, setSubcommittees] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedCommittees, setSelectedCommittees] = useState([]);
  const [selectedSubcommittees, setSelectedSubcommittees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetchingData(true);
    try {
      // Fetch meetings, committees with members, and subcommittees with members
      const [meetingsRes, committeesWithMembers, subcommitteesWithMembers] = await Promise.all([
        fetch(`${process.env.REACT_APP_BASE_URL}/meetings`, { credentials: 'include' }).catch(() => ({ ok: false })),
        CommitteeMemberService.getAllCommitteesWithMembers(),
        SubcommitteeMemberService.getAllSubcommitteesWithMembers()
      ]);

      const meetingsData = meetingsRes.ok ? await meetingsRes.json() : [];

      // Filter for schedulable meetings
      const schedulableMeetings = meetingsData.filter(meeting => 
        ['SCHEDULED', 'DRAFT'].includes(meeting.status) &&
        new Date(meeting.meetingDate) > new Date()
      );

      setMeetings(schedulableMeetings);
      setCommittees(committeesWithMembers || []);
      setSubcommittees(subcommitteesWithMembers || []);

      console.log('✅ Data loaded:', {
        meetings: schedulableMeetings.length,
        committees: committeesWithMembers.length,
        subcommittees: subcommitteesWithMembers.length
      });

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError('Failed to load data. Please refresh and try again.');
    } finally {
      setFetchingData(false);
    }
  };

  const handleMeetingSelect = (meetingId) => {
    const meeting = meetings.find(m => m.id === parseInt(meetingId));
    setSelectedMeeting(meeting || null);
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
    setError('');
  };

  const handleSubcommitteeToggle = (subcommitteeId) => {
    setSelectedSubcommittees(prev => 
      prev.includes(subcommitteeId) 
        ? prev.filter(id => id !== subcommitteeId)
        : [...prev, subcommitteeId]
    );
    setError('');
  };

  const getEstimatedRecipients = () => {
    // Estimate recipients (you can make this more accurate with actual member counts)
    return (selectedCommittees.length * 8) + (selectedSubcommittees.length * 5);
  };

  const handleSendInvitations = async () => {
    // Validation
    if (!selectedMeeting) {
      setError('Please select a meeting first.');
      return;
    }

    if (selectedCommittees.length === 0 && selectedSubcommittees.length === 0) {
      setError('Please select at least one committee or subcommittee to send invitations to.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Sending invitations for meeting:', selectedMeeting.id);
      console.log('📋 Selected committees:', selectedCommittees);
      console.log('👥 Selected subcommittees:', selectedSubcommittees);

      const requestBody = {
        committees: selectedCommittees,
        subcommittees: selectedSubcommittees,
        sendEmail: true,
        message: `You are invited to attend the meeting: ${selectedMeeting.title} scheduled for ${new Date(selectedMeeting.meetingDate).toLocaleDateString()}.`
      };

      console.log('📤 Request payload:', requestBody);

      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/committee-invitations/send/${selectedMeeting.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send invitations';
        
        try {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          if (response.status === 404) {
            errorMessage = 'Meeting not found. Please refresh and try again.';
          } else if (response.status === 400) {
            errorMessage = 'Invalid request. Please check your selections.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later or contact support.';
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      console.log('📥 Response received:', result);
      
      setSuccess(
        `✅ Meeting invitations sent successfully!\n` +
        `📧 ${result.totalRecipients || getEstimatedRecipients()} members have been notified\n` +
        `✉️ ${result.successCount || 0} invitations delivered successfully\n` +
        `📊 Email delivery: ${result.emailDeliveryStats?.emailsSentSuccessfully || 0} sent, ${result.emailDeliveryStats?.emailsFailed || 0} failed`
      );

      // Reset selections
      setSelectedCommittees([]);
      setSelectedSubcommittees([]);

      console.log('✅ Invitations sent successfully:', result);

    } catch (error) {
      console.error('❌ Error sending invitations:', error);
      setError(error.message || 'Failed to send invitations. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50) 100%)'}}>
      <div className="container">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" style={{background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--secondary-600) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
            📧 Enhanced Meeting Invitations
          </h1>
          <p className="text-lg" style={{color: 'var(--gray-600)'}}>
            Select committees and subcommittees to send meeting invitations with comprehensive recipient management
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error">
            <FaExclamationTriangle />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm whitespace-pre-line">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <FaCheckCircle />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm whitespace-pre-line">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Meeting Selection */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaCalendar className="text-blue-600" />
                  Select Meeting
                </h2>
              </div>
              
              <div className="p-6">
                {meetings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaCalendar className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p>No upcoming meetings available</p>
                    <button 
                      onClick={fetchData}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <div>
                    <select
                      value={selectedMeeting?.id || ''}
                      onChange={(e) => handleMeetingSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a meeting...</option>
                      {meetings.map(meeting => (
                        <option key={meeting.id} value={meeting.id}>
                          {meeting.title} - {new Date(meeting.meetingDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    
                    {selectedMeeting && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-gray-900">{selectedMeeting.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          📅 {new Date(selectedMeeting.meetingDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          📍 {selectedMeeting.location}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selection Summary */}
            {selectedMeeting && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Selection Summary</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Committees:</span>
                      <span className="font-medium text-blue-600">{selectedCommittees.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subcommittees:</span>
                      <span className="font-medium text-green-600">{selectedSubcommittees.length}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-4">
                      <span className="text-gray-600">Est. Recipients:</span>
                      <span className="font-bold text-purple-600">{getEstimatedRecipients()}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSendInvitations}
                    disabled={loading || !selectedMeeting || (selectedCommittees.length === 0 && selectedSubcommittees.length === 0)}
                    className={`w-full mt-6 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                      loading || !selectedMeeting || (selectedCommittees.length === 0 && selectedSubcommittees.length === 0)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaEnvelope />
                        Send Invitations ({getEstimatedRecipients()})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Committee/Subcommittee Selection */}
          <div className="xl:col-span-2">
            {!selectedMeeting ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FaCalendar className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg font-medium">Select a Meeting First</p>
                  <p className="text-sm">Choose a meeting from the left panel to start selecting recipients</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Select Recipients</h2>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Committees */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FaBuilding className="text-blue-600" />
                        Committees ({committees.length})
                      </h3>
                      
                      {committees.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FaBuilding className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                          <p>No committees available</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {committees.map(committee => (
                            <div
                              key={committee.id}
                              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
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
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{committee.name}</h4>
                                  {committee.description && (
                                    <p className="text-sm text-gray-600">{committee.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Subcommittees */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FaUserTie className="text-green-600" />
                        Subcommittees ({subcommittees.length})
                      </h3>
                      
                      {subcommittees.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FaUserTie className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                          <p>No subcommittees available</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {subcommittees.map(subcommittee => (
                            <div
                              key={subcommittee.id}
                              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
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
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{subcommittee.name}</h4>
                                  {subcommittee.description && (
                                    <p className="text-sm text-gray-600">{subcommittee.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSendInvitations;