import api from '@/lib/axiosIns';
import { apiRoutes } from '@/config/apiRoutes';

export interface InviteDto {
  email: string;
  role?: 'workspace_admin' | 'member' | 'viewer';
}

export interface PendingInvite {
  _id: string;
  invitedEmail: string;
  invitedBy: { _id: string; email: string; fullName: string };
  role: string;
  status: string;
  token?: string;
  inviteLink?: string;
  link?: string;
  url?: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface InviteDetails {
  workspaceId: string;
  workspaceName: string;
  workspaceKey: string;
  invitedEmail: string | null;
  invitedBy: { _id: string; email: string; fullName: string };
  role: string;
  type: 'email' | 'link';
  status: string;
  expiresAt: string | null;
}

export const inviteService = {
  sendInvite: async (workspaceId: string, dto: InviteDto): Promise<PendingInvite> => {
    const res = await api.post(apiRoutes.WORKSPACES.INVITES(workspaceId), dto);
    return res.data.data;
  },

  createInviteLink: async (workspaceId: string, role: string): Promise<{ token: string; inviteUrl: string }> => {
    const res = await api.post(apiRoutes.WORKSPACES.INVITE_LINK(workspaceId), { role });
    return res.data.data;
  },

  listInvites: async (workspaceId: string): Promise<PendingInvite[]> => {
    const res = await api.get(apiRoutes.WORKSPACES.INVITES(workspaceId));
    return res.data.data;
  },

  cancelInvite: (workspaceId: string, inviteId: string) =>
    api.delete(apiRoutes.WORKSPACES.INVITE_BY_ID(workspaceId, inviteId)),

  getInviteByToken: async (token: string): Promise<InviteDetails> => {
    const res = await api.get(apiRoutes.WORKSPACES.INVITE_BY_TOKEN(token));
    return res.data.data;
  },

  acceptInvite: (token: string) => api.post(apiRoutes.WORKSPACES.ACCEPT_INVITE(token)),
};
