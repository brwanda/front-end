// services/profileService.js
import http from './http';

export class ProfileService {

  /**
   * Upload profile picture for a user
   * @param {number} userId - User ID
   * @param {File} file - Profile picture file
   * @returns {Promise} API response
   */
  static async uploadProfilePicture(userId, file) {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      const { data } = await http.post(`/api/profile/${userId}/picture`, formData);
      return data;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  /**
   * Delete profile picture for a user
   * @param {number} userId - User ID
   * @returns {Promise} API response
   */
  static async deleteProfilePicture(userId) {
    try {
      const { data } = await http.del(`/api/profile/${userId}/picture`);
      return data;
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      throw error;
    }
  }

  /**
   * Get profile picture URL for a user
   * @param {number} userId - User ID
   * @returns {Promise} API response with profile picture URL
   */
  static async getProfilePictureUrl(userId) {
    try {
      const { data } = await http.get(`/api/profile/${userId}/picture`);
      return data;
    } catch (error) {
      console.error('Error getting profile picture URL:', error);
      throw error;
    }
  }

  /**
   * Get user profile by email
   * @param {string} email - User email
   * @returns {Promise} API response with user profile
   */
  static async getUserProfile(email) {
    try {
      const { data } = await http.get(`/api/profile/user`, {
        params: { email },
      });
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} API response with updated profile
   */
  static async updateUserProfile(userId, profileData) {
    try {
      const { data } = await http.put(`/api/profile/${userId}`, profileData);
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile by email using auth profile endpoint.
   * Kept for compatibility with dashboards that update profile by email.
   */
  static async updateProfile(email, profileData) {
    try {
      const { data } = await http.put(`/api/auth/profile?email=${encodeURIComponent(email)}`, {
        name: profileData.name,
        phone: profileData.phone,
        email: profileData.email,
      });
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  static async changePassword(userId, passwordData) {
    try {
      const { data } = await http.put(`/api/profile/${userId}/password`, passwordData);
      return data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Get full profile picture URL
   * @param {string} profilePictureUrl - Profile picture URL from API
   * @returns {string} Full URL for the profile picture
   */
  static getFullProfilePictureUrl(profilePictureUrl) {
    if (!profilePictureUrl) {
      return null;
    }

    // If it's already a full URL, return as is
    if (profilePictureUrl.startsWith('http')) {
      return profilePictureUrl;
    }

    // If it's a relative path, prepend the backend root URL (without /api)
    if (profilePictureUrl.startsWith('/')) {
      return `http://localhost:8081${profilePictureUrl}`;
    }

    return profilePictureUrl;
  }

  /**
   * Validate profile picture file
   * @param {File} file - File to validate
   * @returns {Object} Validation result with isValid and error message
   */
  static validateProfilePictureFile(file) {
    if (!file) {
      return { isValid: false, error: 'Please select a file' };
    }

    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Please select a valid image file' };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'Image size must be less than 5MB' };
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return { isValid: false, error: 'Only JPG, JPEG, PNG, GIF, and WebP files are allowed' };
    }

    return { isValid: true, error: null };
  }
}

export default ProfileService;
