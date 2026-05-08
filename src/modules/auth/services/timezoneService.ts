// =============================================================================
// TIMEZONE SERVICE — User timezone preference API calls
// =============================================================================

import api from '@/config/api';
import type { TimezonePreference } from '../types/auth.types';

// ─── Update Timezone ─────────────────────────────────────────────────────────

export const updateTimezoneAPI = async (
  data: TimezonePreference,
): Promise<{ message: string }> => {
  const response = await api.patch<{ message: string }>(
    '/users/me/timezone',
    data,
    { withCredentials: true },
  );
  return response.data;
};

// ─── Get Timezone ────────────────────────────────────────────────────────────

export const getTimezoneAPI = async (): Promise<TimezonePreference> => {
  const response = await api.get<TimezonePreference>('/users/me/timezone', {
    withCredentials: true,
  });
  return response.data;
};
