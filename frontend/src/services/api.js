import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stuvaradhi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global errors (e.g. 401 unauth)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if token expired
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('stuvaradhi_token');
        localStorage.removeItem('stuvaradhi_user');
      }
    }
    return Promise.reject(error);
  }
);

export default API;
