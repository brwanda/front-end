import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendar, FaMapMarkerAlt, FaUsers, FaFileAlt, FaSave, FaTimes, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import MeetingValidationService from '../services/meetingValidationService';
import AuthService from '../services/authService';
import http from '../services/http';

const EnhancedMeetingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const currentUser = AuthService.getCurrentUser();

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
  const [validationWarning, setValidationWarning] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    // Validate secretary location when country changes
    if (formData.hostingCountry.id && currentUser) {
      validateSecretaryLocation();
    }
  }, [formData.hostingCountry.id, currentUser]);

  const fetchData = async () => {
    try {
      // Fetch countries
      const { data: countriesData } = await http.get('/countries');
      setCountries(Array.isArray(countriesData) ? countriesData : []);

      // If editing, fetch meeting data
      if (isEditing) {
        setInitialLoading(true);
        const { data: meetingData } = await http.get(`/meetings/${id}`);
        if (meetingData) {
          
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
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load form data. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  };

  const validateSecretaryLocation = () => {
    if (!currentUser || currentUser.role !== 'SECRETARY') {
      return;
    }

    const canCreate = MeetingValidationService.canSecretaryCreateMeeting(
      currentUser, 
      parseInt(formData.hostingCountry.id)
    );

    if (!canCreate && formData.hostingCountry.id) {
      setValidationWarning(
        `⚠️ You can only create meetings in your country (${currentUser.country?.name}). Please select ${currentUser.country?.name} as the hosting country.`
      );
    } else {
      setValidationWarning('');
    }
  };

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
    // Use the validation service
    const validationErrors = MeetingValidationService.validateMeetingData(formData, currentUser);
    return validationErrors;
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
      // Combine date and time into ISO string
      const dateTime = new Date(`${formData.meetingDate}T${formData.meetingTime}`).toISOString();
      
      const meetingData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        agenda: formData.agenda.trim(),
        meetingDate: dateTime,
        location: formData.location.trim(),
        meetingType: formData.meetingType,
        hostingCountry: formData.hostingCountry,
        createdBy: { id: currentUser.id }
      };

      console.log('Sending meeting data:', meetingData);

      const endpoint = isEditing ? `/meetings/${id}` : '/meetings';
      const { data: result } = await (isEditing
        ? http.put(endpoint, meetingData)
        : http.post(endpoint, meetingData));
        setSuccess(
          isEditing 
            ? 'Meeting updated successfully!' 
            : 'Meeting created successfully! Invitations will be sent automatically.'
        );
        
        // Navigate after a short delay to show success message
        setTimeout(() => {
          navigate('/meetings');
        }, 1500);
    } catch (error) {
      console.error('Error saving meeting:', error);
      setError(error.message || 'Failed to save meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/meetings');
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading meeting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaCalendar className="text-blue-600" />
              {isEditing ? 'Edit Meeting' : 'Create New Meeting'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {isEditing 
                ? 'Update the meeting information below'
                : 'Fill in the details to schedule a new meeting'
              }
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <span>{success}</span>
            </div>
          )}

          {validationWarning && (
            <div className="mx-6 mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              <span>{validationWarning}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Meeting Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Meeting Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter meeting title"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter meeting description"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="agenda" className="block text-sm font-medium text-gray-700">
                    Agenda Items
                  </label>
                  <textarea
                    id="agenda"
                    name="agenda"
                    value={formData.agenda}
                    onChange={handleChange}
                    rows="5"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter agenda items (one per line)"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Meeting Schedule Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Meeting Schedule</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700">
                    Meeting Date *
                  </label>
                  <input
                    type="date"
                    id="meetingDate"
                    name="meetingDate"
                    value={formData.meetingDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="meetingTime" className="block text-sm font-medium text-gray-700">
                    Meeting Time *
                  </label>
                  <input
                    type="time"
                    id="meetingTime"
                    name="meetingTime"
                    value={formData.meetingTime}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="meetingType" className="block text-sm font-medium text-gray-700">
                  Meeting Type *
                </label>
                <select
                  id="meetingType"
                  name="meetingType"
                  value={formData.meetingType}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  required
                >
                  <option value="">Select meeting type</option>
                  {MeetingValidationService.getMeetingTypes(currentUser?.role).map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location & Host Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location & Host</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Meeting Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter meeting location"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="hostingCountry" className="block text-sm font-medium text-gray-700">
                    Hosting Country *
                  </label>
                  <select
                    id="hostingCountry"
                    name="hostingCountry"
                    value={formData.hostingCountry.id}
                    onChange={handleSelectChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      validationWarning ? 'border-yellow-300' : 'border-gray-300'
                    }`}
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
                  {currentUser?.role === 'SECRETARY' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Note: As a Secretary, you can only create meetings in your country ({currentUser.country?.name})
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                <FaTimes className="w-4 h-4 mr-2 inline" />
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                disabled={loading || !!validationWarning}
              >
                {loading ? (
                  <>
                    <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4 mr-2" />
                    {isEditing ? 'Update Meeting' : 'Create Meeting'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMeetingForm;