import axios from "axios";

// Determine API base URL based on environment
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For production, this will be your Railway backend URL
  if (import.meta.env.PROD) {
    return "https://your-railway-backend-url.railway.app";
  }
  
  // For development
  return "http://localhost:5001";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lm_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("lm_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

