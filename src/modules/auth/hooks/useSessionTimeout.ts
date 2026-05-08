'use client';

// =============================================================================
// useSessionTimeout HOOK — Idle detection + auto token refresh
// =============================================================================
// - Listens to user activity (mouse, keyboard, touch, scroll)
// - Shows session expired modal after 1 hour of inactivity
// - Auto-refreshes token at 75% of its lifetime

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore, SESSION_TIMEOUT_MS } from '../stores/sessionStore';
import { refreshTokenAPI, TOKEN_REFRESH_INTERVAL_MS } from '../services/tokenService';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'] as const;
const ACTIVITY_THROTTLE_MS = 30_000; // Only update activity every 30s to reduce noise

export const useSessionTimeout = () => {
  const { isAuthenticated } = useAuthStore();
  const { lastActivityAt, updateActivity, openSessionExpiredModal } = useSessionStore();

  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastThrottleRef = useRef<number>(0);

  // ─── Throttled Activity Handler ────────────────────────────────────────────

  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottleRef.current > ACTIVITY_THROTTLE_MS) {
      lastThrottleRef.current = now;
      updateActivity();
    }
  }, [updateActivity]);

  // ─── Idle Check ────────────────────────────────────────────────────────────

  const checkIdle = useCallback(() => {
    const idle = Date.now() - lastActivityAt;
    if (idle >= SESSION_TIMEOUT_MS) {
      openSessionExpiredModal();
    }
  }, [lastActivityAt, openSessionExpiredModal]);

  // ─── Silent Token Refresh ──────────────────────────────────────────────────

  const silentRefresh = useCallback(async () => {
    try {
      await refreshTokenAPI();
    } catch {
      // Refresh failed — interceptor will handle 401
    }
  }, []);

  // ─── Setup / Teardown ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for user activity
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true }),
    );

    // Check idle every minute
    idleTimerRef.current = setInterval(checkIdle, 60_000);

    // Refresh token periodically (default: every 4 minutes)
    refreshTimerRef.current = setInterval(silentRefresh, TOKEN_REFRESH_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleActivity),
      );
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [isAuthenticated, handleActivity, checkIdle, silentRefresh]);
};