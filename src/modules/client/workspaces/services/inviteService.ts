import api from '@/common/services/api.service';
import { apiRoutes } from '@/config/apiRoutes';

export type InviteRole = 'workspace_admin' | 'member' | 'viewer';
export type InviteType = 'email' | 'link';

export interface InviteDto {
  email: string;
  role?: InviteRole;
}

export interface InviteLinkDto {
  role: InviteRole;
}

export interface PendingInvite {
  _id: string;
  invitedEmail: string | null;
  invitedBy: { _id: string; email: string; fullName: string };
  role: string;
  type?: InviteType;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  inviteUrl?: string;
}

export interface InviteDetails {
  workspaceId: string;
  workspaceName: string;
  workspaceKey: string;
  invitedEmail: string | null;
  invitedBy: { _id: string; email: string; fullName: string };
  role: string;
  type?: InviteType;
  status: string;
  expiresAt: string | null;
  inviteUrl?: string;
}

export const inviteService = {
  sendInvite: async (workspaceId: string, dto: InviteDto): Promise<PendingInvite> => {
    const res = await api.post(apiRoutes.WORKSPACES.INVITES(workspaceId), dto);
    return res.data.data;
  },

  createInviteLink: async (workspaceId: string, dto: InviteLinkDto): Promise<PendingInvite> => {
    const res = await api.post(apiRoutes.WORKSPACES.INVITE_LINK(workspaceId), dto);
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

  acceptInvite: (token: string) =>
    api.post(apiRoutes.WORKSPACES.ACCEPT_INVITE(token)),
};
