import { buildPushServiceWorkerScript } from "@/modules/notifications/utils/service-worker-script";

export const dynamic = "force-dynamic";

export function GET(): Response {
  const vapidPublicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return new Response(null, { status: 503 });

  return new Response(buildPushServiceWorkerScript(vapidPublicKey), {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
