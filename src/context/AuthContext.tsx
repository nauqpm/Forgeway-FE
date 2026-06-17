"use client";

import {
  createContext,
  useCallback,
  useContext,
  ReactNode,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { AuthUser, Permission, UserRole } from "@/modules/auth/shared/types/auth.types";
import { AUTH_ME_QUERY_KEY, useAuth as useModuleAuth } from "@/modules/auth/shared/hooks/useAuth";
import { useAuthStore } from "@/modules/auth/shared/stores/authStore";
import { usePermissionStore } from "@/modules/auth/permission/stores/permissionStore";
import { handleSsoCallbackAPI } from "@/modules/auth/sso/services/ssoService";

interface User {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  fullName?: string;
  avatar?: string;
  ssoProvider?: "google" | null;
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
  user: AuthUser | (Partial<AuthUser> & { id?: string; _id?: string; googleId?: string }),
  permissions: Permission[] = [],
): User => ({
  id: user.id || ("_id" in user ? user._id || "" : ""),
  email: user.email || "",
  role: (user.role || "user") as UserRole,
  fullName: user.fullName,
  avatar: user.avatar,
  ssoProvider: 'googleId' in user ? "google" : (user as AuthUser).ssoProvider ?? null,
  permissions: permissions.length ? permissions : user.permissions || [],
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const moduleAuth = useModuleAuth();
  const { setUser } = useAuthStore();
  const {
    globalPermissions,
  } = usePermissionStore();

  const fetchUserPermissions = useCallback(async (): Promise<Permission[]> => {
    return moduleAuth.fetchPermissions();
  }, [moduleAuth]);

  const ssoCallbackMutation = useMutation({
    mutationFn: handleSsoCallbackAPI,
    onSuccess: async (response) => {
      if (response.user) {
        queryClient.setQueryData(AUTH_ME_QUERY_KEY, response.user);
        setUser(response.user);
        await fetchUserPermissions();
      }
    },
  });

  const login = useCallback(
    async (token?: string) => {
      if (token) {
        await ssoCallbackMutation.mutateAsync(token);
        router.replace("/");
        return;
      }

      await moduleAuth.refreshUser();
      await fetchUserPermissions();
      router.replace("/");
    },
    [fetchUserPermissions, moduleAuth, router, ssoCallbackMutation],
  );

  const logout = useCallback(async () => {
    await moduleAuth.logout();
  }, [moduleAuth]);

  const verifyToken = useCallback(async (): Promise<void> => {
    const user = await moduleAuth.refreshUser();
    if (!user) {
      await moduleAuth.logout();
    }
  }, [moduleAuth]);

  const effectivePermissions =
    globalPermissions.length > 0 ? globalPermissions : moduleAuth.user?.permissions || [];
  const user = moduleAuth.user
    ? normalizeUser(moduleAuth.user, effectivePermissions)
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
        isAuthenticated: moduleAuth.isAuthenticated,
        isLoading: moduleAuth.isLoading || !moduleAuth.isInitialized,
        login,
        logout,
        hasAdminAccess,
        hasPermission,
        fetchUserPermissions,
        isLoadingPermissions:
          moduleAuth.isLoading ||
          !moduleAuth.isInitialized ||
          moduleAuth.isLoadingPermissions,
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

