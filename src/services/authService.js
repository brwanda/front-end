// services/authService.js
import http from './http';
export class AuthService {
  
  /**
   * Get current logged in user
   * @returns {Object|null} Current user object or null if not logged in
   */
  static getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      return user.email ? user : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is logged in
   */
  static isAuthenticated() {
    const user = this.getCurrentUser();
    return user !== null && user.email;
  }

  /**
   * Get current user's email
   * @returns {string|null} Current user's email or null if not logged in
   */
  static getCurrentUserEmail() {
    const user = this.getCurrentUser();
    return user ? user.email : null;
  }

  /**
   * Get current user's ID
   * @returns {number|null} Current user's ID or null if not logged in
   */
  static getCurrentUserId() {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  /**
   * Get current user's role
   * @returns {string|null} Current user's role or null if not logged in
   */
  static getCurrentUserRole() {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  /**
   * Logout current user (server + client)
   */
  static async logout() {
    try {
      // Attempt API logout endpoint (session invalidation)
      await http.post('/api/auth/logout', null, { credentials: 'include' });
    } catch (e1) {
      // Fallback to Spring Security default logout if available
      try {
        await http.post('/logout', null, { credentials: 'include' });
      } catch (e2) {
        // Ignore; client-side cleanup will still proceed
      }
    } finally {
      try { localStorage.removeItem('user'); } catch (_) {}
      try { localStorage.removeItem('isAuthenticated'); } catch (_) {}
      try { localStorage.removeItem('authToken'); } catch (_) {}
      try { localStorage.removeItem('token'); } catch (_) {}
      try { localStorage.removeItem('userProfile'); } catch (_) {}
      // Redirect to login page
      window.location.href = '/login';
    }
  }

  /**
   * Set user as logged in
   * @param {Object} user - User object to store
   */
  static setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
  }
}

export default AuthService;