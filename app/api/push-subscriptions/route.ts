import { forwardPushSubscription } from "@/modules/notifications/server/push-subscription-proxy";

const isObjectJson = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function POST(request: Request): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { allow: "POST" } });

  const backendApiUrl = process.env.BACKEND_API_URL;
  if (!backendApiUrl) return new Response(null, { status: 503 });

  const body = await request.text();
  try {
    if (!isObjectJson(JSON.parse(body))) return new Response(null, { status: 400 });
  } catch {
    return new Response(null, { status: 400 });
  }

  const { status } = await forwardPushSubscription({
    backendApiUrl,
    cookie: request.headers.get("cookie"),
    body,
  });
  return new Response(null, { status });
}
