"use client";
import { useState } from "react";
import {
  requestPasswordResetAPI,
  verifyOtpAPI,
  resetPasswordWithTokenAPI,
  resetPasswordWithOtpAPI,
  PasswordResetResponse,
} from "../services/authService";

interface UsePasswordResetReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  requestPasswordReset: (email: string, resetMethod: 'link' | 'otp') => Promise<PasswordResetResponse>;
  verifyOtp: (email: string, otp: string) => Promise<PasswordResetResponse>;
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<PasswordResetResponse>;
  resetPasswordWithOtp: (email: string, otp: string, newPassword: string) => Promise<PasswordResetResponse>;
  clearError: () => void;
  clearSuccess: () => void;
}

export const usePasswordReset = (): UsePasswordResetReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(false);

  const requestPasswordReset = async (email: string, resetMethod: 'link' | 'otp') => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await requestPasswordResetAPI(email, resetMethod);
      setSuccess(true);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đã có lỗi xảy ra');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await verifyOtpAPI(email, otp);
      setSuccess(true);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Mã OTP không hợp lệ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordWithToken = async (token: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await resetPasswordWithTokenAPI(token, newPassword);
      setSuccess(true);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể đặt lại mật khẩu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordWithOtp = async (email: string, otp: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await resetPasswordWithOtpAPI(email, otp, newPassword);
      setSuccess(true);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể đặt lại mật khẩu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    success,
    requestPasswordReset,
    verifyOtp,
    resetPasswordWithToken,
    resetPasswordWithOtp,
    clearError,
    clearSuccess,
  };
};