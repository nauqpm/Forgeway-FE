"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { ArrowRight, Bell, Check, FileText, Loader2, MoreHorizontal, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import {
  AppNotification,
  notificationService,
  NotificationType,
  NotificationListResponse,
} from "@/modules/notifications/services/notification.service";
import { useNotificationRealtime } from "@/lib/realtime/hooks/use-notification-realtime";
import {
  getTaskStatusTransition,
  TaskStatusTransition,
} from "@/modules/notifications/utils/notification-status.utils";

interface NotificationPanelProps {
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

type NotificationCategory = "DIRECT" | "WATCHING";
type InviteActionStatus = "accepted" | "declined" | "expired" | "unavailable";

const INVITE_NOTIFICATION_STATE_KEY = "sdlc.inviteNotificationState";

interface StoredInviteNotificationState {
  status: InviteActionStatus;
  message: string;
}

interface NotificationViewModel {
  id: string;
  actor: { name: string; avatar?: string };
  actionText: string;
  target?: { id?: string; key?: string; title?: string; type: string };
  messageSnippet?: string;
  href?: string;
  createdAt: string;
  isRead: boolean;
  category: NotificationCategory;
  type: "STANDARD" | "INVITE";
  statusTransition?: TaskStatusTransition;
  inviteData?: {
    inviteId?: string;
    workspaceKey?: string;
    workspaceName: string;
    message?: string;
    statusMessage?: string;
    status?: string;
    role?: string;
  };
}

const DIRECT_TYPES: NotificationType[] = [
  "TASK_ASSIGNED",
  "COMMENT_MENTIONED",
  "WORKSPACE_INVITED",
  "THREAD_REPLY",
  "CHAT_MENTIONED",
];

function actorName(notification: AppNotification): string {
  return (
    notification.actor?.fullName ||
    notification.actor?.email ||
    "A teammate"
  );
}

function initials(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function actionText(type: NotificationType): string {
  switch (type) {
    case "TASK_ASSIGNED":
      return "assigned a task to you";
    case "TASK_STATUS_CHANGED":
      return "changed the task status";
    case "COMMENT_MENTIONED":
      return "mentioned you in a comment";
    case "TASK_COMMENT_CREATED":
      return "commented on a task";
    case "WORKSPACE_INVITED":
      return "invited you to a workspace";
    case "THREAD_REPLY":
      return "replied to a thread";
    case "CHAT_MENTIONED":
      return "mentioned you in a chat channel";
    default:
      return "sent you a notification";
  }
}

function readStoredInviteNotificationState(): Record<string, StoredInviteNotificationState> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(INVITE_NOTIFICATION_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredInviteNotificationState>;
  } catch {
    return {};
  }
}

function getStoredInviteNotificationState(notificationId: string): StoredInviteNotificationState | undefined {
  return readStoredInviteNotificationState()[notificationId];
}

function persistInviteNotificationState(
  notificationId: string,
  state: StoredInviteNotificationState,
): void {
  if (typeof window === "undefined") return;

  const current = readStoredInviteNotificationState();
  current[notificationId] = state;
  window.sessionStorage.setItem(INVITE_NOTIFICATION_STATE_KEY, JSON.stringify(current));
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;

  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message[0] ?? fallback;
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
}

function getInviteFailureState(
  error: unknown,
  fallback: string,
): { message: string; status?: InviteActionStatus } {
  const message = getApiErrorMessage(error, fallback);
  if (!isAxiosError(error) || error.response?.status !== 410) {
    return { message };
  }

  const normalized = message.toLowerCase();
  if (normalized.includes("accepted")) return { message, status: "accepted" };
  if (normalized.includes("declined")) return { message, status: "declined" };
  if (normalized.includes("expired")) return { message, status: "expired" };
  return { message, status: "unavailable" };
}


function buildNotificationHref(notification: AppNotification): string | undefined {
  if (notification.type === "WORKSPACE_INVITED") {
    return "/workspaces";
  }

  const metadata = notification.metadata ?? {};

  if (notification.type === "THREAD_REPLY") {
    const channelId = typeof metadata.channelId === "string" ? metadata.channelId : undefined;
    const messageId = typeof metadata.messageId === "string" ? metadata.messageId : undefined;
    const parentId = typeof metadata.parentId === "string" ? metadata.parentId : undefined;
    const actualParentId = parentId || metadata.threadParentId || messageId;
    if (channelId && actualParentId) {
      const base = `/chat?channelId=${encodeURIComponent(channelId)}&threadParentId=${encodeURIComponent(actualParentId as string)}`;
      return messageId ? `${base}&messageId=${encodeURIComponent(messageId)}` : base;
    }
  }

  if (notification.type === "CHAT_MENTIONED") {
    const channelId = typeof metadata.channelId === "string" ? metadata.channelId : undefined;
    const messageId = typeof metadata.messageId === "string" ? metadata.messageId : undefined;
    if (channelId) {
      const base = `/chat?channelId=${encodeURIComponent(channelId)}`;
      return messageId ? `${base}&messageId=${encodeURIComponent(messageId)}` : base;
    }
  }

  const taskKey = typeof metadata.taskKey === "string" ? metadata.taskKey : undefined;
  const workspaceRouteKey =
    (typeof metadata.workspaceKey === "string" ? metadata.workspaceKey : undefined) ||
    (typeof metadata.workspaceId === "string" ? metadata.workspaceId : undefined) ||
    notification.workspaceId;

  if (taskKey && workspaceRouteKey) {
    return `/workspaces/${encodeURIComponent(workspaceRouteKey)}/board/key/${encodeURIComponent(taskKey)}`;
  }

  return undefined;
}

function mapNotification(notification: AppNotification): NotificationViewModel {
  const name = actorName(notification);
  const metadata = notification.metadata ?? {};
  const isChatNotification = ["THREAD_REPLY", "CHAT_MENTIONED"].includes(notification.type);
  const taskKey = typeof metadata.taskKey === "string" ? metadata.taskKey : undefined;
  const taskTitle = typeof metadata.taskTitle === "string" ? metadata.taskTitle : notification.message;
  const workspaceName =
    typeof metadata.workspaceName === "string" ? metadata.workspaceName : notification.message || "Workspace";
  const storedInviteState = notification.type === "WORKSPACE_INVITED"
    ? getStoredInviteNotificationState(notification.id)
    : undefined;
  const inviteRole = typeof metadata.role === "string" ? metadata.role : undefined;
  const rawInviteMessage = typeof notification.message === "string" ? notification.message.trim() : "";
  const normalizedInviteMessage = rawInviteMessage.toLowerCase();
  const messageLooksLikeRole = normalizedInviteMessage.startsWith("role:");
  const pendingInviteMessage = rawInviteMessage && !messageLooksLikeRole
    ? rawInviteMessage
    : undefined;

  const cleanMessage = typeof notification.message === "string"
    ? notification.message.replace(/(?:\[@|@\[)([^\]]+)\]\(([^)]+)\)/g, '@$1')
    : undefined;

