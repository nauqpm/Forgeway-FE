// =============================================================================
// AUTH SERVICE — Core authentication API calls
// =============================================================================
// Refactored: uses shared axios instance, no alert() calls, proper typing.
// Access token & refresh token are managed via httpOnly cookies by backend.

import api from '@/config/api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PasswordResetResponse,
  ForgotPasswordRequest,
  ResetPasswordByTokenRequest,
  ResetPasswordByOtpRequest,
  UpdateProfileRequest,
  AuthUser,
  AuthApiError,
} from '../types/auth.types';

// ─── Login ───────────────────────────────────────────────────────────────────

export const loginAPI = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data, {
    withCredentials: true, // ensure cookies are set
  });
  return response.data;
};

// ─── Register ────────────────────────────────────────────────────────────────

export const registerAPI = async (
  data: RegisterRequest,
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/register', data);
  return response.data;
};

// ─── Logout ──────────────────────────────────────────────────────────────────

export const logoutAPI = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    '/auth/logout',
    {},
    { withCredentials: true },
  );
  return response.data;
};

// ─── Get Current User ────────────────────────────────────────────────────────

export const getCurrentUserAPI = async (): Promise<AuthUser> => {
  const response = await api.get<AuthUser>('/auth/me', {
    withCredentials: true,
  });
  return {
    ...response.data,
    permissions: response.data.permissions || [],
    spaceRoles: response.data.spaceRoles || [],
  };
};

// ─── Update Current User ──────────────────────────────────────────────────────

export const updateProfileAPI = async (
  data: UpdateProfileRequest,
): Promise<AuthUser> => {
  const response = await api.put<AuthUser>('/auth/update', data, {
    withCredentials: true,
  });
  return response.data;
};

// ─── Check Email ─────────────────────────────────────────────────────────────

interface EmailCheckResponse {
  isValid: boolean;
  googleId?: string;
}

export const checkEmailAPI = async (
  email: string,
): Promise<EmailCheckResponse> => {
  const response = await api.get<EmailCheckResponse>('/auth/check-email', {
    params: { email },
  });
  return response.data;
};

// ─── Password Reset: Request ─────────────────────────────────────────────────

export const requestPasswordResetAPI = async (
  data: ForgotPasswordRequest,
): Promise<PasswordResetResponse> => {
  const response = await api.post<PasswordResetResponse>(
    '/auth/request-password-reset',
    data,
  );
  return response.data;
};

// ─── Password Reset: Verify OTP ──────────────────────────────────────────────

export const verifyOtpAPI = async (
  email: string,
  otp: string,
): Promise<PasswordResetResponse> => {
  const response = await api.post<PasswordResetResponse>('/auth/verify-otp', {
    email,
    otp,
  });
  return response.data;
};

// ─── Password Reset: With Token ──────────────────────────────────────────────

export const resetPasswordWithTokenAPI = async (
  data: ResetPasswordByTokenRequest,
): Promise<PasswordResetResponse> => {
  const response = await api.post<PasswordResetResponse>(
    '/auth/reset-password/token',
    data,
  );
  return response.data;
};

// ─── Password Reset: With OTP ────────────────────────────────────────────────

export const resetPasswordWithOtpAPI = async (
  data: ResetPasswordByOtpRequest,
): Promise<PasswordResetResponse> => {
  const response = await api.post<PasswordResetResponse>(
    '/auth/reset-password/otp',
    data,
  );
  return response.data;
};

// ─── Verify Email ────────────────────────────────────────────────────────────

export const verifyEmailAPI = async (
  token: string,
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/verify-email', {
    token,
  });
  return response.data;
};

// ─── Resend Verify Email ─────────────────────────────────────────────────────

export const resendVerifyEmailAPI = async (
  email: string,
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    '/auth/resend-verify-email',
    { email },
  );
  return response.data;
};

// ─── Error Helper ────────────────────────────────────────────────────────────

export const extractAuthError = (error: unknown): AuthApiError => {
  const err = error as { response?: { data?: AuthApiError }; message?: string };
  if (err.response?.data?.code) {
    return err.response.data;
  }
  return {
    code: 'INVALID_CREDENTIALS' as AuthApiError['code'],
    message: err.response?.data?.message || err.message || 'Đã có lỗi xảy ra',
  };
};
