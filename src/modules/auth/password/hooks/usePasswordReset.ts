"use client";

import { useMutation } from "@tanstack/react-query";
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

const getPasswordResetError = (
  err: unknown,
  context: "request" | "verify" | "reset",
) => {
  const error = err as {
    response?: { status?: number; data?: { code?: string; message?: string } };
    message?: string;
  };
  const status = error.response?.status;
  const code = error.response?.data?.code;

  if (code === "RATE_LIMITED" || status === 429) {
    return "You are acting too quickly. Please try again in a few minutes.";
  }

  if (context === "request") {
    if (code === "EMAIL_NOT_VERIFIED") {
      return "Email has not been verified. Please verify your email before resetting your password.";
    }
    if (status === 400 || status === 404) {
      return "Unable to send OTP for an invalid email address.";
    }
    return "Could not send OTP right now. Please try again later.";
  }

  if (context === "verify") {
    if (status === 401 || status === 403) {
      return "OTP is invalid or expired.";
    }
    if (status === 400) {
      return "Please check the OTP again.";
    }
    return "OTP verification failed. Please try again.";
  }

  if (code === "PASSWORD_TOO_WEAK") {
    return "New password does not meet the security requirements.";
  }
  if (status === 401 || status === 403) {
    return "Password reset session is invalid or expired. Please request a new OTP.";
  }
  if (status === 400) {
    return "Could not reset password. Please check the information again.";
  }
  return "Password reset failed. Please try again later.";
};

const withPasswordResetError = async <T,>(
  action: () => Promise<T>,
  context: "request" | "verify" | "reset",
) => {
  try {
    return await action();
  } catch (err) {
    throw new Error(getPasswordResetError(err, context));
  }
};

export const usePasswordReset = (): UsePasswordResetReturn => {
  const requestPasswordResetMutation = useMutation({
    mutationFn: (email: string) =>
      withPasswordResetError(
        () => requestPasswordResetAPI({ email }),
        "request",
      ),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      withPasswordResetError(
        () => verifyOtpAPI(email, otp),
        "verify",
      ),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ email, otp, newPassword }: { email: string; otp: string; newPassword: string }) =>
      withPasswordResetError(async () => {
        const verified = await verifyOtpAPI(email, otp);
        return resetPasswordWithGrantAPI({
          resetGrant: verified.resetGrant,
          newPassword,
        });
      }, "reset"),
  });

  const activeError =
    requestPasswordResetMutation.error ||
    verifyOtpMutation.error ||
    resetPasswordMutation.error;

  const clearError = () => {
    requestPasswordResetMutation.reset();
    verifyOtpMutation.reset();
    resetPasswordMutation.reset();
  };

  const clearSuccess = clearError;

  return {
    loading:
      requestPasswordResetMutation.isPending ||
      verifyOtpMutation.isPending ||
      resetPasswordMutation.isPending,
    error: activeError instanceof Error ? activeError.message : null,
    success:
      requestPasswordResetMutation.isSuccess ||
      verifyOtpMutation.isSuccess ||
      resetPasswordMutation.isSuccess,
    requestPasswordReset: (email: string) =>
      requestPasswordResetMutation.mutateAsync(email),
    verifyOtp: (email: string, otp: string) =>
      verifyOtpMutation.mutateAsync({ email, otp }),
    resetPasswordWithOtp: (email: string, otp: string, newPassword: string) =>
      resetPasswordMutation.mutateAsync({ email, otp, newPassword }),
    clearError,
    clearSuccess,
  };
};
