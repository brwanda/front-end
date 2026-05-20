// services/invitationService.js
import http from './http';

export const getMeetingsForInvitations = async () => {
  try {
    const { data } = await http.get('/api/meetings');
    if (!Array.isArray(data)) return [];
    return data.filter(
      (m) => m && ['SCHEDULED', 'PLANNED'].includes(m.status) && m.id && m.title
    );
  } catch (error) {
    console.error('Error fetching meetings for invitations:', error);
    throw new Error(`Failed to load meetings: ${error.message}`);
  }
};

export const getPotentialInvitees = async (meetingId) => {
  try {
    try {
      const { data } = await http.get(`/api/meetings/${meetingId}/potential-invitees`);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (_) {
      // Fall through to /users fallback
    }
    const { data: allUsers } = await http.get('/api/users');
    if (!Array.isArray(allUsers)) return [];
    return allUsers.filter((u) => u.active && u.email && u.name && (u.roles?.length > 0 || u.role));
  } catch (error) {
    console.error('Error fetching potential invitees:', error);
    throw new Error(`Failed to load potential invitees: ${error.message}`);
  }
};

export const sendInvitations = async (invitationData) => {
  if (!invitationData.meetingId) throw new Error('Meeting ID is required');
  if (!invitationData.recipientIds?.length) throw new Error('At least one recipient is required');
  if (!invitationData.message?.trim()) throw new Error('Invitation message is required');

  const payload = {
    meetingId: invitationData.meetingId,
    recipientIds: invitationData.recipientIds,
    message: invitationData.message.trim(),
    senderId: invitationData.senderId,
    sendEmail: true,
  };

  try {
    const { data } = await http.post('/api/invitations/send', payload);
    return { success: true, sentCount: invitationData.recipientIds.length, message: 'Invitations sent successfully', data };
  } catch (error) {
    console.error('Error sending invitations:', error);
    throw new Error(`Failed to send invitations: ${error.message}`);
  }
};

export const sendMeetingInvitations = async (meetingId, senderId, recipientIds, customMessage = '') => {
  return sendInvitations({
    meetingId,
    senderId,
    recipientIds,
    message: customMessage || 'You are invited to attend this meeting.',
  });
};

export const getInvitationHistory = async () => {
  try {
    const { data } = await http.get('/api/invitations/history');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching invitation history:', error);
    return [];
  }
};

export const getMeetingInvitations = async (meetingId) => {
  try {
    const { data } = await http.get(`/api/meetings/${meetingId}/invitations`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching meeting invitations:', error);
    return [];
  }
};

export const updateInvitationStatus = async (invitationId, status, userId) => {
  try {
    const { data } = await http.put(`/api/invitations/${invitationId}/status`, { status, userId });
    return data;
  } catch (error) {
    console.error('Error updating invitation status:', error);
    throw new Error(`Failed to update invitation status: ${error.message}`);
  }
};

export const resendInvitations = async (meetingId, recipientIds) => {
  try {
    const { data } = await http.post('/api/invitations/resend', { meetingId, recipientIds });
    return data;
  } catch (error) {
    console.error('Error resending invitations:', error);
    throw new Error(`Failed to resend invitations: ${error.message}`);
  }
};

export const getCountries = async () => {
  try {
    const { data } = await http.get('/api/countries');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
};

export const getUsers = async (filters = {}) => {
  try {
    const params = {};
    if (filters.role) params.role = filters.role;
    if (filters.country) params.country = filters.country;
    if (filters.active !== undefined) params.active = filters.active;
    const { data } = await http.get('/api/users', { params });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const validateEmailTemplate = async (template) => {
  try {
    const { data } = await http.post('/api/invitations/validate-template', { template });
    return data;
  } catch (error) {
    console.error('Error validating email template:', error);
    return { valid: true, warnings: [] };
  }
};

export const getInvitationStats = async (meetingId = null) => {
  try {
    const params = meetingId ? { meetingId } : {};
    const { data } = await http.get('/api/invitations/stats', { params });
    return data;
  } catch (error) {
    console.error('Error fetching invitation stats:', error);
    return { totalSent: 0, totalAccepted: 0, totalDeclined: 0, totalPending: 0 };
  }
};

export const bulkUpdateInvitations = async (invitationIds, action, data = {}) => {
  try {
    const { data: result } = await http.post('/api/invitations/bulk-update', { invitationIds, action, data });
    return result;
  } catch (error) {
    console.error('Error performing bulk invitation update:', error);
    throw new Error(`Failed to perform bulk update: ${error.message}`);
  }
};

export const exportInvitationData = async (meetingId, format = 'csv') => {
  try {
    const { data } = await http.post('/api/invitations/export', { meetingId, format });
    return data;
  } catch (error) {
    console.error('Error exporting invitation data:', error);
    throw new Error(`Failed to export data: ${error.message}`);
  }
};

export const checkAuthentication = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    return { isAuthenticated: isAuthenticated && user && user.id, user };
  } catch (error) {
    console.error('Error checking authentication:', error);
    return { isAuthenticated: false, user: null };
  }
};

export default {
  getMeetingsForInvitations,
  getPotentialInvitees,
  sendInvitations,
  sendMeetingInvitations,
  getInvitationHistory,
  getMeetingInvitations,
  updateInvitationStatus,
  resendInvitations,
  getCountries,
  getUsers,
  validateEmailTemplate,
  getInvitationStats,
  bulkUpdateInvitations,
  exportInvitationData,
  checkAuthentication,
};