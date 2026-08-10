import { describe, expect, it } from "vitest";

import {
  getBrowserPushRequestResult,
  getPushPermissionPromptDisplay,
  getPushPermissionPromptState,
  recordPushPermissionPromptDismissal,
  shouldShowPushPermissionPrompt,
} from "./push-permission-prompt";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  constructor(initialValues: Record<string, string> = {}) {
    Object.entries(initialValues).forEach(([key, value]) => this.values.set(key, value));
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const now = new Date("2026-08-07T10:00:00.000Z");
const oneDay = 24 * 60 * 60 * 1000;

describe("push permission reminder", () => {
  it("preserves the three-dismissal seven-day reminder policy", () => {
    expect(shouldShowPushPermissionPrompt("default", { dismissCount: 0, lastShownAt: null }, now)).toBe(true);
    expect(
      shouldShowPushPermissionPrompt(
        "default",
        { dismissCount: 3, lastShownAt: new Date(now.getTime() - 6 * oneDay).toISOString() },
        now,
      ),
    ).toBe(false);
    expect(
      shouldShowPushPermissionPrompt(
        "default",
        { dismissCount: 3, lastShownAt: new Date(now.getTime() - 7 * oneDay).toISOString() },
        now,
      ),
    ).toBe(true);
    expect(shouldShowPushPermissionPrompt("granted", { dismissCount: 0, lastShownAt: null }, now)).toBe(false);
    expect(shouldShowPushPermissionPrompt("denied", { dismissCount: 0, lastShownAt: null }, now)).toBe(false);
  });

  it("maps native permissions to request results", () => {
    expect(getBrowserPushRequestResult("granted")).toBe("enabled");
    expect(getBrowserPushRequestResult("denied")).toBe("denied");
    expect(getBrowserPushRequestResult("default")).toBe("dismissed");
  });

  it("selects modal, hidden, and denied reminder displays", () => {
    expect(getPushPermissionPromptDisplay("default", { dismissCount: 0, lastShownAt: null }, now)).toBe("modal");
    expect(
      getPushPermissionPromptDisplay(
        "default",
        { dismissCount: 3, lastShownAt: new Date(now.getTime() - oneDay).toISOString() },
        now,
      ),
    ).toBe("hidden");
    expect(getPushPermissionPromptDisplay("granted", { dismissCount: 0, lastShownAt: null }, now)).toBe("hidden");
    expect(getPushPermissionPromptDisplay("denied", { dismissCount: 0, lastShownAt: null }, now)).toBe(
      "denied-banner",
    );
  });

  it("records dismissals", () => {
    const storage = new MemoryStorage();
    recordPushPermissionPromptDismissal(storage, now);
    recordPushPermissionPromptDismissal(storage, new Date(now.getTime() + oneDay));

    expect(getPushPermissionPromptState(storage)).toEqual({
      dismissCount: 2,
      lastShownAt: new Date(now.getTime() + oneDay).toISOString(),
    });
  });

  it("migrates a recent legacy reminder without re-showing the modal", () => {
    const legacyValue = JSON.stringify({
      dismissCount: 3,
      lastShownAt: new Date(now.getTime() - oneDay).toISOString(),
    });
    const storage = new MemoryStorage({ "al-task.push-permission-prompt": legacyValue });

    const state = getPushPermissionPromptState(storage);

    expect(getPushPermissionPromptDisplay("default", state, now)).toBe("hidden");
    expect(storage.getItem("sdlc-platform.push-permission-prompt")).toBe(legacyValue);
    expect(storage.getItem("al-task.push-permission-prompt")).toBeNull();
  });

  it("keeps using legacy reminder state when the new-key write fails", () => {
    const legacyValue = JSON.stringify({
      dismissCount: 3,
      lastShownAt: new Date(now.getTime() - oneDay).toISOString(),
    });
    const storage = new MemoryStorage({ "al-task.push-permission-prompt": legacyValue });
    storage.setItem = () => {
      throw new Error("quota exceeded");
    };

    const state = getPushPermissionPromptState(storage);

    expect(getPushPermissionPromptDisplay("default", state, now)).toBe("hidden");
    expect(storage.getItem("al-task.push-permission-prompt")).toBe(legacyValue);
  });
});
