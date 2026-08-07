import * as assert from "node:assert/strict";

import {
  getBrowserPushRequestResult,
  getPushPermissionPromptDisplay,
  getPushPermissionPromptState,
  recordPushPermissionPromptDismissal,
  shouldShowPushPermissionPrompt,
} from "./push-permission-prompt";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const now = new Date("2026-08-07T10:00:00.000Z");
const oneDay = 24 * 60 * 60 * 1000;

assert.equal(shouldShowPushPermissionPrompt("default", { dismissCount: 0, lastShownAt: null }, now), true);
assert.equal(
  shouldShowPushPermissionPrompt(
    "default",
    { dismissCount: 3, lastShownAt: new Date(now.getTime() - 6 * oneDay).toISOString() },
    now,
  ),
  false,
);
assert.equal(
  shouldShowPushPermissionPrompt(
    "default",
    { dismissCount: 3, lastShownAt: new Date(now.getTime() - 7 * oneDay).toISOString() },
    now,
  ),
  true,
);
assert.equal(shouldShowPushPermissionPrompt("granted", { dismissCount: 0, lastShownAt: null }, now), false);
assert.equal(shouldShowPushPermissionPrompt("denied", { dismissCount: 0, lastShownAt: null }, now), false);
assert.equal(getBrowserPushRequestResult("granted"), "enabled");
assert.equal(getBrowserPushRequestResult("denied"), "denied");
assert.equal(getBrowserPushRequestResult("default"), "dismissed");
assert.equal(
  getPushPermissionPromptDisplay("default", { dismissCount: 0, lastShownAt: null }, now),
  "modal",
);
assert.equal(
  getPushPermissionPromptDisplay(
    "default",
    { dismissCount: 3, lastShownAt: new Date(now.getTime() - oneDay).toISOString() },
    now,
  ),
  "hidden",
);
assert.equal(
  getPushPermissionPromptDisplay("granted", { dismissCount: 0, lastShownAt: null }, now),
  "hidden",
);
assert.equal(
  getPushPermissionPromptDisplay("denied", { dismissCount: 0, lastShownAt: null }, now),
  "denied-banner",
);

const storage = new MemoryStorage();
recordPushPermissionPromptDismissal(storage, now);
recordPushPermissionPromptDismissal(storage, new Date(now.getTime() + oneDay));
assert.deepEqual(getPushPermissionPromptState(storage), {
  dismissCount: 2,
  lastShownAt: new Date(now.getTime() + oneDay).toISOString(),
});
