type PushSubscriptionProxyInput = {
  backendApiUrl: string;
  cookie: string | null;
  body: string;
  fetcher?: typeof fetch;
};

export const forwardPushSubscription = async ({
  backendApiUrl,
  cookie,
  body,
  fetcher = fetch,
}: PushSubscriptionProxyInput): Promise<{ status: number }> => {
  const response = await fetcher(`${backendApiUrl.replace(/\/$/, "")}/notifications/push-subscriptions`, {
    method: "POST",
    headers: {
      ...(cookie ? { cookie } : {}),
      "content-type": "application/json",
    },
    body,
  });

  return { status: response.status };
};
