import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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