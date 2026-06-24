import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "COMMENT_MENTIONED"
  | "TASK_COMMENT_CREATED"
  | "WORKSPACE_INVITED"
  | "THREAD_REPLY"
  | "CHAT_MENTIONED";

export interface NotificationActor {
  id: string;
  email?: string;
  fullName?: string;
  avatar?: string;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  actorId?: string;
  actor?: NotificationActor;
  workspaceId?: string;
  type: NotificationType;
  title: string;
  message?: string;
  entityType: "task" | "comment" | "workspace" | "invite" | "message";
  entityId?: string;
  metadata?: {
    taskId?: string;
    taskKey?: string;
    taskTitle?: string;
    commentId?: string;
    workspaceId?: string;
    workspaceKey?: string;
    workspaceName?: string;
    inviteId?: string;
    role?: string;
    status?: string;
    fromStatus?: string;
    toStatus?: string;
    channelId?: string;
    messageId?: string;
    parentContent?: string;
    replyContent?: string;
    content?: string;
    [key: string]: unknown;
  };
  readAt?: string | Date | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  total: number;
  page: number;
  limit: number;
}

export const notificationService = {
  async list(page = 1, limit = 20): Promise<NotificationListResponse> {
    const response = await api.get<NotificationListResponse>(apiRoutes.NOTIFICATIONS.BASE, {
      params: { page, limit },
    });
    return response.data;
  },

  async unreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>(apiRoutes.NOTIFICATIONS.UNREAD_COUNT);
    return response.data.count ?? 0;
  },

  async markAsRead(notificationId: string): Promise<AppNotification> {
    const response = await api.patch<AppNotification>(apiRoutes.NOTIFICATIONS.READ(notificationId));
    return response.data;
  },

  async markAllAsRead(): Promise<{ modifiedCount: number }> {
    const response = await api.patch<{ modifiedCount: number }>(apiRoutes.NOTIFICATIONS.READ_ALL);
    return response.data;
  },

  async acceptWorkspaceInvite(inviteId: string): Promise<void> {
    await api.post(apiRoutes.WORKSPACES.ACCEPT_INVITE_BY_ID(inviteId));
  },

  async declineWorkspaceInvite(inviteId: string): Promise<void> {
    await api.post(apiRoutes.WORKSPACES.DECLINE_INVITE_BY_ID(inviteId));
  },
};
