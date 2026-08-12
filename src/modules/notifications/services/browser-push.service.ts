import {
  notificationService,
  type PushSubscriptionInput,
} from "./notification.service";
import {
  getBrowserPushRequestResult,
  type BrowserPushRequestResult,
} from "../utils/push-permission-prompt";

export type BrowserPushStatus = "unsupported" | "unavailable" | "denied" | "enabled" | "disabled";
export type { BrowserPushRequestResult } from "../utils/push-permission-prompt";

const isFeatureEnabled = () =>
  process.env.NEXT_PUBLIC_WEB_PUSH_ENABLED === "true" && Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

export const isBrowserPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

const urlBase64ToUint8Array = (value: string) => {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = window.atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
};

const toSubscriptionInput = (subscription: PushSubscription): PushSubscriptionInput => {
  const { endpoint, expirationTime, keys } = subscription.toJSON();
  if (!endpoint || !keys?.p256dh || !keys.auth) {
    throw new Error("The browser returned an incomplete push subscription.");
  }

  return { endpoint, expirationTime, keys: { p256dh: keys.p256dh, auth: keys.auth } };
};

const getServiceWorkerRegistrationForEnable = async () => {
  await navigator.serviceWorker.register("/push-notifications-sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
};

const getExistingSubscription = async () => {
  const registration = await navigator.serviceWorker.getRegistration("/");
  return (await registration?.pushManager.getSubscription()) ?? null;
};

const createSubscriptionIfMissing = async () => {
  const registration = await getServiceWorkerRegistrationForEnable();
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) throw new Error("Browser notifications are not configured.");

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
};

const syncSubscription = async (subscription: PushSubscription) => {
  await notificationService.upsertPushSubscription(toSubscriptionInput(subscription));
};

export const getBrowserPushStatusForRequestResult = (
  result: BrowserPushRequestResult,
): BrowserPushStatus => {
  if (result === "enabled" || result === "denied" || result === "unsupported") return result;
  return "disabled";
};

export const getBrowserPushStatus = async (): Promise<BrowserPushStatus> => {
  if (!isBrowserPushSupported()) return "unsupported";
  if (!isFeatureEnabled()) return "unavailable";
  if (Notification.permission === "denied") return "denied";

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? "enabled" : "disabled";
};

export const enableBrowserPush = async (): Promise<BrowserPushRequestResult> => {
  if (!isBrowserPushSupported() || !isFeatureEnabled()) return "unsupported";

  const permission =
    Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  const result = getBrowserPushRequestResult(permission);
  if (result !== "enabled") return result;

  const subscription = await createSubscriptionIfMissing();
  await syncSubscription(subscription);
  return "enabled";
};

export const syncExistingBrowserPush = async (): Promise<void> => {
  if (!isBrowserPushSupported() || !isFeatureEnabled() || Notification.permission !== "granted") return;
  const subscription = await getExistingSubscription();
  if (subscription) await syncSubscription(subscription);
};

export const disableBrowserPush = async (): Promise<void> => {
  if (!isBrowserPushSupported()) return;

  const subscription = await getExistingSubscription();
  if (!subscription) return;

  await notificationService.removePushSubscription(subscription.endpoint);
  await subscription.unsubscribe();
};

export const deregisterBrowserPushForLogout = async (): Promise<void> => {
  if (!isBrowserPushSupported()) return;

  const subscription = await getExistingSubscription();
  if (subscription) await notificationService.removePushSubscription(subscription.endpoint);
};
