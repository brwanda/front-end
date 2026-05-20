import http from './http';
import { isHeadOfDelegationCommittee } from '../utils/committeeNaming';

const ENDPOINT = '/country-committee-members';

export const fetchMembers = async (page = 1, size = 10, sortBy = 'name', sortDirection = 'ASC', searchTerm = '') => {
  let url = `${ENDPOINT}?page=${page - 1}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
  if (searchTerm) url += `&name=${encodeURIComponent(searchTerm)}`;

  console.log('Fetching members from:', url);
  const { data } = await http.get(url);
  console.log('API Response data:', data);

  // Handle both paginated (Spring Page) and direct array responses
  if (Array.isArray(data)) {
    const normalized = normalizeMembers(data).filter((member) => !isHeadOfDelegationCommittee(member?.subCommittee?.name));
    return { content: normalized, totalPages: 1, totalElements: normalized.length, currentPage: page };
  }

  if (data && data.content && Array.isArray(data.content)) {
    data.content = normalizeMembers(data.content).filter((member) => !isHeadOfDelegationCommittee(member?.subCommittee?.name));
    data.totalElements = data.content.length;
    data.totalPages = Math.max(1, Math.ceil(data.totalElements / size));
    return data;
  }

  throw new Error('No members data in response');
};

function normalizeMembers(arr) {
  return arr.map(m => ({
    ...m,
    isDelegationSecretary: m.isDelegationSecretary ?? m.delegationSecretary ?? false,
    isChair: m.isChair ?? m.chair ?? false,
    isViceChair: m.isViceChair ?? m.viceChair ?? false,
    isCommitteeSecretary: m.isCommitteeSecretary ?? m.committeeSecretary ?? false,
    isCommitteeMember: m.isCommitteeMember ?? m.committeeMember ?? false,
  }));
}


export const fetchMemberById = async (id) => {
  const { data } = await http.get(`${ENDPOINT}/${id}`);
  return {
    ...data,
    delegationSecretary: data.isDelegationSecretary,
    chair: data.isChair,
    viceChair: data.isViceChair,
    committeeSecretary: data.isCommitteeSecretary,
    committeeMember: data.isCommitteeMember
  };
};

export const createMember = async (memberData) => {
  const formData = new FormData();
  const memberObject = {
    name: memberData.name,
    phone: memberData.phone,
    email: memberData.email,
    positionInYourRA: memberData.positionInYourRA,
    country: memberData.country?.id ? { id: parseInt(memberData.country.id) } : null,
    subCommittee: memberData.subCommittee?.id ? { id: parseInt(memberData.subCommittee.id) } : null,
    appointedDate: memberData.appointedDate,
    isDelegationSecretary: memberData.delegationSecretary || false,
    isChair: memberData.chair || false,
    isViceChair: memberData.viceChair || false,
    isCommitteeSecretary: memberData.committeeSecretary || false,
    isCommitteeMember: memberData.committeeMember || false
  };
  formData.append('member', JSON.stringify(memberObject));
  if (memberData.appointmentLetter) formData.append('appointmentLetter', memberData.appointmentLetter);
  const { data } = await http.post(ENDPOINT, formData);
  return data;
};

export const updateMember = async (id, memberData) => {
  const formData = new FormData();
  const memberObject = {
    name: memberData.name,
    phone: memberData.phone,
    email: memberData.email,
    positionInYourRA: memberData.positionInYourRA,
    country: memberData.country?.id ? { id: parseInt(memberData.country.id) } : null,
    subCommittee: memberData.subCommittee?.id ? { id: parseInt(memberData.subCommittee.id) } : null,
    appointedDate: memberData.appointedDate,
    isDelegationSecretary: memberData.delegationSecretary || false,
    isChair: memberData.chair || false,
    isViceChair: memberData.viceChair || false,
    isCommitteeSecretary: memberData.committeeSecretary || false,
    isCommitteeMember: memberData.committeeMember || false
  };
  formData.append('member', JSON.stringify(memberObject));
  if (memberData.appointmentLetter) formData.append('appointmentLetter', memberData.appointmentLetter);
  const { data } = await http.put(`${ENDPOINT}/${id}`, formData);
  return data;
};

export const deleteMember = async (id) => {
  await http.del(`${ENDPOINT}/${id}`);
};

export const fetchCountries = async () => {
  const { data } = await http.get('/countries');
  return data;
};

export const fetchSubCommittees = async () => {
  const { data } = await http.get('/sub-committees');
  return Array.isArray(data)
    ? data.filter((subCommittee) => !isHeadOfDelegationCommittee(subCommittee?.name))
    : [];
};

/**
 * Get which roles are already taken for the given country/subcommittee (for disabling options in the form).
 * Returns { chairTaken, viceChairTaken, committeeSecretaryTaken, delegationSecretaryTaken }.
 */
export const getRoleOccupancy = async (countryId, subCommitteeId, excludeMemberId) => {
  if (!countryId) return { chairTaken: false, viceChairTaken: false, committeeSecretaryTaken: false, delegationSecretaryTaken: false };
  const params = new URLSearchParams({ countryId: String(countryId) });
  if (subCommitteeId) params.set('subCommitteeId', String(subCommitteeId));
  if (excludeMemberId) params.set('excludeMemberId', String(excludeMemberId));
  const { data } = await http.get(`${ENDPOINT}/role-occupancy?${params.toString()}`);
  return data;
};