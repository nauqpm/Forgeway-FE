// /src/config/api.ts
// =============================================================================
// UNIFIED API CLIENT — Single axios instance with proper cookie-based auth
// =============================================================================
// This is the ONLY axios instance in the application.
// All services should import from this file, NOT from common/services/api.service.ts.

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// ─── Configuration ───────────────────────────────────────────────────────────

export const API_URL = process.env.NEXT_PUBLIC_API_URL;
const RESOLVED_API_URL = process.env.NEXT_PUBLIC_API_URL;

export const API_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export const API_TIMEOUT = 10000;

// ─── Headers Helpers ─────────────────────────────────────────────────────────

export const getAuthHeaders = (token?: string | null) => {
  const headers: Record<string, string> = { ...API_HEADERS };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const buildApiUrl = (endpoint: string): string => {
  return `${RESOLVED_API_URL}${endpoint}`;
};

// ─── Create Axios Instance ───────────────────────────────────────────────────

const api = axios.create({
  baseURL: RESOLVED_API_URL,
  headers: API_HEADERS,
  withCredentials: true,
  timeout: API_TIMEOUT,
});

// ─── Refresh Queue (prevents concurrent refresh storms) ──────────────────────

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

// ─── Interceptors ────────────────────────────────────────────────────────────

// Endpoints that should skip token refresh (they should throw auth errors instead)
const SKIP_REFRESH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Always send cookies for auth
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle non-401 errors or missing config
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Don't retry the refresh endpoint itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Skip refresh for login/register (let them throw auth errors)
    if (SKIP_REFRESH_ENDPOINTS.some((endpoint) => originalRequest.url?.includes(endpoint))) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Queue concurrent requests during refresh
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    // Attempt token refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post('/auth/refresh', {}, { withCredentials: true });
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      
      // Dispatch session expired event instead of hard redirect
      if (typeof window !== 'undefined') {
        // Only clear non-sensitive localStorage items
        localStorage.removeItem('workspace-storage');
        localStorage.removeItem('al-task-security');
        // Note: Don't remove 'token' - it's handled by httpOnly cookies
        window.dispatchEvent(new CustomEvent('session:expired'));
      }
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Session Expired Event Handler ───────────────────────────────────────────
// This replaces direct window.location.href with a proper UX flow

if (typeof window !== 'undefined') {
  window.addEventListener('session:expired', () => {
    // Clear any localStorage remnants (legacy support)
    localStorage.removeItem('token');
    localStorage.removeItem('workspace-storage');
    localStorage.removeItem('al-task-security');
    
    // Redirect to login - using replace to prevent back button issues
    window.location.href = '/login';
  });
}

export default api;
