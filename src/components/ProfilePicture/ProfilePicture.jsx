import React, { useState, useRef } from 'react';
import { FaCamera, FaTrash, FaSpinner } from 'react-icons/fa';
import ProfileService from '../../services/profileService';
import './ProfilePicture.css';

const ProfilePicture = ({ 
  userId, 
  currentPictureUrl, 
  size = 'medium', 
  editable = false, 
  onPictureChange = null,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pictureUrl, setPictureUrl] = useState(currentPictureUrl);
  const fileInputRef = useRef(null);

  const sizeClasses = {
    small: 'profile-picture-small',
    medium: 'profile-picture-medium',
    large: 'profile-picture-large',
    xlarge: 'profile-picture-xlarge'
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const validation = ProfileService.validateProfilePictureFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsUploading(true);
    try {
      const response = await ProfileService.uploadProfilePicture(userId, file);
      const newPictureUrl = response.profilePictureUrl;
      
      setPictureUrl(newPictureUrl);
      if (onPictureChange) {
        onPictureChange(newPictureUrl);
      }
      
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePicture = async () => {
    if (!pictureUrl) return;

    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await ProfileService.deleteProfilePicture(userId);
      setPictureUrl(null);
      if (onPictureChange) {
        onPictureChange(null);
      }
      alert('Profile picture deleted successfully!');
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      alert('Failed to delete profile picture: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePictureClick = () => {
    if (editable && !isUploading && !isDeleting) {
      fileInputRef.current?.click();
    }
  };

  const getFullPictureUrl = (url) => {
    return ProfileService.getFullProfilePictureUrl(url);
  };

  return (
    <div className={`profile-picture-container ${sizeClasses[size]} ${className}`}>
      <div 
        className={`profile-picture ${editable ? 'editable' : ''}`}
        onClick={handlePictureClick}
        style={{ cursor: editable ? 'pointer' : 'default' }}
      >
        {pictureUrl ? (
          <img 
            src={getFullPictureUrl(pictureUrl)} 
            alt="Profile" 
            className="profile-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {!pictureUrl && (
          <div className="profile-placeholder">
            <span className="profile-initial">
              {userId ? 'U' : '?'}
            </span>
          </div>
        )}

        {/* Upload overlay */}
        {editable && (
          <div className="profile-overlay">
            {isUploading ? (
              <FaSpinner className="profile-icon loading" />
            ) : isDeleting ? (
              <FaSpinner className="profile-icon loading" />
            ) : (
              <FaCamera className="profile-icon" />
            )}
          </div>
        )}

        {/* Delete button */}
        {editable && pictureUrl && !isUploading && !isDeleting && (
          <button
            className="profile-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePicture();
            }}
            title="Delete profile picture"
          >
            <FaTrash />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      )}

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="profile-upload-progress">
          <FaSpinner className="spinner" />
          <span>Uploading...</span>
        </div>
      )}

      {/* Delete progress indicator */}
      {isDeleting && (
        <div className="profile-upload-progress">
          <FaSpinner className="spinner" />
          <span>Deleting...</span>
        </div>
      )}
    </div>
  );
};

export default ProfilePicture;
