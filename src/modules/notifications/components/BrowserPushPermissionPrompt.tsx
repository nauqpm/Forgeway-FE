"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Modal } from "@/shared/components/ui";
import {
  getBrowserPushStatus,
  requestAndSyncBrowserPush,
} from "@/modules/notifications/services/browser-push.service";
import {
  getPushPermissionPromptDisplay,
  getPushPermissionPromptState,
  recordPushPermissionPromptDismissal,
} from "@/modules/notifications/utils/push-permission-prompt";

type PromptDisplay = "hidden" | "modal" | "denied-banner";

export default function BrowserPushPermissionPrompt() {
  const [display, setDisplay] = useState<PromptDisplay>("hidden");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refreshDisplay = useCallback(async () => {
    const status = await getBrowserPushStatus();
    if (status === "unsupported" || status === "unavailable" || status === "enabled") {
      setDisplay("hidden");
      return;
    }

    setDisplay(
      getPushPermissionPromptDisplay(
        Notification.permission,
        getPushPermissionPromptState(localStorage),
        new Date(),
      ),
    );
  }, []);

  useEffect(() => {
    void refreshDisplay().catch(() => setDisplay("hidden"));
  }, [refreshDisplay]);

  const dismiss = useCallback(() => {
    recordPushPermissionPromptDismissal(localStorage, new Date());
    setDisplay("hidden");
  }, []);

  const enable = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await requestAndSyncBrowserPush();
      if (result === "denied") setDisplay("denied-banner");
      else if (result === "dismissed") dismiss();
      else setDisplay("hidden");
    } catch {
      setError("Could not enable browser notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {display === "denied-banner" && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-[8px] border border-[#F5C6C7] bg-white p-4 text-sm shadow-float dark:border-[rgba(159,47,45,0.3)] dark:bg-[#252525]"
        >
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#9F2F2D] dark:text-[#F87171]" />
          <p className="text-[#5C302E] dark:text-[#F3C6C4]">
            Browser notifications are blocked. Change the site permission in browser settings to receive updates. {" "}
            <Link href="/settings" className="font-medium underline underline-offset-2">
              Open notification settings
            </Link>
          </p>
        </aside>
      )}

      <Modal
        open={display === "modal"}
        onClose={dismiss}
        size="sm"
        title="Stay up to date"
        description="Enable browser notifications to receive task, mention, and workspace updates when AL-TASK is not open."
        footer={
          <>
            <button
              type="button"
              onClick={dismiss}
              disabled={busy}
              className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#EAEAEA] bg-[#F9F9F8] px-3 text-[0.8125rem] font-medium text-[#111111] transition-all duration-150 hover:bg-[#F0F0EE] disabled:opacity-40 dark:border-white/10 dark:bg-[#252525] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E]"
            >
              Later
            </button>
            <button
              type="button"
              onClick={enable}
              disabled={busy}
              className="inline-flex h-8 items-center justify-center rounded-[6px] bg-[#111111] px-3 text-[0.8125rem] font-medium text-white transition-all duration-150 hover:bg-[#2F2F2F] disabled:opacity-40 dark:bg-[#E8E8E7] dark:text-[#111111] dark:hover:bg-[#D0D0CE]"
            >
              {busy ? "Enabling..." : "Enable notifications"}
            </button>
          </>
        }
      >
        {error && <p className="text-sm text-[#9F2F2D] dark:text-[#F87171]">{error}</p>}
      </Modal>
    </>
  );
}
