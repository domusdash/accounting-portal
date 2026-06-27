import axios from 'axios';

const API_BASE_URL = window.location.origin.includes('localhost') ? 'http://localhost:5004/api' : '/api';


const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const selectedOrgId = localStorage.getItem('selectedOrganizationId');
  if (selectedOrgId) {
    config.headers['X-Organization-Id'] = selectedOrgId;
  }
  return config;
});

export default api;
