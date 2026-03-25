import axios from "axios";

// Create axios instance - baseURL will be set dynamically
const api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to set correct baseURL and add token
api.interceptors.request.use(
  (config) => {
    // In production (non-localhost), use current domain origin
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost"
    ) {
      config.baseURL = window.location.origin;
    }

    const token = localStorage.getItem("token");
    console.log(
      "🔑 API Request:",
      config.method?.toUpperCase(),
      config.url,
      "- Token:",
      token ? "PRESENT (" + token.substring(0, 20) + "...)" : "MISSING",
    );
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
    console.log(
      "✅ API Response:",
      response.config.url,
      "- Status:",
      response.status,
    );
    return response;
  },
  (error) => {
    console.error(
      "❌ API Error:",
      error.config?.url,
      "- Status:",
      error.response?.status,
      "- Error:",
      error.response?.data?.error || error.message,
    );
    return Promise.reject(error);
  },
);

export default api;
