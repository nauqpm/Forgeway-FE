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
      const response = await requestPasswordResetAPI({ email });
      setSuccess(true);
      return response;
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { code?: string; message?: string } };
      };
      const status = error.response?.status;
      const code = error.response?.data?.code;
      const backendMessage = error.response?.data?.message?.toLowerCase() || "";

      if (code === "RATE_LIMITED" || status === 429) {
        setError("Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.");
      } else if (code === "EMAIL_NOT_VERIFIED") {
        setError("Email chưa được xác minh. Vui lòng xác minh email trước khi đặt lại mật khẩu.");
      } else if (backendMessage.includes("not found") || backendMessage.includes("khong ton tai")) {
        setError("Email không tồn tại trong hệ thống.");
      } else if (status === 400 || status === 404) {
        setError("Không thể gửi mã OTP. Vui lòng kiểm tra lại email.");
      } else {
        setError("Không thể gửi mã OTP lúc này. Vui lòng thử lại sau.");
      }
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
      const error = err as {
        response?: { status?: number; data?: { code?: string } };
      };
      const status = error.response?.status;
      const code = error.response?.data?.code;

      if (code === "RATE_LIMITED" || status === 429) {
        setError("Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.");
      } else if (status === 401 || status === 403) {
        setError("Mã OTP không hợp lệ hoặc đã hết hạn.");
      } else if (status === 400) {
        setError("Vui lòng kiểm tra lại mã OTP.");
      } else {
        setError("Xác thực mã OTP thất bại. Vui lòng thử lại.");
      }
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
      const error = err as {
        response?: { status?: number; data?: { code?: string } };
      };
      const status = error.response?.status;
      const code = error.response?.data?.code;

      if (code === "RATE_LIMITED" || status === 429) {
        setError("Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.");
      } else if (code === "PASSWORD_TOO_WEAK") {
        setError("Mật khẩu mới chưa đạt yêu cầu bảo mật.");
      } else if (status === 401 || status === 403) {
        setError("Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã OTP mới.");
      } else if (status === 400) {
        setError("Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại thông tin.");
      } else {
        setError("Đặt lại mật khẩu thất bại. Vui lòng thử lại sau.");
      }
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
