import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import type { SavedAccount } from "@/modules/auth/services/account-switcher.service";

export type { SavedAccount };

/**
 * Service cho "Tài khoản gần đây trên thiết bị này" — lưu theo device cookie HttpOnly,
 * không phụ thuộc owner. Khác với accountSwitcherService (lưu theo owner, dùng cho
 * multi-account switch có audit).
 */
export const recentLoginsService = {
  async list(): Promise<SavedAccount[]> {
    const res = await api.get<SavedAccount[]>(apiRoutes.AUTH.ACCOUNTS_RECENT);
    return Array.isArray(res.data) ? res.data : [];
  },

  async forget(accountId: string): Promise<void> {
    await api.delete(apiRoutes.AUTH.ACCOUNTS_RECENT_FORGET(accountId));
  },
};
