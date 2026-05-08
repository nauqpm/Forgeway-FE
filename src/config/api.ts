// /src/config/api.ts
import axios from 'axios';
import { config } from './config';

/**
 * Cấu hình cho API - Định nghĩa URL gốc và các endpoints
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Headers chuẩn cho API requests
 */
export const API_HEADERS = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
};

/**
 * Hàm tạo headers với JWT token nếu có
 */
export const getAuthHeaders = (token?: string | null) => {
    const headers: Record<string, string> = { ...API_HEADERS };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

/**
 * Tạo URL đầy đủ cho endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
    return `${API_URL}${endpoint}`;
};

/**
 * Default API timeout (10 seconds)
 */
export const API_TIMEOUT = 10000;

const api = axios.create({
    baseURL: API_URL,
    headers: API_HEADERS,
});

export default api;
