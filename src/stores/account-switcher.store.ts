"use client";

import { create } from "zustand";
import { accountSwitcherService, type SavedAccount } from "@/modules/auth/services/account-switcher.service";
import { recentLoginsService } from "@/modules/auth/services/recent-logins.service";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface AccountSwitcherState {
  /** Accounts saved under the *current owner* (via AccountSwitcherService). Multi-account switch. */
  accounts: SavedAccount[];
  /** Accounts that have logged in on this device (via recent_logins). Independent of owner. */
  recentAccounts: SavedAccount[];
  isLoading: boolean;
  /** Set while a switch request is in flight to prevent double-clicks */
  isSwitching: boolean;
  error: string | null;
}

interface AccountSwitcherActions {
  /** Loads both saved (owner-scoped) and recent (device-scoped) accounts in one shot. */
  fetch: () => Promise<void>;
  switchTo: (accountId: string) => Promise<void>;
  forget: (accountId: string) => Promise<void>;
  forgetRecent: (accountId: string) => Promise<void>;
  reset: () => void;
}

export const useAccountSwitcherStore = create<
  AccountSwitcherState & AccountSwitcherActions
>((set, get) => ({
  accounts: [],
  recentAccounts: [],
  isLoading: false,
  isSwitching: false,
  error: null,

  async fetch() {
    set({ isLoading: true, error: null });
    try {
      // Gộp 2 nguồn song song để giảm round-trip. Lỗi của 1 nguồn không chặn nguồn còn lại.
      const [savedResult, recentResult] = await Promise.allSettled([
        accountSwitcherService.list(),
        recentLoginsService.list(),
      ]);

      const accounts =
        savedResult.status === "fulfilled" ? savedResult.value : [];
      const recentAccounts =
        recentResult.status === "fulfilled" ? recentResult.value : [];

      set({ accounts, recentAccounts, isLoading: false });

      if (savedResult.status === "rejected") {
        set({ error: "Không tải được danh sách account đã lưu." });
      }
      if (recentResult.status === "rejected") {
        // Ghi đè error chỉ khi saved thành công
        if (savedResult.status === "fulfilled") {
          set({ error: "Không tải được danh sách account gần đây." });
        }
      }
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : "Failed to load accounts",
      });
    }
  },

  async switchTo(accountId) {
    if (get().isSwitching) return;
    set({ isSwitching: true, error: null });
    try {
      await accountSwitcherService.switchTo(accountId);
      // Reload the page so every in-memory store re-initialises with the new identity.
      // This is the safest reset path: a hard refresh clears any per-user cached state.
      if (typeof window !== "undefined") {
        // Clear workspace selection so the new account defaults to its first workspace on reload.
        useWorkspaceStore.getState().clearWorkspace();
        window.location.assign("/");
      }
    } catch (e) {
      set({
        isSwitching: false,
        error: e instanceof Error ? e.message : "Switch failed",
      });
      throw e;
    }
  },

  async forget(accountId) {
    const prev = get().accounts;
    // Optimistic remove
    set({ accounts: prev.filter((a) => a.accountId !== accountId) });
    try {
      await accountSwitcherService.forget(accountId);
    } catch (e) {
      // Roll back
      set({ accounts: prev, error: e instanceof Error ? e.message : "Failed" });
      throw e;
    }
  },

  async forgetRecent(accountId) {
    const prev = get().recentAccounts;
    set({
      recentAccounts: prev.filter((a) => a.accountId !== accountId),
    });
    try {
      await recentLoginsService.forget(accountId);
    } catch (e) {
      set({
        recentAccounts: prev,
        error: e instanceof Error ? e.message : "Failed",
      });
      throw e;
    }
  },

  reset() {
    set({
      accounts: [],
      recentAccounts: [],
      isLoading: false,
      isSwitching: false,
      error: null,
    });
  },
}));
