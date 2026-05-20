import React, { useState, useEffect } from 'react';
import {
  FaTasks, FaUserPlus, FaTrash, FaSave, FaTimes, FaSpinner,
  FaExclamationTriangle, FaCheckCircle, FaArrowLeft, FaInfoCircle, FaStar
} from 'react-icons/fa';
import ChairService from '../../services/chairService';
import './ChairmanTaskAssignment.css';

const ChairmanTaskAssignment = ({ resolution, onBack, currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New task form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedToId: ''
  });

  // Chair ranking state
  const [rankingTaskId, setRankingTaskId] = useState(null);
  const [chairRanking, setChairRanking] = useState(0);
  const [chairFeedback, setChairFeedback] = useState('');
  const [rankingSubmitting, setRankingSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [resolution.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [tasksData, membersData] = await Promise.all([
        ChairService.getSubTasksByResolution(resolution.id),
        ChairService.getSubcommitteeMembers(currentUser.subcommitteeId)
      ]);

      setTasks(tasksData);
      setMembers(membersData);
    } catch (err) {
      console.error('Error fetching task assignment data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedToId) {
      setError('Title and Assigned Member are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        resolution: { id: resolution.id },
        meeting: resolution.meeting ? { id: resolution.meeting.id } : null,
        assignedTo: { id: parseInt(newTask.assignedToId) },
        subcommitteeId: currentUser.subcommitteeId
      };

      const savedTask = await ChairService.createSubTask(taskData);
      setTasks([...tasks, savedTask]);
      setSuccess('Task assigned successfully!');
      setShowAddForm(false);
      setNewTask({ title: '', description: '', assignedToId: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to assign task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task assignment?')) return;

    try {
      setSubmitting(true);
      await ChairService.deleteSubTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      setSuccess('Task assignment deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete task');
    } finally {
      setSubmitting(false);
    }
  };

  const getMemberName = (memberId) => {
    if (memberId == null) return 'Unknown';
    const member = members.find((m) => String(m.id) === String(memberId));
    return member?.name || member?.fullName || member?.user?.name || 'Unknown';
  };

  const getAssignedDisplayName = (task) => {
    if (!task) return 'Unknown';
    const directName = task.assignedTo?.name || task.assignedTo?.fullName || task.assignedTo?.user?.name;
    if (directName) return directName;

    const assignedId = task.assignedTo?.id || task.assignedToId || task.assigneeId || task.memberId;
    return getMemberName(assignedId);
  };

  const handleOpenRanking = (taskId) => {
    setRankingTaskId(taskId);
    const task = tasks.find(t => t.id === taskId);
    setChairRanking(task?.chairRanking || 0);
    setChairFeedback(task?.chairFeedback || '');
  };

  const handleSubmitRanking = async () => {
    if (!chairRanking) {
      setError('Please select a ranking (1-5)');
      return;
    }
    try {
      setRankingSubmitting(true);
      setError('');
      await ChairService.chairRankSubTask(rankingTaskId, chairRanking, chairFeedback);
      setSuccess('Member work ranked successfully!');
      setRankingTaskId(null);
      setChairRanking(0);
      setChairFeedback('');
      await fetchData(); // refresh
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit ranking');
    } finally {
      setRankingSubmitting(false);
    }
  };

  const rankingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (loading) {
    return (
      <div className="task-assignment-loading">
        <FaSpinner className="spinner" />
        <p>Loading member tasks...</p>
      </div>
    );
  }

  return (
    <div className="chairman-task-assignment">
      <div className="assignment-header">
        <button className="back-btn" onClick={onBack}>
          <FaArrowLeft /> Back
        </button>
        <h2>Assign Tasks to Members</h2>
        <p className="resolution-ref">Resolution: {resolution.title}</p>
      </div>

      {error && <div className="alert alert-error"><FaExclamationTriangle /> {error}</div>}
      {success && <div className="alert alert-success"><FaCheckCircle /> {success}</div>}

      <div className="assignment-actions">
        {!showAddForm && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <FaUserPlus /> Assign New Task
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="add-task-form card">
          <h3>Assign New Sub-Task</h3>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label>Task Title*</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task details"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Assign To Member*</label>
              <select
                value={newTask.assignedToId}
                onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                required
              >
                <option value="">Select a member</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.position || 'Member'})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <FaSpinner className="spinner" /> : <FaSave />} Save Assignment
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tasks-list">
        <h3>Current Member Assignments ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <div className="empty-state">
            <FaTasks className="empty-icon" />
            <p>No tasks have been assigned to members yet.</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map(task => (
              <div key={task.id} className="task-item-card">
                <div className="task-item-header">
                  <h4>{task.title}</h4>
                  <span className={`status-badge ${task.status.toLowerCase()}`}>
                    {task.status}
                  </span>
                </div>
                <p className="task-item-desc">{task.description}</p>

                {task.progressNote && (
                  <div className="task-progress-note">
                    <FaInfoCircle style={{ color: 'var(--theme-accent, #3b82f6)', marginRight: 6, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong style={{ fontSize: '0.75rem', color: 'var(--theme-text-1, #f8fafc)' }}>Member's Progress Report:</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--theme-text-2, #b8c5da)', lineHeight: 1.4 }}>{task.progressNote}</p>
                    </div>
                  </div>
                )}

                {task.updatedAt && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--theme-text-3, #8fa1bf)', marginTop: 6 }}>
                    Last updated: {new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                {/* Member submission notes (chair reviews these before ranking) */}
                {task.status === 'DONE' && (task.workingDescription || task.notWorkingDescription) && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(37, 99, 235, 0.14)', borderRadius: 8, border: '1px solid rgba(37, 99, 235, 0.4)' }}>
                    <strong style={{ fontSize: '0.78rem', color: 'var(--theme-accent, #3b82f6)' }}>Member Submission Notes</strong>
                    {task.workingDescription && (
                      <div style={{ fontSize: '0.78rem', color: '#6ee7b7', marginTop: 4 }}>
                        <strong>Working well:</strong> {task.workingDescription}
                      </div>
                    )}
                    {task.notWorkingDescription && (
                      <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: 4 }}>
                        <strong>Not working:</strong> {task.notWorkingDescription}
                      </div>
                    )}
                  </div>
                )}

                {/* Chair's Ranking (if already ranked) */}
                {task.chairRanking && (
                  <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(245, 158, 11, 0.16)', borderRadius: 6, fontSize: '0.78rem', color: '#fcd34d' }}>
                    <FaStar style={{ color: '#f59e0b', marginRight: 4 }} />
                    Your Ranking: <strong>{task.chairRanking}/5</strong> ({rankingLabels[task.chairRanking - 1]})
                    {task.chairFeedback && <span> — {task.chairFeedback}</span>}
                  </div>
                )}

                <div className="task-item-footer">
                  <div className="assigned-to">
                    <FaInfoCircle />
                    <span>Assigned to: <strong>{getAssignedDisplayName(task)}</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {task.status === 'DONE' && (
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                        onClick={() => handleOpenRanking(task.id)}
                        title="Rate this member's work"
                      >
                        <FaStar style={{ marginRight: 4 }} />
                        {task.chairRanking ? 'Re-Rank' : 'Rank Work'}
                      </button>
                    )}
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Delete assignment"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chair Ranking Modal */}
      {rankingTaskId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'var(--theme-surface-2, #101826)', border: '1px solid var(--theme-border, #24344c)', borderRadius: 12, padding: 24, width: '90%',
            maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1.1rem' }}>
              <FaStar style={{ color: '#f59e0b', marginRight: 8 }} />
              Rank Member's Work
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--theme-text-2, #b8c5da)', marginBottom: 16 }}>
              Rate the quality of work on: <strong>{tasks.find(t => t.id === rankingTaskId)?.title}</strong>
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Your Rating (1-5) *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setChairRanking(star)}
                    style={{
                      width: 44, height: 44, borderRadius: '50%', border: 'none',
                      fontSize: '1.1rem', cursor: 'pointer', fontWeight: 700,
                      background: chairRanking >= star ? '#f59e0b' : '#e5e7eb',
                      color: chairRanking >= star ? 'var(--theme-text-1, #f8fafc)' : 'var(--theme-text-2, #b8c5da)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {star}
                  </button>
                ))}
              </div>
              {chairRanking > 0 && (
                <p style={{ fontSize: '0.78rem', color: 'var(--theme-text-2, #b8c5da)', marginTop: 4 }}>
                  {rankingLabels[chairRanking - 1]} ({chairRanking}/5)
                </p>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Feedback (optional)</label>
              <textarea
                value={chairFeedback}
                onChange={(e) => setChairFeedback(e.target.value)}
                placeholder="Provide feedback to the member..."
                rows="3"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6,
                  border: '1px solid var(--theme-border, #24344c)', fontSize: '0.85rem', resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setRankingTaskId(null); setChairRanking(0); setChairFeedback(''); }}
                disabled={rankingSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitRanking}
                disabled={rankingSubmitting || !chairRanking}
              >
                {rankingSubmitting ? <><FaSpinner className="spinner" /> Submitting...</> : <><FaStar style={{ marginRight: 4 }} /> Submit Ranking</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChairmanTaskAssignment;
