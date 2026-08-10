import { beforeEach, describe, expect, it, vi } from "vitest";

import { accountSwitcherService } from "@/modules/auth/services/account-switcher.service";
import {
  deregisterBrowserPushForLogout,
  syncExistingBrowserPush,
} from "@/modules/notifications/services/browser-push.service";
import { useAccountSwitcherStore } from "@/stores/account-switcher.store";

vi.mock("@/modules/notifications/services/browser-push.service", () => ({
  deregisterBrowserPushForLogout: vi.fn(),
  syncExistingBrowserPush: vi.fn(),
}));
vi.mock("@/modules/auth/services/account-switcher.service", () => ({
  accountSwitcherService: {
    list: vi.fn(),
    switchTo: vi.fn(),
    forget: vi.fn(),
  },
}));
vi.mock("@/lib/socket/chat.client", () => ({ chatSocketClient: { disconnect: vi.fn() } }));
vi.mock("@/modules/auth/shared/services/tokenService", () => ({ clearTokens: vi.fn() }));
vi.mock("@/modules/auth/permission/stores/permissionStore", () => ({
  usePermissionStore: { getState: () => ({ clearPermissions: vi.fn() }) },
}));
vi.mock("@/modules/auth/shared/stores/authStore", () => ({
  useAuthStore: { getState: () => ({ clearAuth: vi.fn() }) },
  useSecurityStore: { getState: () => ({ clearSecurityState: vi.fn() }) },
  useSessionStore: { getState: () => ({ clearSessionState: vi.fn() }) },
}));
vi.mock("@/stores/workspaceStore", () => ({
  useWorkspaceStore: { getState: () => ({ clearWorkspace: vi.fn() }) },
}));
vi.mock("@/shared/utils/apiError", () => ({
  extractApiError: () => "Switch failed",
  extractSwitchRenewError: () => null,
}));

describe("account switch push lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAccountSwitcherStore.setState({
      accounts: [],
      isLoading: false,
      isSwitching: false,
      error: null,
    });
    vi.mocked(deregisterBrowserPushForLogout).mockResolvedValue(undefined);
    vi.mocked(syncExistingBrowserPush).mockResolvedValue(undefined);
  });

  it("does not switch account context when Backend deregistration fails", async () => {
    vi.mocked(deregisterBrowserPushForLogout).mockRejectedValue(new Error("offline"));

    await expect(useAccountSwitcherStore.getState().switchTo("next-user")).rejects.toThrow("offline");

    expect(deregisterBrowserPushForLogout).toHaveBeenCalledOnce();
    expect(accountSwitcherService.switchTo).not.toHaveBeenCalled();
    expect(syncExistingBrowserPush).not.toHaveBeenCalled();
  });

  it("restores the old account binding when switching fails after deregistration", async () => {
    vi.mocked(accountSwitcherService.switchTo).mockRejectedValue(new Error("switch rejected"));

    await expect(useAccountSwitcherStore.getState().switchTo("next-user")).rejects.toThrow("switch rejected");

    expect(accountSwitcherService.switchTo).toHaveBeenCalledWith("next-user");
    expect(vi.mocked(deregisterBrowserPushForLogout).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(accountSwitcherService.switchTo).mock.invocationCallOrder[0],
    );
    expect(syncExistingBrowserPush).toHaveBeenCalledOnce();
    expect(vi.mocked(accountSwitcherService.switchTo).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(syncExistingBrowserPush).mock.invocationCallOrder[0],
    );
  });
});
