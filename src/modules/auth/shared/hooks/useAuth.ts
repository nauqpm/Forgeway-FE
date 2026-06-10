'use client';

// =============================================================================
// useAuth HOOK - Main auth orchestration hook
// =============================================================================
// Composes authStore + services. This is the primary hook for components.

import { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMfaStore, useSecurityStore, useSessionStore } from '../stores/authStore';
import { usePermissionStore } from '../../permission/stores/permissionStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { getQueryClient } from '@/common/providers/QueryProvider';
import { loginAPI, registerAPI, logoutAPI, getCurrentUserAPI } from '../services/authService';
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
  UserRole,
  User,
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
  const { incrementFailedAttempts, resetFailedAttempts, setLockout, setSuspendedMessage } =
    useSecurityStore();
  const { setGlobalPermissions } = usePermissionStore();

  // --- Login ---------------------------------------------------------------

  /**
   * Login function handling sign-in business logic.
   */
  const login = useCallback(
    async (data: LoginRequest) => {
      const emailError = validateEmail(data.email);
      if (emailError) {
        toast.error(emailError);
        throw new Error(emailError);
      }

      setLoading(true); // Step 1: start loading
      try {
        // Step 2: call sign-in API
        const response = await loginAPI(data);

        // Step 3: check MFA requirement from backend, currently skipped
        /*
        if (response.mfaRequired && response.mfaToken && response.mfaMethod) {
          setMfaChallenge(response.mfaToken, response.mfaMethod);
          router.push(AUTH_ROUTES.MFA); // Redirect to MFA page
          return response;
        }
        */

        // Step 4: prefer user from response, otherwise call /auth/me
        const currentUser =
          response.user ?? (await getCurrentUserAPI().catch(() => null));

        if (currentUser) {
          // Step 5: update user information and reset security errors
          setUser(currentUser);
          resetFailedAttempts();

          // Load and update user permissions
          try {
            const { permissions } = await getMyPermissionsAPI();
            setGlobalPermissions(permissions);
          } catch {
            // Do not block the main flow if permission loading fails
          }

          // Check whether the role requires MFA but it is not enabled, currently skipped
          /*
          if (needsMfaSetup(currentUser)) {
            router.push(AUTH_ROUTES.MFA);
            return response;
          }
          */

          // Step 5b: redirect based on role
          const isSuperAdmin = currentUser.role === 'super_admin';
          if (isSuperAdmin) {
            // SUPER_ADMIN goes to admin dashboard (separate admin portal)
            window.location.href = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
            return response;
          }

          router.push(AUTH_ROUTES.HOME);
        } else {
          // Return an error if login succeeds but profile cannot be loaded
          throw new Error('Could not load user information after sign-in.');
        }

        return response;
      } catch (error: unknown) {
        // Step 7: handle backend error types
        const err = error as { response?: { data?: AuthApiError } };
        const errorCode = err.response?.data?.code;

        if (errorCode === AuthErrorCode.ACCOUNT_LOCKED) {
          // Account lock error due to too many failed attempts
          setLockout({
            isLocked: true,
            remainingAttempts: 0,
            maxAttempts: 5,
            lockedUntil: err.response?.data?.details?.lockedUntil as string,
          });
          toast.error('Account has been temporarily locked due to too many failed attempts.');
        } else if (
          errorCode === AuthErrorCode.USER_SUSPENDED ||
          errorCode === AuthErrorCode.USER_DEACTIVATED
        ) {
          // Account locked or suspended error
          setSuspendedMessage('Account has been locked');
          toast.error('Account has been locked or suspended.');
        } else if (errorCode === AuthErrorCode.INVALID_CREDENTIALS) {
          // Invalid credentials error; increase failed attempt count
          incrementFailedAttempts();
          toast.error('Email or password is incorrect.');
        } else {
          toast.error('Sign-in failed. Please try again later.');
        }

        throw error; // Throw the error so the UI can handle it if needed
      } finally {
        setLoading(false); // Step 8: always stop loading
      }
    },
    [router, setUser, setLoading, setMfaChallenge, resetFailedAttempts, incrementFailedAttempts, setLockout, setSuspendedMessage, setGlobalPermissions],
  );

  // --- Register ------------------------------------------------------------

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
        router.push(`${AUTH_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(data.email)}`);
        return response;
      } catch (error: unknown) {
        const err = error as { response?: { data?: AuthApiError & { error?: string } } };
        const errorCode = err.response?.data?.code || err.response?.data?.error;
        const errorMessage = err.response?.data?.message;

        if (errorCode === AuthErrorCode.EMAIL_ALREADY_EXISTS) {
          toast.error('Email already exists. Please use another email.');
        } else if (errorCode === AuthErrorCode.USER_SUSPENDED) {
          toast.error('Account has been suspended.');
        } else if (errorCode === AuthErrorCode.EMAIL_NOT_VERIFIED) {
          toast.error('Email not verified. Please check your inbox for a verification email.');
          router.push(`${AUTH_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(data.email)}`);
        } else {
          toast.error('Registration failed. Please try again later.');
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [router, setLoading],
  );

  // --- Logout --------------------------------------------------------------

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

  // --- Refresh Current User ------------------------------------------------

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

  // --- Initialize Auth (check cookie session) -----------------------------

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
      // No valid session - user is not authenticated
      clearAuth();
    } finally {
      setInitialized(true);
    }
  }, [isInitialized, setUser, setLoading, setInitialized, clearAuth, setGlobalPermissions]);

  // --- Auto-initialize on mount -------------------------------------------

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
