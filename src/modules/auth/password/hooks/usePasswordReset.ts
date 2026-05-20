"use client";
import { useState } from "react";
import {
  requestPasswordResetAPI,
  verifyOtpAPI,
  resetPasswordWithGrantAPI,
} from "../../shared/services/authService";
import type {
  PasswordResetResponse,
  VerifyOtpResponse,
} from "../../shared/types/auth.types";

interface UsePasswordResetReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  requestPasswordReset: (email: string) => Promise<PasswordResetResponse>;
  verifyOtp: (email: string, otp: string) => Promise<VerifyOtpResponse>;
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

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await requestPasswordResetAPI({ email, resetMethod: "otp" });
      setSuccess(true);
      return response;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || error.message || "Da co loi xay ra");
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || error.message || "Ma OTP khong hop le");
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
      const verified = await verifyOtpAPI(email, otp);
      const response = await resetPasswordWithGrantAPI({
        resetGrant: verified.resetGrant,
        newPassword,
      });
      setSuccess(true);
      return response;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || error.message || "Khong the dat lai mat khau");
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
    resetPasswordWithOtp,
    clearError,
    clearSuccess,
  };
};
