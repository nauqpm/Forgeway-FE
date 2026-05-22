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
import { loginAPI, registerAPI, logoutAPI, getCurrentUserAPI } from '../services/authService';
import { clearTokens } from '../services/tokenService';
import { getMyPermissionsAPI } from '../../permission/services/permissionService';
import { AUTH_ROUTES } from '../constants/auth-routes';
import { AuthErrorCode } from '../types/auth.types';
import { setupAuthInterceptors } from '../services/axiosAuthInterceptor';
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
   * Hàm login - Xử lý logic nghiệp vụ khi người dùng đăng nhập.
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

          // Chuyển hướng dựa trên role
          const route = currentUser.role === 'super_admin'
            ? AUTH_ROUTES.ADMIN_DASHBOARD
            : AUTH_ROUTES.DASHBOARD;
          router.push(route);
        } else {
          // Trả về lỗi nếu đăng nhập thành công nhưng không lấy được profile
          throw new Error('Không thể lấy thông tin người dùng sau khi đăng nhập.');
        }

        return response;
      } catch (error: unknown) {
        // Bước 7: Xử lý các loại lỗi từ backend trả về
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
          toast.error('Tài khoản đã bị khóa tạm thời do nhập sai quá nhiều lần.');
        } else if (
          errorCode === AuthErrorCode.USER_SUSPENDED ||
          errorCode === AuthErrorCode.USER_DEACTIVATED
        ) {
          // Lỗi tài khoản bị khóa/đình chỉ
          setSuspendedMessage('Tài khoản đã bị khóa');
          toast.error('Tài khoản đã bị khóa hoặc tạm ngưng hoạt động.');
        } else if (errorCode === AuthErrorCode.INVALID_CREDENTIALS) {
          // Lỗi sai thông tin đăng nhập, tăng số đếm lần sai
          incrementFailedAttempts();
          toast.error('Email hoặc mật khẩu không chính xác.');
        } else {
          toast.error('Đăng nhập thất bại. Vui lòng thử lại sau.');
        }

        throw error; // Ném lỗi ra ngoài để UI xử lý luồng nếu cần
      } finally {
        setLoading(false); // Bước 8: Luôn tắt trạng thái tải
      }
    },
    [router, setUser, setLoading, setMfaChallenge, resetFailedAttempts, incrementFailedAttempts, setLockout, setSuspendedMessage, setGlobalPermissions],
  );

  // --- Register ------------------------------------------------------------

  const register = useCallback(
    async (data: RegisterRequest) => {
      setLoading(true);
      try {
        const response = await registerAPI(data);
        if (!response.success) {
          throw new Error('Đăng ký thất bại.');
        }
        router.push(`${AUTH_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(data.email)}`);
        return response;
      } catch (error: unknown) {
        const err = error as { response?: { data?: AuthApiError } };
        const errorCode = err.response?.data?.code;

        if (errorCode === AuthErrorCode.EMAIL_ALREADY_EXISTS) {
          toast.error('Email đã tồn tại. Vui lòng dùng email khác.');
        } else if (errorCode === AuthErrorCode.USER_SUSPENDED) {
          toast.error('Tài khoản đã bị tạm ngưng.');
        } else {
          toast.error('Đăng ký thất bại. Vui lòng thử lại sau.');
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
