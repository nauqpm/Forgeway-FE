export const SECURE_LOGOUT_FAILURE_MESSAGE =
  "Could not sign out securely because this browser is still registered for notifications. Please try again.";

export async function logoutWithPushCleanup<T>(
  deregisterBrowserPush: () => Promise<void>,
  logout: () => Promise<T>,
): Promise<T> {
  await deregisterBrowserPush();
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
    onError: () => {
      showError(SECURE_LOGOUT_FAILURE_MESSAGE);
    },
  };
}
