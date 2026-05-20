// services/commissionerService.js
import http from './http';

export class CommissionerService {
  // ==================== REPORT MANAGEMENT ====================

  static async getApprovedReports() {
    try {
      const { data } = await http.get('/api/reports/status/APPROVED_BY_HOD');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching approved reports:', error);
      return [];
    }
  }

  static async getAllReports() {
    try {
      const { data } = await http.get('/api/reports');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching all reports:', error);
      return await this.getApprovedReports();
    }
  }

  /** Reports escalated to Commissioner (APPROVED_BY_HOD) - scoped for CG */
  static async getReportsForCommissionerReview(commissionerId) {
    try {
      const { data } = await http.get(`/api/reports/commissioner-review/${commissionerId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching reports for commissioner review:', error);
      throw error;
    }
  }

  static async getReportsByResolution(resolutionId) {
    try {
      const { data } = await http.get(`/api/reports/resolution/${resolutionId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching resolution reports:', error);
      return [];
    }
  }

  static async reviewReport(reportId, approved, commissionerComments = '', commissionerId = null) {
    try {
      // Get commissionerId from parameter or localStorage
      let cgId = commissionerId;
      if (!cgId) {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            cgId = user.id;
          }
        } catch (e) { /* ignore */ }
      }
      const { data } = await http.post(`/api/reports/${reportId}/commissioner-review`, {
        commissionerId: cgId,
        approved,
        comments: commissionerComments,
      });
      return data;
    } catch (error) {
      console.error('Error reviewing report:', error);
      throw error;
    }
  }

  static async getReportById(reportId) {
    try {
      const { data } = await http.get(`/api/reports/${reportId}`);
      return data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  // ==================== DASHBOARD & ANALYTICS ====================

  static async getDashboardStats(userId) {
    try {
      const { data } = await http.get('/api/dashboard/comprehensive', {
        params: { userId, userRole: 'COMMISSIONER_GENERAL' },
      });
      return {
        ...data,
        subcommitteePerformance: Array.isArray(data.subcommitteePerformance) ? data.subcommitteePerformance : [],
        statusCounts: data.statusCounts || {},
        monthlyTrends: data.monthlyTrends || [],
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalReports: 0,
        averagePerformance: 0,
        pendingReview: 0,
        approvedReports: 0,
        rejectedReports: 0,
        completedResolutions: 0,
        activeResolutions: 0,
        statusCounts: {},
        subcommitteePerformance: [],
        monthlyTrends: [],
        resolutionProgress: [],
      };
    }
  }

  static async getPerformanceStats() {
    try {
      const { data } = await http.get('/api/dashboard/performance/stats');
      return data;
    } catch (error) {
      console.error('Error fetching performance stats:', error);
      return { averagePerformance: 0, totalReports: 0, subcommitteePerformance: [] };
    }
  }

  static async getResolutionProgress() {
    try {
      const { data } = await http.get('/api/dashboard/resolutions/progress');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching resolution progress:', error);
      return [];
    }
  }

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
      return (data && data.count) ? Number(data.count) : 0;
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

  // ==================== PROFILE MANAGEMENT ====================

  static async getProfile(email) {
    try {
      const { data } = await http.get('/api/auth/profile', { params: { email } });
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  static async updateProfile(email, profileData) {
    try {
      const { data } = await http.put(`/api/auth/profile`, {
        name: profileData.name,
        phone: profileData.phone,
        email: profileData.email,
      }, { params: { email } });
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

  // ==================== CG MEETINGS & RESOLUTIONS ====================

  /** Get all Commissioner General meetings */
  static async getCGMeetings() {
    try {
      const { data } = await http.get('/api/meetings/type/COMMISSIONER_GENERAL_MEETING');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching CG meetings:', error);
      return [];
    }
  }

  /** Get resolutions for a specific meeting */
  static async getResolutionsForMeeting(meetingId) {
    try {
      const { data } = await http.get(`/api/resolutions/meeting/${meetingId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching resolutions for meeting:', error);
      return [];
    }
  }

  /** Download report as Excel or CSV file */
  static async downloadReport(reportId, format = 'csv') {
    try {
      const isExcel = format === 'excel';
      const response = await http.get(`/api/reports/${reportId}/download?format=${format}`, {
        responseType: 'blob'
      });

      const mimeType = isExcel
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv;charset=utf-8';
      const ext = isExcel ? '.xlsx' : '.csv';

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers?.['content-disposition'];
      const filename = disposition
        ? disposition.split('filename=')[1]?.replace(/"/g, '')
        : `report_${reportId}${ext}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS (no fetch) ====================

  static getReportStatusColor(status) {
    const colors = {
      APPROVED_BY_HOD: '#3b82f6',
      APPROVED_BY_COMMISSIONER: '#16a34a',
      REJECTED_BY_COMMISSIONER: '#dc2626',
      IN_REVIEW: '#d97706',
    };
    return colors[status] || '#6b7280';
  }

  static getNotificationIcon(type) {
    const icons = {
      REPORT_COMMENT: '💬',
      REPORT_APPROVAL: '✅',
      REPORT_REJECTION: '❌',
      MEETING_INVITATION: '📅',
      TASK_ASSIGNMENT: '📋',
      DEADLINE_REMINDER: '⏰',
    };
    return icons[type] || '📢';
  }

  static formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  static getPerformanceColor(percentage) {
    if (percentage >= 90) return '#16a34a';
    if (percentage >= 80) return '#65a30d';
    if (percentage >= 70) return '#d97706';
    if (percentage >= 60) return '#f59e0b';
    return '#dc2626';
  }

  static getTrendIcon(trend) {
    return { up: '📈', down: '📉', stable: '➡️' }[trend] || '➡️';
  }

  static calculateCompletionRate(completed, total) {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  static getStatusBadgeClass(status) {
    return `status-badge ${status.toLowerCase().replace('_', '-')}`;
  }

  static filterReports(reports, filters) {
    return reports.filter((report) => {
      if (filters.status && report.status !== filters.status) return false;
      if (filters.subcommitteeId && report.subcommittee.id !== filters.subcommitteeId) return false;
      if (filters.resolutionId && report.resolution.id !== filters.resolutionId) return false;
      if (filters.searchTerm) {
        const s = filters.searchTerm.toLowerCase();
        if (!report.resolution.title.toLowerCase().includes(s) &&
          !report.submittedBy.name.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }

  static sortReports(reports, sortBy, sortOrder = 'desc') {
    return [...reports].sort((a, b) => {
      let vA, vB;
      switch (sortBy) {
        case 'hodReviewedAt': vA = new Date(a.hodReviewedAt || a.submittedAt); vB = new Date(b.hodReviewedAt || b.submittedAt); break;
        case 'performancePercentage': vA = a.performancePercentage; vB = b.performancePercentage; break;
        case 'resolutionTitle': vA = a.resolution.title.toLowerCase(); vB = b.resolution.title.toLowerCase(); break;
        case 'chairName': vA = a.submittedBy.name.toLowerCase(); vB = b.submittedBy.name.toLowerCase(); break;
        default: return 0;
      }
      if (vA < vB) return sortOrder === 'asc' ? -1 : 1;
      if (vA > vB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  static getReportPriority(performancePercentage, hodReviewedAt) {
    const hoursAgo = (new Date() - new Date(hodReviewedAt)) / (1000 * 60 * 60);
    if (performancePercentage >= 90 && hoursAgo <= 24) return 'high';
    if (performancePercentage >= 80) return 'medium';
    if (hoursAgo > 48) return 'urgent';
    return 'normal';
  }
}

export default CommissionerService;
