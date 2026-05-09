// =============================================================================
// MFA SERVICE — Multi-Factor Authentication API calls
// =============================================================================
// MFA is required for ALL users.
// Supports TOTP (authenticator app) and Email OTP.

import api from '@/config/api';
import type {
  MfaVerifyRequest,
  MfaVerifyResponse,
  MfaSetupResponse,
} from '../types/auth.types';

// ─── Verify MFA Code ─────────────────────────────────────────────────────────

export const verifyMfaAPI = async (
  data: MfaVerifyRequest,
): Promise<MfaVerifyResponse> => {
  const response = await api.post<MfaVerifyResponse>('/auth/mfa/verify', data, {
    withCredentials: true,
  });
  return response.data;
};

// ─── Setup TOTP ──────────────────────────────────────────────────────────────
// Returns QR code URL, secret key, and backup codes.

export const setupTotpAPI = async (): Promise<MfaSetupResponse> => {
  const response = await api.post<MfaSetupResponse>(
    '/auth/mfa/setup-totp',
    {},
    { withCredentials: true },
  );
  return response.data;
};

// ─── Confirm TOTP Setup ──────────────────────────────────────────────────────
// User enters a code from their authenticator app to confirm setup.

export const confirmTotpSetupAPI = async (
  code: string,
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    '/auth/mfa/confirm-totp',
    { code },
    { withCredentials: true },
  );
  return response.data;
};

// ─── Request Email OTP ───────────────────────────────────────────────────────
// Sends an OTP to the user's email for MFA verification.

export const requestEmailOtpAPI = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    '/auth/mfa/request-email-otp',
    {},
    { withCredentials: true },
  );
  return response.data;
};

// ─── Disable MFA ─────────────────────────────────────────────────────────────

export const disableMfaAPI = async (): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>('/auth/mfa', {
    withCredentials: true,
  });
  return response.data;
};

// ─── Get Backup Codes ────────────────────────────────────────────────────────

export const getBackupCodesAPI = async (): Promise<{ backupCodes: string[] }> => {
  const response = await api.get<{ backupCodes: string[] }>(
    '/auth/mfa/backup-codes',
    { withCredentials: true },
  );
  return response.data;
};

// ─── Regenerate Backup Codes ─────────────────────────────────────────────────

export const regenerateBackupCodesAPI = async (): Promise<{
  backupCodes: string[];
}> => {
  const response = await api.post<{ backupCodes: string[] }>(
    '/auth/mfa/regenerate-backup-codes',
    {},
    { withCredentials: true },
  );
  return response.data;
};