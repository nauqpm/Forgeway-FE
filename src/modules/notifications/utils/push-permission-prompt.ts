export interface PushPermissionPromptState {
  dismissCount: number;
  lastShownAt: string | null;
}

export type BrowserPushRequestResult = "enabled" | "denied" | "dismissed" | "unsupported";

type PromptStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const STORAGE_KEY = "sdlc-platform.push-permission-prompt";
const LEGACY_STORAGE_KEY = "al-task.push-permission-prompt";
const REMINDER_DELAY_MS = 7 * 24 * 60 * 60 * 1000;
const initialState: PushPermissionPromptState = { dismissCount: 0, lastShownAt: null };

export const getBrowserPushRequestResult = (permission: NotificationPermission): BrowserPushRequestResult => {
  if (permission === "granted") return "enabled";
  return permission === "denied" ? "denied" : "dismissed";
};

export const getPushPermissionPromptState = (storage: PromptStorage): PushPermissionPromptState => {
  let stored: string | null;
  try {
    stored = storage.getItem(STORAGE_KEY);
    if (!stored) {
      stored = storage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        try {
          storage.setItem(STORAGE_KEY, stored);
          storage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          // Keep reading the legacy value; it remains available for a later migration attempt.
        }
      }
    }
  } catch {
    return initialState;
  }

  if (!stored) return initialState;

  try {
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== "object") return initialState;

    const { dismissCount, lastShownAt } = value as Record<string, unknown>;
    return {
      dismissCount: typeof dismissCount === "number" && dismissCount >= 0 ? dismissCount : 0,
      lastShownAt: typeof lastShownAt === "string" && !Number.isNaN(Date.parse(lastShownAt)) ? lastShownAt : null,
    };
  } catch {
    return initialState;
  }
};

export const shouldShowPushPermissionPrompt = (
  permission: NotificationPermission,
  state: PushPermissionPromptState,
  now: Date,
) => {
  if (permission !== "default") return false;
  if (state.dismissCount < 3 || !state.lastShownAt) return true;

  return now.getTime() - Date.parse(state.lastShownAt) >= REMINDER_DELAY_MS;
};

export const getPushPermissionPromptDisplay = (
  permission: NotificationPermission,
  state: PushPermissionPromptState,
  now: Date,
) => {
  if (permission === "denied") return "denied-banner";
  return shouldShowPushPermissionPrompt(permission, state, now) ? "modal" : "hidden";
};

export const recordPushPermissionPromptDismissal = (storage: PromptStorage, now: Date) => {
  const state = getPushPermissionPromptState(storage);
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({ dismissCount: state.dismissCount + 1, lastShownAt: now.toISOString() }),
  );
};
