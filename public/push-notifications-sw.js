const safeText = (value, fallback) => (typeof value === "string" && value.trim() ? value : fallback);
const safeUrl = (value) => (typeof value === "string" && value.startsWith("/") ? value : "/");

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload = {};
      try {
        payload = event.data ? event.data.json() : {};
      } catch {
        return;
      }

      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (windows.some((client) => client.focused)) return;

      const notificationId = safeText(payload.notificationId, "");
      await self.registration.showNotification(safeText(payload.title, "AL-TASK"), {
        body: safeText(payload.message, "You have a new notification."),
        icon: "/icon.png",
        tag: safeText(payload.tag, notificationId ? `al-task:${notificationId}` : "al-task"),
        data: { notificationId, url: safeUrl(payload.url) },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const targetUrl = new URL(safeUrl(event.notification.data?.url), self.location.origin).href;
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const client = windows.find((windowClient) => new URL(windowClient.url).origin === self.location.origin);

      if (client) {
        await client.navigate(targetUrl);
        await client.focus();
        return;
      }

      await self.clients.openWindow(targetUrl);
    })(),
  );
});
