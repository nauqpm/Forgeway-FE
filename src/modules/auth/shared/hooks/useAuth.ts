'use client';

// =============================================================================
// useAuth HOOK — Main auth orchestration hook
// =============================================================================
// Composes authStore + services. This is the primary hook for components.

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useSecurityStore, useSessionStore } from '../stores/authStore';
import { usePermissionStore } from '../../permission/stores/permissionStore';
import { loginAPI, registerAPI, logoutAPI, getCurrentUserAPI } from '../services/authService';
import { clearTokens } from '../services/tokenService';
import { getMyPermissionsAPI } from '../../permission/services/permissionService';
import { AUTH_ROUTES } from '../constants/auth-routes';
import { AuthErrorCode } from '../types/auth.types';
import type {
  LoginRequest,
  RegisterRequest,
  AuthApiError,
} from '../types/auth.types';

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
  const { incrementFailedAttempts, resetFailedAttempts, setLockout, setSuspendedMessage } =
    useSecurityStore();
  const { setGlobalPermissions } = usePermissionStore();

  // ─── Login ─────────────────────────────────────────────────────────────────

  /**
   Hàm login - Xử lý logic nghiệp vụ khi người dùng đăng nhập.
   */
  const login = useCallback(
    async (data: LoginRequest) => {
      setLoading(true); // Bước 1: Bắt đầu tải
      try {
        // Bước 2: Gọi API đăng nhập
        const response = await loginAPI(data);

        // Bước 3: Kiểm tra yêu cầu MFA từ backend (Bỏ qua tạm thời)
        /*
        if (response.mfaRequired && response.mfaToken && response.mfaMethod) {
          setMfaChallenge(response.mfaToken, response.mfaMethod);
          router.push(AUTH_ROUTES.MFA); // Chuyển hướng trang MFA
          return response;
        }
        */

        // Bước 4: Ưu tiên lấy user từ response, nếu không có thì gọi lại API /auth/me
        const currentUser =
          response.user ?? (await getCurrentUserAPI().catch(() => null));

        if (currentUser) {
          // Bước 5: Cập nhật thông tin user và reset lỗi bảo mật
          setUser(currentUser);
          resetFailedAttempts();

          // Tải và cập nhật quyền (permissions) cho user
          try {
            const { permissions } = await getMyPermissionsAPI();
            setGlobalPermissions(permissions);
          } catch {
            // Không block luồng chính nếu lỗi lấy quyền
          }

          // Kiểm tra nếu role bắt buộc có MFA nhưng chưa bật, yêu cầu đi setup (Bỏ qua tạm thời)
          /*
          if (needsMfaSetup(currentUser)) {
            router.push(AUTH_ROUTES.MFA);
            return response;
          }
          */

          // Hoàn thành đăng nhập, chuyển vào trang chủ
          router.push(AUTH_ROUTES.DASHBOARD);
        } else {
          // Trả về lỗi nếu đăng nhập thành công nhưng không lấy được profile
          throw new Error('Không thể lấy thông tin người dùng sau khi đăng nhập.');
        }

        return response;
      } catch (error: unknown) {
        // Bước 6: Xử lý các loại lỗi từ backend trả về
        const err = error as { response?: { data?: AuthApiError } };
        const errorCode = err.response?.data?.code;

        if (errorCode === AuthErrorCode.ACCOUNT_LOCKED) {
          // Lỗi khóa tài khoản do nhập sai nhiều lần
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
          // Lỗi tài khoản bị khóa/đình chỉ
          setSuspendedMessage(err.response?.data?.message || 'Tài khoản đã bị khóa');
        } else if (errorCode === AuthErrorCode.INVALID_CREDENTIALS) {
          // Lỗi sai thông tin đăng nhập, tăng số đếm lần sai
          incrementFailedAttempts();
        }

        throw error; // Ném lỗi ra ngoài để UI (LoginForm) catch lại và hiển thị
      } finally {
        setLoading(false); // Bước 7: Luôn tắt trạng thái tải
      }
    },
    [router, setUser, setLoading, resetFailedAttempts, incrementFailedAttempts, setLockout, setSuspendedMessage, setGlobalPermissions],
  );

  // ─── Register ──────────────────────────────────────────────────────────────

  const register = useCallback(
    async (data: RegisterRequest) => {
      setLoading(true);
      try {
        const response = await registerAPI(data);
        router.push(`${AUTH_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(data.email)}`);
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
      router.push(AUTH_ROUTES.LOGIN);
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
