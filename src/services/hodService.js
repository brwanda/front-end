// services/hodService.js
import http from './http';

export class HODService {
  static normalizeStatus(status) {
    return (status || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
  }

  static getStatusBucket(status) {
    const normalized = this.normalizeStatus(status);
    if (normalized.includes('REJECT')) return 'REJECTED';
    if (normalized.includes('APPROV')) return 'APPROVED';
    if (normalized.includes('SUBMIT') || normalized.includes('PENDING') || normalized.includes('REVIEW')) {
      return 'SUBMITTED';
    }
    return normalized;
  }

  static statusGroupForFilter(selectedStatus) {
    const status = this.normalizeStatus(selectedStatus);
    if (status === 'SUBMITTED') {
      return ['SUBMITTED', 'PENDING_CHAIR_REVIEW', 'IN_REVIEW'];
    }
    if (status === 'APPROVED_BY_HOD') {
      return ['APPROVED_BY_HOD', 'APPROVED_BY_COMMISSIONER', 'APPROVED'];
    }
    if (status === 'REJECTED_BY_HOD') {
      return ['REJECTED_BY_HOD', 'REJECTED_BY_COMMISSIONER', 'REJECTED'];
    }
    return status ? [status] : [];
  }

  static matchesSelectedStatus(reportStatus, selectedStatus) {
    const normalizedSelectedStatus = this.normalizeStatus(selectedStatus);
    const normalizedReportStatus = this.normalizeStatus(reportStatus);

    // Business meaning for HOD filter: once a report is submitted in workflow,
    // it remains part of "Submitted" even after approval/rejection transitions.
    if (normalizedSelectedStatus === 'SUBMITTED') {
      return !!normalizedReportStatus && normalizedReportStatus !== 'DRAFT';
    }

    const allowed = this.statusGroupForFilter(selectedStatus);
    if (!allowed.length) return true;
    if (allowed.includes(normalizedReportStatus)) return true;

    const selectedBucket = this.getStatusBucket(selectedStatus);
    const reportBucket = this.getStatusBucket(reportStatus);
    return selectedBucket === reportBucket;
  }

  static sortNewestFirst(items = [], ...dateFields) {
    const fields = dateFields.length ? dateFields : ['submittedAt', 'updatedAt', 'createdAt'];
    return [...(items || [])].sort((a, b) => {
      for (const field of fields) {
        const aVal = a?.[field] ? new Date(a[field]).getTime() : 0;
        const bVal = b?.[field] ? new Date(b[field]).getTime() : 0;
        if (aVal !== bVal) return bVal - aVal;
      }
      return (b?.id || 0) - (a?.id || 0);
    });
  }

  // ==================== REPORT MANAGEMENT ====================

  static async getAllReports(status = null) {
    try {
      const url = status ? `/api/reports/status/${status}` : '/api/reports';
      const { data } = await http.get(url);
      return Array.isArray(data)
        ? this.sortNewestFirst(data, 'submittedAt', 'updatedAt', 'createdAt')
        : [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }

  static async getReportsByResolution(resolutionId) {
    try {
      const { data } = await http.get(`/api/reports/resolution/${resolutionId}`);
      return Array.isArray(data)
        ? this.sortNewestFirst(data, 'submittedAt', 'updatedAt', 'createdAt')
        : [];
    } catch (error) {
      console.error('Error fetching resolution reports:', error);
      return [];
    }
  }

  static async getReportsBySubcommittee(subcommitteeId) {
    try {
      const { data } = await http.get(`/api/reports/subcommittee/${subcommitteeId}`);
      return Array.isArray(data)
        ? this.sortNewestFirst(data, 'submittedAt', 'updatedAt', 'createdAt')
        : [];
    } catch (error) {
      console.error('Error fetching subcommittee reports:', error);
      return [];
    }
  }

  static async getReportById(reportId) {
    const { data } = await http.get(`/api/reports/${reportId}`);
    return data;
  }

  /** Reports pending HOD review (scoped to HOD's country) */
  static async getReportsForHodReview(hodId) {
    try {
      const { data } = await http.get(`/api/reports/hod-review/${hodId}`);
      return Array.isArray(data)
        ? this.sortNewestFirst(data, 'submittedAt', 'updatedAt', 'createdAt')
        : [];
    } catch (error) {
      console.error('Error fetching reports for HOD review:', error);
      throw error;
    }
  }

  /** Download a report as CSV or Excel file */
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
      // Extract filename from Content-Disposition or use default
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

  static async reviewReport(reportId, approved, hodComments = '', hodId, hodRanking = null) {
    try {
      const payload = {
        hodId,
        approved,
        comments: hodComments,
      };
      if (hodRanking != null) {
        payload.hodRanking = hodRanking;
      }
      const { data } = await http.post(`/api/reports/${reportId}/hod-review`, payload);
      return data ?? { success: true };
    } catch (error) {
      console.error('Error reviewing report:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION MANAGEMENT ====================

  static async getHODNotifications(hodId) {
    try {
      const { data } = await http.get(`/api/notifications/user/${hodId}`);
      return Array.isArray(data)
        ? this.sortNewestFirst(data, 'createdAt', 'updatedAt')
        : [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async getUnreadNotificationCount(hodId) {
    try {
      const { data } = await http.get(`/api/notifications/user/${hodId}/unread-count`);
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

  static async markAllNotificationsAsRead(hodId) {
    try {
      const { data } = await http.post(`/api/notifications/user/${hodId}/mark-all-read`, null);
      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // ==================== PROFILE MANAGEMENT ====================

  static async getHODProfile(email) {
    try {
      const { data } = await http.get(`/api/auth/profile?email=${encodeURIComponent(email)}`);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  static async updateHODProfile(email, profileData) {
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

  // ==================== ANALYTICS & DASHBOARD ====================

  static async getDashboardStats(hodId) {
    try {
      const { data } = await http.get(`/api/dashboard/performance/stats?hodId=${hodId}`);
      return {
        ...data,
        subcommitteePerformance: Array.isArray(data.subcommitteePerformance)
          ? data.subcommitteePerformance
          : [],
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        pendingReports: 0,
        approvedThisMonth: 0,
        rejectedThisMonth: 0,
        averagePerformance: 0,
        activeResolutions: 0,
        totalSubcommittees: 0,
        monthlyTrend: { approved: [], rejected: [], pending: [] },
        subcommitteePerformance: [],
      };
    }
  }

  static async getMeetingInvitations(hodId) {
    try {
      const { data } = await http.get(`/api/invitations/user/${hodId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching meeting invitations:', error);
      return [];
    }
  }

  static async respondToMeetingInvitation(invitationId, response, comments = '') {
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

  // ==================== UTILITY METHODS (no fetch) ====================

  static validateReportReview(approved, hodComments) {
    const errors = [];
    if (!approved && (!hodComments || !hodComments.trim()))
      errors.push('Comments are required when rejecting a report');
    if (hodComments && hodComments.length < 10)
      errors.push('Comments must be at least 10 characters long');
    return errors;
  }

  static getReportStatusColor(status) {
    return { SUBMITTED: '#d97706', APPROVED_BY_HOD: '#3b82f6', REJECTED_BY_HOD: '#dc2626', IN_REVIEW: '#8b5cf6' }[status] || '#6b7280';
  }

  static getNotificationIcon(type) {
    return { REPORT_SUBMISSION: '📊', REPORT_COMMENT: '💬', REPORT_APPROVAL: '✅', REPORT_REJECTION: '❌', MEETING_INVITATION: '📅', DEADLINE_REMINDER: '⏰' }[type] || '📢';
  }

  static formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  static toSafeNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  static clampPercentage(value) {
    const numeric = this.toSafeNumber(value);
    if (numeric === null) return null;
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }

  static extractPercentageFromText(text) {
    if (!text || typeof text !== 'string') return null;
    const match = text.match(/(\d{1,3})\s*%/);
    if (!match) return null;
    return this.clampPercentage(match[1]);
  }

  static getEffectiveReportPerformance(report) {
    const directCandidates = [
      report?.performancePercentage,
      report?.performance,
      report?.effectivePerformance,
      report?.calculatedPerformance,
      report?.subcommitteePerformance,
    ];

    for (const candidate of directCandidates) {
      const pct = this.clampPercentage(candidate);
      if (pct !== null && pct > 0) return pct;
    }

    const hodRanking = this.toSafeNumber(report?.hodRanking);
    if (hodRanking !== null && hodRanking > 0) {
      const rankingBased = this.clampPercentage(hodRanking * 20);
      if (rankingBased !== null && rankingBased > 0) return rankingBased;
    }

    const extracted = this.extractPercentageFromText(report?.progressDetails);
    if (extracted !== null && extracted > 0) return extracted;

    // Keep explicit 0 when no usable signal exists.
    return this.clampPercentage(report?.performancePercentage) ?? 0;
  }

  static getPerformanceColor(pct) {
    if (pct >= 90) return '#16a34a';
    if (pct >= 80) return '#65a30d';
    if (pct >= 70) return '#d97706';
    if (pct >= 60) return '#f59e0b';
    return '#dc2626';
  }

  static getTrendIcon(trend) {
    return { up: '📈', down: '📉', stable: '➡️' }[trend] || '➡️';
  }

  static calculateApprovalRate(approved, rejected) {
    const total = approved + rejected;
    return total === 0 ? 0 : Math.round((approved / total) * 100);
  }

  static getReportUrgency(submittedAt) {
    const hrs = (new Date() - new Date(submittedAt)) / (1000 * 60 * 60);
    if (hrs > 72) return 'overdue';
    if (hrs > 48) return 'urgent';
    if (hrs > 24) return 'warning';
    return 'normal';
  }

  static filterReports(reports, filters) {
    return reports.filter((r) => {
      if (filters.status && !this.matchesSelectedStatus(r.status, filters.status)) return false;
      if (filters.subcommitteeId && Number(r?.subcommittee?.id) !== Number(filters.subcommitteeId)) return false;
      if (filters.resolutionId && Number(r?.resolution?.id) !== Number(filters.resolutionId)) return false;
      if (filters.searchTerm) {
        const t = filters.searchTerm.toLowerCase();
        const resolutionTitle = (r?.resolution?.title || '').toLowerCase();
        const submittedByName = (r?.submittedBy?.name || '').toLowerCase();
        if (!resolutionTitle.includes(t) && !submittedByName.includes(t)) return false;
      }
      return true;
    });
  }

  static sortReports(reports, sortBy, sortOrder = 'desc') {
    return [...reports].sort((a, b) => {
      let vA, vB;
      switch (sortBy) {
        case 'submittedAt': vA = new Date(a.submittedAt); vB = new Date(b.submittedAt); break;
        case 'performancePercentage':
          vA = this.getEffectiveReportPerformance(a);
          vB = this.getEffectiveReportPerformance(b);
          break;
        case 'resolutionTitle': vA = a.resolution.title.toLowerCase(); vB = b.resolution.title.toLowerCase(); break;
        case 'chairName': vA = a.submittedBy.name.toLowerCase(); vB = b.submittedBy.name.toLowerCase(); break;
        default: return 0;
      }
      if (vA < vB) return sortOrder === 'asc' ? -1 : 1;
      if (vA > vB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }
}

export default HODService;
