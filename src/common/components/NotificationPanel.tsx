"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { Bell, Check, FileText, Loader2, MoreHorizontal, X } from "lucide-react";
import {
  AppNotification,
  notificationService,
  NotificationType,
} from "@/common/services/notification.service";
import { useNotificationRealtime } from "@/hooks/realtime/use-notification-realtime";

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
  href?: string;
  createdAt: string;
  isRead: boolean;
  category: NotificationCategory;
  type: "STANDARD" | "INVITE";
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
    case "COMMENT_MENTIONED":
      return "mentioned you in a comment";
    case "TASK_COMMENT_CREATED":
      return "commented on a task";
    case "WORKSPACE_INVITED":
      return "invited you to a workspace";
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

  return {
    id: notification.id,
    actor: {
      name,
      avatar: notification.actor?.avatar || initials(name),
    },
    actionText: actionText(notification.type),
    target: taskKey || taskTitle
      ? {
          id: typeof metadata.taskId === "string" ? metadata.taskId : notification.entityId,
          key: taskKey,
          title: taskTitle || notification.title,
          type: "Task",
        }
      : undefined,
    createdAt: notification.createdAt,
    isRead: Boolean(notification.readAt),
    href: buildNotificationHref(notification),
    category: DIRECT_TYPES.includes(notification.type) ? "DIRECT" : "WATCHING",
    type: notification.type === "WORKSPACE_INVITED" ? "INVITE" : "STANDARD",
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
  const [notifications, setNotifications] = useState<NotificationViewModel[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationCategory>("DIRECT");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteActionId, setInviteActionId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleRealtimeCreated = useCallback((notification?: AppNotification) => {
    if (!notification) return;

    setNotifications((items) => {
      const viewModel = mapNotification(notification);
      const exists = items.some((item) => item.id === viewModel.id);
      if (exists) {
        return items.map((item) => item.id === viewModel.id ? viewModel : item);
      }
      return [viewModel, ...items];
    });
  }, []);

  const handleRealtimeRead = useCallback((notificationId?: string) => {
    if (!notificationId) return;

    setNotifications((items) =>
      items.map((item) => item.id === notificationId ? { ...item, isRead: true } : item),
    );
  }, []);

  const handleRealtimeReadAll = useCallback(() => {
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
  }, []);

  useNotificationRealtime({
    onCreated: handleRealtimeCreated,
    onRead: handleRealtimeRead,
    onReadAll: handleRealtimeReadAll,
  });

  const refreshUnreadCount = async () => {
    if (!onUnreadCountChange) return;
    const count = await notificationService.unreadCount();
    onUnreadCountChange(count);
  };

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await notificationService.list(1, 30);
        if (!mounted) return;
        setNotifications(result.notifications.map(mapNotification));
        await refreshUnreadCount();
      } catch {
        if (mounted) setError("Could not load notifications.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

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

  const markAllAsRead = async () => {
    const previous = notifications;
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    setShowMenu(false);
    try {
      await notificationService.markAllAsRead();
      await refreshUnreadCount();
    } catch {
      setNotifications(previous);
    }
  };

  const markAsRead = async (id: string) => {
    const target = notifications.find((notification) => notification.id === id);
    if (!target || target.isRead) return;

    setNotifications((items) =>
      items.map((item) => item.id === id ? { ...item, isRead: true } : item),
    );
    try {
      await notificationService.markAsRead(id);
      await refreshUnreadCount();
    } catch {
      setNotifications((items) =>
        items.map((item) => item.id === id ? { ...item, isRead: false } : item),
      );
    }
  };

  const updateInviteNotification = (
    id: string,
    status: InviteActionStatus,
    message: string,
  ) => {
    persistInviteNotificationState(id, { status, message });
    setNotifications((items) =>
      items.map((item) =>
        item.id === id && item.inviteData
          ? {
              ...item,
              isRead: true,
              inviteData: {
                ...item.inviteData,
                status,
                statusMessage: message,
              },
            }
          : item,
      ),
    );
  };

  const handleNotificationClick = async (notification: NotificationViewModel) => {
    await markAsRead(notification.id);

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

    setInviteActionId(`${notification.id}:accept`);
    try {
      await notificationService.acceptWorkspaceInvite(inviteId);
      updateInviteNotification(notification.id, "accepted", "Invitation accepted.");
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
      }
      await refreshUnreadCount();
      toast.success("Workspace invitation accepted.");
      onClose();
      const workspaceKey = notification.inviteData?.workspaceKey;
      router.push(workspaceKey ? `/workspaces/${encodeURIComponent(workspaceKey)}` : "/workspaces");
    } catch (error) {
      const failure = getInviteFailureState(error, "Could not accept invitation.");
      if (failure.status) {
        updateInviteNotification(notification.id, failure.status, failure.message);
        if (!notification.isRead) {
          await notificationService.markAsRead(notification.id);
          await refreshUnreadCount();
        }
      }
      toast.error(failure.message);
    } finally {
      setInviteActionId(null);
    }
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

    setInviteActionId(`${notification.id}:decline`);
    try {
      await notificationService.declineWorkspaceInvite(inviteId);
      updateInviteNotification(notification.id, "declined", "Invitation declined.");
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
      }
      await refreshUnreadCount();
      toast.success("Workspace invitation declined.");
    } catch (error) {
      const failure = getInviteFailureState(error, "Could not decline invitation.");
      if (failure.status) {
        updateInviteNotification(notification.id, failure.status, failure.message);
        if (!notification.isRead) {
          await notificationService.markAsRead(notification.id);
          await refreshUnreadCount();
        }
      }
      toast.error(failure.message);
    } finally {
      setInviteActionId(null);
    }
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
            <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">You're all caught up!</p>
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
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          onKeyDown={(event) => handleNotificationKeyDown(event, notification)}
                          className={`w-full text-left relative p-3 rounded-[8px] transition-all group hover:bg-[#F9F9F8] dark:hover:bg-[#252525] border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 ${!notification.isRead ? "bg-[#EFF6FF]/30 dark:bg-[rgba(37,99,235,0.06)]" : ""}`}
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

                              {notification.type === "INVITE" && notification.inviteData && (
                                <div className="mt-2 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] p-3">
                                  <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">{notification.inviteData.workspaceName}</p>
                                  {notification.inviteData.role && (
                                    <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97] mt-1">Role: {notification.inviteData.role}</p>
                                  )}
                                  {isPendingInvite && notification.inviteData.message && (
                                    <p className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] mt-1">{notification.inviteData.message}</p>
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
                        </button>
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
