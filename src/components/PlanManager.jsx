import React, { useState, useEffect } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSpinner,
  FaCalendar, FaFlag, FaChartLine, FaStickyNote
} from 'react-icons/fa';
import './PlanManager.css';

/**
 * PlanManager Component
 * Allows creating and managing execution plans for subtasks
 */
const PlanManager = ({ subTaskId, onClose }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'MEDIUM',
    notes: ''
  });

  useEffect(() => {
    if (subTaskId) {
      loadPlans();
    }
  }, [subTaskId]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/plans/subtask/${subTaskId}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setPlans(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load plans');
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setError('Failed to load plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      priority: 'MEDIUM',
      notes: ''
    });
    setEditingPlan(null);
    setShowForm(false);
  };

  const handleEdit = (plan) => {
    setFormData({
      title: plan.title || '',
      description: plan.description || '',
      startDate: plan.startDate ? plan.startDate.substring(0, 10) : '',
      endDate: plan.endDate ? plan.endDate.substring(0, 10) : '',
      priority: plan.priority || 'MEDIUM',
      notes: plan.notes || ''
    });
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Plan title is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not authenticated');
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        priority: formData.priority,
        notes: formData.notes.trim(),
        subTask: { id: subTaskId }
      };

      const url = editingPlan
        ? `${process.env.REACT_APP_BASE_URL}/plans/${editingPlan.id}`
        : `${process.env.REACT_APP_BASE_URL}/plans`;

      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess(editingPlan ? 'Plan updated successfully!' : 'Plan created successfully!');
        resetForm();
        loadPlans();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      setError('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/plans/${planId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        setSuccess('Plan deleted successfully!');
        loadPlans();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError('Failed to delete plan. Please try again.');
    }
  };

  const updateProgress = async (planId, progressPercentage) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/plans/${planId}/progress`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ progressPercentage })
        }
      );

      if (response.ok) {
        loadPlans();
      } else {
        setError('Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      setError('Failed to update progress');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: '#10b981',
      MEDIUM: '#3b82f6',
      HIGH: '#f59e0b',
      URGENT: '#ef4444'
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: '#6b7280',
      ACTIVE: '#3b82f6',
      ON_HOLD: '#f59e0b',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444'
    };
    return colors[status] || colors.DRAFT;
  };

  if (loading) {
    return (
      <div className="plan-manager loading">
        <FaSpinner className="spinner" />
        <p>Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="plan-manager">
      <div className="plan-manager-header">
        <h3>Execution Plans</h3>
        <div className="header-actions">
          {!showForm && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <FaPlus /> Create Plan
            </button>
          )}
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose}>
              <FaTimes /> Close
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <FaCheck /> {success}
        </div>
      )}

      {showForm && (
        <form className="plan-form" onSubmit={handleSubmit}>
          <h4>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h4>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Plan title..."
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the plan..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><FaCalendar /> Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label><FaCalendar /> End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
              />
            </div>

            <div className="form-group">
              <label><FaFlag /> Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label><FaStickyNote /> Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <FaSpinner className="spinner" /> : <FaCheck />}
              {saving ? ' Saving...' : editingPlan ? ' Update Plan' : ' Create Plan'}
            </button>
          </div>
        </form>
      )}

      <div className="plans-list">
        {plans.length === 0 ? (
          <div className="empty-state">
            <FaChartLine />
            <p>No plans created yet</p>
            <small>Create a plan to organize task execution</small>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="plan-card">
              <div className="plan-header">
                <h4>{plan.title}</h4>
                <div className="plan-badges">
                  <span
                    className="badge"
                    style={{ backgroundColor: getPriorityColor(plan.priority) }}
                  >
                    {plan.priority}
                  </span>
                  <span
                    className="badge"
                    style={{ backgroundColor: getStatusColor(plan.status) }}
                  >
                    {plan.status}
                  </span>
                </div>
              </div>

              {plan.description && <p className="plan-description">{plan.description}</p>}

              <div className="plan-dates">
                {plan.startDate && (
                  <span>
                    <FaCalendar /> Start: {new Date(plan.startDate).toLocaleDateString()}
                  </span>
                )}
                {plan.endDate && (
                  <span>
                    <FaCalendar /> End: {new Date(plan.endDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="plan-progress">
                <label>
                  <FaChartLine /> Progress: {plan.progressPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={plan.progressPercentage}
                  onChange={(e) => updateProgress(plan.id, parseInt(e.target.value))}
                  className="progress-slider"
                />
              </div>

              {plan.notes && (
                <div className="plan-notes">
                  <FaStickyNote /> {plan.notes}
                </div>
              )}

              <div className="plan-actions">
                <button className="btn-icon" onClick={() => handleEdit(plan)} title="Edit">
                  <FaEdit />
                </button>
                <button className="btn-icon danger" onClick={() => handleDelete(plan.id)} title="Delete">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlanManager;
