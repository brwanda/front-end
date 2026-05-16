import React, { useState, useEffect } from 'react';
import {
  FaCheck,
  FaTimes,
  FaSpinner,
  FaRoute,
  FaFileAlt,
  FaTasks,
  FaClipboardList,
  FaEdit,
} from 'react-icons/fa';
import './WorkflowIndicator.css';

/**
 * WorkflowIndicator Component
 * Shows what actions are allowed for a meeting based on meeting type and secretary role
 * Helps guide the secretary through the correct workflow
 */
const WorkflowIndicator = ({ meetingId, compact = false }) => {
  const [allowedActions, setAllowedActions] = useState(null);
  const [meetingType, setMeetingType] = useState('');
  const [secretaryRole, setSecretaryRole] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (meetingId) {
      loadAllowedActions();
    }
  }, [meetingId]);

  const loadAllowedActions = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/secretary/meetings/${meetingId}/allowed-actions?secretaryId=${user.id}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAllowedActions(data.allowedActions);
          setMeetingType(data.meetingType);
          setSecretaryRole(data.secretaryRole);
        }
      }
    } catch (error) {
      console.error('Error loading allowed actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMeetingTypeLabel = () => {
    switch (meetingType) {
      case 'COMMISSIONER_GENERAL_MEETING':
        return 'Commissioner General Meeting';
      case 'TECHNICAL_MEETING':
        return 'Technical Committee Meeting';
      case 'SUBCOMMITTEE_MEETING':
        return 'Subcommittee Meeting';
      default:
        return 'Meeting';
    }
  };

  const getWorkflowSteps = () => {
    if (!allowedActions) return [];

    const steps = [];

    if (allowedActions.canCreateResolutions) {
      steps.push({
        icon: <FaFileAlt />,
        text: 'Create Resolutions (title only)',
        enabled: true,
      });
    }

    if (allowedActions.canCreateTasks) {
      steps.push({
        icon: <FaTasks />,
        text: 'Create Tasks (title only)',
        enabled: true,
      });
    }

    if (allowedActions.canAddAOB) {
      steps.push({
        icon: <FaClipboardList />,
        text: 'Add AOB Items',
        enabled: true,
      });
    }

    if (allowedActions.canDescribeTasks) {
      steps.push({
        icon: <FaEdit />,
        text: 'Add Task Descriptions & Deadlines',
        enabled: true,
      });
    }

    return steps;
  };

  if (loading) {
    return (
      <div className={`workflow-indicator ${compact ? 'compact' : ''}`}>
        <div className="workflow-loading">
          <FaSpinner className="spinner" />
          <div>Loading workflow...</div>
        </div>
      </div>
    );
  }

  if (!allowedActions) {
    return null;
  }

  const steps = getWorkflowSteps();

  if (compact) {
    return (
      <div className="workflow-indicator compact">
        <div className="workflow-header">
          <FaRoute className="workflow-icon" />
          <h4 className="workflow-title">{getMeetingTypeLabel()}</h4>
          <span className="workflow-badge">
            {steps.length} action{steps.length !== 1 ? 's' : ''} available
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-indicator">
      <div className="workflow-header">
        <FaRoute className="workflow-icon" />
        <h4 className="workflow-title">
          Workflow: {getMeetingTypeLabel()}
        </h4>
      </div>

      {steps.length > 0 ? (
        <div className="workflow-steps">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`workflow-step ${step.enabled ? 'enabled' : 'disabled'}`}
            >
              <div className={`step-icon ${step.enabled ? 'enabled' : 'disabled'}`}>
                {step.enabled ? <FaCheck /> : <FaTimes />}
              </div>
              <div className="step-text">{step.text}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="workflow-step disabled">
          <div className="step-icon disabled">
            <FaTimes />
          </div>
          <div className="step-text">
            No actions available for this meeting type
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowIndicator;
