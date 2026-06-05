// /src/config/api.ts
import axios from 'axios';

/**
 * API configuration with base URL and endpoints
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL;
const RESOLVED_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_URL;

/**
 * Standard headers for API requests
 */
export const API_HEADERS = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
};

/**
 * Create headers with JWT token when available
 */
export const getAuthHeaders = (token?: string | null) => {
    const headers: Record<string, string> = { ...API_HEADERS };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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

export default api;
