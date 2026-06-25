import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/csfaq/api',
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('yaksha_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        localStorage.removeItem('yaksha_token');
        localStorage.removeItem('yaksha_user');
        // v1.68 — single-login. /admin/login is gone, so a 401
        // for an admin route bounces to / with a ?next=/admin
        // hint. The AuthModal on / will pick up the hint and
        // route the user to /admin after sign-in.
        window.location.href = '/?next=/admin';
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;