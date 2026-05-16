import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaBriefcase, FaShieldAlt, FaCalendarAlt, FaClock, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ProfilePicture from '../../components/ProfilePicture/ProfilePicture';
import ProfileService from '../../services/profileService';
import AuthService from '../../services/authService';
import './UserProfile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    position: ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    fetchUserProfile();
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user email from AuthService
      const userEmail = AuthService.getCurrentUserEmail();
      const currentUser = AuthService.getCurrentUser();
      
      console.log('🔍 Profile Debug - Current user from AuthService:', currentUser);
      console.log('🔍 Profile Debug - User email:', userEmail);
      
      if (!userEmail) {
        setError('No user logged in. Please log in first.');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Profile Debug - Fetching profile for email:', userEmail);
      const userData = await ProfileService.getUserProfile(userEmail);
      console.log('🔍 Profile Debug - Fetched user data:', userData);
      
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        department: userData.department || '',
        position: userData.position || ''
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updatedUser = await ProfileService.updateUserProfile(user.id, formData);
      setUser(updatedUser.user);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      department: user.department || '',
      position: user.position || ''
    });
  };

  const handlePictureChange = (newPictureUrl) => {
    setUser(prev => ({
      ...prev,
      profilePicture: newPictureUrl
    }));
  };

  const handleLogout = () => {
    AuthService.logout();
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setError('');
      setSuccess('');

      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New password and confirm password do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }

      // Call the password change API
      await ProfileService.changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess('Password changed successfully!');
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordForm(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-profile-container">
        <div className="error-message">
          <p>Failed to load user profile</p>
          <button onClick={fetchUserProfile} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      {/* Header with Logout */}
      <div className="profile-header">
        <div className="header-content">
          <h1>My Profile</h1>
          <p>Welcome back, {user.name}! Manage your personal information and profile picture</p>
        </div>
        <button onClick={handleLogout} className="btn btn-logout">
          <FaSignOutAlt /> LOGOUT
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="profile-layout">
        {/* Left Sidebar */}
        <div className="profile-sidebar">
          <div className="sidebar-section">
            <div className="profile-avatar-container">
              <ProfilePicture
                userId={user.id}
                currentPictureUrl={user.profilePicture}
                size="large"
                editable={true}
                onPictureChange={handlePictureChange}
                className="sidebar-avatar"
              />
              <div className="avatar-upload-hint">
                <FaUser />
                <span>Click to upload</span>
              </div>
            </div>
            
            <div className="user-summary">
              <h3>{user.name}</h3>
              <p className="user-role">{user.role}</p>
              <p className="user-email">{user.email}</p>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Quick Info</h4>
            <div className="quick-info-item">
              <FaCalendarAlt />
              <div>
                <span className="info-label">Member Since</span>
                <span className="info-value">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
            <div className="quick-info-item">
              <FaClock />
              <div>
                <span className="info-label">Last Login</span>
                <span className="info-value">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-main-content">
          {/* Personal Information Section */}
          <div className="content-section">
            <div className="section-header">
              <h2>Personal Information</h2>
              {!isEditing ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <FaEdit /> EDIT PROFILE
                </button>
              ) : (
                <div className="edit-actions">
                  <button
                    className="btn btn-success"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="profile-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <FaUser /> Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="form-value">{user.name || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <FaEnvelope /> Email Address
                  </label>
                  <div className="form-value non-editable">{user.email}</div>
                  <small className="form-help">Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>
                    <FaPhone /> Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="form-value">{user.phone || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <FaMapMarkerAlt /> Address
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your address"
                      rows="3"
                    />
                  ) : (
                    <div className="form-value">{user.address || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <FaBuilding /> Department
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Enter your department"
                    />
                  ) : (
                    <div className="form-value">{user.department || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <FaBriefcase /> Position
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Enter your position"
                    />
                  ) : (
                    <div className="form-value">{user.position || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <div className="form-value non-editable">{user.role}</div>
                  <small className="form-help">Role cannot be changed</small>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings Section */}
          <div className="content-section">
            <div className="section-header">
              <h2>Security Settings</h2>
              {!showPasswordForm ? (
                <button
                  className="btn btn-warning"
                  onClick={() => setShowPasswordForm(true)}
                >
                  <FaShieldAlt /> CHANGE PASSWORD
                </button>
              ) : null}
            </div>

            {showPasswordForm ? (
              <div className="password-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                      placeholder="Enter your current password"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                      placeholder="Enter your new password"
                      required
                    />
                    <small className="form-help">Password must be at least 6 characters long</small>
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your new password"
                      required
                    />
                  </div>
                </div>

                <div className="password-actions">
                  <button
                    className="btn btn-success"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                  >
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancelPasswordChange}
                    disabled={changingPassword}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="password-info">
                <p>Keep your account secure by changing your password regularly.</p>
                <small>Last changed: {user.passwordChangedAt ? new Date(user.passwordChangedAt).toLocaleDateString() : 'Unknown'}</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
