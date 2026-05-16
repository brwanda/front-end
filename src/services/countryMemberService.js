// services/countryMemberService.js
import http from './http';

const COMMISSIONER_PREFIX = '/api/commissioner-generals';

export const getMembers = async () => {
  const { data } = await http.get(`${COMMISSIONER_PREFIX}/get-all`);
  if (!Array.isArray(data)) throw new Error('Invalid response format from server');
  return data;
};

export const getMemberById = async (id) => {
  const { data } = await http.get(`${COMMISSIONER_PREFIX}/get-by/${id}`);
  return data;
};

export const createMember = async (memberData) => {
  const { data } = await http.post(`${COMMISSIONER_PREFIX}/add`, memberData);
  return data;
};

export const updateMember = async (id, memberData) => {
  const { data } = await http.put(`${COMMISSIONER_PREFIX}/update`, memberData);
  return data;
};

export const deleteMember = async (id) => {
  await http.del(`${COMMISSIONER_PREFIX}/delete/${id}`);
  return true;
};

export default { getMembers, getMemberById, createMember, updateMember, deleteMember };
