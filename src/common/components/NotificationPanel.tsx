"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, FileText, Loader2, MoreHorizontal, X } from "lucide-react";
import {
  AppNotification,
  notificationService,
  NotificationType,
} from "@/common/services/notification.service";

interface NotificationPanelProps {
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

type NotificationCategory = "DIRECT" | "WATCHING";

interface NotificationViewModel {
  id: string;
  actor: { name: string; avatar?: string };
  actionText: string;
  target?: { id?: string; key?: string; title?: string; type: string };
  createdAt: string;
  isRead: boolean;
  category: NotificationCategory;
  type: "STANDARD" | "INVITE";
  inviteData?: { workspaceName: string; message: string };
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

function mapNotification(notification: AppNotification): NotificationViewModel {
  const name = actorName(notification);
  const metadata = notification.metadata ?? {};
  const taskKey = typeof metadata.taskKey === "string" ? metadata.taskKey : undefined;
  const taskTitle = typeof metadata.taskTitle === "string" ? metadata.taskTitle : notification.message;
  const workspaceName =
    typeof metadata.workspaceName === "string" ? metadata.workspaceName : notification.message || "Workspace";

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
    category: DIRECT_TYPES.includes(notification.type) ? "DIRECT" : "WATCHING",
    type: notification.type === "WORKSPACE_INVITED" ? "INVITE" : "STANDARD",
    inviteData: notification.type === "WORKSPACE_INVITED"
      ? {
          workspaceName,
          message: notification.message || "You have a pending workspace invite.",
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
  const [notifications, setNotifications] = useState<NotificationViewModel[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationCategory>("DIRECT");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
      className="absolute right-0 top-12 w-[min(calc(100vw-32px),420px)] bg-white dark:bg-gray-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 dark:border-gray-700 z-50 flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="px-4 pt-4 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Unread</span>
            <button
              onClick={() => setShowUnreadOnly((value) => !value)}
              className={`h-5 w-9 rounded-full relative transition-colors ${showUnreadOnly ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"}`}
              aria-pressed={showUnreadOnly}
            >
              <span className={`h-4 w-4 bg-white rounded-full absolute top-0.5 transition-transform ${showUnreadOnly ? "translate-x-4 left-0.5" : "left-0.5"}`} />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((value) => !value)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={markAllAsRead}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-gray-400" />
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("DIRECT")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "DIRECT" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            Direct
          </button>
          <button
            onClick={() => setActiveTab("WATCHING")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "WATCHING" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            Watching
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-gray-800/30">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">You're all caught up!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No notifications here.</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {groupOrder.map((group) => {
              const items = groupedNotifications[group];
              if (!items?.length) return null;

              return (
                <div key={group}>
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{group}</h3>
                  <div className="space-y-1">
                    {items.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`w-full text-left relative p-3 rounded-xl transition-all group hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 ${!notification.isRead ? "bg-indigo-50/40 dark:bg-indigo-900/10" : ""}`}
                      >
                        {!notification.isRead && (
                          <span className="absolute top-4 right-3 w-2.5 h-2.5 bg-[#0c66e4] rounded-full" />
                        )}

                        <div className="flex items-start gap-3 pr-6">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm overflow-hidden">
                            {notification.actor.avatar?.startsWith("http") ? (
                              <img src={notification.actor.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              notification.actor.avatar
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                              <span className="font-semibold text-gray-900 dark:text-white">{notification.actor.name}</span> {notification.actionText}
                            </p>

                            {notification.type === "STANDARD" && notification.target && (
                              <div className="mt-1.5 flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 w-fit max-w-full hover:border-indigo-300 transition-colors">
                                <FileText className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                  {notification.target.key ? `${notification.target.key}: ` : ""}{notification.target.title}
                                </span>
                              </div>
                            )}

                            {notification.type === "INVITE" && notification.inviteData && (
                              <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{notification.inviteData.workspaceName}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.inviteData.message}</p>
                              </div>
                            )}

                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatTime(notification.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
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