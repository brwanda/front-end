import React, { useState, useEffect } from 'react';
import { getAllResolutions, assignResolution, getResolutionAssignments } from '../../services/resolutionService';
import { getCountries } from '../../services/countryService';
import { FaFileAlt, FaUsers, FaPlus, FaEdit, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import './Resolutions.css';

const ResolutionAssignment = () => {
  const [resolutions, setResolutions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resolutionsData, countriesData] = await Promise.all([
          getAllResolutions(),
          getCountries()
        ]);
        setResolutions(resolutionsData);
        setCountries(countriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleResolutionSelect = async (resolution) => {
    setSelectedResolution(resolution);
    setAssignments([]);
    setError('');
    setSuccess('');

    // Validate resolution and ID
    if (!resolution || !resolution.id) {
      setError('Invalid resolution selected. Please select a valid resolution.');
      return;
    }

    try {
      const existingAssignments = await getResolutionAssignments(resolution.id);
      if (existingAssignments && existingAssignments.length > 0) {
        setAssignments(existingAssignments);
      } else {
        // Initialize with empty assignment
        setAssignments([{
          id: Date.now(),
          countryId: '',
          assignedTo: '',
          deadline: '',
          priority: 'MEDIUM',
          notes: ''
        }]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      // Initialize with empty assignment if no existing ones
      setAssignments([{
        id: Date.now(),
        countryId: '',
        assignedTo: '',
        deadline: '',
        priority: 'MEDIUM',
        notes: ''
      }]);
    }
  };

  const addAssignment = () => {
    setAssignments(prev => [
      ...prev,
      {
        id: Date.now(),
        countryId: '',
        assignedTo: '',
        deadline: '',
        priority: 'MEDIUM',
        notes: ''
      }
    ]);
  };

  const removeAssignment = (id) => {
    setAssignments(prev => prev.filter(assignment => assignment.id !== id));
  };

  const updateAssignment = (id, field, value) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id
          ? { ...assignment, [field]: value }
          : assignment
      )
    );
  };

  const validateAssignments = () => {
    const errors = [];
    
    assignments.forEach((assignment, index) => {
      if (!assignment.countryId) {
        errors.push(`Assignment ${index + 1}: Country is required`);
      }
      if (!assignment.assignedTo.trim()) {
        errors.push(`Assignment ${index + 1}: Assigned person is required`);
      }
      if (!assignment.deadline) {
        errors.push(`Assignment ${index + 1}: Deadline is required`);
      } else {
        const deadline = new Date(assignment.deadline);
        const today = new Date();
        if (deadline <= today) {
          errors.push(`Assignment ${index + 1}: Deadline must be in the future`);
        }
      }
    });

    return errors;
  };

  const handleSave = async () => {
    if (!selectedResolution) {
      setError('Please select a resolution first');
      return;
    }

    const validationErrors = validateAssignments();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const assignmentData = assignments.map(assignment => ({
        countryId: assignment.countryId,
        assignedTo: assignment.assignedTo,
        deadline: assignment.deadline,
        priority: assignment.priority,
        notes: assignment.notes
      }));

      await assignResolution(selectedResolution.id, user.id, assignmentData);
      setSuccess('Resolution assignments saved successfully!');
      
      // Clear form after 2 seconds
      setTimeout(() => {
        setSelectedResolution(null);
        setAssignments([]);
        setSuccess('');
      }, 2000);

    } catch (error) {
      console.error('Error saving assignments:', error);
      setError('Failed to save assignments. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ASSIGNED':
        return '#3b82f6';
      case 'IN_PROGRESS':
        return '#f59e0b';
      case 'COMPLETED':
        return '#10b981';
      case 'OVERDUE':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="resolution-assignment-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading resolutions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resolution-assignment-container">
      <div className="header">
        <div className="header-content">
          <h2 className="page-title">
            <FaFileAlt className="title-icon" />
            Resolution Assignment
          </h2>
          <p className="page-subtitle">Assign resolutions to countries and track progress</p>
        </div>
      </div>

      <div className="assignment-content">
        {/* Resolution Selection */}
        <div className="resolution-selection">
          <h3>Select Resolution to Assign</h3>
          
          {error && (
            <div className="error-banner">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-banner">
              <span>{success}</span>
            </div>
          )}

          <div className="resolutions-list">
            {resolutions.filter(r => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS').map(resolution => (
              <div
                key={resolution.id}
                className={`resolution-item ${selectedResolution?.id === resolution.id ? 'selected' : ''}`}
                onClick={() => handleResolutionSelect(resolution)}
              >
                <div className="resolution-info">
                  <h4>{resolution.title}</h4>
                  <p className="resolution-description">{resolution.description}</p>
                  <div className="resolution-meta">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(resolution.status) }}
                    >
                      {resolution.status.replace('_', ' ')}
                    </span>
                    {resolution.meeting && (
                      <span className="meeting-info">
                        From: {resolution.meeting.title} ({formatDate(resolution.meeting.meetingDate)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Form */}
        {selectedResolution && (
          <div className="assignment-form">
            <div className="form-header">
              <h3>Assign: {selectedResolution.title}</h3>
              <button
                onClick={addAssignment}
                className="btn btn-secondary"
                disabled={saving}
              >
                <FaPlus className="btn-icon" />
                Add Assignment
              </button>
            </div>

            <div className="assignments-list">
              {assignments.map((assignment, index) => (
                <div key={assignment.id} className="assignment-item">
                  <div className="assignment-header">
                    <h4>Assignment {index + 1}</h4>
                    {assignments.length > 1 && (
                      <button
                        onClick={() => removeAssignment(assignment.id)}
                        className="btn btn-delete btn-sm"
                        disabled={saving}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>

                  <div className="assignment-form-grid">
                    <div className="form-group">
                      <label>Country *</label>
                      <select
                        value={assignment.countryId}
                        onChange={(e) => updateAssignment(assignment.id, 'countryId', e.target.value)}
                        disabled={saving}
                      >
                        <option value="">Select Country</option>
                        {countries.map(country => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Assigned To *</label>
                      <input
                        type="text"
                        value={assignment.assignedTo}
                        onChange={(e) => updateAssignment(assignment.id, 'assignedTo', e.target.value)}
                        placeholder="Enter person's name or role"
                        disabled={saving}
                      />
                    </div>

                    <div className="form-group">
                      <label>Deadline *</label>
                      <input
                        type="date"
                        value={assignment.deadline}
                        onChange={(e) => updateAssignment(assignment.id, 'deadline', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        disabled={saving}
                      />
                    </div>

                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        value={assignment.priority}
                        onChange={(e) => updateAssignment(assignment.id, 'priority', e.target.value)}
                        disabled={saving}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      value={assignment.notes}
                      onChange={(e) => updateAssignment(assignment.id, 'notes', e.target.value)}
                      placeholder="Add any additional notes or instructions"
                      rows="3"
                      disabled={saving}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button
                onClick={() => setSelectedResolution(null)}
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={saving || assignments.length === 0}
              >
                {saving ? (
                  <>
                    <FaSpinner className="btn-icon spinning" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheck className="btn-icon" />
                    Save Assignments
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResolutionAssignment;