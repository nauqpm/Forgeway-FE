import { beforeEach, describe, expect, it, vi } from "vitest";

import { notificationService } from "./notification.service";
import {
  deregisterBrowserPushForLogout,
  disableBrowserPush,
  enableBrowserPush,
  getBrowserPushStatusForRequestResult,
  syncExistingBrowserPush,
} from "./browser-push.service";

vi.mock("./notification.service", () => ({
  notificationService: {
    upsertPushSubscription: vi.fn(),
    removePushSubscription: vi.fn(),
  },
}));

const endpoint = "https://push.example/subscription";
const subscription = {
  endpoint,
  unsubscribe: vi.fn(),
  toJSON: () => ({
    endpoint,
    expirationTime: null,
    keys: { p256dh: "p256dh", auth: "auth" },
  }),
} as unknown as PushSubscription;

const subscribe = vi.fn();
const getSubscription = vi.fn();
const registration = {
  pushManager: { getSubscription, subscribe },
} as unknown as ServiceWorkerRegistration;

const serviceWorker = {
  getRegistration: vi.fn(),
  register: vi.fn(),
  ready: Promise.resolve(registration),
};

const setPermission = (permission: NotificationPermission) => {
  vi.stubGlobal("Notification", {
    permission,
    requestPermission: vi.fn(),
  });
};

describe("browser push lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_WEB_PUSH_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "AQAB");
    vi.stubGlobal("PushManager", class PushManager {});
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: serviceWorker,
    });
    setPermission("granted");
    getSubscription.mockResolvedValue(subscription);
    serviceWorker.getRegistration.mockResolvedValue(registration);
    subscription.unsubscribe = vi.fn().mockResolvedValue(true);
    vi.mocked(notificationService.upsertPushSubscription).mockResolvedValue(undefined);
    vi.mocked(notificationService.removePushSubscription).mockResolvedValue(undefined);
  });

  it("syncs an existing subscription without creating one", async () => {
    await syncExistingBrowserPush();

    expect(serviceWorker.register).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
    expect(notificationService.upsertPushSubscription).toHaveBeenCalledWith({
      endpoint,
      expirationTime: null,
      keys: { p256dh: "p256dh", auth: "auth" },
    });
  });

  it("does nothing when background sync finds no subscription", async () => {
    getSubscription.mockResolvedValue(null);

    await syncExistingBrowserPush();

    expect(subscribe).not.toHaveBeenCalled();
    expect(notificationService.upsertPushSubscription).not.toHaveBeenCalled();
  });

  it("explicit enable is the only lifecycle path that creates a subscription", async () => {
    getSubscription.mockResolvedValue(null);
    subscribe.mockResolvedValue(subscription);

    await expect(enableBrowserPush()).resolves.toBe("enabled");

    expect(serviceWorker.register).toHaveBeenCalledWith("/push-notifications-sw.js", { scope: "/" });
    expect(subscribe).toHaveBeenCalledOnce();
    expect(notificationService.upsertPushSubscription).toHaveBeenCalledOnce();
  });

  it("treats a dismissed permission request as retryable without subscribing", async () => {
    setPermission("default");
    vi.mocked(Notification.requestPermission).mockResolvedValue("default");

    await expect(enableBrowserPush()).resolves.toBe("dismissed");

    expect(serviceWorker.register).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("maps a dismissed permission request to the retryable disabled status", () => {
    expect(getBrowserPushStatusForRequestResult("dismissed")).toBe("disabled");
  });

  it("unsubscribes in the browser before best-effort Backend removal", async () => {
    vi.mocked(notificationService.removePushSubscription).mockRejectedValue(new Error("offline"));

    await expect(disableBrowserPush()).resolves.toBeUndefined();

    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
    expect(notificationService.removePushSubscription).toHaveBeenCalledWith(endpoint);
    expect(vi.mocked(subscription.unsubscribe).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(notificationService.removePushSubscription).mock.invocationCallOrder[0],
    );
  });

  it("logout removes only the Backend binding", async () => {
    await deregisterBrowserPushForLogout();

    expect(subscription.unsubscribe).not.toHaveBeenCalled();
    expect(notificationService.removePushSubscription).toHaveBeenCalledWith(endpoint);
  });
});
