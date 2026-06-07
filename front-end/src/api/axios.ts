import axios from "axios";
import { useAuthStore } from "@/store/auth";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const isDevelopment = import.meta.env.DEV;

// Em desenvolvimento usamos URL relativa para passar sempre pelo proxy do Vite (/api -> backend)
const apiBaseUrl = isDevelopment ? "" : configuredApiUrl || "";
const refreshBaseUrl = isDevelopment ? "" : apiBaseUrl;

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => apiClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(
        `${refreshBaseUrl}/api/v1/auth/refresh`,
        { refresh_token: refreshToken }
      );

      const { access_token, refresh_token: new_refresh_token } = response.data;

      useAuthStore.getState().setTokens(access_token, new_refresh_token);

      processQueue();
      isRefreshing = false;

      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      isRefreshing = false;
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
