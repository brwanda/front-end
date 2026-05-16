import http from './http';

export const getCountries = async () => {
  const { data } = await http.get('/api/countries');
  return Array.isArray(data) ? data : [];
};

export const getCountryById = async (id) => {
  const { data } = await http.get(`/api/countries/${id}`);
  return data;
};

export const createCountry = async (country) => {
  const { data } = await http.post('/api/countries', country);
  return data;
};

export const updateCountry = async (id, country) => {
  const { data } = await http.put(`/api/countries/${id}`, country);
  return data;
};

export const deleteCountry = async (id) => {
  await http.del(`/api/countries/${id}`);
};