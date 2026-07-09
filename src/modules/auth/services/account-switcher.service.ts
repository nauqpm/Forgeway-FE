import api, { isAxiosError } from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";

export interface SavedAccount {
  accountId: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: string;
  ssoProvider?: "google" | null;
  lastUsedAt: string | Date;
  switchState?: "parked" | "reauth_required";
}

export interface SwitchAccountResponse {
  success: true;
  message: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
    avatar?: string;
    role: string;
    ssoProvider?: "google" | null;
  };
}

export type SwitchCredential =
  | {
      type: "password";
      password: string;
    }
  | {
      type: "parked";
    };

export interface InitSsoSwitchResponse {
  authorizationUrl: string;
}

export const SSO_SWITCH_REQUIRED_MESSAGE =
  "This account requires SSO sign-in. Please sign in with SSO to switch.";
export const ACCOUNT_SWITCH_DISABLED_MESSAGE =
  "Account switching is temporarily disabled.";
export const REAUTH_REQUIRED_MESSAGE =
  "Please verify this account before switching.";

type ApiErrorBody = {
  code?: unknown;
  message?: unknown;
};

function getErrorCode(data: ApiErrorBody | undefined): unknown {
  if (!data) return undefined;
  if (data.code) return data.code;
  if (typeof data.message === "object" && data.message !== null) {
    return (data.message as ApiErrorBody).code;
  }
  return undefined;
}

function isSsoRequiredError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const data = error.response?.data as ApiErrorBody | undefined;
  return getErrorCode(data) === "SSO_REQUIRED" || data?.message === "SSO_REQUIRED";
}

function getPublicSwitchError(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  const data = error.response?.data as ApiErrorBody | undefined;
  if (getErrorCode(data) === "FEATURE_DISABLED") {
    return ACCOUNT_SWITCH_DISABLED_MESSAGE;
  }
  if (getErrorCode(data) === "REAUTH_REQUIRED") {
    return REAUTH_REQUIRED_MESSAGE;
  }
  if (typeof data?.message === "string") return data.message;
  return null;
}

export const accountSwitcherService = {
  async list(): Promise<SavedAccount[]> {
    const res = await api.get<SavedAccount[]>(apiRoutes.AUTH.ACCOUNTS);
    return Array.isArray(res.data) ? res.data : [];
  },

  async switchTo(
    accountId: string,
    credential: SwitchCredential,
  ): Promise<SwitchAccountResponse> {
    try {
      const res = await api.post<SwitchAccountResponse>(apiRoutes.AUTH.ACCOUNTS_SWITCH, {
        accountId,
        credential,
      });
      return res.data;
    } catch (error) {
      if (isSsoRequiredError(error)) {
        throw new Error(SSO_SWITCH_REQUIRED_MESSAGE);
      }
      const publicMessage = getPublicSwitchError(error);
      if (publicMessage) {
        throw new Error(publicMessage);
      }
      throw error;
    }
  },

  async initSsoSwitch(
    accountId: string,
    currentPageUrl: string,
  ): Promise<InitSsoSwitchResponse> {
    try {
      const res = await api.post<InitSsoSwitchResponse>(
        apiRoutes.AUTH.ACCOUNTS_SWITCH_SSO_INIT,
        {
          targetAccountId: accountId,
          currentPageUrl,
        },
      );
      return res.data;
    } catch (error) {
      const publicMessage = getPublicSwitchError(error);
      if (publicMessage) {
        throw new Error(publicMessage);
      }
      throw error;
    }
  },

  async forget(accountId: string): Promise<void> {
    await api.delete(apiRoutes.AUTH.ACCOUNTS_FORGET(accountId));
  },
};
