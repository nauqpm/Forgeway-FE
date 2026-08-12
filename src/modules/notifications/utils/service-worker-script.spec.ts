import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/../app/push-notifications-sw.js/route";
import { buildPushServiceWorkerScript } from "./service-worker-script";

type EventListener = (event: { waitUntil: (promise: Promise<unknown>) => void; [key: string]: unknown }) => void;

const installWorker = (vapidPublicKey = "public-vapid-key") => {
  const listeners = new Map<string, EventListener>();
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const subscribe = vi.fn();
  const clients = {
    matchAll: vi.fn(),
    openWindow: vi.fn().mockResolvedValue(undefined),
  };

  vi.stubGlobal("self", {
    addEventListener: (name: string, listener: EventListener) => listeners.set(name, listener),
    clients,
    location: { origin: "https://app.example" },
    registration: { showNotification, pushManager: { subscribe } },
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 201 })));

  new Function(buildPushServiceWorkerScript(vapidPublicKey))();

  return { clients, listeners, showNotification, subscribe };
};

const dispatch = async (listener: EventListener, event: Record<string, unknown>) => {
  let pending: Promise<unknown> | undefined;
  listener({ ...event, waitUntil: (promise) => (pending = promise) });
  await pending;
};

describe("buildPushServiceWorkerScript", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("renews a subscription and posts its JSON through the authenticated proxy", async () => {
    const { listeners, subscribe } = installWorker("public-vapid-key");
    const subscription = { toJSON: () => ({ endpoint: "https://push.example/new", keys: { auth: "a", p256dh: "p" } }) };
    subscribe.mockResolvedValue(subscription);

    await dispatch(listeners.get("pushsubscriptionchange")!, {});

    expect(subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: expect.any(Uint8Array) });
    expect(fetch).toHaveBeenCalledWith("/api/push-subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(subscription.toJSON()),
    });
  });

  it("rejects renewal when the authenticated proxy returns a non-success response", async () => {
    const { listeners, subscribe } = installWorker("public-vapid-key");
    subscribe.mockResolvedValue({
      toJSON: () => ({ endpoint: "https://push.example/new", keys: { auth: "a", p256dh: "p" } }),
    });
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 503 }));

    await expect(dispatch(listeners.get("pushsubscriptionchange")!, {})).rejects.toThrow(
      "Push subscription renewal failed",
    );

    expect(buildPushServiceWorkerScript("public-vapid-key")).toContain("if (!response.ok)");
  });

  it("uses SDLC-Platform fallbacks and exposes no private VAPID material", async () => {
    const { clients, listeners, showNotification } = installWorker("public-vapid-key");
    clients.matchAll.mockResolvedValue([]);

    await dispatch(listeners.get("push")!, { data: null });

    expect(showNotification).toHaveBeenCalledWith("SDLC-Platform", {
      body: "You have a new notification.",
      icon: "/icon.png",
      tag: "sdlc-platform",
      data: { notificationId: "", url: "/" },
    });
    expect(buildPushServiceWorkerScript("public-vapid-key")).not.toContain("private-vapid-key");
  });

  it("uses fallback notification content when a valid push payload is null", async () => {
    const { clients, listeners, showNotification } = installWorker();
    clients.matchAll.mockResolvedValue([]);

    await dispatch(listeners.get("push")!, { data: { json: () => null } });

    expect(showNotification).toHaveBeenCalledWith(
      "SDLC-Platform",
      expect.objectContaining({ tag: "sdlc-platform", data: { notificationId: "", url: "/" } }),
    );
  });

  it("focuses only an exact target URL and otherwise opens a new window", async () => {
    const { clients, listeners } = installWorker();
    const exactClient = { url: "https://app.example/tasks/123", focus: vi.fn().mockResolvedValue(undefined) };
    const otherClient = {
      url: "https://app.example/workspaces/NFC1",
      focus: vi.fn().mockResolvedValue(undefined),
      navigate: vi.fn(),
    };
    clients.matchAll.mockResolvedValue([otherClient, exactClient]);

    await dispatch(listeners.get("notificationclick")!, {
      notification: { close: vi.fn(), data: { url: "/tasks/123" } },
    });

    expect(exactClient.focus).toHaveBeenCalledOnce();
    expect(otherClient.navigate).not.toHaveBeenCalled();
    expect(clients.openWindow).not.toHaveBeenCalled();
    expect(clients.matchAll).toHaveBeenLastCalledWith({ type: "window" });

    clients.matchAll.mockResolvedValue([otherClient]);
    await dispatch(listeners.get("notificationclick")!, {
      notification: { close: vi.fn(), data: { url: "/tasks/456" } },
    });

    expect(otherClient.focus).not.toHaveBeenCalled();
    expect(clients.openWindow).toHaveBeenCalledWith("https://app.example/tasks/456");
    expect(clients.matchAll).toHaveBeenLastCalledWith({ type: "window" });
  });

  it("does not open a protocol-relative notification URL outside the app origin", async () => {
    const { clients, listeners } = installWorker();
    clients.matchAll.mockResolvedValue([]);

    await dispatch(listeners.get("notificationclick")!, {
      notification: { close: vi.fn(), data: { url: "//attacker.example" } },
    });

    expect(clients.openWindow).toHaveBeenCalledWith("https://app.example/");
  });

  it("returns a no-store JavaScript worker only when the public VAPID key exists", async () => {
    vi.stubEnv("WEB_PUSH_VAPID_PUBLIC_KEY", "public-vapid-key");

    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/javascript; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.text()).resolves.toContain("public-vapid-key");

    vi.stubEnv("WEB_PUSH_VAPID_PUBLIC_KEY", "");
    expect(GET().status).toBe(503);
  });
});
