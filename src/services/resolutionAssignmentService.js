// services/resolutionAssignmentService.js
import http from './http';

export class ResolutionAssignmentService {
  static async getAllResolutions() {
    try {
      const { data } = await http.get('/api/resolutions');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching resolutions:', error);
      throw error;
    }
  }

  static async getResolutionsBySecretary(secretaryId) {
    try {
      const { data } = await http.get(`/api/secretary/resolutions/${secretaryId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching secretary resolutions:', error);
      throw error;
    }
  }

  static async getResolutionsByMeeting(meetingId) {
    try {
      const { data } = await http.get(`/api/resolutions/meeting/${meetingId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching resolutions by meeting:', error);
      throw error;
    }
  }

  static async createResolution(resolutionData) {
    try {
      const { data } = await http.post('/api/resolutions', resolutionData);
      return data;
    } catch (error) {
      console.error('Error creating resolution:', error);
      throw error;
    }
  }

  /**
   * CRITICAL: Assign resolution to subcommittees — percentages must total 100%.
   * Sending emails to all members of each selected subcommittee is handled by backend.
   */
  static async assignResolution(resolutionId, assignments) {
    const validationErrors = this.validateAssignments(assignments);
    if (validationErrors.length > 0) throw new Error(validationErrors.join('. '));

    const assignmentData = {
      assignments: assignments.map((a) => ({
        subcommitteeId: a.subcommitteeId,
        contributionPercentage: a.contributionPercentage,
      })),
    };
    try {
      const { data } = await http.post(
        `/api/resolutions/${resolutionId}/assign`,
        assignmentData
      );
      return data;
    } catch (error) {
      console.error('Error assigning resolution:', error);
      throw error;
    }
  }

  static async getResolutionProgress(resolutionId) {
    try {
      const { data } = await http.get(`/api/resolutions/${resolutionId}/progress`);
      return data;
    } catch (error) {
      console.error('Error fetching resolution progress:', error);
      throw error;
    }
  }

  static async updateResolutionStatus(resolutionId, status) {
    try {
      const { data } = await http.put(`/api/resolutions/${resolutionId}/status`, { status });
      return data;
    } catch (error) {
      console.error('Error updating resolution status:', error);
      throw error;
    }
  }

  // ── Pure utility methods (no fetch) ──────────────────────────────────────

  static validateAssignments(assignments) {
    const errors = [];
    if (!assignments || assignments.length === 0) {
      errors.push('At least one assignment is required');
      return errors;
    }
    const total = assignments.reduce(
      (sum, a) => sum + parseInt(a.contributionPercentage || 0),
      0
    );
    if (total !== 100) errors.push(`Total contribution must equal 100%. Current total: ${total}%`);
    const ids = assignments.map((a) => a.subcommitteeId);
    if (ids.length !== new Set(ids).size)
      errors.push('Cannot assign the same subcommittee multiple times');
    assignments.forEach((a, i) => {
      if (!a.subcommitteeId) errors.push(`Assignment ${i + 1}: Subcommittee is required`);
      const p = parseInt(a.contributionPercentage || 0);
      if (p <= 0 || p > 100)
        errors.push(`Assignment ${i + 1}: Contribution percentage must be between 1 and 100`);
    });
    return errors;
  }

  static calculateRemainingPercentage(assignments) {
    const total = assignments.reduce(
      (sum, a) => sum + parseInt(a.contributionPercentage || 0),
      0
    );
    return Math.max(0, 100 - total);
  }

  static getStatusColor(status) {
    return { ASSIGNED: '#3b82f6', IN_PROGRESS: '#f59e0b', COMPLETED: '#10b981', CANCELLED: '#ef4444' }[status] || '#6b7280';
  }

  static getPriorityColor(priority) {
    return { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', URGENT: '#dc2626' }[priority] || '#6b7280';
  }

  static formatResolutionData(resolution) {
    return {
      ...resolution,
      statusColor: this.getStatusColor(resolution.status),
      formattedDate: resolution.createdAt
        ? new Date(resolution.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        })
        : 'N/A',
    };
  }

  static validateResolutionData(resolutionData) {
    const errors = [];
    if (!resolutionData.title?.trim()) errors.push('Resolution title is required');
    if (!resolutionData.description?.trim()) errors.push('Resolution description is required');
    if (!resolutionData.meetingId) errors.push('Meeting is required');
    return errors;
  }
}

export default ResolutionAssignmentService;