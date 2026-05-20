'use client';

// =============================================================================
// useTimezone HOOK — Timezone conversion and formatting utilities
// =============================================================================
// All dates stored as UTC. This hook converts for display using user's preference.

import { useCallback } from 'react';
import { useTimezoneStore } from '../../shared/stores/authStore';
import { updateTimezoneAPI } from '../services/sessionService';

export const useTimezone = () => {
  const { timezone, locale, dateFormat, setTimezone, setLocale, setDateFormat } =
    useTimezoneStore();

  // ─── Format DateTime ───────────────────────────────────────────────────────
  // Converts a UTC date string/Date to the user's timezone and locale.

  const formatDateTime = useCallback(
    (
      utcDate: string | Date,
      options?: Intl.DateTimeFormatOptions,
    ): string => {
      try {
        const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
        const defaultOptions: Intl.DateTimeFormatOptions = {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          ...options,
        };
        return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
      } catch {
        return String(utcDate);
      }
    },
    [timezone, locale],
  );

  // ─── Format Date Only ──────────────────────────────────────────────────────

  const formatDate = useCallback(
    (utcDate: string | Date): string => {
      return formatDateTime(utcDate, {
        hour: undefined,
        minute: undefined,
        second: undefined,
      });
    },
    [formatDateTime],
  );

  // ─── Format Time Only ──────────────────────────────────────────────────────

  const formatTime = useCallback(
    (utcDate: string | Date): string => {
      try {
        const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
        return new Intl.DateTimeFormat(locale, {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      } catch {
        return String(utcDate);
      }
    },
    [timezone, locale],
  );

  // ─── Relative Time ─────────────────────────────────────────────────────────
  // "2 giờ trước", "vừa xong", "3 ngày trước"

  const formatRelative = useCallback(
    (utcDate: string | Date): string => {
      try {
        const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

        if (diffSec < 60) return rtf.format(-diffSec, 'second');
        if (diffMin < 60) return rtf.format(-diffMin, 'minute');
        if (diffHour < 24) return rtf.format(-diffHour, 'hour');
        if (diffDay < 30) return rtf.format(-diffDay, 'day');
        return formatDateTime(utcDate);
      } catch {
        return String(utcDate);
      }
    },
    [locale, formatDateTime],
  );

  // ─── Update Timezone (persist to API + store) ──────────────────────────────

  const updateTimezone = useCallback(
    async (tz: string) => {
      setTimezone(tz);
      try {
        await updateTimezoneAPI({ timezone: tz, locale, dateFormat });
      } catch {
        // Store is already updated; API sync is best-effort
      }
    },
    [locale, dateFormat, setTimezone],
  );

  // ─── Update Locale ─────────────────────────────────────────────────────────

  const updateLocale = useCallback(
    async (loc: string) => {
      setLocale(loc);
      try {
        await updateTimezoneAPI({ timezone, locale: loc, dateFormat });
      } catch {
        // Best-effort
      }
    },
    [timezone, dateFormat, setLocale],
  );

  return {
    timezone,
    locale,
    dateFormat,
    formatDateTime,
    formatDate,
    formatTime,
    formatRelative,
    updateTimezone,
    updateLocale,
    setDateFormat,
  };
};