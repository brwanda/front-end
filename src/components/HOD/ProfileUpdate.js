import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import http from '../../services/http';

const ProfileUpdate = () => {
  // State management
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    contactNumber: '',
    role: 'Head of Delegation'
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: response } = await http.get('/api/users/profile');
      const profileData = {
        name: response.data.name || '',
        email: response.data.email || '',
        contactNumber: response.data.contactNumber || response.data.phone || '',
        role: 'Head of Delegation'
      };
      setProfile(profileData);
      setOriginalProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Input validation
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!profile.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (profile.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(profile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Contact number validation (optional but if provided, should be valid)
    if (profile.contactNumber.trim()) {
      const phoneRegex = /^[\+]?[0-9\-\(\)\s]{10,}$/;
      if (!phoneRegex.test(profile.contactNumber.replace(/\s/g, ''))) {
        newErrors.contactNumber = 'Please enter a valid contact number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle form submission
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please correct the errors before saving');
      return;
    }

    setSaving(true);
    
    try {
      const updateData = {
        name: profile.name.trim(),
        email: profile.email.trim(),
        contactNumber: profile.contactNumber.trim()
      };

      await http.put('/api/users/profile/update', updateData);
      
      toast.success('Profile updated successfully!');
      setOriginalProfile(profile);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 409) {
        toast.error('Email address is already in use by another account');
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setProfile(originalProfile);
    setErrors({});
    setIsEditing(false);
  };

  // Check if profile has changes
  const hasChanges = () => {
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading profile">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-white mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-white">Profile Management</h2>
              <p className="text-blue-100 text-sm">Update your personal information</p>
            </div>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Edit profile"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Save changes"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Cancel editing"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <UserIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="name"
                type="text"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  !isEditing 
                    ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                    : 'bg-white text-gray-900'
                } ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
            </div>
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  !isEditing 
                    ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                    : 'bg-white text-gray-900'
                } ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Contact Number Field */}
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number
            </label>
            <div className="relative">
              <PhoneIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="contactNumber"
                type="tel"
                value={profile.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  !isEditing 
                    ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                    : 'bg-white text-gray-900'
                } ${
                  errors.contactNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your contact number (optional)"
                aria-describedby={errors.contactNumber ? 'contact-error' : undefined}
              />
            </div>
            {errors.contactNumber && (
              <p id="contact-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.contactNumber}
              </p>
            )}
          </div>

          {/* Role Field (Read-only) */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <div className="relative">
              <ShieldCheckIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="role"
                type="text"
                value={profile.role}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                aria-describedby="role-help"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  System Assigned
                </span>
              </div>
            </div>
            <p id="role-help" className="mt-1 text-xs text-gray-500">
              Your role is assigned by the system administrator and cannot be changed.
            </p>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Security Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your role and permissions are managed by system administrators</li>
                    <li>Email changes may require verification before taking effect</li>
                    <li>Contact your system administrator for role-related changes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Save reminder for editing mode */}
          {isEditing && hasChanges() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    You have unsaved changes. Don't forget to save your updates!
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileUpdate;
