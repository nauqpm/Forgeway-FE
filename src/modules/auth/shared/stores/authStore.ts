import { create } from 'zustand';
import type {
  AuthUser,
  MfaMethod,
  MfaSetupResponse,
} from '../types/auth.types';
import { persist } from 'zustand/middleware';

// ============================================================================
// ─── AUTH STORE ─────────────────────────────────────────────────────────────
// ============================================================================
// Core authentication state. Access token is managed via httpOnly cookie by
// the backend, so we only track user info and auth status in-memory.

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True once the initial auth check (cookie validation) has completed */
  isInitialized: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // ── State ──
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  // ── Actions ──
  setUser: (user) => set({ user, isAuthenticated: true }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  clearAuth: () => set({
    user: null,
    isAuthenticated: false,
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
// Tracks lightweight security messaging for the auth flow.

interface SecurityState {
  suspendedMessage: string | null;
}

interface SecurityActions {
  setSuspendedMessage: (message: string | null) => void;
  clearSecurityState: () => void;
}

export const useSecurityStore = create<SecurityState & SecurityActions>((set) => ({
  suspendedMessage: null,
  setSuspendedMessage: (suspendedMessage) => set({ suspendedMessage }),
  clearSecurityState: () => set({ suspendedMessage: null }),
}));

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
