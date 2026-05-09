import { create } from 'zustand';
import type { AuthUser } from '../types/auth.types';

// ─── Auth Store ──────────────────────────────────────────────────────────────
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
  setUser: (user) =>
    set({ user, isAuthenticated: true, isLoading: false }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setInitialized: (isInitialized) =>
    set({ isInitialized, isLoading: false }),

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    }),
}));