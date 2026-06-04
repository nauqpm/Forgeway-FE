'use client';

// =============================================================================
// useMfa HOOK — MFA verification and setup orchestration
// =============================================================================

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMfaStore } from '../../shared/stores/authStore';
import {
  verifyMfaAPI,
  setupTotpAPI,
  confirmTotpSetupAPI,
  requestEmailOtpAPI,
  disableMfaAPI,
  getBackupCodesAPI,
  regenerateBackupCodesAPI,
} from '../services/mfaService';
import { AUTH_ROUTES } from '../../shared/constants/auth-routes';
import type { MfaMethod, UserRole } from '../../shared/types/auth.types';

const MFA_REQUIRED_ROLES: UserRole[] = ['super_admin'];

export const useMfa = () => {
  const router = useRouter();
  const { mfaRequired, mfaToken, method, setupData, setMfaSetup, clearMfa } =
    useMfaStore();
  const { user, setUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Verify MFA Code ───────────────────────────────────────────────────────

  const verifyMfa = useCallback(
    async (code: string, mfaMethod?: MfaMethod) => {
      if (!mfaToken) {
        setError('Your MFA session has expired. Please sign in again.');
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
        router.push(AUTH_ROUTES.HOME);
        return response;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Invalid verification code');
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
      setError(error.response?.data?.message || 'Could not set up TOTP');
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
      setError(error.response?.data?.message || 'Incorrect verification code');
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
      setError(error.response?.data?.message || 'Could not send OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Disable MFA ───────────────────────────────────────────────────────────

  const disableMfa = useCallback(async () => {
    if (user?.role && MFA_REQUIRED_ROLES.includes(user.role)) {
      setError('The current role requires MFA and it cannot be disabled.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await disableMfaAPI();
      clearMfa();
      return result;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Could not disable MFA');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearMfa, user]);

  // ─── Backup Codes ──────────────────────────────────────────────────────────

  const getBackupCodes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBackupCodesAPI();
      return result.backupCodes;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Could not get backup codes');
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
      setError(error.response?.data?.message || 'Could not regenerate backup codes');
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
