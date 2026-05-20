// services/revenueAuthorityService.js
import http from './http';

export const getAllRevenueAuthorities = async () => {
  const { data } = await http.get('/api/revenue-authorities');
  return data;
};

export const getRevenueAuthorityById = async (id) => {
  if (!id) throw new Error('Revenue authority ID is required');
  const { data } = await http.get(`/api/revenue-authorities/${id}`);
  return data;
};

export const getRevenueAuthoritiesByCountry = async (countryId) => {
  if (!countryId) throw new Error('Country ID is required');
  const { data } = await http.get(`/api/revenue-authorities/country/${countryId}`);
  return data;
};

export const createRevenueAuthority = async (revenueAuthorityData) => {
  if (!revenueAuthorityData) throw new Error('Revenue authority data is required');
  if (!revenueAuthorityData.name?.trim()) throw new Error('Revenue authority name is required');
  if (!revenueAuthorityData.countryId) throw new Error('Country ID is required');
  const payload = {
    name: revenueAuthorityData.name.trim(),
    country: { id: revenueAuthorityData.countryId },
  };
  const { data } = await http.post('/api/revenue-authorities', payload);
  return data;
};

export const updateRevenueAuthority = async (id, revenueAuthorityData) => {
  if (!id) throw new Error('Revenue authority ID is required');
  if (!revenueAuthorityData) throw new Error('Revenue authority data is required');
  if (!revenueAuthorityData.name?.trim()) throw new Error('Revenue authority name is required');
  if (!revenueAuthorityData.countryId) throw new Error('Country ID is required');
  const payload = {
    name: revenueAuthorityData.name.trim(),
    country: { id: revenueAuthorityData.countryId },
  };
  const { data } = await http.put(`/api/revenue-authorities/${id}`, payload);
  return data;
};

export const deleteRevenueAuthority = async (id) => {
  if (!id) throw new Error('Revenue authority ID is required');
  const { data } = await http.del(`/api/revenue-authorities/${id}`);
  return data;
};

export const searchRevenueAuthorities = async (searchTerm) => {
  if (!searchTerm?.trim()) return getAllRevenueAuthorities();
  const { data } = await http.get(
    `/api/revenue-authorities/search?name=${encodeURIComponent(searchTerm.trim())}`
  );
  return data;
};

export default {
  getAllRevenueAuthorities,
  getRevenueAuthorityById,
  getRevenueAuthoritiesByCountry,
  createRevenueAuthority,
  updateRevenueAuthority,
  deleteRevenueAuthority,
  searchRevenueAuthorities,
};