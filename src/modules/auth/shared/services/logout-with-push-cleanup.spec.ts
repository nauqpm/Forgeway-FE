import { describe, expect, it, vi } from "vitest";

import {
  createLogoutWithPushCleanupCallbacks,
  logoutWithPushCleanup,
  SECURE_LOGOUT_FAILURE_MESSAGE,
} from "./logout-with-push-cleanup";

describe("logoutWithPushCleanup", () => {
  it("does not call the logout API when Browser Push deregistration fails", async () => {
    const deregisterBrowserPush = vi.fn().mockRejectedValue(new Error("offline"));
    const logout = vi.fn().mockResolvedValue({ message: "signed out" });

    await expect(logoutWithPushCleanup(deregisterBrowserPush, logout)).rejects.toThrow("offline");

    expect(deregisterBrowserPush).toHaveBeenCalledOnce();
    expect(logout).not.toHaveBeenCalled();
  });

  it("deregisters Browser Push before calling the logout API", async () => {
    const deregisterBrowserPush = vi.fn().mockResolvedValue(undefined);
    const logout = vi.fn().mockResolvedValue({ message: "signed out" });

    await expect(logoutWithPushCleanup(deregisterBrowserPush, logout)).resolves.toEqual({ message: "signed out" });

    expect(deregisterBrowserPush).toHaveBeenCalledOnce();
    expect(logout).toHaveBeenCalledOnce();
    expect(deregisterBrowserPush.mock.invocationCallOrder[0]).toBeLessThan(logout.mock.invocationCallOrder[0]);
  });
});

describe("createLogoutWithPushCleanupCallbacks", () => {
  it("preserves auth state and shows the secure logout message when cleanup fails", () => {
    const clearClientAuthState = vi.fn();
    const redirectToLogin = vi.fn();
    const showError = vi.fn();
    const callbacks = createLogoutWithPushCleanupCallbacks(
      clearClientAuthState,
      redirectToLogin,
      showError,
    );

    callbacks.onError();

    expect(clearClientAuthState).not.toHaveBeenCalled();
    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith(SECURE_LOGOUT_FAILURE_MESSAGE);
  });

  it("clears client auth state and redirects only after logout succeeds", () => {
    const clearClientAuthState = vi.fn();
    const redirectToLogin = vi.fn();
    const showError = vi.fn();
    const callbacks = createLogoutWithPushCleanupCallbacks(
      clearClientAuthState,
      redirectToLogin,
      showError,
    );

    callbacks.onSuccess();

    expect(clearClientAuthState).toHaveBeenCalledOnce();
    expect(redirectToLogin).toHaveBeenCalledOnce();
    expect(showError).not.toHaveBeenCalled();
  });
});
