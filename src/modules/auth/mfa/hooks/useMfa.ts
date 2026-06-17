'use client';

// =============================================================================
// useMfa HOOK - MFA verification and setup orchestration
// =============================================================================

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
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

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message || err.message || fallback;
};

export const useMfa = () => {
  const router = useRouter();
  const { mfaRequired, mfaToken, method, setupData, setMfaSetup, clearMfa } =
    useMfaStore();
  const { user, setUser } = useAuthStore();

  const verifyMfaMutation = useMutation({
    mutationFn: async ({ code, mfaMethod }: { code: string; mfaMethod?: MfaMethod }) => {
      if (!mfaToken) {
        throw new Error('Your MFA session has expired. Please sign in again.');
      }

      return verifyMfaAPI({
        mfaToken,
        code,
        method: mfaMethod || method || 'totp',
      });
    },
    onSuccess: (response) => {
      setUser(response.user);
      clearMfa();
      router.push(AUTH_ROUTES.HOME);
    },
  });

  const setupTotpMutation = useMutation({
    mutationFn: setupTotpAPI,
    onSuccess: setMfaSetup,
  });

  const confirmTotpMutation = useMutation({
    mutationFn: confirmTotpSetupAPI,
  });

  const requestEmailOtpMutation = useMutation({
    mutationFn: requestEmailOtpAPI,
  });

  const disableMfaMutation = useMutation({
    mutationFn: async () => {
      if (user?.role && MFA_REQUIRED_ROLES.includes(user.role)) {
        throw new Error('The current role requires MFA and it cannot be disabled.');
      }

      return disableMfaAPI();
    },
    onSuccess: clearMfa,
  });

  const getBackupCodesMutation = useMutation({
    mutationFn: async () => {
      const result = await getBackupCodesAPI();
      return result.backupCodes;
    },
  });

  const regenerateBackupCodesMutation = useMutation({
    mutationFn: async () => {
      const result = await regenerateBackupCodesAPI();
      return result.backupCodes;
    },
  });

  const clearError = useCallback(() => {
    verifyMfaMutation.reset();
    setupTotpMutation.reset();
    confirmTotpMutation.reset();
    requestEmailOtpMutation.reset();
    disableMfaMutation.reset();
    getBackupCodesMutation.reset();
    regenerateBackupCodesMutation.reset();
  }, [
    verifyMfaMutation,
    setupTotpMutation,
    confirmTotpMutation,
    requestEmailOtpMutation,
    disableMfaMutation,
    getBackupCodesMutation,
    regenerateBackupCodesMutation,
  ]);

  const activeError =
    verifyMfaMutation.error ||
    setupTotpMutation.error ||
    confirmTotpMutation.error ||
    requestEmailOtpMutation.error ||
    disableMfaMutation.error ||
    getBackupCodesMutation.error ||
    regenerateBackupCodesMutation.error;

  return {
    // State
    mfaRequired,
    mfaToken,
    method,
    setupData,
    loading:
      verifyMfaMutation.isPending ||
      setupTotpMutation.isPending ||
      confirmTotpMutation.isPending ||
      requestEmailOtpMutation.isPending ||
      disableMfaMutation.isPending ||
      getBackupCodesMutation.isPending ||
      regenerateBackupCodesMutation.isPending,
    error: activeError ? getErrorMessage(activeError, 'MFA action failed') : null,

    // Actions
    verifyMfa: (code: string, mfaMethod?: MfaMethod) =>
      verifyMfaMutation.mutateAsync({ code, mfaMethod }),
    setupTotp: () => setupTotpMutation.mutateAsync(),
    confirmTotp: (code: string) => confirmTotpMutation.mutateAsync(code),
    requestEmailOtp: () => requestEmailOtpMutation.mutateAsync(),
    disableMfa: () => disableMfaMutation.mutateAsync(),
    getBackupCodes: () => getBackupCodesMutation.mutateAsync(),
    regenerateBackupCodes: () => regenerateBackupCodesMutation.mutateAsync(),
    clearMfa,
    clearError,
  };
};
