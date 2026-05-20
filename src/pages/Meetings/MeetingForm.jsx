import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMeetingById, createMeeting, updateMeeting } from '../../services/meetingService';
import { getCountries } from '../../services/countryService';
import { FaCalendar, FaMapMarkerAlt, FaUsers, FaFileAlt, FaSave, FaTimes } from 'react-icons/fa';
import './Meetings.css';

const MeetingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    agenda: '',
    meetingDate: '',
    meetingTime: '',
    location: '',
    meetingType: '',
    hostingCountry: { id: '' }
  });

  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const countriesData = await getCountries();
        setCountries(countriesData);

        if (isEditing) {
          setInitialLoading(true);
          const meetingData = await getMeetingById(id);
          
          // Parse the datetime string to separate date and time
          const meetingDateTime = new Date(meetingData.meetingDate);
          const dateString = meetingDateTime.toISOString().split('T')[0];
          const timeString = meetingDateTime.toTimeString().slice(0, 5);

          setFormData({
            title: meetingData.title || '',
            description: meetingData.description || '',
            agenda: meetingData.agenda || '',
            meetingDate: dateString,
            meetingTime: timeString,
            location: meetingData.location || '',
            meetingType: meetingData.meetingType || '',
            hostingCountry: meetingData.hostingCountry || { id: '' }
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load form data. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: { id: value }
    }));
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim()) {
      errors.push('Meeting title is required');
    }

    if (!formData.meetingDate) {
      errors.push('Meeting date is required');
    }

    if (!formData.meetingTime) {
      errors.push('Meeting time is required');
    }

    if (!formData.meetingType) {
      errors.push('Meeting type is required');
    }

    if (!formData.hostingCountry.id) {
      errors.push('Hosting country is required');
    }

    // Validate future date for new meetings
    if (!isEditing && formData.meetingDate) {
      const selectedDate = new Date(`${formData.meetingDate}T${formData.meetingTime}`);
      const now = new Date();
      
      if (selectedDate <= now) {
        errors.push('Meeting date and time must be in the future');
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get current user
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Combine date and time into ISO string
      const dateTime = new Date(`${formData.meetingDate}T${formData.meetingTime}`).toISOString();
      
      const meetingData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        agenda: formData.agenda.trim(),
        meetingDate: dateTime,
        location: formData.location.trim(),
        meetingType: formData.meetingType,
        hostingCountry: formData.hostingCountry
      };

      console.log('Sending meeting data:', meetingData); // Debug log

      let response;
      if (isEditing) {
        response = await updateMeeting(id, meetingData);
        setSuccess('Meeting updated successfully!');
      } else {
        response = await createMeeting(meetingData);
        setSuccess('Meeting created successfully!');
      }

      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/meetings');
      }, 1500);

    } catch (error) {
      console.error('Error saving meeting:', error);
      
      // More specific error handling
      if (error.message.includes('User not authenticated')) {
        setError('Please log in again to continue.');
        setTimeout(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          window.location.href = '/login';
        }, 2000);
      } else if (error.message.includes('500')) {
        setError('Server error occurred. Please check all required fields and try again.');
      } else {
        setError(error.message || 'Failed to save meeting. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/meetings');
  };

  if (initialLoading) {
    return (
      <div className="meeting-form-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading meeting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-form-container">
      <div className="form-header">
        <div className="header-content">
          <h2 className="form-title">
            <FaCalendar className="title-icon" />
            {isEditing ? 'Edit Meeting' : 'Create New Meeting'}
          </h2>
          <p className="form-subtitle">
            {isEditing 
              ? 'Update the meeting information below'
              : 'Fill in the details to schedule a new meeting'
            }
          </p>
        </div>
      </div>

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

      <div className="form-card">
        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-section">
            <h3 className="section-title">Meeting Information</h3>
            
            <div className="form-group">
              <label htmlFor="title" className="field-label">
                Meeting Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter meeting title"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="field-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter meeting description"
                rows="3"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="agenda" className="field-label">
                Agenda Items
              </label>
              <textarea
                id="agenda"
                name="agenda"
                value={formData.agenda}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter agenda items (one per line)"
                rows="5"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Meeting Schedule</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="meetingDate" className="field-label">
                  Meeting Date *
                </label>
                <input
                  type="date"
                  id="meetingDate"
                  name="meetingDate"
                  value={formData.meetingDate}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="meetingTime" className="field-label">
                  Meeting Time *
                </label>
                <input
                  type="time"
                  id="meetingTime"
                  name="meetingTime"
                  value={formData.meetingTime}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="meetingType" className="field-label">
                Meeting Type *
              </label>
              <select
                id="meetingType"
                name="meetingType"
                value={formData.meetingType}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
                required
              >
                <option value="">Select meeting type</option>
                <option value="COMMISSIONER_GENERAL_MEETING">Commissioner General Meeting</option>
                <option value="TECHNICAL_MEETING">Technical Committee Meeting</option>
                <option value="SUBCOMMITTEE_MEETING">Subcommittee Meeting</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Location & Host</h3>
            
            <div className="form-group">
              <label htmlFor="location" className="field-label">
                Meeting Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter meeting location"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="hostingCountry" className="field-label">
                Hosting Country *
              </label>
              <select
                id="hostingCountry"
                name="hostingCountry"
                value={formData.hostingCountry.id}
                onChange={handleSelectChange}
                className="form-input"
                disabled={loading}
                required
              >
                <option value="">Select hosting country</option>
                {countries.map(country => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner small"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FaSave className="btn-icon" />
                  {isEditing ? 'Update Meeting' : 'Create Meeting'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingForm;