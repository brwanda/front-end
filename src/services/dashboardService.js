// services/dashboardService.js
import http from './http';

export const getDashboardStats = async (role, userId) => {
  try {
    const { data } = await http.get(`/api/dashboard/stats`, { params: { role, userId } });
    return data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getRecentActivities = async (userId, limit = 10) => {
  try {
    const { data } = await http.get(`/api/dashboard/activities`, { params: { userId, limit } });
    return data;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
};

export const getMeetingStats = async (userId) => {
  try {
    const { data } = await http.get(`/api/dashboard/meetings/stats`, { params: { userId } });
    return data;
  } catch (error) {
    console.error('Error fetching meeting stats:', error);
    throw error;
  }
};

export const getResolutionStats = async (userId) => {
  try {
    const { data } = await http.get(`/api/dashboard/resolutions/stats`, { params: { userId } });
    return data;
  } catch (error) {
    console.error('Error fetching resolution stats:', error);
    throw error;
  }
};

export const getCommitteeStats = async (userId) => {
  try {
    const { data } = await http.get(`/api/dashboard/committees/stats`, { params: { userId } });
    return data;
  } catch (error) {
    console.error('Error fetching committee stats:', error);
    throw error;
  }
};

export const getUpcomingMeetings = async (userId, limit = 5) => {
  try {
    const { data } = await http.get(`/api/dashboard/meetings/upcoming`, { params: { userId, limit } });
    return data;
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
    throw error;
  }
};

export const getPendingTasks = async (userId, limit = 5) => {
  try {
    const { data } = await http.get(`/api/dashboard/tasks/pending`, { params: { userId, limit } });
    return data;
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    throw error;
  }
};

export const getNotificationStats = async (userId) => {
  try {
    const { data } = await http.get(`/api/dashboard/notifications/stats`, { params: { userId } });
    return data;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
};

export const getAdminStats = async () => {
  try {
    const { data } = await http.get(`/api/dashboard/admin/stats`);
    return data;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};

export const getSecretaryStats = async (userId) => {
  try {
    const { data } = await http.get(`/api/dashboard/secretary/stats`, { params: { userId } });
    return data;
  } catch (error) {
    console.error('Error fetching secretary stats:', error);
    throw error;
  }
};

export const getMeetingTrends = async (userId, period = '6months') => {
  try {
    const { data } = await http.get(`/api/dashboard/charts/meetings`, { params: { userId, period } });
    return data;
  } catch (error) {
    console.error('Error fetching meeting trends:', error);
    throw error;
  }
};

export const getResolutionTrends = async (userId, period = '6months') => {
  try {
    const { data } = await http.get(`/api/dashboard/charts/resolutions`, { params: { userId, period } });
    return data;
  } catch (error) {
    console.error('Error fetching resolution trends:', error);
    throw error;
  }
};

export default {
  getDashboardStats,
  getRecentActivities,
  getMeetingStats,
  getResolutionStats,
  getCommitteeStats,
  getUpcomingMeetings,
  getPendingTasks,
  getNotificationStats,
  getAdminStats,
  getSecretaryStats,
  getMeetingTrends,
  getResolutionTrends,
};