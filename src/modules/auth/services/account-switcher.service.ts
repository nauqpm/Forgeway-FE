import api from '@/lib/axiosIns';
import { apiRoutes } from '@/config/apiRoutes';

export interface DeviceSwitchAccountItem {
  userId: string;
  displayName: string;
  maskedEmail: string;
  avatarUrl: string | null;
  provider: 'password' | 'google';
  status: 'active' | 'expired';
  expiresAt: string;
  lastAuthenticatedAt: string;
  lastSwitchedAt: string | null;
  isCurrent: boolean;
}

export interface SwitchAccountResponse {
  success: true;
  redirectTo: '/';
  switchedUser: {
    id: string;
    displayName: string;
  };
}

export const accountSwitcherService = {
  async list(): Promise<DeviceSwitchAccountItem[]> {
    const res = await api.get<DeviceSwitchAccountItem[]>(
      apiRoutes.AUTH.DEVICE_SWITCH_ACCOUNTS,
    );
    return Array.isArray(res.data) ? res.data : [];
  },

  async switchTo(targetUserId: string): Promise<SwitchAccountResponse> {
    const res = await api.post<SwitchAccountResponse>(
      apiRoutes.AUTH.DEVICE_SWITCH_ACCOUNTS_SWITCH,
      { targetUserId },
    );
    return res.data;
  },

  async forget(targetUserId: string): Promise<void> {
    await api.delete(
      apiRoutes.AUTH.DEVICE_SWITCH_ACCOUNTS_FORGET(targetUserId),
    );
  },
};
