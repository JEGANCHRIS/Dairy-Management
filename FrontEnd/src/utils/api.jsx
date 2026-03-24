import axios from "axios";

// Use Vite proxy - requests will be proxied to backend
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log('🔑 API Request:', config.method?.toUpperCase(), config.url, '- Token:', token ? 'PRESENT (' + token.substring(0, 20) + '...)' : 'MISSING');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, '- Status:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.config?.url, '- Status:', error.response?.status, '- Error:', error.response?.data?.error || error.message);
    // Don't auto-redirect on 401 - let components handle it
    return Promise.reject(error);
  },
);

export default api;