  return {
    id: notification.id,
    actor: {
      name,
      avatar: notification.actor?.avatar || initials(name),
    },
    actionText: actionText(notification.type),
    target: !isChatNotification && (taskKey || taskTitle)
      ? {
          id: typeof metadata.taskId === "string" ? metadata.taskId : notification.entityId,
          key: taskKey,
          title: taskTitle || notification.title,
          type: "Task",
        }
      : undefined,
    messageSnippet: isChatNotification ? cleanMessage : undefined,
    createdAt: notification.createdAt,
    isRead: Boolean(notification.readAt),
    href: buildNotificationHref(notification),
    category: DIRECT_TYPES.includes(notification.type) ? "DIRECT" : "WATCHING",
    type: notification.type === "WORKSPACE_INVITED" ? "INVITE" : "STANDARD",
    statusTransition:
      notification.type === "TASK_STATUS_CHANGED"
        ? getTaskStatusTransition(metadata)
        : undefined,
    inviteData: notification.type === "WORKSPACE_INVITED"
      ? {
          inviteId: typeof metadata.inviteId === "string" ? metadata.inviteId : notification.entityId,
          workspaceKey: typeof metadata.workspaceKey === "string" ? metadata.workspaceKey : undefined,
          workspaceName,
          message: pendingInviteMessage,
          statusMessage: storedInviteState?.message,
          status: storedInviteState?.status ?? (typeof metadata.status === "string" ? metadata.status : undefined),
          role: inviteRole,
        }
      : undefined,
  };
}

