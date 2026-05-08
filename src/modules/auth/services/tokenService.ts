// =============================================================================
// TOKEN SERVICE — Token refresh & lifecycle management
// =============================================================================
// Tokens are stored in httpOnly cookies (backend-managed).
// This service handles refresh calls and token expiry checks.

import api from '@/config/api';
import type { RefreshTokenResponse } from '../types/auth.types';

// ─── Refresh Token ───────────────────────────────────────────────────────────

export const refreshTokenAPI = async (): Promise<RefreshTokenResponse> => {
  const response = await api.post<RefreshTokenResponse>(
    '/auth/refresh-token',
    {},
    { withCredentials: true },
  );
  return response.data;
};

// ─── Clear Tokens (Logout) ───────────────────────────────────────────────────
// Backend clears cookies on logout. This is a client-side cleanup helper.

export const clearTokens = (): void => {
  // Remove any client-side remnants (legacy support during migration)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('workspace-storage');
  }
};

// ─── Token Refresh Interval ──────────────────────────────────────────────────

export const TOKEN_REFRESH_INTERVAL_MS =
  Number(process.env.NEXT_PUBLIC_TOKEN_REFRESH_INTERVAL_MS) || 4 * 60 * 1000; // 4 minutes