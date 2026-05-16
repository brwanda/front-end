// services/meetingService.js
import http from './http';

export const getMeetingsByCountry = async (countryId) => {
  const { data } = await http.get(`/api/meetings/country/${countryId}`);
  return data;
};

export const getMeetings = async () => {
  const { data } = await http.get('/api/meetings');
  return data;
};

export const getMeetingById = async (id) => {
  const { data } = await http.get(`/api/meetings/${id}`);
  return data;
};

export const createMeeting = async (meetingData) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.id) throw new Error('User not authenticated');
  const payload = { ...meetingData, createdBy: { id: user.id } };
  const { data } = await http.post('/api/meetings', payload);
  return data;
};

export const updateMeeting = async (id, meetingData) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.id) throw new Error('User not authenticated');
  const payload = { ...meetingData, updatedBy: { id: user.id } };
  const { data } = await http.put(`/api/meetings/${id}`, payload);
  return data;
};

export const deleteMeeting = async (id) => {
  const { data } = await http.del(`/api/meetings/${id}`);
  return data;
};

export const validateSecretaryPermission = async (meetingId, secretaryId) => {
  const { data } = await http.post(
    `/api/meetings/${meetingId}/validate-secretary?secretaryId=${secretaryId}`,
    null
  );
  return data;
};

export const sendInvitations = async (meetingId, secretaryId, userIds) => {
  const { data } = await http.post(
    `/api/meetings/${meetingId}/invitations/send?secretaryId=${secretaryId}`,
    userIds
  );
  return data;
};

export const recordAttendance = async (meetingId, secretaryId, attendanceData) => {
  const { data } = await http.post(
    `/api/meetings/${meetingId}/attendance?secretaryId=${secretaryId}`,
    attendanceData
  );
  return data;
};

export const getAttendance = async (meetingId, secretaryId) => {
  const { data } = await http.get(
    `/api/meetings/${meetingId}/attendance?secretaryId=${secretaryId}`
  );
  return data;
};

export const updateMeetingMinutes = async (meetingId, secretaryId, minutes) => {
  const { data } = await http.put(
    `/api/meetings/${meetingId}/minutes?secretaryId=${secretaryId}`,
    { minutes }
  );
  return data;
};

export const uploadMinutesDocument = async (meetingId, fileOrFiles) => {
  const formData = new FormData();
  const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
  files.filter(Boolean).forEach(file => formData.append('minutesDocument', file));
  const { data } = await http.post(`/api/meetings/${meetingId}/minutes-document`, formData);
  return data;
};

export const createArchivedMeetingRecord = async (meetingData) => {
  const { data } = await http.post('/api/meetings/archived-record', meetingData);
  return data;
};

export const changeMeetingStatus = async (meetingId, status) => {
  const { data } = await http.put(`/api/meetings/${meetingId}/status`, { status });
  return data;
};

export const getInvitedMembers = async (meetingId) => {
  const { data } = await http.get(`/api/meetings/${meetingId}/invitations`);
  return data;
};