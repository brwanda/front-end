// services/resolutionService.js
import http from './http';

export const getResolutionsByMeeting = async (meetingId) => {
  const { data } = await http.get(`/api/resolutions/meeting/${meetingId}`);
  return data;
};

export const getAllResolutions = async () => {
  const { data } = await http.get('/api/resolutions');
  return data;
};

export const getResolutionById = async (id) => {
  if (!id || id === 'undefined') throw new Error('Invalid resolution ID provided');
  const { data } = await http.get(`/api/resolutions/${id}`);
  return data;
};

export const createResolutions = async (meetingId, resolutions) => {
  const { data } = await http.post(`/api/meetings/${meetingId}/resolutions`, { resolutions });
  return data;
};

export const updateResolution = async (resolutionId, resolutionData) => {
  const { data } = await http.put(`/api/resolutions/${resolutionId}`, resolutionData);
  return data;
};

export const deleteResolution = async (resolutionId) => {
  const { data } = await http.del(`/api/resolutions/${resolutionId}`);
  return data;
};

export const assignResolution = async (resolutionId, secretaryId, assignments) => {
  const { data } = await http.post(`/api/resolutions/${resolutionId}/assignments`, assignments);
  return data;
};

export const getResolutionAssignments = async (resolutionId) => {
  if (!resolutionId || resolutionId === 'undefined') throw new Error('Invalid resolution ID provided');
  const { data } = await http.get(`/api/resolutions/${resolutionId}/assignments`);
  return data;
};

export const updateResolutionStatus = async (resolutionId, status) => {
  const { data } = await http.put(`/api/resolutions/${resolutionId}/status`, { status });
  return data;
};

export const submitResolutionReport = async (resolutionId, reportData) => {
  const { data } = await http.post(`/api/resolutions/${resolutionId}/report`, reportData);
  return data;
};

export const getResolutionsByCountry = async (countryId) => {
  const { data } = await http.get(`/api/resolutions/country/${countryId}`);
  return data;
};

export const getResolutionsByStatus = async (status) => {
  const { data } = await http.get(`/api/resolutions/status/${status}`);
  return data;
};