import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaPlus, FaTrash, FaCheckCircle, FaSpinner,
  FaTasks, FaSave, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import http from '../../services/http';
import './CommitteeSecretaryTaskManagement.css';

/**
 * Committee Secretary Task Management
 * After taking minutes for a Subcommittee meeting, the Committee Secretary:
 * 1. Views existing parent tasks (created by Delegation Secretary)
 * 2. Adds descriptions & deadlines to parent tasks
 * 3. Creates sub-tasks under those parent tasks
 */
const CommitteeSecretaryTaskManagement = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  const [meeting, setMeeting] = useState(null);
  const [parentTasks, setParentTasks] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Track task updates
  const [taskUpdates, setTaskUpdates] = useState({});
  // Track sub-tasks per parent task
  const [subTasks, setSubTasks] = useState({});

  useEffect(() => {
    loadData();
  }, [meetingId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load meeting details
      const meetingRes = await http.get(`/meetings/${meetingId}`);
      setMeeting(meetingRes.data);

      // Load parent tasks for this meeting
      const tasksRes = await http.get(`/sub-tasks/meeting/${meetingId}`);
      const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      
      // Filter only parent tasks (tasks without parent, or tasks that need description)
      const parentTasksList = tasks.filter(t => t.requiresDescription || !t.description);
      setParentTasks(parentTasksList);

      // Initialize task updates
      const updates = {};
      parentTasksList.forEach(task => {
        updates[task.id] = {
          description: task.description || '',
          deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
        };
      });
      setTaskUpdates(updates);

      // Initialize sub-tasks (empty arrays for each parent)
      const subs = {};
      parentTasksList.forEach(task => {
        subs[task.id] = [];
      });
      setSubTasks(subs);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load meeting data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const updateTaskField = (taskId, field, value) => {
    setTaskUpdates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value
      }
    }));
  };

  const addSubTask = (parentTaskId) => {
    setSubTasks(prev => ({
      ...prev,
      [parentTaskId]: [
        ...prev[parentTaskId],
        {
          id: Date.now() + Math.random(),
          title: '',
          description: '',
          isNew: true
        }
      ]
    }));
  };

  const removeSubTask = (parentTaskId, subTaskId) => {
    setSubTasks(prev => ({
      ...prev,
      [parentTaskId]: prev[parentTaskId].filter(st => st.id !== subTaskId)
    }));
  };

  const updateSubTask = (parentTaskId, subTaskId, field, value) => {
    setSubTasks(prev => ({
      ...prev,
      [parentTaskId]: prev[parentTaskId].map(st =>
        st.id === subTaskId ? { ...st, [field]: value } : st
      )
    }));
  };

  const saveTask = async (taskId) => {
    const updates = taskUpdates[taskId];
    const taskSubTasks = subTasks[taskId] || [];

    // Validation
    if (!updates.description || !updates.description.trim()) {
      setError('Task description is required');
      return;
    }

    if (!updates.deadline) {
      setError('Task deadline is required');
      return;
    }

    // Validate sub-tasks
    const validSubTasks = taskSubTasks.filter(st => st.title && st.title.trim());
    for (const st of validSubTasks) {
      if (!st.description || !st.description.trim()) {
        setError('All sub-tasks must have a description');
        return;
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // 1. Update parent task description and deadline
      await http.put(`/secretary/tasks/${taskId}/complete-setup`, {
        description: updates.description.trim(),
        deadline: new Date(updates.deadline).toISOString(),
        secretaryId: currentUser.id
      });

      // 2. Create sub-tasks
      for (const subTask of validSubTasks) {
        const parentTask = parentTasks.find(t => t.id === taskId);
        await http.post('/sub-tasks', {
          title: subTask.title.trim(),
          description: subTask.description.trim(),
          resolution: parentTask.resolution ? { id: parentTask.resolution.id } : null,
          meeting: { id: meetingId },
          subcommitteeId: parentTask.subcommitteeId,
          status: 'TODO',
          requiresDescription: false
        });
      }

      setSuccess('Task and sub-tasks saved successfully!');
      
      // Remove task from list
      setParentTasks(prev => prev.filter(t => t.id !== taskId));
      setExpandedTaskId(null);

      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error saving task:', err);
      const msg = err?.response?.data?.error || err.message || 'Unknown error';
      setError(`Failed to save: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = () => {
    navigate('/secretary/dashboard');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }) : '';

  if (loading) {
    return (
      <div className="csm-page">
        <div className="csm-loading"><FaSpinner className="spin" /> Loading...</div>
      </div>
    );
  }

  return (
    <div className="csm-page">
      {/* Header */}
      <div className="csm-topbar">
        <button className="csm-back-btn" onClick={() => navigate('/secretary/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <div className="csm-title-block">
          <h1><FaTasks /> Task Management</h1>
          {meeting && (
            <p className="csm-meeting-subtitle">
              {meeting.title} — {formatDate(meeting.meetingDate)}
            </p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="csm-alert csm-alert-error">
          {error} <button onClick={() => setError('')}>×</button>
        </div>
      )}
      {success && (
        <div className="csm-alert csm-alert-success">
          <FaCheckCircle /> {success} <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Instructions */}
      <div className="csm-instructions">
        <h3>Complete Task Setup</h3>
        <p>Add descriptions, deadlines, and create sub-tasks for each parent task created by the Delegation Secretary.</p>
      </div>

      {/* Tasks List */}
      {parentTasks.length === 0 ? (
        <div className="csm-empty">
          <FaCheckCircle className="csm-empty-icon" />
          <h3>All Tasks Complete!</h3>
          <p>All tasks have been set up with descriptions and deadlines.</p>
          <button className="csm-btn csm-btn-primary" onClick={handleComplete}>
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="csm-tasks-list">
          {parentTasks.map(task => (
            <div key={task.id} className={`csm-task-card ${expandedTaskId === task.id ? 'expanded' : ''}`}>
              {/* Task Header */}
              <div className="csm-task-header" onClick={() => toggleTaskExpansion(task.id)}>
                <div className="csm-task-title-section">
                  <span className="csm-task-badge">Parent Task</span>
                  <h4>{task.title}</h4>
                </div>
                {expandedTaskId === task.id ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {/* Task Body (Expanded) */}
              {expandedTaskId === task.id && (
                <div className="csm-task-body">
                  {/* Parent Task Description */}
                  <div className="csm-form-group">
                    <label>Task Description *</label>
                    <textarea
                      value={taskUpdates[task.id]?.description || ''}
                      onChange={(e) => updateTaskField(task.id, 'description', e.target.value)}
                      placeholder="Describe what needs to be done..."
                      rows={4}
                      disabled={saving}
                    />
                  </div>

                  {/* Parent Task Deadline */}
                  <div className="csm-form-group">
                    <label>Deadline *</label>
                    <input
                      type="datetime-local"
                      value={taskUpdates[task.id]?.deadline || ''}
                      onChange={(e) => updateTaskField(task.id, 'deadline', e.target.value)}
                      disabled={saving}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  {/* Sub-Tasks Section */}
                  <div className="csm-subtasks-section">
                    <div className="csm-subtasks-header">
                      <h5>Sub-Tasks ({(subTasks[task.id] || []).length})</h5>
                      <button
                        className="csm-btn csm-btn-sm csm-btn-outline"
                        onClick={() => addSubTask(task.id)}
                        disabled={saving}
                      >
                        <FaPlus /> Add Sub-Task
                      </button>
                    </div>

                    {(subTasks[task.id] || []).map((subTask, idx) => (
                      <div key={subTask.id} className="csm-subtask-card">
                        <div className="csm-subtask-header">
                          <span>Sub-Task {idx + 1}</span>
                          <button
                            className="csm-btn-icon danger"
                            onClick={() => removeSubTask(task.id, subTask.id)}
                            disabled={saving}
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <div className="csm-form-group">
                          <label>Sub-Task Title *</label>
                          <input
                            type="text"
                            value={subTask.title}
                            onChange={(e) => updateSubTask(task.id, subTask.id, 'title', e.target.value)}
                            placeholder="e.g. Review documentation"
                            disabled={saving}
                          />
                        </div>

                        <div className="csm-form-group">
                          <label>Sub-Task Description *</label>
                          <textarea
                            value={subTask.description}
                            onChange={(e) => updateSubTask(task.id, subTask.id, 'description', e.target.value)}
                            placeholder="Describe this sub-task..."
                            rows={3}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="csm-task-actions">
                    <button
                      className="csm-btn csm-btn-secondary"
                      onClick={() => setExpandedTaskId(null)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      className="csm-btn csm-btn-primary"
                      onClick={() => saveTask(task.id)}
                      disabled={saving}
                    >
                      {saving ? <><FaSpinner className="spin" /> Saving...</> : <><FaSave /> Save Task</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Complete Button */}
      {parentTasks.length > 0 && (
        <div className="csm-complete-section">
          <button className="csm-btn csm-btn-outline" onClick={handleComplete}>
            Done — Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default CommitteeSecretaryTaskManagement;
