// /src/config/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
export { isAxiosError } from "axios";
import { useAuthStore, useSessionStore } from "@/modules/auth/shared/stores/authStore";

/**
 * API configuration with base URL and endpoints
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL;
const RESOLVED_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_URL;

/**
 * Standard headers for API requests
 */
export const API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

/**
 * Create headers with JWT token when available
 */
export const getAuthHeaders = (token?: string | null) => {
  const headers: Record<string, string> = { ...API_HEADERS };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Create the full URL for an endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${RESOLVED_API_URL}${endpoint}`;
};

/**
 * Default API timeout (10 seconds)
 */
export const API_TIMEOUT = 10000;

const api = axios.create({
  baseURL: RESOLVED_API_URL,
  headers: API_HEADERS,
  withCredentials: true,
});

// ─── Refresh Queue State ──────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// ─── Setup Interceptors ──────────────────────────────────────────────────────

const skipRefreshEndpoints = ["/auth/login", "/auth/register"];

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Always send cookies
    config.withCredentials = true;
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      const headers = config.headers as InternalAxiosRequestConfig["headers"] & {
        delete?: (header: string) => void;
      };
      if (typeof headers?.delete === "function") {
        headers.delete("Content-Type");
      } else if (headers) {
        delete (headers as Record<string, unknown>)["Content-Type"];
        delete (headers as Record<string, unknown>)["content-type"];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // Update session activity on successful requests
    useSessionStore.getState().updateActivity();
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 (Unauthorized)
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Don't retry the refresh endpoint itself
    if (originalRequest.url?.includes("/auth/refresh")) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    // Keep original auth errors for login/register instead of trying refresh
    if (skipRefreshEndpoints.some((endpoint) => originalRequest.url?.includes(endpoint))) {
      return Promise.reject(error);
    }

    // Don't retry if already retried
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post("/auth/refresh", {}, { withCredentials: true });
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      useAuthStore.getState().clearAuth();
      useSessionStore.getState().openSessionExpiredModal();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
