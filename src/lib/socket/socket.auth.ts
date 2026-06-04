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

export const getSocketAuthPayload = (): Record<string, string> => {
  const state = useAuthStore.getState() as { accessToken?: string | null };
  if (state.accessToken) {
    return { token: state.accessToken };
  }

  // Legacy fallback. Remove this after auth store fully owns client-side tokens,
  // or after the backend socket auth relies only on httpOnly cookies.
  if (typeof window !== 'undefined') {
    const legacyToken =
      window.localStorage.getItem('token') ||
      window.localStorage.getItem('accessToken');

    if (legacyToken) {
      return { token: legacyToken };
    }
  }

  return {};
};

export const isUnauthorizedError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return UNAUTHORIZED_FRAGMENTS.some((fragment) => message.includes(fragment));
};