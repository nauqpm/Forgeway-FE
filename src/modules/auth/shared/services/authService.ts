import api from '@/lib/axiosIns';
import { AuthErrorCode } from '../types/auth.types';
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
  LoginRetryDetails,
} from '../types/auth.types';

export const loginAPI = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data, {
    withCredentials: true,
  });
  return response.data;
};

export const registerAPI = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/register', data);
  return response.data;
};

export const logoutAPI = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/logout', {}, { withCredentials: true });
  return response.data;
};

export const getCurrentUserAPI = async (): Promise<AuthUser> => {
  const response = await api.get<AuthUser>('/auth/me', {
    withCredentials: true,
  });
  return response.data;
};

export const updateProfileAPI = async (data: UpdateProfileRequest): Promise<AuthUser> => {
  const response = await api.put<AuthUser>('/auth/update', data, {
    withCredentials: true,
  });
  return response.data;
};

interface EmailCheckResponse {
  isValid: boolean;
  googleId?: string;
}

export const checkEmailAPI = async (email: string): Promise<EmailCheckResponse> => {
  const response = await api.get<EmailCheckResponse>('/auth/check-email', {
    params: { email },
  });
  return response.data;
};

export const requestPasswordResetAPI = async (data: ForgotPasswordRequest): Promise<PasswordResetResponse> => {
  const response = await api.post<PasswordResetResponse>('/auth/request-password-reset', data);
  return response.data;
};

export const verifyOtpAPI = async (email: string, otp: string): Promise<VerifyOtpResponse> => {
  const response = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
    email,
    otp,
  });
  return response.data;
};

export const resetPasswordWithGrantAPI = async (data: ResetPasswordByGrantRequest): Promise<PasswordResetResponse> => {
  const response = await api.post<PasswordResetResponse>('/auth/reset-password', data);
  return response.data;
};

export const verifyEmailAPI = async (email: string, otp: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/verify-email', {
    email,
    code: otp,
  });
  return response.data;
};

export const resendVerifyEmailAPI = async (email: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/resend-verification', { email });
  return response.data;
};


const toPositiveNumber = (value: unknown): number | null => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.ceil(numberValue) : null;
};

export const extractLoginRetryDetails = (error: unknown): LoginRetryDetails | null => {
  const err = error as {
    response?: {
      data?: AuthApiError;
      headers?: Record<string, string | number | undefined>;
      status?: number;
    };
  };

  const data = err.response?.data;
  const code = data?.code;

  if (code !== AuthErrorCode.LOGIN_RETRY_LATER) return null;

  const details = data?.details ?? {};
  const retryAfterFromBody = toPositiveNumber(details.retryAfterSeconds);
  const retryAfterFromHeader = toPositiveNumber(err.response?.headers?.['retry-after']);
  const retryAfterSeconds = retryAfterFromBody ?? retryAfterFromHeader;

  if (!retryAfterSeconds) return null;

  const retryAtFromBody = typeof details.retryAt === 'string' ? details.retryAt : null;
  const retryAt = retryAtFromBody ?? new Date(Date.now() + retryAfterSeconds * 1000).toISOString();

  return { retryAfterSeconds, retryAt };
};
export const extractAuthError = (error: unknown): AuthApiError => {
  const err = error as { response?: { data?: AuthApiError }; message?: string };
  if (err.response?.data?.code) {
    return err.response.data;
  }
  return {
    code: 'INVALID_CREDENTIALS' as AuthApiError['code'],
    message: err.response?.data?.message || err.message || 'An error occurred',
  };
};

export const extractRegisterError = (error: unknown): AuthApiError => {
  const err = error as { response?: { data?: AuthApiError }; message?: string };
  if (err.response?.data?.code) {
    return err.response.data;
  }
  return {
    code: 'EMAIL_ALREADY_EXISTS' as AuthApiError['code'],
    message: err.response?.data?.message || err.message || 'Registration failed.',
  };
};
