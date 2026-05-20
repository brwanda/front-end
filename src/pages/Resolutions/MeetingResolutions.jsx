import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FaArrowLeft, FaPlus, FaTrash, FaCheckCircle, FaSpinner,
  FaFileAlt, FaUsers, FaClipboardList, FaSave
} from 'react-icons/fa';
import http from '../../services/http';
import './MeetingResolutions.css';

const MeetingResolutions = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  /* Dashboard path based on role — used by the back button */
  const getDashboardPath = () => {
    const role = currentUser?.role;
    if (role === 'SECRETARY') return '/secretary/dashboard';
    if (role === 'CHAIR' || role === 'VICE_CHAIR') return '/chair/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'COMMISSIONER_GENERAL') return '/commissioner/dashboard';
    return '/dashboard';
  };

  const [meeting, setMeeting] = useState(null);
  const [existingResolutions, setExistingResolutions] = useState([]);
  const [cgResolutions, setCgResolutions] = useState([]); // CG resolutions for TC meetings
  const [subcommittees, setSubcommittees] = useState([]);
  const [countries, setCountries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentRole = currentUser?.role || '';
  const isDelegationSecretary = currentRole === 'DELEGATION_SECRETARY';
  const isCommitteeSecretary = currentRole === 'COMMITTEE_SECRETARY';
  const isCommissionerGeneralMeeting = meeting?.meetingType === 'COMMISSIONER_GENERAL_MEETING';
  const isTechnicalMeeting = meeting?.meetingType === 'TECHNICAL_MEETING';
  const isSubcommitteeMeeting = meeting?.meetingType === 'SUBCOMMITTEE_MEETING';
  const routeTaskMode = location.pathname.endsWith('/tasks');

  const delegationCgTitleOnly = isDelegationSecretary && isCommissionerGeneralMeeting;
  const delegationTechnicalTaskOnly = isDelegationSecretary && isTechnicalMeeting && routeTaskMode;
  const delegationTechnicalTaskTitleOnly = isDelegationSecretary && isTechnicalMeeting;
  const committeeSecretaryStrictTasks = isCommitteeSecretary && isSubcommitteeMeeting;

  /** Draft resolutions the user is building */
  const [newResolutions, setNewResolutions] = useState([createBlankResolution()]);
  const [newTasks, setNewTasks] = useState([createBlankTask()]);

  function createBlankResolution() {
    return {
      id: Date.now() + Math.random(),
      title: '',
      description: '',
      tasks: [createBlankTask()]
    };
  }

  function createBlankTask() {
    return {
      id: Date.now() + Math.random(),
      title: '',
      description: '',
      assigneeType: 'SUBCOMMITTEE', // SUBCOMMITTEE | COUNTRY | DELEGATION
      subcommitteeId: '',
      countryId: '',
      deadline: '',
      resolutionId: '' // For linking tasks to CG resolutions in TC meetings
    };
  }

  // ── Data loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [meetingRes, resRes, subRes, countryRes] = await Promise.allSettled([
          http.get(`/meetings/${meetingId}`),
          http.get(`/resolutions/meeting/${meetingId}`),
          http.get('/sub-committees'),
          http.get('/countries'),
        ]);

        if (meetingRes.status === 'fulfilled') {
          const meetingData = meetingRes.value.data;
          setMeeting(meetingData);
          
          // If this is a TC meeting, load CG resolutions
          if (meetingData.meetingType === 'TECHNICAL_MEETING') {
            try {
              // Get all resolutions and filter for CG meetings
              const allResRes = await http.get('/resolutions');
              if (allResRes.data) {
                const cgResos = Array.isArray(allResRes.data) 
                  ? allResRes.data.filter(r => r.meeting?.meetingType === 'COMMISSIONER_GENERAL_MEETING')
                  : [];
                setCgResolutions(cgResos);
              }
            } catch (err) {
              console.warn('Could not load CG resolutions:', err);
            }
          }
        }
        
        if (resRes.status === 'fulfilled')
          setExistingResolutions(Array.isArray(resRes.value.data) ? resRes.value.data : []);
        if (subRes.status === 'fulfilled')
          setSubcommittees(Array.isArray(subRes.value.data) ? subRes.value.data : []);
        if (countryRes.status === 'fulfilled')
          setCountries(Array.isArray(countryRes.value.data) ? countryRes.value.data : []);
      } catch (err) {
        setError('Failed to load meeting data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [meetingId]);

  // ── Resolution helpers ──────────────────────────────────────────────────────
  const addResolution = () =>
    setNewResolutions(prev => [...prev, createBlankResolution()]);

  const removeResolution = (rid) =>
    setNewResolutions(prev => prev.filter(r => r.id !== rid));

  const updateResolution = (rid, field, value) =>
    setNewResolutions(prev => prev.map(r => r.id === rid ? { ...r, [field]: value } : r));

  // ── Task helpers ────────────────────────────────────────────────────────────
  const addTask = (resolutionId) =>
    setNewResolutions(prev => prev.map(r =>
      r.id === resolutionId ? { ...r, tasks: [...r.tasks, createBlankTask()] } : r
    ));

  const removeTask = (resolutionId, taskId) =>
    setNewResolutions(prev => prev.map(r =>
      r.id === resolutionId ? { ...r, tasks: r.tasks.filter(t => t.id !== taskId) } : r
    ));

  const updateTask = (resolutionId, taskId, field, value) =>
    setNewResolutions(prev => prev.map(r =>
      r.id === resolutionId ? {
        ...r,
        tasks: r.tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t)
      } : r
    ));

  const addStandaloneTask = () =>
    setNewTasks(prev => [...prev, createBlankTask()]);

  const removeStandaloneTask = (taskId) =>
    setNewTasks(prev => prev.filter(t => t.id !== taskId));

  const updateStandaloneTask = (taskId, field, value) =>
    setNewTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (delegationTechnicalTaskOnly) {
      const titledTasks = newTasks
        .map(t => ({
          ...t,
          title: (t.title || '').trim(),
          description: (t.description || '').trim()
        }))
        .filter(t => t.title);

      if (titledTasks.length === 0) {
        setError('Please add at least one task title.');
        return;
      }

      const hasDescription = titledTasks.some(t => t.description);
      if (hasDescription) {
        setError('For technical meetings in delegation secretary flow, task description is not allowed.');
        return;
      }

      setSaving(true);
      setError('');
      setSuccess('');
      try {
        const tasksPayload = titledTasks.map(t => ({
          title: t.title,
          description: '',
          assigneeType: t.assigneeType,
          subcommitteeId: t.assigneeType === 'SUBCOMMITTEE' && t.subcommitteeId ? Number(t.subcommitteeId) : null,
          countryId: t.assigneeType !== 'SUBCOMMITTEE' && t.countryId ? Number(t.countryId) : null,
          deadline: null,
          resolutionId: t.resolutionId ? Number(t.resolutionId) : null // Link to CG resolution
        }));

        await http.post(`/meetings/${meetingId}/tasks`, { tasks: tasksPayload });
        setSuccess('Tasks saved successfully!');
        setNewTasks([createBlankTask()]);
      } catch (err) {
        const msg = err?.response?.data?.error || err.message || 'Unknown error';
        setError('Failed to save tasks: ' + msg);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Basic validation
    for (const res of newResolutions) {
      if (!res.title.trim()) { setError('All resolutions must have a title.'); return; }

      if (delegationCgTitleOnly && res.description.trim()) {
        setError('For Commissioner General meetings, delegation secretary can only save resolution titles.');
        return;
      }

      const titledTasks = res.tasks.filter(t => t.title.trim());

      if (delegationCgTitleOnly && titledTasks.length > 0) {
        setError('For Commissioner General meetings, delegation secretary cannot create tasks at this stage.');
        return;
      }

      if (committeeSecretaryStrictTasks && titledTasks.length === 0) {
        setError('Subcommittee secretary must add at least one task with description and timeline.');
        return;
      }

      if (committeeSecretaryStrictTasks) {
        const invalidTask = titledTasks.find(t => !t.description.trim() || !t.deadline);
        if (invalidTask) {
          setError('Subcommittee secretary tasks require both task description and timeline/deadline.');
          return;
        }
      }

      if (delegationTechnicalTaskTitleOnly) {
        const invalidTask = titledTasks.find(t => t.description.trim() || t.deadline);
        if (invalidTask) {
          setError('For technical meetings under delegation secretary, tasks must be title only.');
          return;
        }
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const resolutionPayload = newResolutions.map(r => ({
        title: r.title.trim(),
        description: delegationCgTitleOnly ? '' : r.description.trim(),
        tasks: r.tasks
          .filter(t => t.title.trim())
          .map(t => ({
            title: t.title.trim(),
            description: delegationTechnicalTaskTitleOnly ? '' : t.description.trim(),
            assigneeType: t.assigneeType,
            subcommitteeId: t.assigneeType === 'SUBCOMMITTEE' && t.subcommitteeId ? Number(t.subcommitteeId) : null,
            countryId: t.assigneeType !== 'SUBCOMMITTEE' && t.countryId ? Number(t.countryId) : null,
            deadline: committeeSecretaryStrictTasks ? (t.deadline || null) : null
          }))
      }));

      await http.post(`/meetings/${meetingId}/resolutions`, { resolutions: resolutionPayload });

      setSuccess('Resolutions and tasks saved successfully!');
      // Reload existing resolutions
      const { data } = await http.get(`/resolutions/meeting/${meetingId}`);
      setExistingResolutions(Array.isArray(data) ? data : []);
      setNewResolutions([createBlankResolution()]);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Unknown error';
      setError('Failed to save: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Formatting ───────────────────────────────────────────────────────────────
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }) : '';

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mr-page">
        <div className="mr-loading"><FaSpinner className="spin" /> Loading meeting data…</div>
      </div>
    );
  }

  return (
    <div className="mr-page">
      {/* ── Top bar with back button ─────────────────────────────────────── */}
      <div className="mr-topbar">
        <button className="mr-back-btn" onClick={() => navigate(getDashboardPath())}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <div className="mr-title-block">
          <h1>
            <FaClipboardList />
            {delegationCgTitleOnly ? ' Create Resolution' : delegationTechnicalTaskOnly ? ' Create Task' : ' Resolutions & Tasks'}
          </h1>
          {meeting && (
            <p className="mr-meeting-subtitle">
              {meeting.title} &mdash; {formatDate(meeting.meetingDate)}
            </p>
          )}
        </div>
      </div>

      {/* ── Alert banners ───────────────────────────────────────────────── */}
      {error && (
        <div className="mr-alert mr-alert-error">
          {error} <button onClick={() => setError('')}>×</button>
        </div>
      )}
      {success && (
        <div className="mr-alert mr-alert-success">
          <FaCheckCircle /> {success} <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* ── CG Resolutions for TC meetings ──────────────────────────────── */}
      {delegationTechnicalTaskOnly && cgResolutions.length > 0 && (
        <section className="mr-section">
          <h2 className="mr-section-title"><FaFileAlt /> Commissioner General Resolutions</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
            These resolutions were created in Commissioner General meetings. Create tasks to address them.
          </p>
          <div className="mr-existing-list">
            {cgResolutions.map(r => (
              <div key={r.id} className="mr-existing-card">
                <h3>{r.title}</h3>
                {r.description && <p>{r.description}</p>}
                <span className={`mr-status-badge ${r.status?.toLowerCase() || ''}`}>
                  {r.status?.replace('_', ' ') || 'PENDING'}
                </span>
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#64748b' }}>
                  From: {r.meeting?.title || 'CG Meeting'} ({formatDate(r.meeting?.meetingDate)})
                </small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Existing resolutions ────────────────────────────────────────── */}
      {!delegationTechnicalTaskOnly && existingResolutions.length > 0 && (
        <section className="mr-section">
          <h2 className="mr-section-title"><FaFileAlt /> Recorded Resolutions</h2>
          <div className="mr-existing-list">
            {existingResolutions.map(r => (
              <div key={r.id} className="mr-existing-card">
                <h3>{r.title}</h3>
                {r.description && <p>{r.description}</p>}
                <span className={`mr-status-badge ${r.status?.toLowerCase() || ''}`}>
                  {r.status?.replace('_', ' ') || 'PENDING'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── New resolutions form ─────────────────────────────────────────── */}
      <section className="mr-section">
        <div className="mr-section-header">
          <h2 className="mr-section-title">
            <FaPlus /> {delegationTechnicalTaskOnly ? 'Add New Tasks' : 'Add New Resolutions'}
          </h2>
          {!delegationTechnicalTaskOnly ? (
            <button className="mr-btn mr-btn-outline" onClick={addResolution}>
              <FaPlus /> Add Resolution
            </button>
          ) : (
            <button className="mr-btn mr-btn-outline" onClick={addStandaloneTask}>
              <FaPlus /> Add Task
            </button>
          )}
        </div>

        {!delegationTechnicalTaskOnly && newResolutions.map((res, rIdx) => (
          <div key={res.id} className="mr-resolution-card">
            {/* Resolution header */}
            <div className="mr-resolution-header">
              <span className="mr-res-number">Resolution {rIdx + 1}</span>
              {newResolutions.length > 1 && (
                <button className="mr-btn-icon danger" onClick={() => removeResolution(res.id)}
                  title="Remove resolution">
                  <FaTrash />
                </button>
              )}
            </div>

            <div className="mr-form-group">
              <label>Title *</label>
              <input
                type="text"
                placeholder="e.g. Strengthen cross-border data sharing protocols"
                value={res.title}
                onChange={e => updateResolution(res.id, 'title', e.target.value)}
              />
            </div>
            {!delegationCgTitleOnly && (
              <div className="mr-form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe this resolution..."
                  rows={3}
                  value={res.description}
                  onChange={e => updateResolution(res.id, 'description', e.target.value)}
                />
              </div>
            )}

            {/* Tasks ---------------------------------------------------- */}
            {!delegationCgTitleOnly && (
              <div className="mr-tasks-section">
                <div className="mr-tasks-header">
                  <span><FaUsers /> Tasks ({res.tasks.length})</span>
                  <button className="mr-btn mr-btn-sm mr-btn-outline" onClick={() => addTask(res.id)}>
                    <FaPlus /> Add Task
                  </button>
                </div>

                {res.tasks.map((task, tIdx) => (
                  <div key={task.id} className="mr-task-card">
                    <div className="mr-task-header">
                      <span>Task {tIdx + 1}</span>
                      {res.tasks.length > 1 && (
                        <button className="mr-btn-icon danger" onClick={() => removeTask(res.id, task.id)}>
                          <FaTrash />
                        </button>
                      )}
                    </div>

                    <div className="mr-task-row">
                      <div className="mr-form-group" style={{ flex: 2 }}>
                        <label>Task Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. Draft implementation framework"
                          value={task.title}
                          onChange={e => updateTask(res.id, task.id, 'title', e.target.value)}
                        />
                      </div>

                      <div className="mr-form-group" style={{ flex: 1 }}>
                        <label>Assign To</label>
                        <select
                          value={task.assigneeType}
                          onChange={e => updateTask(res.id, task.id, 'assigneeType', e.target.value)}
                        >
                          <option value="SUBCOMMITTEE">Subcommittee</option>
                          <option value="COUNTRY">Country</option>
                          <option value="DELEGATION">Delegation</option>
                        </select>
                      </div>

                      {task.assigneeType === 'SUBCOMMITTEE' ? (
                        <div className="mr-form-group" style={{ flex: 1 }}>
                          <label>Subcommittee</label>
                          <select
                            value={task.subcommitteeId}
                            onChange={e => updateTask(res.id, task.id, 'subcommitteeId', e.target.value)}
                          >
                            <option value="">— Select —</option>
                            {subcommittees.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="mr-form-group" style={{ flex: 1 }}>
                          <label>Country / Delegation</label>
                          <select
                            value={task.countryId}
                            onChange={e => updateTask(res.id, task.id, 'countryId', e.target.value)}
                          >
                            <option value="">— Select —</option>
                            {countries.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {committeeSecretaryStrictTasks && (
                        <div className="mr-form-group" style={{ flex: 1 }}>
                          <label>Timeline / Deadline *</label>
                          <input
                            type="date"
                            value={task.deadline}
                            onChange={e => updateTask(res.id, task.id, 'deadline', e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {!delegationTechnicalTaskTitleOnly && (
                      <div className="mr-form-group">
                        <label>{committeeSecretaryStrictTasks ? 'Task Description *' : 'Task Description'}</label>
                        <textarea
                          placeholder="What needs to be done?"
                          rows={2}
                          value={task.description}
                          onChange={e => updateTask(res.id, task.id, 'description', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {delegationTechnicalTaskOnly && (
          <div className="mr-tasks-section">
            <div className="mr-tasks-header">
              <span><FaUsers /> Tasks ({newTasks.length})</span>
            </div>

            {newTasks.map((task, tIdx) => (
              <div key={task.id} className="mr-task-card">
                <div className="mr-task-header">
                  <span>Task {tIdx + 1}</span>
                  {newTasks.length > 1 && (
                    <button className="mr-btn-icon danger" onClick={() => removeStandaloneTask(task.id)}>
                      <FaTrash />
                    </button>
                  )}
                </div>

                <div className="mr-task-row">
                  <div className="mr-form-group" style={{ flex: 2 }}>
                    <label>Task Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Draft implementation framework"
                      value={task.title}
                      onChange={e => updateStandaloneTask(task.id, 'title', e.target.value)}
                    />
                  </div>

                  {cgResolutions.length > 0 && (
                    <div className="mr-form-group" style={{ flex: 1.5 }}>
                      <label>Link to CG Resolution (Optional)</label>
                      <select
                        value={task.resolutionId}
                        onChange={e => updateStandaloneTask(task.id, 'resolutionId', e.target.value)}
                      >
                        <option value="">— None —</option>
                        {cgResolutions.map(r => (
                          <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mr-form-group" style={{ flex: 1 }}>
                    <label>Assign To</label>
                    <select
                      value={task.assigneeType}
                      onChange={e => updateStandaloneTask(task.id, 'assigneeType', e.target.value)}
                    >
                      <option value="SUBCOMMITTEE">Subcommittee</option>
                      <option value="COUNTRY">Country</option>
                      <option value="DELEGATION">Delegation</option>
                    </select>
                  </div>

                  {task.assigneeType === 'SUBCOMMITTEE' ? (
                    <div className="mr-form-group" style={{ flex: 1 }}>
                      <label>Subcommittee</label>
                      <select
                        value={task.subcommitteeId}
                        onChange={e => updateStandaloneTask(task.id, 'subcommitteeId', e.target.value)}
                      >
                        <option value="">— Select —</option>
                        {subcommittees.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="mr-form-group" style={{ flex: 1 }}>
                      <label>Country / Delegation</label>
                      <select
                        value={task.countryId}
                        onChange={e => updateStandaloneTask(task.id, 'countryId', e.target.value)}
                      >
                        <option value="">— Select —</option>
                        {countries.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mr-save-row">
          <button className="mr-btn mr-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <FaSpinner className="spin" /> : <FaSave />}
            {saving ? ' Saving…' : delegationCgTitleOnly ? ' Save Resolution' : delegationTechnicalTaskOnly ? ' Save Tasks' : ' Save Resolutions & Tasks'}
          </button>
          <button className="mr-btn mr-btn-outline" onClick={() => navigate(getDashboardPath())}>
            Done — Go to Dashboard
          </button>
        </div>
      </section>
    </div>
  );
};

export default MeetingResolutions;
