import { create } from 'zustand';
import type { 
  AuthUser, 
  MfaMethod, 
  MfaSetupResponse, 
  LockoutInfo 
} from '../types/auth.types';
import { PASSWORD_POLICY } from '../../password/constants/password-policy';
import { persist } from 'zustand/middleware';

// ============================================================================
// ─── AUTH STORE ─────────────────────────────────────────────────────────────
// ============================================================================
// Core authentication state. Access token is managed via httpOnly cookie by
// the backend, so we only track user info and auth status in-memory.

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True once the initial auth check (cookie validation) has completed */
  isInitialized: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // ── State ──
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  // ── Actions ──
  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized, isLoading: false }),
  clearAuth: () => set({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: true,
  }),
}));


// ============================================================================
// ─── MFA STORE ──────────────────────────────────────────────────────────────
// ============================================================================
// Holds transient MFA challenge state (between login and MFA verification)
// and setup state (when user is configuring MFA).

interface MfaState {
  /** True when backend responds with mfaRequired after login */
  mfaRequired: boolean;
  /** Temporary token received from login, used to verify MFA */
  mfaToken: string | null;
  /** Method backend requires */
  method: MfaMethod | null;
  /** Setup data when configuring TOTP (QR code, secret, backup codes) */
  setupData: MfaSetupResponse | null;
}

interface MfaActions {
  setMfaChallenge: (mfaToken: string, method: MfaMethod) => void;
  setMfaSetup: (data: MfaSetupResponse) => void;
  clearMfa: () => void;
}

export const useMfaStore = create<MfaState & MfaActions>((set) => ({
  // ── State ──
  mfaRequired: false,
  mfaToken: null,
  method: null,
  setupData: null,

  // ── Actions ──
  setMfaChallenge: (mfaToken, method) => set({ mfaRequired: true, mfaToken, method }),
  setMfaSetup: (setupData) => set({ setupData }),
  clearMfa: () => set({
    mfaRequired: false,
    mfaToken: null,
    method: null,
    setupData: null,
  }),
}));


// ============================================================================
// ─── SECURITY STORE ─────────────────────────────────────────────────────────
// ============================================================================
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
  checkAndResetLockout: () => void;
  setSuspendedMessage: (message: string | null) => void;
  clearSecurityState: () => void;
}

export const useSecurityStore = create<SecurityState & SecurityActions>()(
  persist(
    (set, get) => ({
      // ── State ──
      lockoutInfo: null,
      failedAttempts: 0,
      suspendedMessage: null,

      // ── Actions ──
      setLockout: (lockoutInfo) => set({ lockoutInfo }),

      /**
       * Tăng số lần đăng nhập sai (failedAttempts) và cập nhật trạng thái khóa (lockoutInfo).
       * 
       * Các bước chi tiết:
       * 1. Tính toán số lần thử hiện tại cộng thêm 1 (biến `next`).
       * 2. Kiểm tra nếu số lần `next` lớn hơn hoặc bằng giới hạn cho phép (`MAX_FAILED_ATTEMPTS`, ví dụ: 5 lần):
       *    - Thay đổi trạng thái tài khoản thành bị khóa (`isLocked: true`).
       *    - Thiết lập thời gian khóa (ví dụ: 15 phút từ hiện tại).
       *    - Set số lần thử còn lại (`remainingAttempts`) về 0.
       * 3. Nếu chưa đạt giới hạn số lần thử:
       *    - Giữ trạng thái không bị khóa (`isLocked: false`).
       *    - Trừ lùi số lần thử còn lại (`MAX_FAILED_ATTEMPTS - next`).
       */
      incrementFailedAttempts: () => {
        const next = get().failedAttempts + 1;
        const max = PASSWORD_POLICY.MAX_FAILED_ATTEMPTS;
        
        if (next >= max) {
          // Khóa trong 15 phút
          const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          set({
            failedAttempts: next,
            lockoutInfo: {
              isLocked: true,
              remainingAttempts: 0,
              maxAttempts: max,
              lockedUntil,
            },
          });
        } else {
          set({
            failedAttempts: next,
            lockoutInfo: {
              isLocked: false,
              remainingAttempts: max - next,
              maxAttempts: max,
            },
          });
        }
      },

      resetFailedAttempts: () => set({ failedAttempts: 0, lockoutInfo: null }),

      checkAndResetLockout: () => {
        const { lockoutInfo } = get();
        if (lockoutInfo?.isLocked && lockoutInfo.lockedUntil) {
          const now = Date.now();
          const until = new Date(lockoutInfo.lockedUntil).getTime();
          if (now >= until) {
            set({ lockoutInfo: null, failedAttempts: 0 });
          }
        }
      },

      setSuspendedMessage: (suspendedMessage) => set({ suspendedMessage }),
      clearSecurityState: () => set({
        lockoutInfo: null,
        failedAttempts: 0,
        suspendedMessage: null,
      }),
    }),
    {
      name: 'al-task-security',
    }
  )
);


// ============================================================================
// ─── SESSION STORE ──────────────────────────────────────────────────────────
// ============================================================================
// Tracks user activity for idle timeout detection.
// Timeout: 1 hour idle → show expired modal.

export const SESSION_TIMEOUT_MS =
  Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS) || 60 * 60 * 1000; // 1 hour

interface SessionState {
  lastActivityAt: number; // Date.now() timestamp
  sessionExpired: boolean;
  showExpiredModal: boolean;
}

interface SessionActions {
  updateActivity: () => void;
  setSessionExpired: (expired: boolean) => void;
  openSessionExpiredModal: () => void;
  closeSessionExpiredModal: () => void;
  clearSessionState: () => void;
}

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  // ── State ──
  lastActivityAt: Date.now(),
  sessionExpired: false,
  showExpiredModal: false,

  // ── Actions ──
  updateActivity: () => set({ lastActivityAt: Date.now() }),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),
  openSessionExpiredModal: () => set({ sessionExpired: true, showExpiredModal: true }),
  closeSessionExpiredModal: () => set({ showExpiredModal: false }),
  clearSessionState: () => set({
    lastActivityAt: Date.now(),
    sessionExpired: false,
    showExpiredModal: false,
  }),
}));


// ─── Timezone Store ──────────────────────────────────────────────────────────
// Persisted via localStorage so timezone preference survives page reload.
// All dates stored as UTC; this store determines display conversion.

interface TimezoneState {
  timezone: string;
  locale: string;
  dateFormat: string;
}

interface TimezoneActions {
  setTimezone: (timezone: string) => void;
  setLocale: (locale: string) => void;
  setDateFormat: (dateFormat: string) => void;
  /** Reset to browser-detected defaults */
  resetToDefaults: () => void;
}

const getDefaultTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

const getDefaultLocale = (): string => {
  try {
    return navigator.language || 'en-US';
  } catch {
    return 'en-US';
  }
};

export const useTimezoneStore = create<TimezoneState & TimezoneActions>()(
  persist(
    (set) => ({
      // ── State ──
      timezone: getDefaultTimezone(),
      locale: getDefaultLocale(),
      dateFormat: 'DD/MM/YYYY',

      // ── Actions ──
      setTimezone: (timezone) => set({ timezone }),
      setLocale: (locale) => set({ locale }),
      setDateFormat: (dateFormat) => set({ dateFormat }),

      resetToDefaults: () =>
        set({
          timezone: getDefaultTimezone(),
          locale: getDefaultLocale(),
          dateFormat: 'DD/MM/YYYY',
        }),
    }),
    {
      name: 'al-task-timezone',
    },
  ),
);