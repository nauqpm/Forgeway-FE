"use client";

// =============================================================================
// useAuth HOOK - Main auth orchestration hook
// =============================================================================
// Composes React Query server state with small synchronous Zustand auth mirrors.

import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuthStore, useMfaStore, useSecurityStore, useSessionStore } from "../stores/authStore";
import { usePermissionStore } from "../../permission/stores/permissionStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { chatSocketClient } from "@/lib/socket/chat.client";
import { ADMIN_URL } from "@/lib/admin-url";
import { loginAPI, registerAPI, logoutAPI, getCurrentUserAPI } from "../services/authService";
import { clearTokens } from "../services/tokenService";
import { getMyPermissionsAPI } from "../../permission/services/permissionService";
import { AUTH_ROUTES } from "../constants/auth-routes";
import { AuthErrorCode } from "../types/auth.types";
import { validateEmail } from "../utils/emailValidation";
import type { AuthUser, LoginRequest, RegisterRequest, AuthApiError, Permission } from "../types/auth.types";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;
export const AUTH_PERMISSIONS_QUERY_KEY = ["auth", "permissions"] as const;

const getApiMessage = (error: unknown): string | undefined => {
  const err = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const rawMessage = err.response?.data?.message;
  if (Array.isArray(rawMessage)) return rawMessage[0];
  return rawMessage || err.message;
};

const getAuthErrorCode = (error: unknown): string | undefined => {
  const err = error as { response?: { data?: AuthApiError & { error?: string } } };
  return err.response?.data?.code || err.response?.data?.error;
};

const handleLoginError = (error: unknown) => {
  const errorCode = getAuthErrorCode(error);

  if (errorCode === AuthErrorCode.EMAIL_NOT_VERIFIED) {
    toast.error("Please verify your email before signing in.");
  } else if (errorCode === AuthErrorCode.RATE_LIMITED) {
    toast.error("Too many sign-in attempts. Please wait a moment and try again.");
  } else if (
    errorCode === AuthErrorCode.INVALID_CREDENTIALS ||
    errorCode === AuthErrorCode.ACCOUNT_LOCKED ||
    errorCode === AuthErrorCode.USER_SUSPENDED ||
    errorCode === AuthErrorCode.USER_DEACTIVATED
  ) {
    toast.error("Email or password is incorrect.");
  } else {
    toast.error("Sign-in failed. Please try again later.");
  }
};

