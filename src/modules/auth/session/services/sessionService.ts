// =============================================================================
// SESSION SERVICE — Active sessions management API calls
// =============================================================================

import api from "@/lib/axiosIns";
import type { Session } from "../../shared/types/auth.types";
import type { TimezonePreference } from "../../shared/types/auth.types";

// ─── Get Active Sessions ─────────────────────────────────────────────────────

export const getSessionsAPI = async (): Promise<{ sessions: Session[] }> => {
  const response = await api.get<{ sessions: Session[] }>("/auth/sessions", {
    withCredentials: true,
  });
  return response.data;
};

// ─── Revoke a Session ────────────────────────────────────────────────────────

export const revokeSessionAPI = async (sessionId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/auth/sessions/${sessionId}`, { withCredentials: true });
  return response.data;
};

// ─── Revoke All Other Sessions ───────────────────────────────────────────────

export const revokeAllOtherSessionsAPI = async (): Promise<{
  message: string;
}> => {
  const response = await api.delete<{ message: string }>("/auth/sessions/others", { withCredentials: true });
  return response.data;
};

// =============================================================================
// TIMEZONE SERVICE — User timezone preference API calls
// =============================================================================

// ─── Update Timezone ─────────────────────────────────────────────────────────

export const updateTimezoneAPI = async (data: TimezonePreference): Promise<{ message: string }> => {
  const response = await api.patch<{ message: string }>("/users/me/timezone", data, { withCredentials: true });
  return response.data;
};

// ─── Get Timezone ────────────────────────────────────────────────────────────

export const getTimezoneAPI = async (): Promise<TimezonePreference> => {
  const response = await api.get<TimezonePreference>("/users/me/timezone", {
    withCredentials: true,
  });
  return response.data;
};
