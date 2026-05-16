// services/memberService.js
import http from './http';

export class MemberService {
  // ==================== NOTIFICATION MANAGEMENT ====================

  static async getNotifications(userId) {
    try {
      const { data } = await http.get(`/api/notifications/user/${userId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async getUnreadCount(userId) {
    try {
      const { data } = await http.get(`/api/notifications/user/${userId}/unread-count`);
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  static async markNotificationAsRead(notificationId) {
    try {
      const { data } = await http.post(`/api/notifications/${notificationId}/mark-read`, null);
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllNotificationsAsRead(userId) {
    try {
      const { data } = await http.post(`/api/notifications/user/${userId}/mark-all-read`, null);
      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // ==================== TASK MANAGEMENT ====================

  static async getAssignedTasks(subcommitteeId) {
    try {
      const { data } = await http.get(`/api/resolutions/subcommittee/${subcommitteeId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching assigned tasks:', error);
      return [];
    }
  }

  static async getSubTasks() {
    try {
      const { data } = await http.get('/api/sub-tasks/my');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching member sub-tasks:', error);
      return [];
    }
  }

  static async getTaskById(taskId) {
    try {
      const { data } = await http.get(`/api/resolutions/${taskId}`);
      return data;
    } catch (error) {
      console.error('Error fetching task details:', error);
      throw error;
    }
  }

  static async updateMySubTaskStatus(subTaskId, progressNote = '') {
    const note = progressNote ? progressNote.trim() : '';
    if (!note) {
      throw new Error('Progress Note to Chair of the Subcommittee is required.');
    }

    const payload = { progressNote: note };
    const { data } = await http.put(`/api/sub-tasks/${subTaskId}/my-status`, payload);
    return data;
  }

  // ==================== PROFILE MANAGEMENT ====================

  static async getProfile(email) {
    try {
      const { data } = await http.get(`/api/auth/profile?email=${encodeURIComponent(email)}`);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

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

  // ==================== MEETING INVITATIONS ====================

  static async getMeetingInvitations(userId) {
    try {
      const { data } = await http.get(`/api/invitations/user/${userId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching meeting invitations:', error);
      return [];
    }
  }

  static async getAllMeetings(subcommitteeId) {
    try {
      const { data } = await http.get(`/api/meetings/subcommittee/${subcommitteeId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  }

  static async getSubCommitteeMembers(subcommitteeId) {
    try {
      const { data } = await http.get(`/api/sub-committees/${subcommitteeId}/members`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching subcommittee members:', error);
      return [];
    }
  }

  static async respondToInvitation(invitationId, response, comments = '') {
    try {
      const { data } = await http.post(`/api/invitations/${invitationId}/respond`, {
        status: response,
        comment: comments,
      });
      return data;
    } catch (error) {
      console.error('Error responding to invitation:', error);
      throw error;
    }
  }

  // ==================== DASHBOARD STATS ====================

  static async getDashboardStats(userId, subcommitteeId) {
    try {
      const { data } = await http.get(
        `/api/dashboard/member/stats?userId=${userId}&subcommitteeId=${subcommitteeId}`
      );
      return {
        ...data,
        recentTasks: Array.isArray(data.recentTasks) ? data.recentTasks : [],
      };
    } catch (error) {
      console.error('Error fetching member stats:', error);
      return {
        assignedTasks: 0,
        completedTasks: 0,
        upcomingMeetings: 0,
        unreadNotifications: 0,
        subcommitteePerformance: 0,
        myContributions: [],
        recentTasks: [],
      };
    }
  }

  // ==================== UTILITY METHODS (no fetch) ====================

  static getNotificationIcon(type) {
    return { TASK_ASSIGNMENT: '📋', MEETING_INVITATION: '📅', DEADLINE_REMINDER: '⏰', TASK_UPDATE: '📝', MEETING_UPDATE: '🔄' }[type] || '📢';
  }

  static formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  static getTaskPriorityColor(priority) {
    return { high: '#dc2626', medium: '#d97706', low: '#16a34a', normal: '#6b7280' }[priority] || '#6b7280';
  }

  static getTaskStatusColor(status) {
    return { ASSIGNED: '#3b82f6', IN_PROGRESS: '#d97706', COMPLETED: '#16a34a', ON_HOLD: '#6b7280' }[status] || '#6b7280';
  }

  static getDaysUntilDeadline(deadlineString) {
    return Math.ceil((new Date(deadlineString) - new Date()) / (1000 * 60 * 60 * 24));
  }

  static getDeadlineUrgency(deadlineString) {
    const d = this.getDaysUntilDeadline(deadlineString);
    if (d < 0) return 'overdue';
    if (d <= 3) return 'urgent';
    if (d <= 7) return 'warning';
    return 'normal';
  }

  static getMeetingStatusColor(status) {
    return { PENDING: '#d97706', ACCEPTED: '#16a34a', DECLINED: '#dc2626', MAYBE: '#8b5cf6' }[status] || '#6b7280';
  }

  static filterNotifications(notifications, type = null) {
    return type ? notifications.filter((n) => n.type === type) : notifications;
  }

  static sortNotifications(notifications, order = 'desc') {
    return [...notifications].sort((a, b) => {
      const diff = new Date(b.createdAt) - new Date(a.createdAt);
      return order === 'desc' ? diff : -diff;
    });
  }

  static getUpcomingDeadlines(tasks, days = 7) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return tasks.filter((t) => { const d = new Date(t.deadline); return d >= now && d <= future; });
  }

  static calculateTaskCompletion(completed, total) {
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }

  static getPerformanceBadgeClass(pct) {
    if (pct >= 90) return 'performance-excellent';
    if (pct >= 80) return 'performance-good';
    if (pct >= 70) return 'performance-average';
    return 'performance-needs-improvement';
  }

  static formatTaskDuration(assignedDate, deadline) {
    const days = Math.ceil((new Date(deadline) - new Date(assignedDate)) / (1000 * 60 * 60 * 24));
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.ceil(days / 7)} weeks`;
    return `${Math.ceil(days / 30)} months`;
  }

  static getTaskProgress(task) {
    return { COMPLETED: 100, DONE: 100, IN_PROGRESS: 65, TODO: 10, ASSIGNED: 10 }[task.status] || 0;
  }
}

export default MemberService;