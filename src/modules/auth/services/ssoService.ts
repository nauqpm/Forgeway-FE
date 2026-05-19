// =============================================================================
// SSO SERVICE — Google Single Sign-On
// =============================================================================

import api from '@/config/api';
import type { LoginResponse } from '../types/auth.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Initiate Google Login ───────────────────────────────────────────────────
// Redirects user to backend's Google OAuth endpoint.

export const initiateGoogleLogin = (): void => {
  window.location.href = `${API_URL}/auth/google`;
};

// ─── Handle SSO Callback ─────────────────────────────────────────────────────
// Called after OAuth redirect returns with a token in the URL.

export const handleSsoCallbackAPI = async (token: string): Promise<{ user: unknown }> => {
  const response = await api.post<{ user: unknown }>(
    '/auth/sso/callback',
    { token },
    { withCredentials: true },
  );
  return response.data;
};


// ─── Link Google Account ─────────────────────────────────────────────────────
// Links Google account to existing user account.

export const linkGoogleAccountAPI = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    '/auth/sso/link',
    { provider: 'google' },
    { withCredentials: true },
  );
  return response.data;
};

// ─── Unlink Google Account ───────────────────────────────────────────────────

export const unlinkGoogleAccountAPI = async (): Promise<{
  message: string;
}> => {
  const response = await api.delete<{ message: string }>('/auth/sso/link', {
    data: { provider: 'google' },
    withCredentials: true,
  });
  return response.data;
};