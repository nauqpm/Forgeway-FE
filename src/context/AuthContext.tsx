"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, Permission, UserRole } from "@/modules/auth/shared/types/auth.types";
import { useAuthStore } from "@/modules/auth/shared/stores/authStore";
import { usePermissionStore } from "@/modules/auth/permission/stores/permissionStore";
import {
  getCurrentUserAPI,
  logoutAPI,
} from "@/modules/auth/shared/services/authService";
import { getMyPermissionsAPI } from "@/modules/auth/permission/services/permissionService";
import { handleSsoCallbackAPI } from "@/modules/auth/sso/services/ssoService";
import { clearTokens } from "@/modules/auth/shared/services/tokenService";
import { setupAuthInterceptors } from "@/modules/auth/shared/services/axiosAuthInterceptor";
import { useSessionStore } from "@/modules/auth/shared/stores/authStore";
import { useSecurityStore } from "@/modules/auth/shared/stores/authStore";

interface User {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  fullName?: string;
  avatar?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasAdminAccess: () => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  fetchUserPermissions: () => Promise<Permission[]>;
  isLoadingPermissions: boolean;
  verifyToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (
  user: AuthUser | (Partial<AuthUser> & { id?: string; _id?: string }),
  permissions: Permission[] = [],
): User => ({
  id: user.id || ("_id" in user ? user._id || "" : ""),
  email: user.email || "",
  role: (user.role || "user") as UserRole,
  fullName: user.fullName,
  avatar: user.avatar,
  permissions: permissions.length ? permissions : user.permissions || [],
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const {
    user: storeUser,
    isAuthenticated,
    isLoading,
    isInitialized,
    setUser,
    setLoading,
    setInitialized,
    clearAuth,
  } = useAuthStore();
  const {
    globalPermissions,
    setGlobalPermissions,
    clearPermissions,
  } = usePermissionStore();
  const { clearSessionState } = useSessionStore();
  const { clearSecurityState } = useSecurityStore();

  useEffect(() => {
    setupAuthInterceptors();
  }, []);

  const fetchUserPermissions = useCallback(async (): Promise<Permission[]> => {
    try {
      const { permissions } = await getMyPermissionsAPI();
      setGlobalPermissions(permissions);
      if (useAuthStore.getState().user) {
        setUser({
          ...useAuthStore.getState().user!,
          permissions,
        });
      }
      return permissions;
    } catch {
      setGlobalPermissions([]);
      return [];
    }
  }, [setGlobalPermissions, setUser]);

  const refreshCurrentUser = useCallback(async () => {
    const currentUser = await getCurrentUserAPI();
    setUser({
      ...currentUser,
      permissions: currentUser.permissions || [],
    });
    await fetchUserPermissions();
  }, [fetchUserPermissions, setUser]);

  useEffect(() => {
    const initAuth = async () => {
      if (isInitialized) return;

      setLoading(true);
      try {
        await refreshCurrentUser();
      } catch {
        clearAuth();
        clearPermissions();
      } finally {
        setInitialized(true);
      }
    };

    initAuth();
  }, [
    clearAuth,
    clearPermissions,
    isInitialized,
    refreshCurrentUser,
    setInitialized,
    setLoading,
  ]);

  const login = useCallback(
    async (token?: string) => {
      if (token) {
        const response = await handleSsoCallbackAPI(token);
        if (response.user) {
          setUser(response.user);
          await fetchUserPermissions();
        }
        router.replace("/");
        return;
      }

      await refreshCurrentUser();
      router.replace("/");
    },
    [fetchUserPermissions, refreshCurrentUser, router, setUser],
  );

  const logout = useCallback(async () => {
    try {
      await logoutAPI();
    } catch {
      // Client state must still be cleared if the session has already expired.
    } finally {
      clearTokens();
      clearAuth();
      clearPermissions();
      clearSessionState();
      clearSecurityState();
      router.replace("/login");
    }
  }, [
    clearAuth,
    clearPermissions,
    clearSecurityState,
    clearSessionState,
    router,
  ]);

  const verifyToken = useCallback(async (): Promise<void> => {
    try {
      await refreshCurrentUser();
    } catch {
      await logout();
    }
  }, [logout, refreshCurrentUser]);

  const effectivePermissions =
    globalPermissions.length > 0 ? globalPermissions : storeUser?.permissions || [];
  const user = storeUser
    ? normalizeUser(storeUser, effectivePermissions)
    : null;

  const hasAdminAccess = (): boolean => {
    if (!user) return false;
    return (
      (user.role as string) === "super_admin" ||
      (user.role as string) === "admin" ||
      effectivePermissions.length > 0
    );
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    if ((user.role as string) === "super_admin" || (user.role as string) === "admin") return true;
    return effectivePermissions.some(
      (p) =>
        (p.resource === resource || p.resource === "*") &&
        (p.action === action || p.action === "*"),
    );
  };

  return (
    <AuthContext.Provider
      value={{
        token: null,
        user,
        isAuthenticated,
        isLoading: isLoading || !isInitialized,
        login,
        logout,
        hasAdminAccess,
        hasPermission,
        fetchUserPermissions,
        isLoadingPermissions: isLoading || !isInitialized,
        verifyToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
