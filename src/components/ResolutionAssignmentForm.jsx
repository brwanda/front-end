import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaCheck, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import './ResolutionAssignmentForm.css';

const ResolutionAssignmentForm = ({ resolutionId, onAssignmentComplete, onCancel }) => {
  const [assignments, setAssignments] = useState([
    { id: Date.now(), subcommitteeId: '', contributionPercentage: 100 }
  ]);
  const [subcommittees, setSubcommittees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    loadSubcommittees();
  }, []);

  useEffect(() => {
    validateAssignments();
  }, [assignments]);

  const loadSubcommittees = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/sub-committees`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSubcommittees(data);
      }
    } catch (error) {
      console.error('Error loading subcommittees:', error);
      setError('Failed to load subcommittees');
    }
  };

  const validateAssignments = () => {
    const errors = [];

    // Check if we have assignments
    if (assignments.length === 0) {
      errors.push('At least one assignment is required');
      setValidationErrors(errors);
      return;
    }

    // Check total percentage
    const total = assignments.reduce((sum, assignment) => {
      const percentage = parseInt(assignment.contributionPercentage || 0);
      return sum + percentage;
    }, 0);

    if (total !== 100) {
      errors.push(`Total contribution must equal 100%. Current total: ${total}%`);
    }

    // Check for duplicate subcommittees
    const subcommitteeIds = assignments.map(a => a.subcommitteeId).filter(id => id);
    const uniqueIds = new Set(subcommitteeIds);
    
    if (subcommitteeIds.length !== uniqueIds.size) {
      errors.push('Cannot assign the same subcommittee multiple times');
    }

    // Check individual assignments
    assignments.forEach((assignment, index) => {
      if (!assignment.subcommitteeId) {
        errors.push(`Assignment ${index + 1}: Subcommittee is required`);
      }

      const percentage = parseInt(assignment.contributionPercentage || 0);
      if (percentage <= 0 || percentage > 100) {
        errors.push(`Assignment ${index + 1}: Contribution percentage must be between 1 and 100`);
      }
    });

    setValidationErrors(errors);
  };

  const getTotalPercentage = () => {
    return assignments.reduce((sum, assignment) => {
      return sum + (parseInt(assignment.contributionPercentage) || 0);
    }, 0);
  };

  const handleAssignmentChange = (id, field, value) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.id === id 
        ? { ...assignment, [field]: value }
        : assignment
    ));
  };

  const addAssignment = () => {
    const newAssignment = {
      id: Date.now(),
      subcommitteeId: '',
      contributionPercentage: Math.max(0, 100 - getTotalPercentage())
    };
    setAssignments(prev => [...prev, newAssignment]);
  };

  const removeAssignment = (id) => {
    if (assignments.length > 1) {
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validationErrors.length > 0) {
      setError('Please fix validation errors before submitting');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare assignment data
      const assignmentData = assignments
        .filter(a => a.subcommitteeId && a.contributionPercentage > 0)
        .map(a => ({
          subcommitteeId: parseInt(a.subcommitteeId),
          contributionPercentage: parseInt(a.contributionPercentage)
        }));

      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/secretary/resolutions/${resolutionId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          assignments: assignmentData,
          secretaryId: user.id
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`Resolution assigned successfully to ${assignmentData.length} subcommittees!`);
        setTimeout(() => {
          if (onAssignmentComplete) {
            onAssignmentComplete();
          }
        }, 2000);
      } else {
        setError(result.error || 'Failed to assign resolution');
      }
    } catch (error) {
      console.error('Error assigning resolution:', error);
      setError('Failed to assign resolution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSubcommitteeName = (subcommitteeId) => {
    const subcommittee = subcommittees.find(s => s.id === parseInt(subcommitteeId));
    return subcommittee ? subcommittee.name : '';
  };

  const totalPercentage = getTotalPercentage();
  const isValidTotal = totalPercentage === 100;

  return (
    <div className="resolution-assignment-form">
      <div className="form-header">
        <h2>Assign Resolution to Subcommittees</h2>
        <p>Distribute the resolution workload across subcommittees with contribution percentages</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <FaCheck /> {success}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="alert alert-warning">
          <FaExclamationTriangle />
          <div>
            <strong>Validation Errors:</strong>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="assignment-form">
        <div className="assignments-section">
          <div className="section-header">
            <h3>Subcommittee Assignments</h3>
            <div className={`total-percentage ${isValidTotal ? 'valid' : 'invalid'}`}>
              Total: {totalPercentage}%
              {isValidTotal && <FaCheck className="check-icon" />}
              {!isValidTotal && <FaExclamationTriangle className="warning-icon" />}
            </div>
          </div>

          <div className="assignments-list">
            {assignments.map((assignment, index) => (
              <div key={assignment.id} className="assignment-item">
                <div className="assignment-number">
                  {index + 1}
                </div>
                
                <div className="assignment-fields">
                  <div className="field-group">
                    <label>Subcommittee</label>
                    <select
                      value={assignment.subcommitteeId}
                      onChange={(e) => handleAssignmentChange(assignment.id, 'subcommitteeId', e.target.value)}
                      required
                    >
                      <option value="">Select Subcommittee</option>
                      {subcommittees.map(subcommittee => (
                        <option key={subcommittee.id} value={subcommittee.id}>
                          {subcommittee.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group">
                    <label>Contribution %</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={assignment.contributionPercentage}
                      onChange={(e) => handleAssignmentChange(assignment.id, 'contributionPercentage', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="assignment-actions">
                  {assignments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAssignment(assignment.id)}
                      className="btn-remove"
                      title="Remove assignment"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addAssignment}
            className="btn-add-assignment"
            disabled={assignments.length >= subcommittees.length}
          >
            <FaPlus /> Add Another Assignment
          </button>
        </div>

        <div className="assignment-summary">
          <h3>Assignment Summary</h3>
          <div className="summary-list">
            {assignments
              .filter(a => a.subcommitteeId && a.contributionPercentage > 0)
              .map((assignment, index) => (
                <div key={assignment.id} className="summary-item">
                  <span className="subcommittee-name">
                    {getSubcommitteeName(assignment.subcommitteeId)}
                  </span>
                  <span className="percentage">
                    {assignment.contributionPercentage}%
                  </span>
                </div>
              ))}
          </div>
          
          <div className="summary-total">
            <strong>Total: {totalPercentage}%</strong>
            {isValidTotal ? (
              <span className="valid-indicator">
                <FaCheck /> Valid
              </span>
            ) : (
              <span className="invalid-indicator">
                <FaExclamationTriangle /> Must equal 100%
              </span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-cancel"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || !isValidTotal || validationErrors.length > 0}
          >
            {loading ? (
              <>
                <FaSpinner className="loading-spinner" />
                Assigning...
              </>
            ) : (
              <>
                <FaCheck />
                Assign Resolution
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResolutionAssignmentForm;
