// =============================================================================
// API ERROR UTILITIES — Type-safe error extraction from axios errors
// =============================================================================

import type { AxiosError, AxiosResponse } from 'axios';

/**
 * Standard API error response structure from our backend
 */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  code?: string;
  statusCode?: number;
}

/**
 * Extended axios error with typed response
 */
export type TypedAxiosError<T = unknown> = AxiosError<ApiErrorResponse, T>;

/**
 * Extract error message from axios error with proper typing
 */
export function extractApiError(error: unknown, fallback: string): string {
  const axiosError = error as TypedAxiosError;
  
  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message;
  }
  
  if (axiosError.response?.data?.error) {
    return axiosError.response.data.error;
  }
  
  if (axiosError.message) {
    return axiosError.message;
  }
  
  return fallback;
}

/**
 * Extract error code from axios error (e.g., 'INVALID_CREDENTIALS')
 */
export function extractApiErrorCode(error: unknown, fallback: string): string {
  const axiosError = error as TypedAxiosError;
  return axiosError.response?.data?.code ?? fallback;
}

/**
 * Check if error is an axios error with specific status code
 */
export function isApiError(error: unknown, statusCode?: number): boolean {
  const axiosError = error as TypedAxiosError;
  if (!axiosError.response) return false;
  if (statusCode !== undefined) {
    return axiosError.response.status === statusCode;
  }
  return true;
}

/**
 * Check if error is a network/connection error
 */
export function isNetworkError(error: unknown): boolean {
  const axiosError = error as TypedAxiosError;
  return !axiosError.response && axiosError.request !== undefined;
}

/**
 * Safely extract data from API response
 */
export function extractResponseData<T>(response: AxiosResponse<T> | undefined, fallback: T): T {
  if (!response) return fallback;
  return response.data ?? fallback;
}

/**
 * Create a type guard for API error responses
 */
export function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  if (!data || typeof data !== 'object') return false;
  return 'message' in data || 'error' in data || 'code' in data;
}
