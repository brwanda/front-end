// services/userManagementService.js
import http from './http';

export class UserManagementService {
  static async getAllUsers() {
    try {
      const { data } = await http.get('/api/users');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  static async getUserById(id) {
    try {
      const { data } = await http.get(`/api/users/${id}`);
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  static async getUsersByRole(role) {
    try {
      const { data } = await http.get(`/api/users/role/${role}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  static async getUsersByCountry(countryId) {
    try {
      const { data } = await http.get(`/api/users/country/${countryId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching users by country:', error);
      throw error;
    }
  }

  static async createUser(userData) {
    try {
      if (!userData.email || !userData.name || !userData.role) {
        throw new Error('Email, name, and role are required');
      }
      if (['COMMITTEE_SECRETARY', 'DELEGATION_SECRETARY'].includes(userData.role) && !userData.country?.id) {
        throw new Error('Country is required for Secretary roles');
      }
      if (['CHAIR', 'VICE_CHAIR', 'SUBCOMMITTEE_MEMBER', 'COMMITTEE_MEMBER'].includes(userData.role) && !userData.subcommittee?.id) {
        throw new Error('Subcommittee is required for this role');
      }
      const { data } = await http.post('/api/users', userData);
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(id, userData) {
    try {
      const { data } = await http.put(`/api/users/${id}`, userData);
      // Backend now returns { message: "...", user: {...} }
      return data.user || data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(id) {
    try {
      const { data } = await http.del(`/api/users/${id}`);
      // Backend returns { message: "User deleted successfully" }
      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async resendCredentials(userId) {
    try {
      await http.post(`/api/users/${userId}/resend-credentials`, null);
      return true;
    } catch (error) {
      console.error('Error resending credentials:', error);
      throw error;
    }
  }

  // ── Pure utility methods (no fetch) ──────────────────────────────────────

  static validateUserData(userData) {
    const errors = [];
    if (!userData.email || !userData.email.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.push('Please enter a valid email address');
    }
    if (!userData.name || !userData.name.trim()) errors.push('Name is required');
    if (!userData.role) errors.push('Role is required');
    if (['COMMITTEE_SECRETARY', 'DELEGATION_SECRETARY'].includes(userData.role) && !userData.country?.id)
      errors.push('Country is required for Secretary roles');
    if (['CHAIR', 'VICE_CHAIR', 'SUBCOMMITTEE_MEMBER', 'COMMITTEE_MEMBER'].includes(userData.role) && !userData.subcommittee?.id)
      errors.push('Subcommittee is required for this role');
    return errors;
  }

  static getRoleDisplayName(role) {
    const roleNames = {
      ADMIN: 'System Administrator',
      COMMITTEE_SECRETARY: 'Committee Secretary',
      DELEGATION_SECRETARY: 'Delegation Secretary',
      CHAIR: 'Chair',
      VICE_CHAIR: 'Vice Chair',
      HOD: 'Head of Delegation',
      COMMISSIONER_GENERAL: 'Commissioner General',
      SUBCOMMITTEE_MEMBER: 'Subcommittee Member',
      COMMITTEE_MEMBER: 'Committee Member',
      SECRETARY: 'Secretary',
    };
    return roleNames[role] || role;
  }

  static getAvailableRoles() {
    return [
      { value: 'COMMISSIONER_GENERAL', label: 'Commissioner General' },
      { value: 'HOD', label: 'Head of Delegation' },
      { value: 'CHAIR', label: 'Chair' },
      { value: 'VICE_CHAIR', label: 'Vice Chair' },
      { value: 'COMMITTEE_SECRETARY', label: 'Committee Secretary' },
      { value: 'DELEGATION_SECRETARY', label: 'Delegation Secretary' },
      { value: 'SUBCOMMITTEE_MEMBER', label: 'Subcommittee Member' },
      { value: 'COMMITTEE_MEMBER', label: 'Committee Member' },
    ];
  }
}

export default UserManagementService;