'use client';

import { create } from 'zustand';
import { chatSocketClient } from '@/lib/socket/chat.client';
import { clearTokens } from '@/modules/auth/shared/services/tokenService';
import { usePermissionStore } from '@/modules/auth/permission/stores/permissionStore';
import {
  useAuthStore,
  useSecurityStore,
  useSessionStore,
} from '@/modules/auth/shared/stores/authStore';
import {
  accountSwitcherService,
  type DeviceSwitchAccountItem,
} from '@/modules/auth/services/account-switcher.service';
import {
  extractApiError,
  extractSwitchRenewError,
} from '@/shared/utils/apiError';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  deregisterBrowserPushForLogout,
  syncExistingBrowserPush,
} from '@/modules/notifications/services/browser-push.service';

interface AccountSwitcherState {
  accounts: DeviceSwitchAccountItem[];
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  switchTo: (targetUserId: string) => Promise<void>;
  forget: (targetUserId: string) => Promise<void>;
  reset: () => void;
}

const resetClientStateForSwitch = () => {
  clearTokens();
  useAuthStore.getState().clearAuth();
  usePermissionStore.getState().clearPermissions();
  useSessionStore.getState().clearSessionState();
  useSecurityStore.getState().clearSecurityState();
  useWorkspaceStore.getState().clearWorkspace();
  chatSocketClient.disconnect();
};

export const useAccountSwitcherStore = create<AccountSwitcherState>(
  (set, get) => ({
    accounts: [],
    isLoading: false,
    isSwitching: false,
    error: null,

    async fetch() {
      set({ isLoading: true, error: null });
      try {
        const accounts = await accountSwitcherService.list();
        set({ accounts, isLoading: false });
      } catch (error) {
        set({
          isLoading: false,
          error: extractApiError(error, 'Failed to load device accounts'),
        });
      }
    },

    async switchTo(targetUserId) {
      if (get().isSwitching) return;
      set({ isSwitching: true, error: null });

      try {
        await deregisterBrowserPushForLogout();
        const result = await accountSwitcherService.switchTo(targetUserId).catch(async (error) => {
          await syncExistingBrowserPush().catch(() => undefined);
          throw error;
        });
        resetClientStateForSwitch();
        window.location.assign(result.redirectTo);
      } catch (error) {
        const renew = extractSwitchRenewError(error);
        if (renew?.redirectTo) {
          set((state) => ({
            isSwitching: false,
            accounts: state.accounts.map((account) =>
              account.userId === renew.targetUserId
                ? {
                    ...account,
                    status: 'expired',
                    provider: renew.provider ?? account.provider,
                  }
                : account,
            ),
          }));
          window.location.assign(renew.redirectTo);
          return;
        }

        set({
          isSwitching: false,
          error: extractApiError(error, 'Switch failed'),
        });
        throw error;
      }
    },

    async forget(targetUserId) {
      const previous = get().accounts;
      set({
        accounts: previous.filter((account) => account.userId !== targetUserId),
        error: null,
      });

      try {
        await accountSwitcherService.forget(targetUserId);
      } catch (error) {
        set({
          accounts: previous,
          error: extractApiError(error, 'Failed to remove account'),
        });
        throw error;
      }
    },

    reset() {
      set({ accounts: [], isLoading: false, isSwitching: false, error: null });
    },
  }),
);
