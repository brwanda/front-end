// services/chairService.js
import http from './http';

export class ChairService {
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

  // ==================== RESOLUTION MANAGEMENT ====================

  static async getAssignedResolutions(chairId) {
    try {
      const { data } = await http.get(`/api/chair/resolutions/${chairId}`);
      return Array.isArray(data)
        ? this.sortNewestFirst(data, 'updatedAt', 'createdAt')
        : [];
    } catch (error) {
      console.error(`Error fetching assigned resolutions for chair ${chairId}:`, error);
      return [];
    }
  }

  static async getResolutionDetails(resolutionId, chairId) {
    try {
      const { data } = await http.get(
        `/api/chair/resolutions/${resolutionId}/details?chairId=${chairId}`
      );
      return data;
    } catch (error) {
      console.error(`Error fetching resolution details for ${resolutionId}:`, error);
      return null;
    }
  }

  // ==================== REPORT MANAGEMENT ====================

  /** Download a report as CSV or Excel file */
  static async downloadReport(reportId, format = 'csv') {
    try {
      const isExcel = format === 'excel';
      const response = await http.get(`/api/reports/${reportId}/download?format=${format}`, {
        expectBlob: true
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

  static async getReportAttachments(reportId) {
    try {
      const { data } = await http.get(`/api/reports/${reportId}/attachments`);
      return Array.isArray(data)
        ? this.sortNewestFirst(data, 'uploadedAt', 'createdAt')
        : [];
    } catch (error) {
      console.error(`Error fetching report attachments for ${reportId}:`, error);
      return [];
    }
  }

  static async uploadReportAttachments(reportId, files) {
    const formData = new FormData();
    const normalizedFiles = Array.isArray(files)
      ? files
      : (files instanceof FileList ? Array.from(files) : [files]);

    normalizedFiles.filter(Boolean).forEach((file) => {
      formData.append('files', file);
    });
    const { data } = await http.post(`/api/reports/${reportId}/attachments`, formData);
    return Array.isArray(data) ? data : [];
  }

  static getReportAttachmentViewUrl(reportId, attachmentId) {
    return `/api/reports/${reportId}/attachments/${attachmentId}/view`;
  }

  static async getReportAttachmentPreview(reportId, attachmentId) {
    const response = await http.get(
      `/api/reports/${reportId}/attachments/${attachmentId}/view`,
      { expectBlob: true }
    );

    const headerContentType = typeof response.headers?.get === 'function'
      ? (response.headers.get('content-type') || '')
      : '';

    const blob = response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: headerContentType || 'application/octet-stream' });

    return {
      blob,
      contentType: blob.type || headerContentType || 'application/octet-stream',
    };
  }

  static async downloadReportAttachment(reportId, attachment) {
    const response = await http.get(
      `/api/reports/${reportId}/attachments/${attachment.id}/download`,
      { expectBlob: true }
    );
    const blob = response.data;
    const url = window.URL.createObjectURL(blob);

    let headerFilename = '';
    const contentDisposition = typeof response.headers?.get === 'function'
      ? response.headers.get('content-disposition')
      : null;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      headerFilename = decodeURIComponent((match?.[1] || match?.[2] || '').trim());
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = headerFilename || attachment.filename || `attachment_${attachment.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  static async submitReport(reportData) {
    try {
      const { data } = await http.post(
        `/api/chair/reports?chairId=${reportData.chairId}`,
        {
          resolution: { id: reportData.resolutionId },
          subcommittee: { id: reportData.subcommitteeId },
          progressDetails: reportData.progressDetails,
          hindrances: reportData.hindrances || '',
          performancePercentage: reportData.performancePercentage,
          memberRatingsSummary: reportData.memberRatingsSummary || null,
          submittedAt: new Date().toISOString(),
        }
      );
      return {
        ...data,
        successMessage: `Report submitted successfully! Report ID: ${data.id}`,
      };
    } catch (error) {
      // Extract and log detailed error information from backend response
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      const errorDetails = error.response?.data?.details || [];
      console.error('Error submitting report:', error);
      console.error('Backend error:', errorMessage);
      if (errorDetails.length > 0) {
        console.error('Validation details:', errorDetails);
      }
      throw error;
    }
  }

  static async getReportsForResolution(resolutionId) {
    try {
      const { data } = await http.get(`/api/reports/resolution/${resolutionId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching reports for resolution ${resolutionId}:`, error);
      return [];
    }
  }

  static async getChairReports(chairId) {
    try {
      const { data } = await http.get(`/api/chair/reports/${chairId}`);
      return Array.isArray(data)
        ? this.sortNewestFirst(data, 'submittedAt', 'updatedAt', 'createdAt')
        : [];
    } catch (error) {
      console.error(`Error fetching chair reports for chair ${chairId}:`, error);
      throw error;
    }
  }

  static async updateReport(reportId, reportData) {
    try {
      const { data } = await http.put(
        `/api/chair/reports/${reportId}?chairId=${reportData.chairId}`,
        {
          resolution: reportData.resolutionId ? { id: reportData.resolutionId } : undefined,
          subcommittee: reportData.subcommitteeId ? { id: reportData.subcommitteeId } : undefined,
          progressDetails: reportData.progressDetails,
          hindrances: reportData.hindrances,
          performancePercentage: reportData.performancePercentage,
          submittedAt: new Date().toISOString(),
        }
      );
      return data;
    } catch (error) {
      console.error(`Error updating report ${reportId}:`, error);
      throw error;
    }
  }

  static async resubmitReport(reportId, reportData) {
    const updated = await this.updateReport(reportId, reportData);
    return this.submitReport({
      resolutionId: updated.resolution.id,
      subcommitteeId: updated.subcommittee.id,
      chairId: reportData.chairId,
      progressDetails: reportData.progressDetails,
      hindrances: reportData.hindrances,
      performancePercentage: reportData.performancePercentage,
    });
  }

  // ==================== NOTIFICATION MANAGEMENT ====================

  static async getUserNotifications(userId) {
    try {
      const { data } = await http.get(`/api/notifications/user/${userId}`);
      return Array.isArray(data)
        ? this.sortNewestFirst(data, 'createdAt', 'updatedAt')
        : [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async getUnreadNotificationCount(userId) {
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

  // ==================== PROFILE MANAGEMENT ====================

  static async getUserProfile(email) {
    try {
      const { data } = await http.get(`/api/auth/profile?email=${encodeURIComponent(email)}`);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  static async updateUserProfile(email, profileData) {
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

  // ==================== SUB-TASK MANAGEMENT ====================

  static async getSubTasksBySubcommittee(subcommitteeId) {
    try {
      const { data } = await http.get(`/api/sub-tasks/subcommittee/${subcommitteeId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching subcommittee sub-tasks:', error);
      return [];
    }
  }

  static async getSubTasksByResolution(resolutionId) {
    try {
      const { data } = await http.get(`/api/sub-tasks/resolution/${resolutionId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching resolution sub-tasks:', error);
      return [];
    }
  }

  /** Get sub-tasks for a resolution scoped to a specific subcommittee */
  static async getSubTasksByResolutionAndSubcommittee(resolutionId, subcommitteeId) {
    try {
      const { data } = await http.get(`/api/sub-tasks/resolution/${resolutionId}/subcommittee/${subcommitteeId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching resolution+subcommittee sub-tasks:', error);
      // Fallback: fetch by resolution only
      return this.getSubTasksByResolution(resolutionId);
    }
  }

  static async createSubTask(taskData) {
    const { data } = await http.post('/api/sub-tasks', taskData);
    return data;
  }

  static async updateSubTask(taskId, taskData) {
    const { data } = await http.put(`/api/sub-tasks/${taskId}`, taskData);
    return data;
  }

  static async deleteSubTask(taskId) {
    const { data } = await http.del(`/api/sub-tasks/${taskId}`);
    return data;
  }

  /** Chair ranks a member's completed subtask (1-5 scale with feedback) */
  static async chairRankSubTask(taskId, ranking, feedback) {
    try {
      const { data } = await http.put(`/api/sub-tasks/${taskId}/chair-rank`, {
        ranking: String(ranking),
        feedback: feedback || ''
      });
      return data;
    } catch (error) {
      console.error(`Error ranking sub-task ${taskId}:`, error);
      throw error;
    }
  }

  static async getSubcommitteeMembers(subcommitteeId) {
    try {
      const { data } = await http.get(`/api/sub-committees/${subcommitteeId}/members`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching subcommittee members:', error);
      return [];
    }
  }

  // ==================== UTILITY METHODS (no fetch) ====================

  static validateReportData(reportData) {
    const errors = [];
    if (!reportData.progressDetails?.trim()) errors.push('Progress details are required');
    // Check TRIMMED length to match backend validation
    if (reportData.progressDetails?.trim().length < 10) errors.push('Progress details must be at least 10 characters long');
    if (reportData.performancePercentage == null) errors.push('Performance percentage is required');
    if (reportData.performancePercentage < 0 || reportData.performancePercentage > 100) errors.push('Performance percentage must be between 0 and 100');
    return errors;
  }

  static getReportStatusColor(status) {
    return { SUBMITTED: '#d97706', APPROVED: '#16a34a', REJECTED_BY_HOD: '#dc2626', IN_REVIEW: '#3b82f6' }[status] || '#6b7280';
  }

  static getNotificationIcon(type) {
    return { REPORT_REJECTION: '❌', REPORT_COMMENT: '💬', TASK_ASSIGNMENT: '📋', MEETING_INVITATION: '📅', REPORT_APPROVED: '✅', DEADLINE_REMINDER: '⏰' }[type] || '📢';
  }

  static formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  static getDaysUntilDeadline(deadlineString) {
    return Math.ceil((new Date(deadlineString) - new Date()) / (1000 * 60 * 60 * 24));
  }

  static getPerformanceColor(pct) {
    if (pct >= 80) return '#16a34a';
    if (pct >= 60) return '#d97706';
    if (pct >= 40) return '#f59e0b';
    return '#dc2626';
  }

  static getDeadlineUrgency(deadlineString) {
    const d = this.getDaysUntilDeadline(deadlineString);
    if (d < 0) return 'overdue';
    if (d <= 3) return 'urgent';
    if (d <= 7) return 'warning';
    return 'normal';
  }
}

export default ChairService;
