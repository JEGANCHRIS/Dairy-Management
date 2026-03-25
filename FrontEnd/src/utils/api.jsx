import axios from "axios";

// Create axios instance with explicit baseURL handling
const api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to ensure correct API calls
api.interceptors.request.use(
  (config) => {
    // In production (non-localhost), use current domain origin
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost"
    ) {
      // Ensure baseURL is set to current origin
      config.baseURL = window.location.origin;

      // Ensure URL starts with /api
      if (!config.url.startsWith("/api") && !config.url.startsWith("http")) {
        config.url = "/api" + config.url;
      }
    }

    const token = localStorage.getItem("token");
    console.log(
      "🔑 API Request:",
      config.method?.toUpperCase(),
      config.url,
      "- BaseURL:",
      config.baseURL,
      "- Token:",
      token ? "PRESENT" : "MISSING",
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

// Response interceptor
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
      "- BaseURL:",
      error.config?.baseURL,
      "- Full URL:",
      error.config?.baseURL + error.config?.url,
      "- Status:",
      error.response?.status,
      "- Error:",
      error.response?.data?.error || error.message,
    );
    return Promise.reject(error);
  },
);

export default api;
