// =============================================================================
// TOKEN SERVICE — Token refresh & lifecycle management
// =============================================================================
// Tokens are stored in httpOnly cookies (backend-managed).
// This service handles refresh calls and token expiry checks.

import api from '@/lib/axiosIns';
import type { RefreshTokenResponse } from '../types/auth.types';

// ─── Refresh Token ───────────────────────────────────────────────────────────

export const refreshTokenAPI = async (): Promise<RefreshTokenResponse> => {
  const response = await api.post<RefreshTokenResponse>('/auth/refresh', {}, { withCredentials: true });
  return response.data;
};

// ─── Clear Tokens (Logout) ───────────────────────────────────────────────────
// Backend clears cookies on logout. This is a client-side cleanup helper.

export const clearTokens = (): void => {
  // Tokens are stored in httpOnly cookies managed by backend
  // Clear localStorage remnants only (legacy migration support)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('workspace-storage');
    // Note: 'token' is intentionally NOT removed here as it may be used by other legacy code
    // The httpOnly cookie handles actual authentication
  }
};

// ─── Token Refresh Interval ──────────────────────────────────────────────────

export const TOKEN_REFRESH_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_TOKEN_REFRESH_INTERVAL_MS) || 4 * 60 * 1000; // 4 minutes
