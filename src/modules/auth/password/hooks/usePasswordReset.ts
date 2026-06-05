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
        setError("You are acting too quickly. Please try again in a few minutes.");
      } else if (code === "EMAIL_NOT_VERIFIED") {
        setError("Email has not been verified. Please verify your email before resetting your password.");
      } else if (backendMessage.includes("not found") || backendMessage.includes("khong ton tai")) {
        setError("Email does not exist in the system.");
      } else if (status === 400 || status === 404) {
        setError("Could not send OTP. Please check the email again.");
      } else {
        setError("Could not send OTP right now. Please try again later.");
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
        setError("You are acting too quickly. Please try again in a few minutes.");
      } else if (status === 401 || status === 403) {
        setError("OTP is invalid or expired.");
      } else if (status === 400) {
        setError("Please check the OTP again.");
      } else {
        setError("OTP verification failed. Please try again.");
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
        setError("You are acting too quickly. Please try again in a few minutes.");
      } else if (code === "PASSWORD_TOO_WEAK") {
        setError("New password does not meet the security requirements.");
      } else if (status === 401 || status === 403) {
        setError("Password reset session is invalid or expired. Please request a new OTP.");
      } else if (status === 400) {
        setError("Could not reset password. Please check the information again.");
      } else {
        setError("Password reset failed. Please try again later.");
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
