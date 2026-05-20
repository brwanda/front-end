import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import http from '../../services/http';

const HodProfile = () => {
  // State management
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    contactNumber: '',
    profilePicture: '',
    role: 'Head of Delegation',
    department: '',
    country: '',
    joinDate: '',
    lastLogin: ''
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadingPicture, setUploadingPicture] = useState(false);
  
  // File upload ref
  const fileInputRef = useRef(null);

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: response } = await http.get('/api/hod/profile');
      const profileData = {
        name: response.data.name || '',
        email: response.data.email || '',
        contactNumber: response.data.contactNumber || response.data.phone || '',
        profilePicture: response.data.profilePicture || '',
        role: 'Head of Delegation',
        department: response.data.department || '',
        country: response.data.country || '',
        joinDate: response.data.joinDate || '',
        lastLogin: response.data.lastLogin || ''
      };
      setProfile(profileData);
      setOriginalProfile(profileData);
    } catch (error) {
      console.error('Error fetching HOD profile:', error);
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
    } else if (profile.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(profile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Contact number validation
    if (profile.contactNumber.trim()) {
      const phoneRegex = /^[\+]?[0-9\-\(\)\s]{10,}$/;
      if (!phoneRegex.test(profile.contactNumber.replace(/\s/g, ''))) {
        newErrors.contactNumber = 'Please enter a valid contact number (minimum 10 digits)';
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

  // Handle profile picture upload
  const handlePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingPicture(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const { data: response } = await http.post('/api/hod/profile/upload-picture', formData);

      setProfile(prev => ({
        ...prev,
        profilePicture: response.data.profilePictureUrl
      }));

      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingPicture(false);
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

      const { data: response } = await http.put('/api/hod/profile/update', updateData);
      
      toast.success('Profile updated successfully!');
      setOriginalProfile({ ...profile, ...response.data });
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error updating HOD profile:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 409) {
        toast.error('Email address is already in use by another account');
      } else if (error.response?.status === 400) {
        toast.error('Invalid data provided. Please check your inputs.');
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
    return (
      profile.name !== originalProfile.name ||
      profile.email !== originalProfile.email ||
      profile.contactNumber !== originalProfile.contactNumber
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Loading HOD profile">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading HOD Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-white shadow-lg">
                  {profile.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="h-full w-full text-gray-300" />
                  )}
                </div>
                
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPicture}
                    className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 disabled:opacity-50 transition-colors"
                    aria-label="Upload profile picture"
                  >
                    {uploadingPicture ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <CameraIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  className="hidden"
                />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-white">{profile.name || 'HOD User'}</h1>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white">
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    {profile.role}
                  </div>
                  {profile.department && (
                    <span className="text-blue-100">{profile.department}</span>
                  )}
                </div>
                {profile.country && (
                  <p className="text-blue-100 mt-1">{profile.country}</p>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-blue-800 transition-all"
                aria-label="Edit profile"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges()}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  aria-label="Save changes"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-3 border border-white border-opacity-30 text-sm font-medium rounded-xl text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-blue-800 transition-all"
                  aria-label="Cancel editing"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Information */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              <p className="text-sm text-gray-600 mt-1">Update your personal details and contact information</p>
            </div>
            
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
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        !isEditing 
                          ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                          : 'bg-white text-gray-900'
                      } ${
                        errors.name ? 'border-red-300 ring-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                  </div>
                  {errors.name && (
                    <p id="name-error" className="mt-2 text-sm text-red-600 flex items-center" role="alert">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
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
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        !isEditing 
                          ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                          : 'bg-white text-gray-900'
                      } ${
                        errors.email ? 'border-red-300 ring-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email address"
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" className="mt-2 text-sm text-red-600 flex items-center" role="alert">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
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
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        !isEditing 
                          ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                          : 'bg-white text-gray-900'
                      } ${
                        errors.contactNumber ? 'border-red-300 ring-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your contact number (optional)"
                      aria-describedby={errors.contactNumber ? 'contact-error' : undefined}
                    />
                  </div>
                  {errors.contactNumber && (
                    <p id="contact-error" className="mt-2 text-sm text-red-600 flex items-center" role="alert">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.contactNumber}
                    </p>
                  )}
                </div>

                {/* Role Field (Read-only) */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role & Position
                  </label>
                  <div className="relative">
                    <ShieldCheckIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      id="role"
                      type="text"
                      value={profile.role}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                      aria-describedby="role-help"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        System Protected
                      </span>
                    </div>
                  </div>
                  <p id="role-help" className="mt-2 text-xs text-gray-500 flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    Your role is assigned by the system administrator and cannot be modified.
                  </p>
                </div>

                {/* Save reminder for editing mode */}
                {isEditing && hasChanges() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Unsaved Changes</h3>
                        <p className="text-sm text-amber-700 mt-1">
                          You have unsaved changes. Don't forget to save your updates before leaving this page!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Account Information Sidebar */}
        <div className="space-y-6">
          {/* Account Details */}
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Department</p>
                <p className="text-sm text-gray-900 mt-1">{profile.department || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Country</p>
                <p className="text-sm text-gray-900 mt-1">{profile.country || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Member Since</p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(profile.joinDate)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Last Login</p>
                <p className="text-sm text-gray-900 mt-1">
                  {profile.lastLogin ? formatDate(profile.lastLogin) : 'Current session'}
                </p>
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-blue-800">Security & Privacy</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your role and permissions are managed by system administrators</li>
                    <li>Email changes may require verification before taking effect</li>
                    <li>Profile picture uploads are scanned for security</li>
                    <li>Contact your system administrator for role-related changes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Picture Guidelines */}
          {isEditing && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CloudArrowUpIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-green-800">Profile Picture Guidelines</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Maximum file size: 5MB</li>
                      <li>Supported formats: JPG, PNG, GIF</li>
                      <li>Recommended size: 400x400 pixels</li>
                      <li>Use a professional headshot for best results</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HodProfile;
