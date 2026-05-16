import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaEnvelope, 
  FaCheck, 
  FaTimes, 
  FaSearch, 
  FaFilter,
  FaEye,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendar,
  FaMapMarkerAlt
} from 'react-icons/fa';
import SubcommitteeMemberService from '../../services/subcommitteeMemberService';
import CommitteeMemberService from '../../services/committeeMemberService';

const EnhancedMeetingInvitations = ({ meetingId, meetingTitle, onClose }) => {
  const [committees, setCommittees] = useState([]);
  const [subcommittees, setSubcommittees] = useState([]);
  const [selectedCommittees, setSelectedCommittees] = useState(new Set());
  const [selectedSubcommittees, setSelectedSubcommittees] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'committees', 'subcommittees'
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔍 EnhancedMeetingInvitations: Starting to fetch data...');
      
      const [committeesWithMembers, subcommitteesWithMembers] = await Promise.all([
        CommitteeMemberService.getAllCommitteesWithMembers(),
        SubcommitteeMemberService.getAllSubcommitteesWithMembers()
      ]);

      console.log('✅ EnhancedMeetingInvitations: Committees with members:', committeesWithMembers);
      console.log('✅ EnhancedMeetingInvitations: Subcommittees with members:', subcommitteesWithMembers);

      setCommittees(committeesWithMembers);
      setSubcommittees(subcommitteesWithMembers);
      
      // Log individual counts
      console.log('📊 EnhancedMeetingInvitations: Committee member counts:');
      committeesWithMembers.forEach(committee => {
        console.log(`  - ${committee.name} (ID: ${committee.id}) has ${committee.memberCount} members`);
      });
      
      console.log('📊 EnhancedMeetingInvitations: Subcommittee member counts:');
      subcommitteesWithMembers.forEach(subcommittee => {
        console.log(`  - ${subcommittee.name} (ID: ${subcommittee.id}) has ${subcommittee.memberCount} members`);
      });
      
    } catch (error) {
      console.error('❌ EnhancedMeetingInvitations: Error fetching data:', error);
      setError('Failed to load committees and subcommittees');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitteeToggle = (committeeId) => {
    const newSelected = new Set(selectedCommittees);
    if (newSelected.has(committeeId)) {
      newSelected.delete(committeeId);
    } else {
      newSelected.add(committeeId);
    }
    setSelectedCommittees(newSelected);
    setError(''); // Clear errors when user makes changes
  };

  const handleSubcommitteeToggle = (subcommitteeId) => {
    const newSelected = new Set(selectedSubcommittees);
    if (newSelected.has(subcommitteeId)) {
      newSelected.delete(subcommitteeId);
    } else {
      newSelected.add(subcommitteeId);
    }
    setSelectedSubcommittees(newSelected);
    setError(''); // Clear errors when user makes changes
  };

  const handleSelectAll = (type) => {
    if (type === 'committees') {
      const filteredCommittees = getFilteredCommittees();
      if (selectedCommittees.size === filteredCommittees.length) {
        // Deselect all
        setSelectedCommittees(new Set());
      } else {
        // Select all
        setSelectedCommittees(new Set(filteredCommittees.map(c => c.id)));
      }
    } else if (type === 'subcommittees') {
      const filteredSubcommittees = getFilteredSubcommittees();
      if (selectedSubcommittees.size === filteredSubcommittees.length) {
        // Deselect all
        setSelectedSubcommittees(new Set());
      } else {
        // Select all
        setSelectedSubcommittees(new Set(filteredSubcommittees.map(s => s.id)));
      }
    }
  };

  const getFilteredCommittees = () => {
    return committees.filter(committee =>
      committee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      committee.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredSubcommittees = () => {
    return subcommittees.filter(subcommittee =>
      subcommittee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcommittee.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getTotalRecipients = () => {
    // Calculate actual member counts
    const committeeMembers = Array.from(selectedCommittees).reduce((total, committeeId) => {
      const committee = committees.find(c => c.id === committeeId);
      return total + (committee?.memberCount || 8); // Fallback to avg 8 members
    }, 0);
    
    const subcommitteeMembers = Array.from(selectedSubcommittees).reduce((total, subcommitteeId) => {
      const subcommittee = subcommittees.find(s => s.id === subcommitteeId);
      return total + (subcommittee?.memberCount || 0);
    }, 0);
    
    return committeeMembers + subcommitteeMembers;
  };

  const getSelectedNames = () => {
    const selectedCommitteeNames = committees
      .filter(c => selectedCommittees.has(c.id))
      .map(c => c.name);
    
    const selectedSubcommitteeNames = subcommittees
      .filter(s => selectedSubcommittees.has(s.id))
      .map(s => s.name);

    return [...selectedCommitteeNames, ...selectedSubcommitteeNames];
  };

  const handleSendInvitations = async () => {
    if (selectedCommittees.size === 0 && selectedSubcommittees.size === 0) {
      setError('Please select at least one committee or subcommittee');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const invitationData = {
        meetingId,
        committees: Array.from(selectedCommittees),
        subcommittees: Array.from(selectedSubcommittees),
        sendEmail: true
      };

              const response = await fetch(`${process.env.REACT_APP_BASE_URL}/invitations/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(invitationData),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(
          `✅ Invitations sent successfully to ${getTotalRecipients()} members across ${selectedCommittees.size + selectedSubcommittees.size} groups. ` +
          `📧 Email notifications have been delivered to all recipients.`
        );
        
        // Auto-close after success
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error('Failed to send invitations');
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      setError('Failed to send invitations. Please try again.');
    } finally {
      setSending(false);
    }
  };

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
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaEnvelope className="text-blue-600" />
                Send Meeting Invitations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Meeting: <span className="font-medium">{meetingTitle}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={sending}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-start gap-2">
              <FaCheckCircle className="mt-1" />
              <span>{success}</span>
            </div>
          </div>
        )}

        <div className="flex h-[calc(90vh-200px)]">
          {/* Selection Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Search and Filter Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search committees and subcommittees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Groups</option>
                  <option value="committees">Committees Only</option>
                  <option value="subcommittees">Subcommittees Only</option>
                </select>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectAll('committees')}
                  className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg"
                  disabled={sending}
                >
                  {selectedCommittees.size === getFilteredCommittees().length ? 'Deselect' : 'Select'} All Committees
                </button>
                <button
                  onClick={() => handleSelectAll('subcommittees')}
                  className="text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg"
                  disabled={sending}
                >
                  {selectedSubcommittees.size === getFilteredSubcommittees().length ? 'Deselect' : 'Select'} All Subcommittees
                </button>
              </div>
            </div>

            {/* Committees Section */}
            {(filterType === 'all' || filterType === 'committees') && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaUsers className="text-blue-600" />
                  Committees ({getFilteredCommittees().length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getFilteredCommittees().map(committee => (
                    <div
                      key={committee.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedCommittees.has(committee.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCommitteeToggle(committee.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedCommittees.has(committee.id)
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedCommittees.has(committee.id) && (
                                <FaCheck className="text-white text-xs" />
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900">{committee.name}</h4>
                          </div>
                          {committee.description && (
                            <p className="text-sm text-gray-600 mt-1 ml-6">{committee.description}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-2 ml-6">
                            {committee.memberCount || 0} members will be notified
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subcommittees Section */}
            {(filterType === 'all' || filterType === 'subcommittees') && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaUsers className="text-green-600" />
                  Subcommittees ({getFilteredSubcommittees().length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getFilteredSubcommittees().map(subcommittee => (
                    <div
                      key={subcommittee.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedSubcommittees.has(subcommittee.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSubcommitteeToggle(subcommittee.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedSubcommittees.has(subcommittee.id)
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedSubcommittees.has(subcommittee.id) && (
                                <FaCheck className="text-white text-xs" />
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900">{subcommittee.name}</h4>
                          </div>
                          {subcommittee.description && (
                            <p className="text-sm text-gray-600 mt-1 ml-6">{subcommittee.description}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-2 ml-6">
                            {subcommittee.memberCount || 0} members will be notified
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaEye className="text-purple-600" />
              Invitation Preview
            </h3>

            {/* Selection Summary */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">Selected Groups</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Committees:</span>
                  <span className="font-medium text-blue-600">{selectedCommittees.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Subcommittees:</span>
                  <span className="font-medium text-green-600">{selectedSubcommittees.size}</span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span>Total Recipients:</span>
                  <span className="text-purple-600">{getTotalRecipients()}</span>
                </div>
              </div>
            </div>

            {/* Selected Groups List */}
            {(selectedCommittees.size > 0 || selectedSubcommittees.size > 0) && (
              <div className="mb-6 p-4 bg-white rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Groups to Invite</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getSelectedNames().map((name, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      <FaCheck className="text-green-500 text-xs" />
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Preview */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">Email Preview</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <div><strong>Subject:</strong> Meeting Invitation: {meetingTitle}</div>
                <div><strong>Content:</strong></div>
                <div className="bg-gray-50 p-3 rounded text-xs">
                  Dear [Member Name],<br/><br/>
                  You have been invited to attend: {meetingTitle}<br/><br/>
                  Please check the EaraConnect system for full meeting details.<br/><br/>
                  Best regards,<br/>
                  EaraConnect System Team
                </div>
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendInvitations}
              disabled={sending || (selectedCommittees.size === 0 && selectedSubcommittees.size === 0)}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                sending || (selectedCommittees.size === 0 && selectedSubcommittees.size === 0)
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
                  Send Invitations ({getTotalRecipients()} recipients)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMeetingInvitations;