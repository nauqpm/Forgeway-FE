import { create } from 'zustand';

// ─── Session Store ───────────────────────────────────────────────────────────
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
  updateActivity: () =>
    set({ lastActivityAt: Date.now() }),

  setSessionExpired: (sessionExpired) =>
    set({ sessionExpired }),

  openSessionExpiredModal: () =>
    set({ sessionExpired: true, showExpiredModal: true }),

  closeSessionExpiredModal: () =>
    set({ showExpiredModal: false }),

  clearSessionState: () =>
    set({
      lastActivityAt: Date.now(),
      sessionExpired: false,
      showExpiredModal: false,
    }),
}));