import React, { useState, useEffect } from 'react';
import { FaUser, FaCalendar, FaVenusMars, FaBriefcase, FaMapMarkerAlt, FaClock, FaSave, FaTimes } from 'react-icons/fa';
import './PersonalInfoPopup.css';

const PersonalInfoPopup = ({ user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    workExperience: '',
    currentPosition: '',
    country: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Set current position based on user role
  useEffect(() => {
    if (user && user.role) {
      const positionMap = {
        'ADMIN': 'System Administrator',
        'SECRETARY': 'Secretary',
        'CHAIR': 'Chair',
        'VICE_CHAIR': 'Vice Chair',
        'COMMISSIONER_GENERAL': 'Commissioner General',
        'SUBCOMMITTEE_MEMBER': 'Subcommittee Member',
        'COMMITTEE_MEMBER': 'Committee Member',
        'COMMITTEE_SECRETARY': 'Committee Secretary',
        'DELEGATION_SECRETARY': 'Delegation Secretary'
      };
      
      setFormData(prev => ({
        ...prev,
        currentPosition: positionMap[user.role] || user.role,
        country: user.country?.name || ''
      }));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.age || formData.age < 18 || formData.age > 100) {
      newErrors.age = 'Age must be between 18 and 100';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (!formData.workExperience) {
      newErrors.workExperience = 'Work experience is required';
    }
    
    if (!formData.currentPosition) {
      newErrors.currentPosition = 'Current position is required';
    }
    
    if (!formData.country) {
      newErrors.country = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting personal information:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (window.confirm('Are you sure you want to close this form? You can complete it later from your profile.')) {
      onClose();
    }
  };

  return (
    <div className="personal-info-overlay">
      <div className="personal-info-popup">
        <div className="popup-header">
          <h2>
            <FaUser /> Personal Information
          </h2>
          <p>Please complete your profile information to continue</p>
          <button className="close-button" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="personal-info-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">
                <FaUser /> First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">
                <FaUser /> Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                className={errors.lastName ? 'error' : ''}
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age">
                <FaCalendar /> Age *
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="Enter your age"
                min="18"
                max="100"
                className={errors.age ? 'error' : ''}
              />
              {errors.age && <span className="error-message">{errors.age}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gender">
                <FaVenusMars /> Gender *
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={errors.gender ? 'error' : ''}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && <span className="error-message">{errors.gender}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="workExperience">
                <FaClock /> How long have you been working? *
              </label>
              <select
                id="workExperience"
                name="workExperience"
                value={formData.workExperience}
                onChange={handleInputChange}
                className={errors.workExperience ? 'error' : ''}
              >
                <option value="">Select work experience</option>
                <option value="0-2 years">0-2 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="6-10 years">6-10 years</option>
                <option value="11-15 years">11-15 years</option>
                <option value="16-20 years">16-20 years</option>
                <option value="20+ years">20+ years</option>
              </select>
              {errors.workExperience && <span className="error-message">{errors.workExperience}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="currentPosition">
                <FaBriefcase /> Current Position *
              </label>
              <input
                type="text"
                id="currentPosition"
                name="currentPosition"
                value={formData.currentPosition}
                onChange={handleInputChange}
                placeholder="Your current position"
                className={errors.currentPosition ? 'error' : ''}
                readOnly
              />
              {errors.currentPosition && <span className="error-message">{errors.currentPosition}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="country">
                <FaMapMarkerAlt /> Country *
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Your country"
                className={errors.country ? 'error' : ''}
                readOnly
              />
              {errors.country && <span className="error-message">{errors.country}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="date">
                <FaCalendar /> Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={errors.date ? 'error' : ''}
              />
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleClose} className="cancel-button">
              Complete Later
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <>
                  <FaSave /> Saving...
                </>
              ) : (
                <>
                  <FaSave /> Save & Continue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoPopup;
