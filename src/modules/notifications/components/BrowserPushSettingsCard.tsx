"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import {
  disableBrowserPush,
  enableBrowserPush,
  getBrowserPushStatus,
  getBrowserPushStatusForRequestResult,
  type BrowserPushStatus,
} from "@/modules/notifications/services/browser-push.service";

const isAppleMobile = () =>
  typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

export default function BrowserPushSettingsCard() {
  const [status, setStatus] = useState<BrowserPushStatus>("disabled");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await getBrowserPushStatus());
    } catch {
      setStatus("disabled");
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const enable = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await enableBrowserPush();
      setStatus(getBrowserPushStatusForRequestResult(result));
    } catch {
      setError("Could not enable browser notifications. Please try again.");
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError("");
    try {
      await disableBrowserPush();
      setStatus("disabled");
    } catch {
      setError("Could not disable browser notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const description =
    status === "unsupported"
      ? "This browser does not support browser notifications."
      : status === "unavailable"
        ? "Browser notifications are not available in this environment."
        : status === "denied"
          ? "Browser permission is denied. Change it in your browser Site settings to enable notifications."
          : status === "enabled"
            ? "This browser will receive notifications when SDLC-Platform is not focused."
            : "Receive notifications when SDLC-Platform is not focused.";

  return (
    <section className="workspace-panel mb-6 rounded-[8px] border border-[#EAEAEA] bg-white dark:border-white/[0.06] dark:bg-[#252525]">
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-[#111111] dark:text-[#E8E8E7]">
        <Bell className="h-5 w-5 text-[#2563EB] dark:text-[#3B82F6]" />
        Browser notifications
      </h2>
      <p className="text-sm text-[#787774] dark:text-[#9B9A97]">{description}</p>

      {isAppleMobile() && (
        <p className="mt-3 flex gap-2 text-xs text-[#787774] dark:text-[#9B9A97]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          On iPhone or iPad, add SDLC-Platform to your Home Screen before enabling notifications.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-[#9F2F2D] dark:text-[#F87171]">{error}</p>}

      <div className="mt-4">
        {status === "enabled" ? (
          <>
            <p className="mb-3 flex items-center gap-2 text-sm text-[#346538] dark:text-[#6DB374]">
              <CheckCircle2 className="h-4 w-4" /> Enabled for this browser
            </p>
            <button
              type="button"
              onClick={disable}
              disabled={busy}
              className="rounded-[6px] border border-[#F5C6C7] px-4 py-2 text-sm font-medium text-[#9F2F2D] transition-colors hover:bg-[#FDEBEC] disabled:opacity-50 dark:border-[rgba(159,47,45,0.18)] dark:text-[#F87171] dark:hover:bg-[rgba(159,47,45,0.12)]"
            >
              {busy ? "Disabling..." : "Disable for this browser"}
            </button>
            <p className="mt-2 text-xs text-[#787774] dark:text-[#9B9A97]">
              This removes this browser from SDLC-Platform. Browser permission is controlled in Site settings.
            </p>
          </>
        ) : status === "disabled" ? (
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="rounded-[6px] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50 dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
          >
            {busy ? "Enabling..." : "Enable browser notifications"}
          </button>
        ) : status === "denied" ? (
          <p className="flex items-center gap-2 text-sm text-[#9F2F2D] dark:text-[#F87171]">
            <ShieldAlert className="h-4 w-4" /> Permission is managed by your browser.
          </p>
        ) : null}
      </div>
    </section>
  );
}