function groupName(createdAt: string): string {
  const date = new Date(createdAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Latest";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return "Older";
}

function formatTime(createdAt: string): string {
  return new Date(createdAt).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
  });
}

export default function NotificationPanel({
  onClose,
  onUnreadCountChange,
}: NotificationPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<NotificationCategory>("DIRECT");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [inviteActionId, setInviteActionId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: listData, isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => notificationService.list(1, 30),
    staleTime: 30_000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationService.unreadCount(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  const error = queryError ? "Could not load notifications." : null;

  const notifications = useMemo(() => {
    return (listData?.notifications || []).map(mapNotification);
  }, [listData]);

  const handleRealtimeCreated = useCallback((notification?: AppNotification) => {
    if (!notification) return;

    queryClient.setQueryData<NotificationListResponse>(queryKeys.notifications.list(), (current) => {
      if (!current) return current;
      const exists = current.notifications.some((item) => item.id === notification.id);
      const nextNotifications = exists
        ? current.notifications.map((item) => item.id === notification.id ? notification : item)
        : [notification, ...current.notifications];
      return {
        ...current,
        notifications: nextNotifications,
      };
    });

    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
  }, [queryClient]);

  const handleRealtimeRead = useCallback((notificationId?: string) => {
    if (!notificationId) return;

    queryClient.setQueryData<NotificationListResponse>(queryKeys.notifications.list(), (current) => {
      if (!current) return current;
      return {
        ...current,
        notifications: current.notifications.map((item) =>
          item.id === notificationId
            ? { ...item, readAt: new Date().toISOString() }
            : item
        ),
      };
    });

    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
  }, [queryClient]);

  const handleRealtimeReadAll = useCallback(() => {
    queryClient.setQueryData<NotificationListResponse>(queryKeys.notifications.list(), (current) => {
      if (!current) return current;
      return {
        ...current,
        notifications: current.notifications.map((item) => ({
          ...item,
          readAt: new Date().toISOString(),
        })),
      };
    });

    queryClient.setQueryData<number>(queryKeys.notifications.unreadCount(), 0);
  }, [queryClient]);

  useNotificationRealtime({
    onCreated: handleRealtimeCreated,
    onRead: handleRealtimeRead,
    onReadAll: handleRealtimeReadAll,
  });

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowMenu(false);
      }
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount() });

      const previousListData = queryClient.getQueryData<NotificationListResponse>(queryKeys.notifications.list());
      const previousUnreadCount = queryClient.getQueryData<number>(queryKeys.notifications.unreadCount());

      if (previousListData) {
        queryClient.setQueryData<NotificationListResponse>(queryKeys.notifications.list(), {
          ...previousListData,
          notifications: previousListData.notifications.map((n) => ({
            ...n,
            readAt: new Date().toISOString(),
          })),
        });
      }

      queryClient.setQueryData<number>(queryKeys.notifications.unreadCount(), 0);

      return { previousListData, previousUnreadCount };
    },
    onError: (err, variables, context) => {
      if (context?.previousListData) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.previousListData);
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), context.previousUnreadCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount() });

      const previousListData = queryClient.getQueryData<NotificationListResponse>(queryKeys.notifications.list());
      const previousUnreadCount = queryClient.getQueryData<number>(queryKeys.notifications.unreadCount());

      if (previousListData) {
        queryClient.setQueryData<NotificationListResponse>(queryKeys.notifications.list(), {
          ...previousListData,
          notifications: previousListData.notifications.map((n) =>
            n.id === id ? { ...n, readAt: new Date().toISOString() } : n
          ),
        });
      }

      if (typeof previousUnreadCount === "number" && previousUnreadCount > 0) {
        queryClient.setQueryData<number>(queryKeys.notifications.unreadCount(), previousUnreadCount - 1);
      }

      return { previousListData, previousUnreadCount };
    },
    onError: (err, id, context) => {
      if (context?.previousListData) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.previousListData);
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), context.previousUnreadCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });

  const updateInviteNotification = (
    id: string,
    status: InviteActionStatus,
    message: string,
  ) => {
    persistInviteNotificationState(id, { status, message });
    queryClient.setQueryData<NotificationListResponse>(queryKeys.notifications.list(), (current) => {
      if (!current) return current;
      return {
        ...current,
        notifications: current.notifications.map((item) =>
          item.id === id && item.type === "WORKSPACE_INVITED"
            ? {
                ...item,
                readAt: item.readAt || new Date().toISOString(),
                metadata: {
                  ...item.metadata,
                  status,
                },
              }
            : item
        ),
      };
    });
  };

  const handleNotificationClick = async (notification: NotificationViewModel) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id);
    }

    if (!notification.href) return;

    onClose();
    router.push(notification.href);
  };

  const handleNotificationKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    notification: NotificationViewModel,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleNotificationClick(notification);
  };

  const acceptInviteMutation = useMutation({
    mutationFn: ({ inviteId }: { inviteId: string; notificationId: string }) =>
      notificationService.acceptWorkspaceInvite(inviteId),
    onMutate: ({ notificationId }) => {
      setInviteActionId(`${notificationId}:accept`);
    },
    onSuccess: async (data, { notificationId }) => {
      updateInviteNotification(notificationId, "accepted", "Invitation accepted.");
      
      await notificationService.markAsRead(notificationId);
      
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      toast.success("Workspace invitation accepted.");
      onClose();
      
      const notification = notifications.find((n) => n.id === notificationId);
      const workspaceKey = notification?.inviteData?.workspaceKey;
      router.push(workspaceKey ? `/workspaces/${encodeURIComponent(workspaceKey)}` : "/workspaces");
    },
    onError: (error, { notificationId }) => {
      const failure = getInviteFailureState(error, "Could not accept invitation.");
      if (failure.status) {
        updateInviteNotification(notificationId, failure.status, failure.message);
        notificationService.markAsRead(notificationId).finally(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
        });
      }
      toast.error(failure.message);
    },
    onSettled: () => {
      setInviteActionId(null);
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: ({ inviteId }: { inviteId: string; notificationId: string }) =>
      notificationService.declineWorkspaceInvite(inviteId),
    onMutate: ({ notificationId }) => {
      setInviteActionId(`${notificationId}:decline`);
    },
    onSuccess: async (data, { notificationId }) => {
      updateInviteNotification(notificationId, "declined", "Invitation declined.");
      
      await notificationService.markAsRead(notificationId);
      
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      toast.success("Workspace invitation declined.");
    },
    onError: (error, { notificationId }) => {
      const failure = getInviteFailureState(error, "Could not decline invitation.");
      if (failure.status) {
        updateInviteNotification(notificationId, failure.status, failure.message);
        notificationService.markAsRead(notificationId).finally(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
        });
      }
      toast.error(failure.message);
    },
    onSettled: () => {
      setInviteActionId(null);
    },
  });

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
    setShowMenu(false);
  };

  const handleAcceptInvite = async (
    event: ReactMouseEvent<HTMLButtonElement>,
    notification: NotificationViewModel,
  ) => {
    event.stopPropagation();
    const inviteId = notification.inviteData?.inviteId;
    if (!inviteId) {
      toast.error("Invitation is missing.");
      return;
    }
    acceptInviteMutation.mutate({ inviteId, notificationId: notification.id });
  };

  const handleDeclineInvite = async (
    event: ReactMouseEvent<HTMLButtonElement>,
    notification: NotificationViewModel,
  ) => {
    event.stopPropagation();
    const inviteId = notification.inviteData?.inviteId;
    if (!inviteId) {
      toast.error("Invitation is missing.");
      return;
    }
    declineInviteMutation.mutate({ inviteId, notificationId: notification.id });
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (notification.category !== activeTab) return false;
      if (showUnreadOnly && notification.isRead) return false;
      return true;
    });
  }, [activeTab, notifications, showUnreadOnly]);

  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce<Record<string, NotificationViewModel[]>>((groups, notification) => {
      const key = groupName(notification.createdAt);
      groups[key] = groups[key] ?? [];
      groups[key].push(notification);
      return groups;
    }, {});
  }, [filteredNotifications]);

  const groupOrder = ["Latest", "Yesterday", "Older"];

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-[min(calc(100vw-32px),420px)] bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] z-50 flex flex-col max-h-[85vh]"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <div className="px-4 pt-4 border-b border-[#EAEAEA] dark:border-white/[0.06] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Notifications</h2>
          <div className="flex items-center gap-2">
            <span className="text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97]">Unread</span>
            <button
              onClick={() => setShowUnreadOnly((value) => !value)}
              className={`h-5 w-9 rounded-full relative transition-colors ${showUnreadOnly ? "bg-[#2563EB] dark:bg-[#3B82F6]" : "bg-[#EAEAEA] dark:bg-white/10"}`}
              aria-pressed={showUnreadOnly}
            >
              <span className={`h-4 w-4 bg-white rounded-full absolute top-0.5 transition-transform ${showUnreadOnly ? "translate-x-4 left-0.5" : "left-0.5"}`} />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((value) => !value)}
                className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#ABABAB] dark:text-[#6B6B6B] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] py-1 z-50"
                  style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <button
                    onClick={markAllAsRead}
                    className="w-full text-left px-3 py-2 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-[#ABABAB]" />
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#ABABAB] dark:text-[#6B6B6B] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-5">
          <button
            onClick={() => setActiveTab("DIRECT")}
            className={`pb-3 text-[0.8125rem] font-semibold border-b-2 transition-colors ${activeTab === "DIRECT" ? "border-[#2563EB] text-[#2563EB] dark:text-[#3B82F6] dark:border-[#3B82F6]" : "border-transparent text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7]"}`}
          >
            Direct
          </button>
          <button
            onClick={() => setActiveTab("WATCHING")}
            className={`pb-3 text-[0.8125rem] font-semibold border-b-2 transition-colors ${activeTab === "WATCHING" ? "border-[#2563EB] text-[#2563EB] dark:text-[#3B82F6] dark:border-[#3B82F6]" : "border-transparent text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7]"}`}
          >
            Watching
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#2563EB] dark:text-[#3B82F6]" />
            <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[#F7F6F3] dark:bg-[#252525] rounded-full flex items-center justify-center mb-3">
              <Bell className="w-7 h-7 text-[#ABABAB] dark:text-[#6B6B6B]" />
            </div>
            <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[#F7F6F3] dark:bg-[#252525] rounded-full flex items-center justify-center mb-3">
              <Bell className="w-7 h-7 text-[#ABABAB] dark:text-[#6B6B6B]" />
            </div>
            <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">You&apos;re all caught up!</p>
            <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97] mt-1">No notifications here.</p>
          </div>
        ) : (
          <div className="p-3 space-y-5">
            {groupOrder.map((group) => {
              const items = groupedNotifications[group];
              if (!items?.length) return null;

              return (
                <div key={group}>
                  <h3 className="text-[0.6875rem] font-bold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wider mb-2 px-1">{group}</h3>
                  <div className="space-y-0.5">
                    {items.map((notification) => {
                      const inviteStatus = notification.inviteData?.status?.toLowerCase();
                      const isPendingInvite = notification.type === "INVITE" && (!inviteStatus || inviteStatus === "pending");
                      const isAccepting = inviteActionId === `${notification.id}:accept`;
                      const isDeclining = inviteActionId === `${notification.id}:decline`;
                      const isInviteBusy = isAccepting || isDeclining;

                      return (
                        <div
                          key={notification.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleNotificationClick(notification)}
                          onKeyDown={(event) => handleNotificationKeyDown(event, notification)}
                          className={`w-full text-left relative p-3 rounded-[8px] transition-all group hover:bg-[#F9F9F8] dark:hover:bg-[#252525] border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.06] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 ${!notification.isRead ? "bg-[#EFF6FF]/30 dark:bg-[rgba(37,99,235,0.06)]" : ""}`}
                        >
                          {!notification.isRead && (
                            <span className="absolute top-3.5 right-3 w-2 h-2 bg-[#2563EB] dark:bg-[#3B82F6] rounded-full" />
                          )}

                          <div className="flex items-start gap-3 pr-5">
                            <div className="w-7 h-7 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white flex items-center justify-center text-[0.6875rem] font-bold flex-shrink-0 overflow-hidden">
                              {notification.actor.avatar?.startsWith("http") ? (
                                <img src={notification.actor.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                notification.actor.avatar
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] leading-snug">
                                <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">{notification.actor.name}</span>{" "}{notification.actionText}
                              </p>

                              {notification.type === "STANDARD" && notification.target && (
                                <div className="mt-1.5 flex items-center gap-1.5 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[4px] p-1.5 w-fit max-w-full hover:border-[#2563EB]/40 transition-colors">
                                  <FileText className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6] flex-shrink-0" />
                                  <span className="text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97] truncate">
                                    {notification.target.key ? `${notification.target.key}: ` : ""}{notification.target.title}
                                  </span>
                                </div>
                              )}

                              {notification.messageSnippet && (
                                <div className="mt-1.5 px-2.5 py-1.5 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-[0.75rem] text-[#787774] dark:text-[#9B9A97] italic max-w-full truncate">
                                  {notification.messageSnippet}
                                </div>
                              )}

                              {notification.statusTransition && (
                                <div className="mt-1.5 flex w-fit items-center gap-2 text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97]">
                                  <span className="rounded-[4px] border border-[#EAEAEA] bg-[#F9F9F8] px-1.5 py-0.5 dark:border-white/[0.06] dark:bg-[#252525]">
                                    {notification.statusTransition.from}
                                  </span>
                                  <ArrowRight className="h-3.5 w-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" />
                                  <span className="rounded-[4px] border border-[#EAEAEA] bg-[#F9F9F8] px-1.5 py-0.5 dark:border-white/[0.06] dark:bg-[#252525]">
                                    {notification.statusTransition.to}
                                  </span>
                                </div>
                              )}

                              {notification.type === "INVITE" && notification.inviteData && (
                                <div className="mt-2 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] p-3 min-w-0">
                                  <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] truncate" title={notification.inviteData.workspaceName}>{notification.inviteData.workspaceName}</p>
                                  {notification.inviteData.role && (
                                    <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97] mt-1 truncate" title={notification.inviteData.role}>Role: {notification.inviteData.role}</p>
                                  )}
                                  {isPendingInvite && notification.inviteData.message && (
                                    <p className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] mt-1 break-words [overflow-wrap:anywhere]">{notification.inviteData.message}</p>
                                  )}
                                  {isPendingInvite ? (
                                    <div className="mt-3 flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={(event) => handleAcceptInvite(event, notification)}
                                        disabled={isInviteBusy || !notification.inviteData.inviteId}
                                        className="inline-flex items-center justify-center rounded-[6px] bg-[#2563EB] px-3 py-1.5 text-[0.75rem] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {isAccepting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                                        Accept
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(event) => handleDeclineInvite(event, notification)}
                                        disabled={isInviteBusy || !notification.inviteData.inviteId}
                                        className="inline-flex items-center justify-center rounded-[6px] border border-[#EAEAEA] px-3 py-1.5 text-[0.75rem] font-semibold text-[#787774] transition-colors hover:bg-white dark:border-white/[0.08] dark:text-[#C9C9C7] dark:hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {isDeclining ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                                        Decline
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97]">
                                      {notification.inviteData.statusMessage || `Invitation ${inviteStatus ?? "processed"}.`}
                                    </p>
                                  )}
                                </div>
                              )}

                              <p className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] mt-1.5">{formatTime(notification.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
