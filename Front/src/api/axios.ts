import axios, { InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8080/api"
});

// We add ': InternalAxiosRequestConfig' here to fix the "implicitly any" error
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    localStorage.getItem("auth_token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;