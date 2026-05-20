// =============================================================================
// AXIOS AUTH INTERCEPTOR — Automatic cookie auth + 401 refresh queue
// =============================================================================
// Setup on the shared axios instance from config/api.ts.
// - Request: ensures withCredentials for cookie-based auth
// - Response 401: queues concurrent requests, attempts token refresh,
//   replays queued requests on success, or clears auth on failure.

import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import api from '@/config/api';
import { refreshTokenAPI } from './tokenService';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/authStore';

// ─── Refresh Queue ───────────────────────────────────────────────────────────

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

export const setupAuthInterceptors = (): void => {
  // ── Request Interceptor ──
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Always send cookies
      config.withCredentials = true;
      return config;
    },
    (error) => Promise.reject(error),
  );

  // ── Response Interceptor ──
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
      if (originalRequest.url?.includes('/auth/refresh')) {
        useAuthStore.getState().clearAuth();
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
        await refreshTokenAPI();
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
    },
  );
};
