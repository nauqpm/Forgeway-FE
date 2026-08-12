export const buildPushServiceWorkerScript = (vapidPublicKey: string): string => {
  const encodedVapidPublicKey = JSON.stringify(vapidPublicKey);

  return `
const vapidPublicKey = ${encodedVapidPublicKey};
const safeText = (value, fallback) => (typeof value === "string" && value.trim() ? value : fallback);
const safeUrl = (value) => (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/");
const urlBase64ToUint8Array = (value) => {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
};

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload = {};
      try {
        const parsedPayload = event.data ? event.data.json() : {};
        payload = parsedPayload && typeof parsedPayload === "object" ? parsedPayload : {};
      } catch {
        payload = {};
      }

      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (windows.some((client) => client.focused)) return;

      const notificationId = safeText(payload.notificationId, "");
      await self.registration.showNotification(safeText(payload.title, "SDLC-Platform"), {
        body: safeText(payload.message, "You have a new notification."),
        icon: "/icon.png",
        tag: safeText(payload.tag, notificationId ? "sdlc-platform:" + notificationId : "sdlc-platform"),
        data: { notificationId, url: safeUrl(payload.url) },
      });
    })(),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(subscription.toJSON()),
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const targetUrl = new URL(safeUrl(event.notification.data?.url), self.location.origin).href;
      const windows = await self.clients.matchAll({ type: "window" });
      const client = windows.find((windowClient) => windowClient.url === targetUrl);

      if (client) {
        await client.focus();
        return;
      }

      await self.clients.openWindow(targetUrl);
    })(),
  );
});
`;
};
