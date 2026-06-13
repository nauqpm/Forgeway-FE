/**
 * =============================================================================
 * SSO SERVICE - Single Sign-On service with Google
 * =============================================================================

 */

import api from '@/lib/axiosIns';
import type { AuthUser } from '../../shared/types/auth.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Initiate Google Login ───────────────────────────────────────────────────

/**
 * Start the Google OAuth2 sign-in process.
 * 1. Redirect the browser to the backend `/auth/google` endpoint.
 * 2. On the backend, passport-google-oauth20 creates a URL and redirects users to Google's sign-in form.
 * 3. Users grant access, then Google calls the backend callback URL with an authorization code.
 * 4. The backend exchanges the code for tokens, retrieves user information, sets HTTP-only cookies, and redirects users
 *    back to the frontend with success or error parameters in the URL.
 */
export const initiateGoogleLogin = (): void => {
  window.location.href = `${API_URL}/auth/google`;
};

// ─── Link Google Account ─────────────────────────────────────────────────────
// Links Google account to existing user account.

export const linkGoogleAccountAPI = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    '/auth/sso/link',
    { provider: 'google' },
    { withCredentials: true }
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

// ─── Handle SSO Callback ─────────────────────────────────────────────────────
// Called after OAuth redirect returns with a token in the URL.

export const handleSsoCallbackAPI = async (token: string): Promise<{ user: AuthUser }> => {
  const response = await api.post<{ user: AuthUser }>('/auth/sso/callback', { token }, { withCredentials: true });
  return response.data;
};
