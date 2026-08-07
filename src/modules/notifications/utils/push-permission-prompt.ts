export interface PushPermissionPromptState {
  dismissCount: number;
  lastShownAt: string | null;
}

export type BrowserPushRequestResult = "enabled" | "denied" | "dismissed" | "unsupported";

type PromptStorage = Pick<Storage, "getItem" | "setItem">;

const STORAGE_KEY = "al-task.push-permission-prompt";
const REMINDER_DELAY_MS = 7 * 24 * 60 * 60 * 1000;
const initialState: PushPermissionPromptState = { dismissCount: 0, lastShownAt: null };

export const getBrowserPushRequestResult = (permission: NotificationPermission): BrowserPushRequestResult => {
  if (permission === "granted") return "enabled";
  return permission === "denied" ? "denied" : "dismissed";
};

export const getPushPermissionPromptState = (storage: Pick<Storage, "getItem">): PushPermissionPromptState => {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return initialState;

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
