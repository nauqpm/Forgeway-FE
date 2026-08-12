import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/../app/api/push-subscriptions/route";
import { forwardPushSubscription } from "./push-subscription-proxy";

describe("push subscription proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards only the cookie and exact JSON body to the Backend", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("ignored", { status: 201 }));
    const body = '{"endpoint":"https://push.example/subscription","keys":{"p256dh":"p","auth":"a"}}';

    const result = await forwardPushSubscription({
      backendApiUrl: "https://api.example/",
      cookie: "session=abc",
      body,
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith("https://api.example/notifications/push-subscriptions", {
      method: "POST",
      headers: { cookie: "session=abc", "content-type": "application/json" },
      body,
    });
    expect(result.status).toBe(201);
  });

  it("rejects non-POST requests", async () => {
    expect((await POST(new Request("https://app.example/api/push-subscriptions", { method: "GET" }))).status).toBe(405);
  });

  it("rejects JSON that is not an object", async () => {
    vi.stubEnv("BACKEND_API_URL", "https://api.example");

    expect(
      (await POST(
        new Request("https://app.example/api/push-subscriptions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "[]",
        }),
      )).status,
    ).toBe(400);
  });

  it("returns 503 when no Backend API URL is configured", async () => {
    vi.stubEnv("BACKEND_API_URL", "");

    expect(
      (await POST(
        new Request("https://app.example/api/push-subscriptions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
      )).status,
    ).toBe(503);
  });

  it("forwards the Backend status without a response body", async () => {
    vi.stubEnv("BACKEND_API_URL", "https://api.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Backend body", { status: 201 })));

    const response = await POST(
      new Request("https://app.example/api/push-subscriptions", {
        method: "POST",
        headers: { cookie: "session=abc", "content-type": "application/json" },
        body: '{"endpoint":"https://push.example/subscription"}',
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.text()).resolves.toBe("");
  });
});
