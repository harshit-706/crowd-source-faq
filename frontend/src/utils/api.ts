import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Centralized Axios instance for all API calls.
// Uses VITE_API_URL env var, falls back to production backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://yaksha-faq-backend.vercel.app/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token from localStorage to every outgoing request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('yaksha_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: globally catch 401s and redirect to login.
// All other errors are rejected so calling components can handle them.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('yaksha_token');
      localStorage.removeItem('yaksha_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;