const handleRegisterError = (error: unknown, email: string, router: ReturnType<typeof useRouter>) => {
  const errorCode = getAuthErrorCode(error);
  const apiMessage = getApiMessage(error);

  if (errorCode === AuthErrorCode.EMAIL_ALREADY_EXISTS) {
    toast.error("Email already exists. Please use another email.");
  } else if (errorCode === AuthErrorCode.ACCOUNT_LOCKED) {
    toast.error(apiMessage || "Account has been temporarily locked due to too many failed attempts.");
  } else if (
    errorCode === AuthErrorCode.USER_SUSPENDED ||
    errorCode === AuthErrorCode.USER_DEACTIVATED
  ) {
    toast.error(apiMessage || "Account has been suspended.");
  } else if (errorCode === AuthErrorCode.EMAIL_NOT_VERIFIED) {
    toast.error(apiMessage || "Please verify your email before registering.");
    router.push(`${AUTH_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}`);
  } else if (errorCode === AuthErrorCode.RATE_LIMITED) {
    toast.error(apiMessage || "Too many registration attempts. Please wait a moment and try again.");
  } else {
    toast.error(apiMessage || "Registration failed. Please try again later.");
  }
};

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isInitialized, setUser, setInitialized, clearAuth } = useAuthStore();
  const { setMfaChallenge } = useMfaStore();
  const { resetFailedAttempts } = useSecurityStore();
  const { setGlobalPermissions, globalPermissions } = usePermissionStore();

  const authMeQuery = useQuery<AuthUser>({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: getCurrentUserAPI,
    retry: false,
  });

  const permissionsQuery = useQuery<Permission[]>({
    queryKey: AUTH_PERMISSIONS_QUERY_KEY,
    queryFn: async () => {
      const { permissions } = await getMyPermissionsAPI();
      return permissions;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (authMeQuery.data) {
      setUser(authMeQuery.data);
      setInitialized(true);
    }
  }, [authMeQuery.data, setInitialized, setUser]);

  useEffect(() => {
    if (authMeQuery.isError) {
      clearAuth();
      usePermissionStore.getState().clearPermissions();
    }
  }, [authMeQuery.isError, clearAuth]);

  useEffect(() => {
    if (!permissionsQuery.data) return;

    setGlobalPermissions(permissionsQuery.data);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      setUser({ ...currentUser, permissions: permissionsQuery.data });
    }
  }, [permissionsQuery.data, setGlobalPermissions, setUser]);

  const fetchPermissions = useCallback(async (): Promise<Permission[]> => {
    try {
      const permissions = await queryClient.fetchQuery({
        queryKey: AUTH_PERMISSIONS_QUERY_KEY,
        queryFn: async () => {
          const { permissions } = await getMyPermissionsAPI();
          return permissions;
        },
        retry: false,
      });

      setGlobalPermissions(permissions);
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setUser({ ...currentUser, permissions });
      }
      return permissions;
    } catch {
      setGlobalPermissions([]);
      return [];
    }
  }, [queryClient, setGlobalPermissions, setUser]);

  const loginMutation = useMutation({
    mutationFn: loginAPI,
    onSuccess: async (response) => {
      if (response.mfaRequired && response.mfaToken && response.mfaMethod) {
        setMfaChallenge(response.mfaToken, response.mfaMethod);
        router.push(AUTH_ROUTES.MFA);
        return;
      }

      const currentUser =
        response.user ??
        (await queryClient.fetchQuery({
          queryKey: AUTH_ME_QUERY_KEY,
          queryFn: getCurrentUserAPI,
          retry: false,
        }).catch(() => null));

      if (!currentUser) {
        throw new Error("Could not load user information after sign-in.");
      }

      queryClient.setQueryData(AUTH_ME_QUERY_KEY, currentUser);
      setUser(currentUser);
      setInitialized(true);
      resetFailedAttempts();
      await fetchPermissions();

      if (currentUser.role === "super_admin") {
        window.location.href = ADMIN_URL;
        return;
      }

      router.push(AUTH_ROUTES.HOME);
    },
    onError: handleLoginError,
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await registerAPI(data);
      if (!response.success) {
        throw new Error("Registration failed.");
      }
      return response;
    },
    onSuccess: (response, variables) => {
      router.push(`${AUTH_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error, variables) => handleRegisterError(error, variables.email, router),
  });

  const clearClientAuthState = useCallback(() => {
    clearTokens();
    clearAuth();
    usePermissionStore.getState().clearPermissions();
    useSessionStore.getState().clearSessionState();
    useSecurityStore.getState().clearSecurityState();
    useWorkspaceStore.getState().clearWorkspace();
    queryClient.clear();
    chatSocketClient.disconnect();
  }, [clearAuth, queryClient]);

  const logoutMutation = useMutation({
    mutationFn: logoutAPI,
    retry: false,
    onSettled: () => {
      clearClientAuthState();
      router.push(AUTH_ROUTES.LOGIN);
    },
  });

  const login = useCallback(
    async (data: LoginRequest) => {
      const emailError = validateEmail(data.email);
      if (emailError) {
        toast.error(emailError);
        throw new Error(emailError);
      }

      return loginMutation.mutateAsync(data);
    },
    [loginMutation],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const emailError = validateEmail(data.email);
      if (emailError) {
        toast.error(emailError);
        throw new Error(emailError);
      }

      return registerMutation.mutateAsync(data);
    },
    [registerMutation],
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Cleanup and redirect are handled in onSettled.
    }
  }, [logoutMutation]);

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await queryClient.fetchQuery({
        queryKey: AUTH_ME_QUERY_KEY,
        queryFn: getCurrentUserAPI,
        retry: false,
      });
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, nextUser);
      setUser(nextUser);
      setInitialized(true);
      return nextUser;
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth, queryClient, setInitialized, setUser]);

  const initializeAuth = useCallback(async () => {
    await refreshUser();
  }, [refreshUser]);

  const verifyToken = useCallback(async (): Promise<void> => {
    const u = await refreshUser();
    if (!u) await logout();
  }, [refreshUser, logout]);

  const effectivePermissions = useMemo(
    () => (globalPermissions.length > 0 ? globalPermissions : user?.permissions ?? []),
    [globalPermissions, user?.permissions],
  );

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!user) return false;
    if ((user.role as string) === 'super_admin' || (user.role as string) === 'admin') return true;
    return effectivePermissions.some(
      (p) =>
        (p.resource === resource || p.resource === '*') &&
        (p.action === action || p.action === '*'),
    );
  }, [user, effectivePermissions]);

  const hasAdminAccess = useCallback((): boolean => {
    if (!user) return false;
    return (user.role as string) === 'super_admin' || (user.role as string) === 'admin' || effectivePermissions.length > 0;
  }, [user, effectivePermissions]);

  const loginWithSsoToken = useCallback(async (token: string): Promise<void> => {
    const { handleSsoCallbackAPI } = await import('@/modules/auth/sso/services/ssoService');
    const response = await handleSsoCallbackAPI(token);
    if (response.user) {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, response.user);
      setUser(response.user);
      await fetchPermissions();
    }
    router.replace('/');
  }, [queryClient, setUser, fetchPermissions, router]);

  return {
    user,
    isAuthenticated,
    isLoading:
      !isInitialized ||
      authMeQuery.isLoading ||
      loginMutation.isPending ||
      registerMutation.isPending ||
      logoutMutation.isPending,
    isInitialized,
    token: null as string | null,
    permissions: permissionsQuery.data ?? [],
    isLoadingPermissions: permissionsQuery.isLoading || permissionsQuery.isFetching,
    login,
    loginWithSsoToken,
    register,
    logout,
    refreshUser,
    initializeAuth,
    fetchPermissions,
    fetchUserPermissions: fetchPermissions,
    verifyToken,
    hasPermission,
    hasAdminAccess,
  };
};
