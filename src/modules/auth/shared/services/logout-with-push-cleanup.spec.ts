import { describe, expect, it, vi } from "vitest";

import {
  BrowserPushDeregistrationError,
  createLogoutWithPushCleanupCallbacks,
  logoutWithPushCleanup,
  SECURE_LOGOUT_FAILURE_MESSAGE,
} from "./logout-with-push-cleanup";

describe("logoutWithPushCleanup", () => {
  it("marks Browser Push deregistration failures without calling the logout API", async () => {
    const cleanupFailure = new Error("offline");
    const deregisterBrowserPush = vi.fn().mockRejectedValue(cleanupFailure);
    const logout = vi.fn().mockResolvedValue({ message: "signed out" });

    await expect(logoutWithPushCleanup(deregisterBrowserPush, logout)).rejects.toMatchObject({
      name: "BrowserPushDeregistrationError",
      cause: cleanupFailure,
    });

    expect(deregisterBrowserPush).toHaveBeenCalledOnce();
    expect(logout).not.toHaveBeenCalled();
  });

  it("preserves a logout API failure after successful Browser Push deregistration", async () => {
    const deregisterBrowserPush = vi.fn().mockResolvedValue(undefined);
    const logoutFailure = new Error("logout unavailable");
    const logout = vi.fn().mockRejectedValue(logoutFailure);

    await expect(logoutWithPushCleanup(deregisterBrowserPush, logout)).rejects.toBe(logoutFailure);

    expect(deregisterBrowserPush).toHaveBeenCalledOnce();
    expect(logout).toHaveBeenCalledOnce();
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

    callbacks.onError(new BrowserPushDeregistrationError(new Error("offline")));

    expect(clearClientAuthState).not.toHaveBeenCalled();
    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith(SECURE_LOGOUT_FAILURE_MESSAGE);
  });

  it("shows a generic logout error without clearing auth state when the logout API fails", () => {
    const clearClientAuthState = vi.fn();
    const redirectToLogin = vi.fn();
    const showError = vi.fn();
    const callbacks = createLogoutWithPushCleanupCallbacks(
      clearClientAuthState,
      redirectToLogin,
      showError,
    );

    callbacks.onError(new Error("logout unavailable"));

    expect(clearClientAuthState).not.toHaveBeenCalled();
    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith("Could not sign out. Please try again.");
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
