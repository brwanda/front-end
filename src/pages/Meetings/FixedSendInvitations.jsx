import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaEnvelope, 
  FaCheck, 
  FaTimes, 
  FaSearch, 
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import SubcommitteeMemberService from '../../services/subcommitteeMemberService';
import CommitteeMemberService from '../../services/committeeMemberService';

const FixedSendInvitations = ({ meeting, onClose, onSuccess }) => {
  const [committees, setCommittees] = useState([]);
  const [subcommittees, setSubcommittees] = useState([]);
  const [selectedCommittees, setSelectedCommittees] = useState([]);
  const [selectedSubcommittees, setSelectedSubcommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (meeting) {
      fetchData();
    }
  }, [meeting]);

  const fetchData = async () => {
    try {
      const [committeesWithMembers, subcommitteesWithMembers] = await Promise.all([
        CommitteeMemberService.getAllCommitteesWithMembers(),
        SubcommitteeMemberService.getAllSubcommitteesWithMembers()
      ]);

      setCommittees(committeesWithMembers || []);
      setSubcommittees(subcommitteesWithMembers || []);
      
      console.log('FixedSendInvitations - Loaded committees with members:', committeesWithMembers);
      console.log('FixedSendInvitations - Loaded subcommittees with members:', subcommitteesWithMembers);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load committees and subcommittees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitteeToggle = (committeeId) => {
    setSelectedCommittees(prev => 
      prev.includes(committeeId) 
        ? prev.filter(id => id !== committeeId)
        : [...prev, committeeId]
    );
    setError(''); // Clear errors when user makes changes
  };

  const handleSubcommitteeToggle = (subcommitteeId) => {
    setSelectedSubcommittees(prev => 
      prev.includes(subcommitteeId) 
        ? prev.filter(id => id !== subcommitteeId)
        : [...prev, subcommitteeId]
    );
    setError(''); // Clear errors when user makes changes
  };

  const getTotalRecipients = () => {
    // Estimate recipients (you can make this more accurate with actual member counts)
    return (selectedCommittees.length * 8) + (selectedSubcommittees.length * 5);
  };

  const handleSendInvitations = async () => {
    // Validate selections
    if (selectedCommittees.length === 0 && selectedSubcommittees.length === 0) {
      setError('Please select at least one committee or subcommittee to send invitations to.');
      return;
    }

    if (!meeting || !meeting.id) {
      setError('Invalid meeting selected. Please try again.');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      // Use the correct endpoint that matches the backend
              const response = await fetch(`${process.env.REACT_APP_BASE_URL}/committee-invitations/send/${meeting.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          committees: selectedCommittees,
          subcommittees: selectedSubcommittees,
          sendEmail: true,
          message: `You are invited to attend the meeting: ${meeting.title} scheduled for ${new Date(meeting.meetingDate).toLocaleDateString()}.`
        }),
      });

      if (!response.ok) {
        // Handle different error responses
        let errorMessage = 'Failed to send invitations';
        
        if (response.status === 404) {
          errorMessage = 'Meeting not found. Please check if the meeting still exists.';
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.error || 'Invalid request. Please check your selections.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          // Try to get error message from response
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If we can't parse the error response, use the default message
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      setSuccess(
        `✅ Invitations sent successfully! ` +
        `📧 ${result.totalRecipients || getTotalRecipients()} members have been notified via email. ` +
        `${result.successCount || 0} invitations sent successfully.`
      );

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Error sending invitations:', error);
      setError(error.message || 'Failed to send invitations. Please check your network connection and try again.');
    } finally {
      setSending(false);
    }
  };

  if (!meeting) {
    return null;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading committees and subcommittees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaEnvelope className="text-blue-600" />
                Send Meeting Invitations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Meeting: <span className="font-medium">{meeting.title}</span>
              </p>
              <p className="text-xs text-gray-500">
                Date: {new Date(meeting.meetingDate).toLocaleDateString()} | Location: {meeting.location}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
              disabled={sending}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Alert Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex items-start gap-2">
                <FaCheckCircle className="mt-1" />
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* Selection Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Selection Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Committees selected:</span>
                <span className="font-medium text-blue-600 ml-2">{selectedCommittees.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Subcommittees selected:</span>
                <span className="font-medium text-green-600 ml-2">{selectedSubcommittees.length}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Estimated recipients:</span>
                <span className="font-bold text-purple-600 ml-2">{getTotalRecipients()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Committees Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaUsers className="text-blue-600" />
                Committees ({committees.length})
              </h3>
              
              {committees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaUsers className="mx-auto h-12 w-12 text-gray-300 mb-2" />
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
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
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

            {/* Subcommittees Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaUsers className="text-green-600" />
                Subcommittees ({subcommittees.length})
              </h3>
              
              {subcommittees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaUsers className="mx-auto h-12 w-12 text-gray-300 mb-2" />
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
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedCommittees.length + selectedSubcommittees.length > 0 ? (
              <span>Ready to send invitations to {getTotalRecipients()} members</span>
            ) : (
              <span>Please select committees or subcommittees to continue</span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              onClick={handleSendInvitations}
              disabled={sending || (selectedCommittees.length === 0 && selectedSubcommittees.length === 0)}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                sending || (selectedCommittees.length === 0 && selectedSubcommittees.length === 0)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {sending ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Sending Invitations...
                </>
              ) : (
                <>
                  <FaEnvelope />
                  Send Invitations ({getTotalRecipients()})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedSendInvitations;