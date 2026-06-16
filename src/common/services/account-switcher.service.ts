import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";

export interface SavedAccount {
  accountId: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: string;
  ssoProvider?: "google" | null;
  lastUsedAt: string | Date;
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

export const accountSwitcherService = {
  async list(): Promise<SavedAccount[]> {
    const res = await api.get<SavedAccount[]>(apiRoutes.AUTH.ACCOUNTS);
    return Array.isArray(res.data) ? res.data : [];
  },

  async switchTo(accountId: string): Promise<SwitchAccountResponse> {
    const res = await api.post<SwitchAccountResponse>(apiRoutes.AUTH.ACCOUNTS_SWITCH, {
      accountId,
    });
    return res.data;
  },

  async forget(accountId: string): Promise<void> {
    await api.delete(apiRoutes.AUTH.ACCOUNTS_FORGET(accountId));
  },
};
