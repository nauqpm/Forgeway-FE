/**
 * =============================================================================
 * SSO SERVICE — Dịch vụ Đăng nhập một lần (Single Sign-On) bằng Google
 * =============================================================================

 */

import api from '@/config/api';
import type { AuthUser } from '../../shared/types/auth.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Initiate Google Login ───────────────────────────────────────────────────

/**
 * Khởi tạo quá trình đăng nhập qua Google OAuth2.
 * 1. Chuyển hướng toàn bộ trình duyệt của người dùng đến endpoint `/auth/google` của Backend.
 * 2. Tại Backend, passport-google-oauth20 sẽ tạo url và điều hướng người dùng sang form đăng nhập của Google.
 * 3. Người dùng đồng ý cấp quyền -> Google gọi lại callback URL trên Backend kèm authorization code.
 * 4. Backend dùng code đổi lấy token, lấy thông tin user, gán HTTP-only cookie và redirect người dùng 
 *    về lại giao diện Frontend (kèm tham số thành công hoặc lỗi trên URL).
 */
export const initiateGoogleLogin = (): void => {
  window.location.href = `${API_URL}/auth/google`;
};


// ─── Link Google Account ─────────────────────────────────────────────────────
// Links Google account to existing user account.

export const linkGoogleAccountAPI = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    '/auth/sso/link',
    { provider: 'google' },
    { withCredentials: true },
  );
  return response.data;
};

// ─── Unlink Google Account ───────────────────────────────────────────────────

export const unlinkGoogleAccountAPI = async (): Promise<{
  message: string;
}> => {
  const response = await api.delete<{ message: string }>('/auth/sso/link', {
    data: { provider: 'google' },
    withCredentials: true,
  });
  return response.data;
};

// ─── Handle SSO Callback ─────────────────────────────────────────────────────
// Called after OAuth redirect returns with a token in the URL.

export const handleSsoCallbackAPI = async (token: string): Promise<{ user: AuthUser }> => {
  const response = await api.post<{ user: AuthUser }>(
    '/auth/sso/callback',
    { token },
    { withCredentials: true },
  );
  return response.data;
};
