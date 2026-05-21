import api from '@/config/api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PasswordResetResponse,
  VerifyOtpResponse,
  ForgotPasswordRequest,
  ResetPasswordByGrantRequest,
  UpdateProfileRequest,
  AuthUser,
  AuthApiError,
} from '../types/auth.types';

export const loginAPI = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data, {
    withCredentials: true,
  });
  return response.data;
};

export const registerAPI = async (
  data: RegisterRequest,
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/register', data);
  return response.data;
};

export const logoutAPI = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    '/auth/logout',
    {},
    { withCredentials: true },
  );
  return response.data;
};

export const getCurrentUserAPI = async (): Promise<AuthUser> => {
  const response = await api.get<AuthUser>('/auth/me', {
    withCredentials: true,
  });
  return response.data;
};

export const updateProfileAPI = async (
  data: UpdateProfileRequest,
): Promise<AuthUser> => {
  const response = await api.put<AuthUser>('/auth/update', data, {
    withCredentials: true,
  });
  return response.data;
};

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

export const requestPasswordResetAPI = async (
  data: ForgotPasswordRequest,
): Promise<PasswordResetResponse> => {
  const response = await api.post<PasswordResetResponse>(
    '/auth/request-password-reset',
    data,
  );
  return response.data;
};

export const verifyOtpAPI = async (
  email: string,
  otp: string,
): Promise<VerifyOtpResponse> => {
  const response = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
    email,
    otp,
  });
  return response.data;
};

export const resetPasswordWithGrantAPI = async (
  data: ResetPasswordByGrantRequest,
): Promise<PasswordResetResponse> => {
  const response = await api.post<PasswordResetResponse>(
    '/auth/reset-password',
    data,
  );
  return response.data;
};

export const verifyEmailAPI = async (
  email: string,
  otp: string,
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/verify-email', {
    email,
    code: otp,
  });
  return response.data;
};

export const resendVerifyEmailAPI = async (
  email: string,
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    '/auth/resend-verification',
    { email },
  );
  return response.data;
};

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
