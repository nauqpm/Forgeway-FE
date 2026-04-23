"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { apiRoutes } from "@/config/apiRoutes";

type UserRole = "user" | "admin" | "staff" | "manager" | "technical";

interface Permission {
  id: string;
  resource: string;
  action: string;
}

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
  login: (token: string) => void;
  logout: () => void;
  hasAdminAccess: () => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  fetchUserPermissions: () => Promise<Permission[]>;
  isLoadingPermissions: boolean;
  verifyToken: (token?: string) => Promise<void>;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const router = useRouter();

  const fetchUserPermissions = useCallback(async (): Promise<Permission[]> => {
    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) return [];

    setIsLoadingPermissions(true);
    try {
      const response = await axios.get(
        `${BASE_URL}${apiRoutes.AUTH.MY_PERMISSIONS}`,
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      const { permissions } = response.data;
      if (permissions && Array.isArray(permissions)) {
        setUser((prev) => {
          if (!prev) {
            const decoded = jwtDecode<{ userId: string; email: string; role: UserRole }>(currentToken);
            setIsAuthenticated(true);
            return { id: decoded.userId, email: decoded.email, role: decoded.role, permissions: permissions || [] };
          }
          return { ...prev, permissions: permissions || [] };
        });
        return permissions;
      }
      return [];
    } catch {
      return [];
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [token]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        try {
          const decodedToken = jwtDecode<{ userId: string; email: string; role: UserRole; fullName?: string; avatar?: string; exp: number }>(storedToken);
          const currentTime = Math.floor(Date.now() / 1000);
          if (decodedToken.exp && decodedToken.exp < currentTime) {
            logout();
            return;
          }
          setUser({ id: decodedToken.userId, email: decodedToken.email, role: decodedToken.role, fullName: decodedToken.fullName, avatar: decodedToken.avatar, permissions: [] });
          setIsAuthenticated(true);
          await fetchUserPermissions();
        } catch {
          logout();
        }
      }
    };
    initAuth();
  }, []);

  const verifyToken = async (storedToken?: string): Promise<void> => {
    const tokenToVerify = storedToken || token || localStorage.getItem("token");
    if (!tokenToVerify) { logout(); return; }
    try {
      const decodedToken = jwtDecode<{ userId: string; email: string; role: UserRole; exp: number }>(tokenToVerify);
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp && decodedToken.exp < currentTime) { logout(); return; }
      setToken(tokenToVerify);
      localStorage.setItem("token", tokenToVerify);
      setUser({ id: decodedToken.userId, email: decodedToken.email, role: decodedToken.role, permissions: [] });
      setIsAuthenticated(true);
      await fetchUserPermissions();
    } catch { logout(); }
  };

  const login = async (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    const decodedToken = jwtDecode<{ userId: string; email: string; role: UserRole; fullName?: string; avatar?: string }>(newToken);
    setUser({ id: decodedToken.userId, email: decodedToken.email, role: decodedToken.role, fullName: decodedToken.fullName, avatar: decodedToken.avatar, permissions: [] });
    setIsAuthenticated(true);
    await fetchUserPermissions();
    router.replace("/");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    localStorage.removeItem("workspace-storage");
    router.replace("/login");
  };

  const hasAdminAccess = (): boolean => {
    if (!user) return false;
    return user.role === "admin" || ["staff", "manager", "technical"].includes(user.role) || user.permissions.length > 0;
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.permissions.some((p) => p.resource === resource && p.action === action);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout, hasAdminAccess, hasPermission, fetchUserPermissions, isLoadingPermissions, verifyToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
