import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCommitteeById,
  createCommittee,
  updateCommittee,
  getSubCommitteeById,
  createSubCommittee,
  updateSubCommittee
} from '../../services/committeeService';
import { 
  FaUsers, 
  FaSave, 
  FaTimes,  
  FaExclamationCircle,
  FaCheckCircle,
  FaSpinner
} from 'react-icons/fa';
import './Committees.css';

const CommitteeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    isSubCommittee: false
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const isEditing = !!id;
  const formTitle = isEditing 
    ? `Edit ${formData.isSubCommittee ? 'Sub-Committee' : 'Committee'}`
    : 'Add New Committee';

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setInitialLoading(true);
        try {
          // Try to fetch as committee first
          try {
            const data = await getCommitteeById(id);
            setFormData({ ...data, isSubCommittee: false });
          } catch {
            // If not found as committee, try as sub-committee
            const data = await getSubCommitteeById(id);
            setFormData({ ...data, isSubCommittee: true });
          }
        } catch (error) {
          console.error('Error fetching committee data:', error);
          setErrors({ fetch: 'Failed to load committee data. Please try again.' });
        } finally {
          setInitialLoading(false);
        }
      };
      fetchData();
    }
  }, [id]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Committee name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Committee name must be at least 2 characters long';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Committee name must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear general errors
    if (errors.submit) {
      setErrors(prev => ({
        ...prev,
        submit: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const committeeData = { name: formData.name.trim() };

      if (formData.isSubCommittee) {
        if (isEditing) {
          await updateSubCommittee(id, committeeData);
        } else {
          await createSubCommittee(committeeData);
        }
      } else {
        if (isEditing) {
          await updateCommittee(id, committeeData);
        } else {
          await createCommittee(committeeData);
        }
      }

      // Show success message briefly before navigating
      navigate('/committees', { 
        state: { 
          message: `${formData.isSubCommittee ? 'Sub-Committee' : 'Committee'} ${isEditing ? 'updated' : 'created'} successfully!`,
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Error saving committee:', error);
      
      let errorMessage = 'Failed to save committee. Please try again.';
      
      if (error.response?.status === 409) {
        errorMessage = 'A committee with this name already exists.';
        setErrors({ name: errorMessage });
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check your input.';
        setErrors({ submit: errorMessage });
      } else {
        setErrors({ submit: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/committees');
  };

  if (initialLoading) {
    return (
      <div className="committee-form-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading committee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="committee-form-container">
      <div className="form-header">
        <div className="header-content">
          <h2 className="form-title">
            <FaUsers className="title-icon" />
            {formTitle}
          </h2>
          <p className="form-subtitle">
            {isEditing 
              ? `Update the ${formData.isSubCommittee ? 'sub-committee' : 'committee'} information below`
              : 'Enter the committee details below'
            }
          </p>
        </div>
      </div>

      {errors.fetch && (
        <div className="error-banner">
          <FaExclamationCircle className="error-icon" />
          <span>{errors.fetch}</span>
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit} className="committee-form">
          {!isEditing && (
            <div className="form-section">
              <h3 className="section-title">Committee Type</h3>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isSubCommittee"
                    checked={formData.isSubCommittee}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">
                    This is a Sub-Committee
                  </span>
                </label>
                <small className="field-hint">
                  Check this box if you're creating a sub-committee
                </small>
              </div>
            </div>
          )}

          <div className="form-section">
            <h3 className="section-title">
              {formData.isSubCommittee ? 'Sub-Committee' : 'Committee'} Information
            </h3>
            
            <div className="form-group">
              <label htmlFor="name" className="field-label">
                {formData.isSubCommittee ? 'Sub-Committee' : 'Committee'} Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-input ${errors.name ? 'error' : ''} ${submitAttempted && !errors.name && formData.name ? 'success' : ''}`}
                placeholder={`Enter ${formData.isSubCommittee ? 'sub-committee' : 'committee'} name`}
                maxLength={100}
                disabled={loading}
              />
              {errors.name && (
                <span className="field-error">
                  <FaExclamationCircle className="error-icon" />
                  {errors.name}
                </span>
              )}
              {!errors.name && submitAttempted && formData.name && (
                <span className="field-success">
                  <FaCheckCircle className="success-icon" />
                  Valid name
                </span>
              )}
              <small className="field-hint">
                {formData.name.length}/100 characters
              </small>
            </div>
          </div>

          {errors.submit && (
            <div className="form-error">
              <FaExclamationCircle className="error-icon" />
              <span>{errors.submit}</span>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              <FaTimes className="btn-icon" />
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || Object.keys(errors).length > 0}
            >
              {loading ? (
                <>
                  <FaSpinner className="btn-icon spinning" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FaSave className="btn-icon" />
                  {isEditing ? 'Update Committee' : 'Create Committee'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommitteeForm;