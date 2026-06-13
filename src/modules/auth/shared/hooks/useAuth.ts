'use client';

// =============================================================================
// useAuth HOOK - Main auth orchestration hook
// =============================================================================
// Composes authStore + services. This is the primary hook for components.

import { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  useAuthStore,
  useMfaStore,
  useSecurityStore,
  useSessionStore,
} from '../stores/authStore';
import { usePermissionStore } from '../../permission/stores/permissionStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { getQueryClient } from '@/common/providers/QueryProvider';
import {
  loginAPI,
  registerAPI,
  logoutAPI,
  getCurrentUserAPI,
} from '../services/authService';
import { clearTokens } from '../services/tokenService';
import { getMyPermissionsAPI } from '../../permission/services/permissionService';
import { AUTH_ROUTES } from '../constants/auth-routes';
import { AuthErrorCode } from '../types/auth.types';
import { setupAuthInterceptors } from '../services/axiosAuthInterceptor';
import { validateEmail } from '../utils/emailValidation';
import type {
  LoginRequest,
  RegisterRequest,
  AuthApiError,
} from '../types/auth.types';

let interceptorsInitialized = false;

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
  const { resetFailedAttempts } = useSecurityStore();
  const { setGlobalPermissions } = usePermissionStore();

  const login = useCallback(
    async (data: LoginRequest) => {
      const emailError = validateEmail(data.email);
      if (emailError) {
        toast.error(emailError);
        throw new Error(emailError);
      }

      setLoading(true);
      try {
        const response = await loginAPI(data);

        /*
        if (response.mfaRequired && response.mfaToken && response.mfaMethod) {
          setMfaChallenge(response.mfaToken, response.mfaMethod);
          router.push(AUTH_ROUTES.MFA);
          return response;
        }
        */

        const currentUser = response.user ?? (await getCurrentUserAPI().catch(() => null));

        if (!currentUser) {
          throw new Error('Could not load user information after sign-in.');
        }

        setUser(currentUser);
        resetFailedAttempts();

        try {
          const { permissions } = await getMyPermissionsAPI();
          setGlobalPermissions(permissions);
        } catch {
          // Do not block the main flow if permission loading fails
        }

        const isSuperAdmin = currentUser.role === 'super_admin';
        if (isSuperAdmin) {
          window.location.href =
            process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
          return response;
        }

        router.push(AUTH_ROUTES.HOME);
        return response;
      } catch (error: unknown) {
        const err = error as { response?: { data?: AuthApiError } };
        const errorCode = err.response?.data?.code;

        if (errorCode === AuthErrorCode.EMAIL_NOT_VERIFIED) {
          toast.error('Please verify your email before signing in.');
        } else if (errorCode === AuthErrorCode.RATE_LIMITED) {
          toast.error('Too many sign-in attempts. Please wait a moment and try again.');
        } else if (
          errorCode === AuthErrorCode.INVALID_CREDENTIALS ||
          errorCode === AuthErrorCode.ACCOUNT_LOCKED ||
          errorCode === AuthErrorCode.USER_SUSPENDED ||
          errorCode === AuthErrorCode.USER_DEACTIVATED
        ) {
          toast.error('Email or password is incorrect.');
        } else {
          toast.error('Sign-in failed. Please try again later.');
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      router,
      setUser,
      setLoading,
      setMfaChallenge,
      resetFailedAttempts,
      setGlobalPermissions,
    ],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const emailError = validateEmail(data.email);
      if (emailError) {
        toast.error(emailError);
        throw new Error(emailError);
      }

      setLoading(true);
      try {
        const response = await registerAPI(data);
        if (!response.success) {
          throw new Error('Registration failed.');
        }

        router.push(
          `${AUTH_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(data.email)}`,
        );
        return response;
      } catch (error: unknown) {
        const err = error as {
          response?: { data?: AuthApiError & { error?: string; message?: string | string[] } };
        };
        const errorCode = err.response?.data?.code || err.response?.data?.error;
        const rawMessage = err.response?.data?.message;
        const apiMessage = Array.isArray(rawMessage)
          ? rawMessage[0]
          : typeof rawMessage === 'string'
            ? rawMessage
            : undefined;

        if (errorCode === AuthErrorCode.EMAIL_ALREADY_EXISTS) {
          toast.error('Email already exists. Please use another email.');
        } else if (errorCode === AuthErrorCode.ACCOUNT_LOCKED) {
          toast.error(
            apiMessage ||
              'Account has been temporarily locked due to too many failed attempts.',
          );
        } else if (
          errorCode === AuthErrorCode.USER_SUSPENDED ||
          errorCode === AuthErrorCode.USER_DEACTIVATED
        ) {
          toast.error(apiMessage || 'Account has been suspended.');
        } else if (errorCode === AuthErrorCode.EMAIL_NOT_VERIFIED) {
          toast.error(apiMessage || 'Please verify your email before registering.');
          router.push(
            `${AUTH_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(data.email)}`,
          );
        } else if (errorCode === AuthErrorCode.RATE_LIMITED) {
          toast.error(
            apiMessage ||
              'Too many registration attempts. Please wait a moment and try again.',
          );
        } else {
          toast.error(apiMessage || 'Registration failed. Please try again later.');
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [router, setLoading],
  );

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
      useWorkspaceStore.getState().clearWorkspace();
      getQueryClient()?.clear();
      router.push(AUTH_ROUTES.LOGIN);
    }
  }, [clearAuth, router]);

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await getCurrentUserAPI();
      setUser(nextUser);
      return nextUser;
    } catch {
      clearAuth();
      return null;
    }
  }, [setUser, clearAuth]);

  const initializeAuth = useCallback(async () => {
    if (isInitialized) return;

    setLoading(true);
    try {
      const nextUser = await getCurrentUserAPI();
      setUser(nextUser);

      try {
        const { permissions } = await getMyPermissionsAPI();
        setGlobalPermissions(permissions);
      } catch {
        // Non-blocking
      }
    } catch {
      clearAuth();
    } finally {
      setInitialized(true);
    }
  }, [
    isInitialized,
    setUser,
    setLoading,
    setInitialized,
    clearAuth,
    setGlobalPermissions,
  ]);

  useEffect(() => {
    if (!interceptorsInitialized) {
      setupAuthInterceptors();
      interceptorsInitialized = true;
    }
  }, []);

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
