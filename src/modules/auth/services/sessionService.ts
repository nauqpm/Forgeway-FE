// =============================================================================
// SESSION SERVICE — Active sessions management API calls
// =============================================================================

import api from '@/config/api';
import type { Session } from '../types/auth.types';

// ─── Get Active Sessions ─────────────────────────────────────────────────────

export const getSessionsAPI = async (): Promise<{ sessions: Session[] }> => {
  const response = await api.get<{ sessions: Session[] }>('/auth/sessions', {
    withCredentials: true,
  });
  return response.data;
};

// ─── Revoke a Session ────────────────────────────────────────────────────────

export const revokeSessionAPI = async (
  sessionId: string,
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `/auth/sessions/${sessionId}`,
    { withCredentials: true },
  );
  return response.data;
};

// ─── Revoke All Other Sessions ───────────────────────────────────────────────

export const revokeAllOtherSessionsAPI = async (): Promise<{
  message: string;
}> => {
  const response = await api.delete<{ message: string }>(
    '/auth/sessions/others',
    { withCredentials: true },
  );
  return response.data;
};