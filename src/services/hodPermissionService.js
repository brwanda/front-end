// services/hodPermissionService.js
import http from './http';

/**
 * HOD Permission Service
 * Handles checking if a user has HOD (Head of Delegation) privileges.
 * Chair or Vice Chair of the "Head Of Delegation" subcommittee have HOD privileges.
 */
export class HODPermissionService {

  static hasHODPrivileges(user) {
    if (!user) return false;
    if (user.role === 'HOD' || user.role === 'CHAIR_OF_HOD' || user.role === 'CHAIR_HEAD_OF_DELEGATION') return true;
    if ((user.role === 'CHAIR' || user.role === 'VICE_CHAIR') && user.subcommittee) {
      return this.isHeadOfDelegationSubcommittee(user.subcommittee);
    }
    return false;
  }

  static isHODChair(user) {
    if (!user) return false;
    if (user.role === 'CHAIR_OF_HOD' || user.role === 'CHAIR_HEAD_OF_DELEGATION') return true;
    return user.role === 'CHAIR' && this.isHeadOfDelegationSubcommittee(user.subcommittee);
  }

  static isHeadOfDelegationSubcommittee(subcommittee) {
    return !!(subcommittee?.name?.toLowerCase() === 'head of delegation');
  }

  static getDashboardRoute(user) {
    if (!user) return '/dashboard';
    if (this.hasHODPrivileges(user)) return '/hod/dashboard';
    return {
      ADMIN: '/admin/dashboard',
      SECRETARY: '/secretary/dashboard',
      CHAIR: '/chair/dashboard',
      VICE_CHAIR: '/chair/dashboard',
      HOD: '/hod/dashboard',
      CHAIR_OF_HOD: '/hod/dashboard',
      CHAIR_HEAD_OF_DELEGATION: '/hod/dashboard',
      COMMISSIONER_GENERAL: '/commissioner/dashboard',
      SUBCOMMITTEE_MEMBER: '/member/dashboard',
      COMMITTEE_MEMBER: '/member/dashboard',
      COMMITTEE_SECRETARY: '/secretary/dashboard',
      DELEGATION_SECRETARY: '/secretary/dashboard',
    }[user.role] || '/dashboard';
  }

  static getUserRoleDisplay(user) {
    if (!user) return 'Unknown';
    if (this.hasHODPrivileges(user)) return 'Head of Delegation';
    return {
      ADMIN: 'Administrator',
      SECRETARY: 'Secretary',
      CHAIR: 'Chair',
      VICE_CHAIR: 'Vice Chair',
      HOD: 'Head of Delegation',
      CHAIR_OF_HOD: 'Chair of Head of Delegation',
      CHAIR_HEAD_OF_DELEGATION: 'Chair of Head of Delegation',
      COMMISSIONER_GENERAL: 'Commissioner General',
      SUBCOMMITTEE_MEMBER: 'Subcommittee Member',
      COMMITTEE_MEMBER: 'Committee Member',
      COMMITTEE_SECRETARY: 'Committee Secretary',
      DELEGATION_SECRETARY: 'Delegation Secretary',
    }[user.role] || user.role || 'Unknown';
  }

  static canReviewReports(user) { return this.isHODChair(user); }
  static canCommentOnReports(user) { return this.hasHODPrivileges(user); }
  static canAccessHODDashboard(user) { return this.hasHODPrivileges(user); }

  static getHODNavigationItems(user) {
    if (!this.hasHODPrivileges(user)) return [];
    return [
      { id: 'overview', name: 'Dashboard Overview', path: '/hod/dashboard', icon: 'home' },
      { id: 'reports', name: 'Report Review', path: '/hod/reports', icon: 'document' },
      { id: 'performance', name: 'Performance Analytics', path: '/hod/performance', icon: 'chart' },
      { id: 'notifications', name: 'Notifications', path: '/hod/notifications', icon: 'bell' },
      { id: 'profile', name: 'Profile Settings', path: '/hod/profile', icon: 'user' },
    ];
  }

  /**
   * Verify HOD privileges with backend (for security-critical operations)
   */
  static async verifyHODPrivileges(userId) {
    try {
      const { data } = await http.get(`/api/users/${userId}/hod-privileges`);
      return data.hasHODPrivileges || false;
    } catch (error) {
      console.error('Error verifying HOD privileges:', error);
      return false;
    }
  }
}

export default HODPermissionService;
