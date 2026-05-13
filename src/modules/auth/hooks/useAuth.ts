'use client';

// =============================================================================
// useAuth HOOK — Main auth orchestration hook
// =============================================================================
// Composes authStore + services. This is the primary hook for components.

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { useMfaStore } from '../stores/mfaStore';
import { useSecurityStore } from '../stores/securityStore';
import { usePermissionStore } from '../stores/permissionStore';
import { useSessionStore } from '../stores/sessionStore';
import { loginAPI, registerAPI, logoutAPI, getCurrentUserAPI } from '../services/authService';
import { clearTokens } from '../services/tokenService';
import { getMyPermissionsAPI } from '../services/permissionService';
import { AUTH_ROUTES } from '../constants/auth-routes';
import { AuthErrorCode } from '../types/auth.types';
import type { LoginRequest, RegisterRequest, AuthApiError } from '../types/auth.types';

export const useAuth = () => {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    setUser,
    setLoading,
    setInitialized,
    clearAuth,
  } = useAuthStore();
  const { setMfaChallenge } = useMfaStore();
  const { incrementFailedAttempts, resetFailedAttempts, setLockout, setSuspendedMessage } =
    useSecurityStore();
  const { setGlobalPermissions } = usePermissionStore();

  // ─── Login ─────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (data: LoginRequest) => {
      setLoading(true);
      try {
        const response = await loginAPI(data);

        // MFA required — redirect to MFA page
        if (response.mfaRequired && response.mfaToken && response.mfaMethod) {
          setMfaChallenge(response.mfaToken, response.mfaMethod);
          router.push(AUTH_ROUTES.MFA);
          return response;
        }

        // Login successful — set user
        if (response.user) {
          let currentUser = response.user;
          try {
            currentUser = await getCurrentUserAPI();
          } catch {
            currentUser = {
              ...response.user,
              permissions: response.user.permissions || [],
              spaceRoles: response.user.spaceRoles || [],
            };
          }
          setUser(currentUser);
          resetFailedAttempts();

          // Load permissions
          try {
            const { permissions } = await getMyPermissionsAPI();
            setGlobalPermissions(permissions);
          } catch {
            // Non-blocking: permissions will load on next navigation
          }

          router.push(AUTH_ROUTES.DASHBOARD);
        }

        return response;
      } catch (error: unknown) {
        const err = error as { response?: { data?: AuthApiError } };
        const errorCode = err.response?.data?.code;

        if (errorCode === AuthErrorCode.ACCOUNT_LOCKED) {
          setLockout({
            isLocked: true,
            remainingAttempts: 0,
            maxAttempts: 5,
            lockedUntil: err.response?.data?.details?.lockedUntil as string,
          });
        } else if (
          errorCode === AuthErrorCode.USER_SUSPENDED ||
          errorCode === AuthErrorCode.USER_DEACTIVATED
        ) {
          setSuspendedMessage(err.response?.data?.message || 'Tài khoản đã bị khóa');
        } else if (errorCode === AuthErrorCode.INVALID_CREDENTIALS) {
          incrementFailedAttempts();
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [router, setUser, setLoading, setMfaChallenge, resetFailedAttempts, incrementFailedAttempts, setLockout, setSuspendedMessage, setGlobalPermissions],
  );

  // ─── Register ──────────────────────────────────────────────────────────────

  const register = useCallback(
    async (data: RegisterRequest) => {
      setLoading(true);
      try {
        const response = await registerAPI(data);
        router.push(AUTH_ROUTES.LOGIN);
        return response;
      } finally {
        setLoading(false);
      }
    },
    [router, setLoading],
  );

  // ─── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      await logoutAPI();
    } catch {
      // Always clear client state even if API fails
    } finally {
      clearTokens();
      clearAuth();
      usePermissionStore.getState().clearPermissions();
      useSessionStore.getState().clearSessionState();
      useSecurityStore.getState().clearSecurityState();
      router.push(AUTH_ROUTES.DASHBOARD);
    }
  }, [clearAuth, router]);

  // ─── Refresh Current User ──────────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    try {
      const user = await getCurrentUserAPI();
      setUser(user);
      return user;
    } catch {
      clearAuth();
      return null;
    }
  }, [setUser, clearAuth]);

  // ─── Initialize Auth (check cookie session) ────────────────────────────────

  const initializeAuth = useCallback(async () => {
    if (isInitialized) return;
    setLoading(true);
    try {
      const user = await getCurrentUserAPI();
      setUser(user);

      // Load global permissions
      try {
        const { permissions } = await getMyPermissionsAPI();
        setGlobalPermissions(permissions);
      } catch {
        // Non-blocking
      }
    } catch {
      // No valid session — user is not authenticated
      clearAuth();
    } finally {
      setInitialized(true);
    }
  }, [isInitialized, setUser, setLoading, setInitialized, clearAuth, setGlobalPermissions]);

  // ─── Auto-initialize on mount ──────────────────────────────────────────────

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    refreshUser,
    initializeAuth,
  };
};
