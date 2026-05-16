import http from './http';
import { API_BASE } from './apiConfig';

const COMMITTEE_API_URL = `${API_BASE}/committees`;
const SUB_COMMITTEE_API_URL = `${API_BASE}/sub-committees`;

// Committee functions
export const getCommittees = async () => {
  const response = await http.get(COMMITTEE_API_URL);
  return response.data;
};

export const getCommitteeById = async (id) => {
  const response = await http.get(`${COMMITTEE_API_URL}/${id}`);
  return response.data;
};

export const createCommittee = async (committee) => {
  const response = await http.post(COMMITTEE_API_URL, committee);
  return response.data;
};

export const updateCommittee = async (id, committee) => {
  const response = await http.put(`${COMMITTEE_API_URL}/${id}`, committee);
  return response.data;
};

export const deleteCommittee = async (id) => {
  await http.del(`${COMMITTEE_API_URL}/${id}`);
};

// Sub-Committee functions
export const getSubCommittees = async () => {
  const response = await http.get(SUB_COMMITTEE_API_URL);
  return response.data;
};

export const getSubCommitteeById = async (id) => {
  const response = await http.get(`${SUB_COMMITTEE_API_URL}/${id}`);
  return response.data;
};

export const getSubCommitteesByCommitteeId = async (committeeId) => {
  const response = await http.get(`${SUB_COMMITTEE_API_URL}?committeeId=${committeeId}`);
  return response.data;
};

export const createSubCommittee = async (subCommittee) => {
  const response = await http.post(SUB_COMMITTEE_API_URL, subCommittee);
  return response.data;
};

export const updateSubCommittee = async (id, subCommittee) => {
  const response = await http.put(`${SUB_COMMITTEE_API_URL}/${id}`, subCommittee);
  return response.data;
};

export const deleteSubCommittee = async (id) => {
  await http.del(`${SUB_COMMITTEE_API_URL}/${id}`);
};

export const getHodMembers = async () => {
  const response = await http.get('/api/commissioner-generals/hod');
  return Array.isArray(response.data) ? response.data : [];
};

export const getHodUsersByRole = async () => {
  const response = await http.get('/api/users/role/HOD');
  return Array.isArray(response.data) ? response.data : [];
};

export const getCommissionerGeneralUsersByRole = async () => {
  const response = await http.get('/api/users/role/COMMISSIONER_GENERAL');
  return Array.isArray(response.data) ? response.data : [];
};