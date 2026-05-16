import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaUsers, FaPlus, FaTrash, FaCheck, FaTimes, FaSpinner, FaExclamationTriangle, FaCalculator, FaEnvelope, FaChartPie, FaCheckCircle, FaClock } from 'react-icons/fa';
import ResolutionAssignmentService from '../../services/resolutionAssignmentService';
import SubcommitteeMemberService from '../../services/subcommitteeMemberService';
import AuthService from '../../services/authService';
import './EnhancedResolutionWorkflow.css';

const EnhancedResolutionWorkflow = () => {
  const [resolutions, setResolutions] = useState([]);
  const [subcommittees, setSubcommittees] = useState([]);
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let resolutionsData = [];
      let subcommitteesData = [];

      try {
        const user = AuthService.getCurrentUser();
        const userId = user?.id || 1;

        const [resolutionsResponse, subcommitteesWithMembers] = await Promise.all([
          ResolutionAssignmentService.getResolutionsBySecretary(userId),
          SubcommitteeMemberService.getAllSubcommitteesWithMembers()
        ]);

        resolutionsData = resolutionsResponse;
        subcommitteesData = subcommitteesWithMembers;
      } catch (apiError) {
        console.warn('API connection failed, using fallback data:', apiError.message);

        // Provide fallback data when API is not available
        resolutionsData = [
          {
            id: 1,
            title: "Infrastructure Development Initiative",
            description: "Proposal for upgrading the organization's technical infrastructure to support modern operations.",
            status: "ASSIGNED",
            assignedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            meeting: {
              title: "Monthly Committee Review",
              meetingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          },
          {
            id: 2,
            title: "Policy Update Framework",
            description: "Comprehensive review and update of organizational policies to align with current best practices.",
            status: "IN_PROGRESS",
            assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            meeting: {
              title: "Policy Review Meeting",
              meetingDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
            }
          },
          {
            id: 3,
            title: "Community Outreach Program",
            description: "Development of a comprehensive community engagement and outreach program.",
            status: "ASSIGNED",
            assignedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            meeting: {
              title: "Community Affairs Meeting",
              meetingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        ];

        // Try to get subcommittees with real member counts even in fallback mode
        try {
          subcommitteesData = await SubcommitteeMemberService.getAllSubcommitteesWithMembers();
        } catch (fallbackError) {
          console.error('Fallback subcommittees also failed:', fallbackError);
          subcommitteesData = [
            { id: 1, name: "Head Of Delegation", memberCount: 0 },
            { id: 2, name: "Domestic Revenue Sub Committee", memberCount: 0 },
            { id: 3, name: "Customs Revenue Sub Committee", memberCount: 0 },
            { id: 4, name: "IT Sub Committee", memberCount: 0 },
            { id: 5, name: "Legal Sub Committee", memberCount: 0 },
            { id: 6, name: "HR Sub Committee", memberCount: 0 },
            { id: 7, name: "Research Sub Committee", memberCount: 0 }
          ];
        }
      }

      // Filter resolutions that can be assigned
      const assignableResolutions = resolutionsData.filter(r =>
        ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)
      );

      setResolutions(assignableResolutions);
      setSubcommittees(subcommitteesData);
      console.log('Debug - Loaded subcommittees with member counts:', subcommitteesData);

      // Log individual subcommittee member counts
      subcommitteesData.forEach(sub => {
        console.log(`${sub.name} (ID: ${sub.id}) has ${sub.memberCount} members`);
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolutionSelect = (resolution) => {
    setSelectedResolution(resolution);
    setAssignments([{
      id: Date.now(),
      subcommitteeId: '',
      contributionPercentage: 100
    }]);
    setError('');
    setSuccess('');
    setShowPreview(false);
  };

  const addAssignment = () => {
    const remainingPercentage = getRemainingPercentage();
    setAssignments(prev => [
      ...prev,
      {
        id: Date.now(),
        subcommitteeId: '',
        contributionPercentage: Math.max(0, remainingPercentage)
      }
    ]);
  };

  const removeAssignment = (id) => {
    if (assignments.length > 1) {
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
    }
  };

  const updateAssignment = (id, field, value) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id
          ? { ...assignment, [field]: value }
          : assignment
      )
    );
    setError('');
  };

  const getRemainingPercentage = () => {
    return ResolutionAssignmentService.calculateRemainingPercentage(assignments);
  };

  const getTotalPercentage = () => {
    return assignments.reduce((sum, assignment) => {
      return sum + parseInt(assignment.contributionPercentage || 0);
    }, 0);
  };

  const isValidAssignment = () => {
    const validationErrors = ResolutionAssignmentService.validateAssignments(assignments);
    return validationErrors.length === 0;
  };

  const getValidationErrors = () => {
    return ResolutionAssignmentService.validateAssignments(assignments);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const validAssignments = assignments.filter(a => a.subcommitteeId).map(assignment => ({
        subcommitteeId: parseInt(assignment.subcommitteeId),
        contributionPercentage: assignment.contributionPercentage
      }));

      await ResolutionAssignmentService.assignResolution(selectedResolution.id, validAssignments);

      const totalMembers = assignments
        .filter(a => a.subcommitteeId)
        .reduce((total, assignment) => {
          const subcommittee = subcommittees.find(s => s.id.toString() === assignment.subcommitteeId);
          return total + (subcommittee?.memberCount || 0);
        }, 0);

      setSuccess(`Successfully assigned "${selectedResolution.title}" to ${validAssignments.length} subcommittee(s)! ${totalMembers} members will be notified via email.`);
      setSelectedResolution(null);
      setAssignments([]);
      setShowConfirmDialog(false);
      setError('');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error saving assignments:', error);
      setError(error.message || 'Failed to save assignments. Please try again.');
    } finally {
      setSaving(false);
    }
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

  const generatePreviewData = () => {
    if (!selectedResolution || assignments.length === 0) return [];

    return assignments
      .filter(assignment => assignment.subcommitteeId && assignment.contributionPercentage > 0)
      .map(assignment => {
        const subcommittee = subcommittees.find(s => s.id === parseInt(assignment.subcommitteeId));
        return {
          name: subcommittee?.name || 'Unknown',
          percentage: parseInt(assignment.contributionPercentage),
          memberCount: subcommittee?.memberCount || 0,
          id: assignment.subcommitteeId
        };
      });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading resolutions...</p>
        </div>
      </div>
    );
  }

  const totalPercentage = getTotalPercentage();
  const remainingPercentage = getRemainingPercentage();
  const isValid = isValidAssignment();
  const previewData = generatePreviewData();

  return (
    <div className="enhanced-resolution-workflow">
      <div className="resolution-workflow-content">
        <div className="resolution-workflow-header">
          <h1 className="resolution-workflow-title">
            <FaFileAlt />
            Task Assignment System
          </h1>
          <p className="resolution-workflow-subtitle">
            Assign tasks to multiple subcommittees with specific contribution percentages.
            All members of selected subcommittees will be automatically notified via email.
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="resolution-alert resolution-alert-error">
            <FaExclamationTriangle />
            <div className="resolution-alert-content">
              <div className="resolution-alert-title">Error</div>
              <div className="resolution-alert-message">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="resolution-alert resolution-alert-success">
            <FaCheck />
            <div className="resolution-alert-content">
              <div className="resolution-alert-title">Success!</div>
              <div className="resolution-alert-message">{success}</div>
            </div>
          </div>
        )}

        {/* Email Notification Info */}
        <div className="resolution-info-panel">
          <div className="info-panel-header">
            <FaEnvelope />
            <h3 className="info-panel-title">How Email Notifications Work</h3>
          </div>
          <div className="info-panel-grid">
            <div className="info-panel-item">
              <div className="info-panel-item-value">1</div>
              <div className="info-panel-item-label">Select Subcommittees</div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--theme-text-2, #b8c5da)' }}>
                Choose which subcommittees should work on this task
              </p>
            </div>
            <div className="info-panel-item">
              <div className="info-panel-item-value">2</div>
              <div className="info-panel-item-label">Set Percentages</div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--theme-text-2, #b8c5da)' }}>
                Assign contribution percentages that must total 100%
              </p>
            </div>
            <div className="info-panel-item">
              <div className="info-panel-item-value">3</div>
              <div className="info-panel-item-label">Auto Email Sent</div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--theme-text-2, #b8c5da)' }}>
                ALL members of selected subcommittees get notified automatically
              </p>
            </div>
          </div>
        </div>

        <div className="resolution-content-grid">
          {/* Resolution Selection */}
          <div className="resolution-panel">
            <div className="panel-header">
              <h2 className="panel-title">Select Resolution</h2>
              <p className="panel-subtitle">
                Choose a resolution to assign to multiple subcommittees
              </p>
            </div>

            <div className="panel-body">
              {resolutions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FaFileAlt />
                  </div>
                  <h3 className="empty-state-title">No Resolutions Available</h3>
                  <p className="empty-state-description">No resolutions are available for assignment.</p>
                </div>
              ) : (
                <div className="resolutions-list">
                  {resolutions.map(resolution => (
                    <div
                      key={resolution.id}
                      className={`resolution-selection-card ${selectedResolution?.id === resolution.id ? 'selected' : ''
                        }`}
                      onClick={() => handleResolutionSelect(resolution)}
                    >
                      <div className="resolution-card-header">
                        <h4 className="resolution-card-title">{resolution.title}</h4>
                        <span
                          className={`resolution-status-badge resolution-status-${resolution.status.toLowerCase().replace('_', '-')}`}
                        >
                          {resolution.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="resolution-card-description">{resolution.description}</p>
                      {resolution.meeting && (
                        <p className="resolution-card-meta">
                          <FaClock />
                          From: {resolution.meeting.title} ({formatDate(resolution.meeting.meetingDate)})
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assignment Form */}
          {selectedResolution ? (
            <div className="resolution-panel">
              <div className="panel-header">
                <h2 className="panel-title">Assignment Details</h2>
                <p className="panel-subtitle">Assign: {selectedResolution.title}</p>
              </div>
              <div className="panel-body">
                <div className="assignment-form">
                  {/* Assignment Instructions */}
                  <div className="assignment-instructions">
                    <h4>Assignment Instructions</h4>
                    <p>Select subcommittees and assign contribution percentages. Total must equal 100%.</p>
                  </div>

                  {/* Assignment List */}
                  <div className="assignments-list">
                    {assignments.map((assignment, index) => (
                      <div key={assignment.id} className="assignment-item">
                        <div className="assignment-row">
                          <div className="assignment-field">
                            <label>Subcommittee</label>
                            <select
                              value={assignment.subcommitteeId}
                              onChange={(e) => updateAssignment(assignment.id, 'subcommitteeId', e.target.value)}
                              className="assignment-select"
                            >
                              <option value="">Select a subcommittee...</option>
                              {subcommittees
                                .filter(sub => !assignments.some(a => a.subcommitteeId === sub.id.toString() && a.id !== assignment.id))
                                .map(subcommittee => (
                                  <option key={subcommittee.id} value={subcommittee.id.toString()}>
                                    {subcommittee.name} ({subcommittee.memberCount} members)
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="assignment-field percentage-field">
                            <label>Contribution %</label>
                            <div className="percentage-input-container">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={assignment.contributionPercentage}
                                onChange={(e) => updateAssignment(assignment.id, 'contributionPercentage', parseInt(e.target.value) || 0)}
                                className="percentage-input"
                              />
                              <span className="percentage-symbol">%</span>
                            </div>
                          </div>

                          <div className="assignment-actions">
                            {assignments.length > 1 && (
                              <button
                                onClick={() => removeAssignment(assignment.id)}
                                className="remove-assignment-btn"
                                title="Remove assignment"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Show subcommittee details */}
                        {assignment.subcommitteeId && (
                          <div className="subcommittee-details">
                            {(() => {
                              const subcommittee = subcommittees.find(s => s.id.toString() === assignment.subcommitteeId);
                              return subcommittee ? (
                                <div className="subcommittee-info">
                                  <FaUsers />
                                  <span>{subcommittee.description}</span>
                                  <span className="member-count">• {subcommittee.memberCount} members will be notified</span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Assignment Button */}
                  <div className="add-assignment-section">
                    <button
                      onClick={addAssignment}
                      className="add-assignment-btn"
                      disabled={assignments.length >= subcommittees.length}
                    >
                      <FaPlus />
                      Add Another Subcommittee
                    </button>
                  </div>

                  {/* Percentage Summary */}
                  <div className="percentage-summary">
                    <div className="summary-header">
                      <h4>Assignment Summary</h4>
                    </div>
                    <div className="summary-content">
                      <div className="percentage-breakdown">
                        {assignments.map(assignment => {
                          const subcommittee = subcommittees.find(s => s.id.toString() === assignment.subcommitteeId);
                          return assignment.subcommitteeId ? (
                            <div key={assignment.id} className="percentage-item">
                              <span className="subcommittee-name">{subcommittee?.name}</span>
                              <span className="percentage-value">{assignment.contributionPercentage}%</span>
                            </div>
                          ) : null;
                        })}
                      </div>

                      <div className="total-percentage">
                        <div className={`total-row ${totalPercentage === 100 ? 'valid' : 'invalid'}`}>
                          <span className="total-label">Total:</span>
                          <span className="total-value">{totalPercentage}%</span>
                          {totalPercentage === 100 ? (
                            <FaCheck className="valid-icon" />
                          ) : (
                            <FaExclamationTriangle className="invalid-icon" />
                          )}
                        </div>
                        {totalPercentage !== 100 && (
                          <div className="percentage-warning">
                            {totalPercentage > 100
                              ? `Over by ${totalPercentage - 100}%`
                              : `Need ${100 - totalPercentage}% more`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Save Assignment Button */}
                  <div className="save-assignment-section">
                    <button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={!isValid || saving}
                      className="save-assignment-btn"
                    >
                      {saving ? (
                        <>
                          <FaSpinner className="loading-spinner" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <FaEnvelope />
                          Assign & Send Notifications
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="resolution-panel">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FaFileAlt />
                </div>
                <h3 className="empty-state-title">Select a Resolution</h3>
                <p className="empty-state-description">Choose a resolution from the left panel to start assigning tasks</p>
              </div>
            </div>
          )}

          {/* Summary Panel */}
          <div className="summary-panel">
            <div className="panel-header">
              <h3 className="panel-title">Assignment Summary</h3>
            </div>
            <div className="panel-body">
              {selectedResolution ? (
                <div className="summary-content">
                  <div className="summary-item">
                    <label>Selected Resolution:</label>
                    <span>{selectedResolution.title}</span>
                  </div>

                  <div className="summary-item">
                    <label>Assigned Subcommittees:</label>
                    <span>{assignments.filter(a => a.subcommitteeId).length} of {subcommittees.length}</span>
                  </div>

                  <div className="summary-item">
                    <label>Total Members Notified:</label>
                    <span>
                      {(() => {
                        const validAssignments = assignments.filter(a => a.subcommitteeId);
                        const totalMembers = validAssignments.reduce((total, assignment) => {
                          const subcommittee = subcommittees.find(s => s.id.toString() === assignment.subcommitteeId);
                          console.log('Debug - Assignment:', assignment.subcommitteeId, 'Found subcommittee:', subcommittee?.name, 'Members:', subcommittee?.memberCount);
                          return total + (subcommittee?.memberCount || 0);
                        }, 0);
                        console.log('Debug - Total members:', totalMembers);
                        return totalMembers;
                      })()}
                      {' '}members
                    </span>
                  </div>

                  <div className="summary-item">
                    <label>Assignment Status:</label>
                    <span className={`status ${isValid ? 'valid' : 'invalid'}`}>
                      {isValid ? 'Ready to Assign' : 'Incomplete (Check percentages)'}
                    </span>
                  </div>

                  {assignments.filter(a => a.subcommitteeId).length > 0 && (
                    <div className="summary-breakdown">
                      <h5>Subcommittee Breakdown:</h5>
                      <div className="breakdown-list">
                        {assignments
                          .filter(a => a.subcommitteeId)
                          .map(assignment => {
                            const subcommittee = subcommittees.find(s => s.id.toString() === assignment.subcommitteeId);
                            return subcommittee ? (
                              <div key={assignment.id} className="breakdown-item">
                                <div className="breakdown-info">
                                  <span className="subcommittee-name">{subcommittee.name}</span>
                                  <span className="member-info">({subcommittee.memberCount} members)</span>
                                </div>
                                <span className="percentage-badge">{assignment.contributionPercentage}%</span>
                              </div>
                            ) : null;
                          })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-summary">
                  <p>Select a resolution to see assignment summary</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--theme-surface-2, #101826)', border: '1px solid var(--theme-border, #24344c)', borderRadius: '12px', padding: '2rem', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', color: 'var(--theme-text-1, #f8fafc)' }}>
              <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaCheckCircle style={{ color: '#10b981' }} />
                Confirm Resolution Assignment
              </h3>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--theme-text-1, #f8fafc)' }}>Resolution:</h4>
                <p style={{ margin: '0 0 1rem 0', padding: '0.75rem', background: 'var(--theme-surface-3, #162132)', borderRadius: '8px', border: '1px solid var(--theme-border, #24344c)' }}>
                  {selectedResolution?.title}
                </p>

                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--theme-text-1, #f8fafc)' }}>Assignment Details:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {assignments.filter(a => a.subcommitteeId).map((assignment, index) => {
                    const subcommittee = subcommittees.find(s => s.id.toString() === assignment.subcommitteeId);
                    return (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: 'var(--theme-surface-3, #162132)',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-border, #24344c)'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--theme-text-1, #f8fafc)' }}>{subcommittee?.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--theme-text-2, #b8c5da)' }}>
                            {subcommittee?.memberCount || 0} members will be notified
                          </div>
                        </div>
                        <div style={{
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          color: 'var(--theme-text-1, #f8fafc)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          {assignment.contributionPercentage}%
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(16, 185, 129, 0.14)',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.42)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '600', color: '#6ee7b7' }}>
                    Total Members to Notify:
                  </span>
                  <span style={{ fontWeight: '700', color: '#6ee7b7', fontSize: '1.1rem' }}>
                    {(() => {
                      const validAssignments = assignments.filter(a => a.subcommitteeId);
                      const totalMembers = validAssignments.reduce((total, assignment) => {
                        const subcommittee = subcommittees.find(s => s.id.toString() === assignment.subcommitteeId);
                        console.log('Confirmation Debug - Assignment:', assignment.subcommitteeId, 'Found subcommittee:', subcommittee?.name, 'Members:', subcommittee?.memberCount);
                        return total + (subcommittee?.memberCount || 0);
                      }, 0);
                      console.log('Confirmation Debug - Total members:', totalMembers);
                      return totalMembers;
                    })()} members
                  </span>
                </div>
              </div>

              <p style={{ margin: '0 0 1.5rem 0', color: 'var(--theme-text-2, #b8c5da)', fontSize: '0.9rem' }}>
                <FaEnvelope style={{ marginRight: '0.5rem', color: '#2563eb' }} />
                Email notifications will be sent automatically to all members of the selected subcommittees.
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--theme-surface-3, #162132)',
                    color: 'var(--theme-text-1, #f8fafc)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  {saving ? (
                    <>
                      <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <FaEnvelope />
                      Confirm & Send Notifications
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedResolutionWorkflow;