import React, { useState, useEffect } from 'react';
import {
  FaSave,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle,
  FaChevronDown,
  FaTasks,
  FaInfoCircle,
  FaCalendarAlt,
  FaCheckCircle,
} from 'react-icons/fa';
import './TaskDescriptionForm.css';

/**
 * TaskDescriptionForm Component
 * Allows Committee Secretary to add descriptions and deadlines to TC tasks
 * Used in Subcommittee meetings to complete task setup
 */
const TaskDescriptionForm = ({ subcommitteeId, onComplete }) => {
  const [tasks, setTasks] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [taskData, setTaskData] = useState({});

  useEffect(() => {
    if (subcommitteeId) {
      loadTasksAwaitingDescription();
    }
  }, [subcommitteeId]);

  const loadTasksAwaitingDescription = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/secretary/tasks/awaiting-description/${subcommitteeId}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTasks(data.tasks || []);
          // Initialize task data
          const initialData = {};
          data.tasks.forEach((task) => {
            initialData[task.id] = {
              description: task.description || '',
              deadline: task.deadline || '',
            };
          });
          setTaskData(initialData);
        }
      } else {
        setError('Failed to load tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (taskId) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const handleInputChange = (taskId, field, value) => {
    setTaskData({
      ...taskData,
      [taskId]: {
        ...taskData[taskId],
        [field]: value,
      },
    });
  };

  const handleSaveTask = async (taskId) => {
    const data = taskData[taskId];

    if (!data.description || data.description.trim() === '') {
      setError('Task description is required');
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

      // Format deadline for backend (ISO 8601)
      let deadlineISO = null;
      if (data.deadline) {
        deadlineISO = new Date(data.deadline).toISOString();
      }

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/secretary/tasks/${taskId}/complete-setup`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            description: data.description.trim(),
            deadline: deadlineISO,
            secretaryId: user.id,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('Task setup completed successfully!');
        // Remove task from list
        setTasks(tasks.filter((t) => t.id !== taskId));
        setExpandedTaskId(null);

        if (onComplete) {
          onComplete(taskId);
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setError('Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="task-description-form loading">
        <FaSpinner className="spinner" />
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="task-description-form">
      <div className="form-header">
        <h3>Complete Task Setup</h3>
        <p className="form-description">
          Add descriptions and deadlines to tasks from Technical Committee meetings
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <FaCheck />
          <span>{success}</span>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="empty-state">
          <FaCheckCircle />
          <h4>All Tasks Complete!</h4>
          <p>
            There are no tasks awaiting description. All TC tasks have been set up.
          </p>
        </div>
      ) : (
        <>
          <div className="alert alert-info">
            <FaInfoCircle />
            <span>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} awaiting description
            </span>
          </div>

          <div className="tasks-list">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${
                  expandedTaskId === task.id ? 'expanded' : ''
                }`}
              >
                <div
                  className="task-card-header"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="task-title-section">
                    <span className="task-badge">
                      <FaTasks /> TC Task
                    </span>
                    <h4 className="task-title">{task.title}</h4>
                  </div>
                  <FaChevronDown
                    className={`expand-icon ${
                      expandedTaskId === task.id ? 'expanded' : ''
                    }`}
                  />
                </div>

                {expandedTaskId === task.id && (
                  <div className="task-card-body">
                    {task.resolution && (
                      <div className="task-meta">
                        <div className="task-meta-item">
                          <strong>Resolution:</strong> {task.resolution.title}
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor={`description-${task.id}`}>
                        Task Description <span className="required">*</span>
                      </label>
                      <textarea
                        id={`description-${task.id}`}
                        className="form-control"
                        value={taskData[task.id]?.description || ''}
                        onChange={(e) =>
                          handleInputChange(task.id, 'description', e.target.value)
                        }
                        placeholder="Provide detailed description of what needs to be done..."
                        disabled={saving}
                        rows={5}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`deadline-${task.id}`}>
                        Deadline <FaCalendarAlt />
                      </label>
                      <input
                        type="datetime-local"
                        id={`deadline-${task.id}`}
                        className="form-control"
                        value={taskData[task.id]?.deadline || ''}
                        onChange={(e) =>
                          handleInputChange(task.id, 'deadline', e.target.value)
                        }
                        disabled={saving}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>

                    <div className="task-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setExpandedTaskId(null)}
                        disabled={saving}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleSaveTask(task.id)}
                        disabled={
                          saving ||
                          !taskData[task.id]?.description ||
                          taskData[task.id]?.description.trim() === ''
                        }
                      >
                        {saving ? (
                          <>
                            <FaSpinner className="spinner" /> Saving...
                          </>
                        ) : (
                          <>
                            <FaSave /> Complete Task Setup
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TaskDescriptionForm;
