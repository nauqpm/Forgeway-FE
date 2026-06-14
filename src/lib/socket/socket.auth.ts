import { refreshTokenAPI } from '@/modules/auth/shared/services/tokenService';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';

const UNAUTHORIZED_FRAGMENTS = [
  'unauthorized',
  'access token',
  'jwt',
  'token',
  'invalid',
  'expired',
  'missing',
  'revoked',
] as const;

let refreshPromise: Promise<void> | null = null;

export const refreshSocketAuth = async (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = refreshTokenAPI()
      .then(() => undefined)
      .catch((error) => {
        useAuthStore.getState().clearAuth();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

/**
 * Get authentication payload for socket connection.
 * 
 * For cookie-based auth (httpOnly), the socket auth is handled server-side.
 * This function returns an empty object as the token is sent via cookies automatically.
 */
export const getSocketAuthPayload = (): Record<string, string> => {
  // Token-based auth via httpOnly cookies is handled automatically by the socket.io server
  // when the client connects with withCredentials: true
  // No need to manually pass tokens
  return {};
};

export const isUnauthorizedError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return UNAUTHORIZED_FRAGMENTS.some((fragment) => message.includes(fragment));
};
