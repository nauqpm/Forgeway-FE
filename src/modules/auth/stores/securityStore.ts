import { create } from 'zustand';
import type { LockoutInfo } from '../types/auth.types';
import { PASSWORD_POLICY } from '../constants/password-policy';

// ─── Security Store ──────────────────────────────────────────────────────────
// Tracks account lockout and suspension state for the login flow.

interface SecurityState {
  lockoutInfo: LockoutInfo | null;
  failedAttempts: number;
  suspendedMessage: string | null;
}

interface SecurityActions {
  setLockout: (info: LockoutInfo) => void;
  incrementFailedAttempts: () => void;
  resetFailedAttempts: () => void;
  setSuspendedMessage: (message: string | null) => void;
  clearSecurityState: () => void;
}

export const useSecurityStore = create<SecurityState & SecurityActions>(
  (set, get) => ({
    // ── State ──
    lockoutInfo: null,
    failedAttempts: 0,
    suspendedMessage: null,

    // ── Actions ──
    setLockout: (lockoutInfo) =>
      set({ lockoutInfo }),

    incrementFailedAttempts: () => {
      const next = get().failedAttempts + 1;
      set({
        failedAttempts: next,
        lockoutInfo:
          next >= PASSWORD_POLICY.MAX_FAILED_ATTEMPTS
            ? {
                isLocked: true,
                remainingAttempts: 0,
                maxAttempts: PASSWORD_POLICY.MAX_FAILED_ATTEMPTS,
              }
            : {
                isLocked: false,
                remainingAttempts: PASSWORD_POLICY.MAX_FAILED_ATTEMPTS - next,
                maxAttempts: PASSWORD_POLICY.MAX_FAILED_ATTEMPTS,
              },
      });
    },

    resetFailedAttempts: () =>
      set({ failedAttempts: 0, lockoutInfo: null }),

    setSuspendedMessage: (suspendedMessage) =>
      set({ suspendedMessage }),

    clearSecurityState: () =>
      set({
        lockoutInfo: null,
        failedAttempts: 0,
        suspendedMessage: null,
      }),
  }),
);