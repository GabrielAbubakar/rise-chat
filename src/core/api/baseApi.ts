import axios from 'axios';

export const baseApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
baseApi.interceptors.request.use(
  (config) => {
    // TODO: Attach auth token here once auth is implemented
    // const token = storage.getString('auth-token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
baseApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Handle global 401 Unauthorized (e.g. log out user, clear tokens)
    // if (error.response?.status === 401) { ... }
    
    // Log network errors for debugging
    if (!error.response) {
      console.error('Network Error / Server Offline:', error.message);
    }
    return Promise.reject(error);
  }
);
