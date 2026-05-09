'use client';

// =============================================================================
// useMfa HOOK — MFA verification and setup orchestration
// =============================================================================

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMfaStore } from '../stores/mfaStore';
import { useAuthStore } from '../stores/authStore';
import {
  verifyMfaAPI,
  setupTotpAPI,
  confirmTotpSetupAPI,
  requestEmailOtpAPI,
  disableMfaAPI,
  getBackupCodesAPI,
  regenerateBackupCodesAPI,
} from '../services/mfaService';
import { AUTH_ROUTES } from '../constants/auth-routes';
import type { MfaMethod } from '../types/auth.types';

export const useMfa = () => {
  const router = useRouter();
  const { mfaRequired, mfaToken, method, setupData, setMfaSetup, clearMfa } =
    useMfaStore();
  const { setUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Verify MFA Code ───────────────────────────────────────────────────────

  const verifyMfa = useCallback(
    async (code: string, mfaMethod?: MfaMethod) => {
      if (!mfaToken) {
        setError('Phiên xác thực MFA đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await verifyMfaAPI({
          mfaToken,
          code,
          method: mfaMethod || method || 'totp',
        });

        // MFA verified — set user and redirect
        setUser(response.user);
        clearMfa();
        router.push(AUTH_ROUTES.DASHBOARD);
        return response;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Mã xác thực không hợp lệ');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mfaToken, method, setUser, clearMfa, router],
  );

  // ─── Setup TOTP ────────────────────────────────────────────────────────────

  const setupTotp = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await setupTotpAPI();
      setMfaSetup(data);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể thiết lập TOTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setMfaSetup]);

  // ─── Confirm TOTP Setup ────────────────────────────────────────────────────

  const confirmTotp = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await confirmTotpSetupAPI(code);
      return result;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Mã xác thực không đúng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Request Email OTP ─────────────────────────────────────────────────────

  const requestEmailOtp = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestEmailOtpAPI();
      return result;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể gửi mã OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Disable MFA ───────────────────────────────────────────────────────────

  const disableMfa = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await disableMfaAPI();
      clearMfa();
      return result;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể tắt MFA');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearMfa]);

  // ─── Backup Codes ──────────────────────────────────────────────────────────

  const getBackupCodes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBackupCodesAPI();
      return result.backupCodes;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể lấy mã dự phòng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const regenerateBackupCodes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await regenerateBackupCodesAPI();
      return result.backupCodes;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể tạo lại mã dự phòng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    mfaRequired,
    mfaToken,
    method,
    setupData,
    loading,
    error,

    // Actions
    verifyMfa,
    setupTotp,
    confirmTotp,
    requestEmailOtp,
    disableMfa,
    getBackupCodes,
    regenerateBackupCodes,
    clearMfa,
    clearError: () => setError(null),
  };
};