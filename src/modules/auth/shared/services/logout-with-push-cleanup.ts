export const SECURE_LOGOUT_FAILURE_MESSAGE =
  "Could not sign out securely because this browser is still registered for notifications. Please try again.";
export const LOGOUT_FAILURE_MESSAGE = "Could not sign out. Please try again.";

export class BrowserPushDeregistrationError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super("Browser Push deregistration failed.");
    this.name = "BrowserPushDeregistrationError";
    this.cause = cause;
  }
}

export async function logoutWithPushCleanup<T>(
  deregisterBrowserPush: () => Promise<void>,
  logout: () => Promise<T>,
): Promise<T> {
  try {
    await deregisterBrowserPush();
  } catch (cause) {
    throw new BrowserPushDeregistrationError(cause);
  }
  return logout();
}

export function createLogoutWithPushCleanupCallbacks(
  clearClientAuthState: () => void,
  redirectToLogin: () => void,
  showError: (message: string) => void,
) {
  return {
    onSuccess: () => {
      clearClientAuthState();
      redirectToLogin();
    },
    onError: (error: unknown) => {
      showError(
        error instanceof BrowserPushDeregistrationError
          ? SECURE_LOGOUT_FAILURE_MESSAGE
          : LOGOUT_FAILURE_MESSAGE,
      );
    },
  };
}
