"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";

import Sidebar from "@/modules/admin-shared/components/common/components/Sidebar";
import NotificationPanel from "@/modules/admin-shared/components/common/components/NotificationPanel";
import {
  notificationService,
  type AppNotification,
  type NotificationListResponse,
} from "@/modules/notifications/services/notification.service";
import { queryKeys } from "@/shared/constants/queryKeys";
import { useNotificationRealtime } from "@/lib/realtime/hooks/use-notification-realtime";
import { useWorkspaceRealtime } from "@/lib/realtime/hooks/use-workspace-realtime";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";
import {
  ChevronDown,
  LayoutDashboard,
  Loader2,
  Menu,
  Sun,
  Moon,
  Monitor,
  Repeat,
  Shield,
  User,
  Settings,
  LogOut,
  X,
  Search,
  Key,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import sdlcLogo from "../Logo_AutomationLand_AI_SDLC-removebg.png";
import { usePathname, useRouter } from "next/navigation";
import { Filters } from "@/modules/workspace/shared/types/filter.type";

import SearchDropdown from "@/modules/workspace/shared/components/SearchDropdown";

import ChatRealtimeHandler from "@/modules/client/chat/components/ChatRealtimeHandler";
import { useTheme } from "@/shared/hooks/useTheme";
import { ADMIN_URL, IS_SUPER_ADMIN } from "@/lib/admin-url";
import { useAccountSwitcherStore } from "@/stores/account-switcher.store";
import AccountSwitcher from "@/shared/components/layout/account-switcher/AccountSwitcher";

type SearchAssigneeUser = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  avatar?: string;
  avatarUrl?: string;
  image?: string;
};

// Constants for filter synchronization
const DEFAULT_FILTERS: Filters = {
  search: "",
  assigneeId: null,
  reporterId: null,
  taskKey: null,
  workspaceKey: "",
  workspaceKeys: [],
  lastUpdated: null,
  priority: null,
  type: null,
  assignees: [],
  types: [],
  statuses: [],
  priorities: [],
  backlog: false,
  archived: false,
};

import logoIcon from "../icon.png";



export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { currentWorkspace, workspaces, isLoading: isWorkspacesLoading } = useCurrentWorkspace();
  const { theme, setTheme } = useTheme();

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [hasFetchedSwitcher, setHasFetchedSwitcher] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const switchableCount = useAccountSwitcherStore((state) =>
    state.accounts.reduce(
      (count, account) => count + (account.isCurrent ? 0 : 1),
      0,
    ),
  );
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const workspaceKey = pathname?.startsWith("/workspaces/") ? pathname.split("/")[2] : "";
  const activeWorkspaceKey = workspaceKey || currentWorkspace?.key || currentWorkspace?.slug || "AL";

  const [taskSearchFilters, setTaskSearchFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    workspaceKey,
  });
  const [isTaskSearchReady, setIsTaskSearchReady] = useState(false);
  const taskSearchHydrationPathRef = useRef<string | null>(null);
  const { data: unreadNotificationCount = 0 } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationService.unreadCount(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  const handleUnreadNotificationCountChange = useCallback(
    (count: number) => {
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), count);
    },
    [queryClient]
  );

  // Default workspace keys for search
  const searchProjects = useMemo(
    () =>
      (workspaces.length > 0 ? workspaces : currentWorkspace ? [currentWorkspace] : [])
        .filter(Boolean)
        .map((workspace) => {
          const id = workspace._id || (workspace as { id?: string }).id;
          const key = workspace.key || workspace.slug;
          return id && key ? { id, name: workspace.name, key } : null;
        })
        .filter((workspace): workspace is { id: string; name: string; key: string } => Boolean(workspace)),
    [currentWorkspace, workspaces]
  );
  const defaultSearchWorkspaceKeys = useMemo(
    () => searchProjects.map((workspace) => workspace.key).filter(Boolean) as string[],
    [searchProjects],
  );
  const searchAssignees = (currentWorkspace?.members ?? [])
    .filter((member) => member && member.userId)
    .map((member) => {
      const memberUser = member.userId;
      const memberUserProfile = typeof memberUser === "string" ? null : (memberUser as SearchAssigneeUser);
      const memberId =
        typeof memberUser === "string" ? memberUser : memberUserProfile?._id || memberUserProfile?.id || "member";
      const memberName =
        typeof memberUser === "string"
          ? memberUser
          : memberUserProfile?.fullName || memberUserProfile?.name || memberUserProfile?.email || memberId;
      const memberAvatar =
        typeof memberUser === "string"
          ? undefined
          : memberUserProfile?.avatar || memberUserProfile?.avatarUrl || memberUserProfile?.image;

      return {
        id: memberId,
        name: memberId === user?.id ? user?.fullName || user?.email || memberName : memberName,
        avatar: memberAvatar,
      };
    });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
        setShowSwitcher(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const refreshUnreadNotificationCount = useCallback(() => {
    if (!isAuthenticated) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
  }, [isAuthenticated, queryClient]);

  const handleNotificationCreated = useCallback(
    (notification?: AppNotification) => {
      if (!isAuthenticated || !notification) return;

      const listKey = queryKeys.notifications.list();
      const current = queryClient.getQueryData<NotificationListResponse>(listKey);

      if (!current) {
        queryClient.invalidateQueries({ queryKey: listKey });
      } else {
        queryClient.setQueryData<NotificationListResponse>(listKey, {
          ...current,
          total: current.notifications.some((item) => item.id === notification.id) ? current.total : current.total + 1,
          notifications: current.notifications.some((item) => item.id === notification.id)
            ? current.notifications.map((item) => (item.id === notification.id ? notification : item))
            : [notification, ...current.notifications],
        });
      }

      refreshUnreadNotificationCount();
    },
    [isAuthenticated, queryClient, refreshUnreadNotificationCount]
  );

  // Setup real-time connections
  useNotificationRealtime({
    enabled: isAuthenticated,
    onCreated: handleNotificationCreated,
    onRead: refreshUnreadNotificationCount,
    onReadAll: refreshUnreadNotificationCount,
  });
  useWorkspaceRealtime({ enabled: isAuthenticated });

  const mustChangePassword = (user as any)?.mustChangePassword;

  // Auth redirect
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (mustChangePassword && pathname !== "/change-password") {
        router.replace("/change-password");
      }
    }
  }, [isAuthenticated, isLoading, router, mustChangePassword, pathname]);

  // Hydrate filters from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsTaskSearchReady(false);
      return;
    }
    if (isWorkspacesLoading) return;

    const hydrationPath = pathname || "";
    if (taskSearchHydrationPathRef.current === hydrationPath) return;

    const params = new URLSearchParams(window.location.search);
    const csv = (value: string | null) =>
      value
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) ?? [];
    const label = (value: string) =>
      value
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

    setTaskSearchFilters((prev) => ({
      ...prev,
      workspaceKey,
      workspaceKeys:
        csv(params.get("workspaceKeys")).length > 0
          ? csv(params.get("workspaceKeys"))
          : prev.workspaceKeys && prev.workspaceKeys.length > 0
            ? prev.workspaceKeys
            : defaultSearchWorkspaceKeys,
      search: params.get("search") || "",
      taskKey: params.get("taskKey") ?? null,
      statuses: csv(params.get("status")).map((item) => {
        if (item === "todo") return "To Do";
        if (item === "inprogress") return "In Progress";
        return label(item);
      }),
      types: csv(params.get("type")).map(label),
      priorities: csv(params.get("priority")).map(label),
      assignees: csv(params.get("assigneeId")),
      reporterId: params.get("reporterId") ?? null,
      lastUpdated: params.get("lastUpdated") ?? null,
      backlog: params.get("backlog") === "true",
      archived: params.get("archived") === "true",
    }));
    taskSearchHydrationPathRef.current = hydrationPath;
    setIsTaskSearchReady(true);
  }, [pathname, workspaceKey, isWorkspacesLoading, defaultSearchWorkspaceKeys]);

  // Sync filters to URL
  useEffect(() => {
    if (!workspaceKey || !isTaskSearchReady || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const setOrDelete = (key: string, value?: string | null) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };
    const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");

    setOrDelete("search", taskSearchFilters.search.trim());
    setOrDelete("taskKey", taskSearchFilters.taskKey ?? undefined);
    params.delete("workspaceKeys");
    setOrDelete("status", taskSearchFilters.statuses.map(normalize).join(","));
    setOrDelete("type", taskSearchFilters.types.map(normalize).join(","));
    setOrDelete("priority", taskSearchFilters.priorities.map(normalize).join(","));
    setOrDelete("assigneeId", taskSearchFilters.assignees.join(","));
    setOrDelete("reporterId", taskSearchFilters.reporterId ?? undefined);
    setOrDelete("lastUpdated", taskSearchFilters.lastUpdated ?? undefined);
    if (taskSearchFilters.backlog) params.set("backlog", "true");
    else params.delete("backlog");
    if (taskSearchFilters.archived) params.set("archived", "true");
    else params.delete("archived");

    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
    window.dispatchEvent(new CustomEvent("taskFiltersChanged", { detail: taskSearchFilters }));
  }, [isTaskSearchReady, pathname, taskSearchFilters, workspaceKey]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2FAFF] dark:bg-[#202020]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] dark:text-[#3B82F6]" />
          <p className="text-sm text-[#787774] dark:text-[#9B9A97]">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;



  return (
    <div className="h-screen overflow-hidden bg-[#F2FAFF] dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] transition-colors duration-200">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        data-sidebar={sidebarCollapsed ? "collapsed" : "expanded"}
        className="app-shell-offset transition-all duration-300 flex flex-col h-full"
      >
        <header className="app-header px-2 sm:px-3 md:px-4 bg-white dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
            </button>

            <button
              onClick={() => setShowMobileSearch(true)}
              className="lg:hidden p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px]"
            >
              <Search className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
            </button>

            {showMobileSearch && (
              <div className="fixed inset-0 z-[9999] bg-white dark:bg-[#202020] flex flex-col">
                {/* top bar */}
                <div className="flex items-center gap-2 p-3 border-b border-[#EAEAEA] dark:border-white/10">
                  <button onClick={() => setShowMobileSearch(false)} className="p-2">
                    <svg className="w-5 h-5 text-[#787774]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                {/* dropdown search */}
                <div className="flex-1 overflow-y-auto">
                  <SearchDropdown
                    filters={taskSearchFilters}
                    setFilters={setTaskSearchFilters}
                    projects={searchProjects}
                    assignees={searchAssignees}
                    workspaceKey={activeWorkspaceKey}
                    currentUserId={user?.id}
                    currentUserName={user?.fullName || user?.email}
                  />
                </div>
              </div>
            )}

            {/* Logo in topbar — desktop only, slides in when sidebar is collapsed */}
            <div
              className={`hidden lg:flex items-center flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
                sidebarCollapsed ? "max-w-[12rem] opacity-100" : "max-w-0 opacity-0 pointer-events-none"
              }`}
            >
              <Link href="/" className="flex items-center px-1">
                <Image
                  src={sdlcLogo}
                  alt="AutomationLand AI SDLC"
                  height={36}
                  width={160}
                  className="h-9 w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Search bar */}
            <div className="hidden md:block flex-1 max-w-[680px] min-w-[280px]">
              <SearchDropdown
                filters={taskSearchFilters}
                setFilters={setTaskSearchFilters}
                projects={searchProjects}
                assignees={searchAssignees}
                workspaceKey={activeWorkspaceKey}
                currentUserId={user?.id}
                currentUserName={user?.fullName || user?.email}
                className=""
                inputClassName="h-10 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-2 lg:gap-3 shrink-0">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")}
              className="p-2 sm:p-2 md:p-2 lg:p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors"
              title={`Theme: ${theme}`}
            >
              {theme === "dark" ? (
                <Moon className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
              ) : theme === "system" ? (
                <Monitor className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
              ) : (
                <Sun className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
              )}
            </button>

            {/* Notification */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors"
            >
              <svg
                className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#9F2F2D] text-white text-[0.625rem] leading-5 rounded-full text-center font-semibold">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* User avatar + dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[#444444] dark:text-gray-200 transition hover:bg-[#DBEAFE] dark:hover:bg-white/10"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    (user?.fullName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? "U")
                  )}
                </div>
                <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                  {user?.fullName ?? user?.email}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-[#EAEAEA] bg-white py-2 shadow-xl shadow-black/10 dark:border-white/[0.08] dark:bg-[#202020] dark:shadow-black/40">
                  <div className="flex items-start gap-2 border-b border-[#EAEAEA] px-4 py-2 dark:border-white/[0.06]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
                        {user?.fullName ?? "User"}
                      </p>
                      <p className="truncate text-xs text-[#787774] dark:text-[#9B9A97]">{user?.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSwitcher((v) => !v)}
                      title="Switch account"
                      aria-label="Switch account"
                      aria-expanded={showSwitcher}
                      className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-md transition ${
                        showSwitcher
                          ? "bg-[#EFF6FF] text-[#2563EB] dark:bg-indigo-500/15 dark:text-indigo-300"
                          : "text-[#2563EB] hover:bg-[#EFF6FF] dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                      }`}
                    >
                      {showSwitcher ? <X className="h-3.5 w-3.5" /> : <Repeat className="h-4 w-4" />}
                      {switchableCount > 0 && !showSwitcher && (
                        <span className="absolute -right-0.5 -top-0.5 min-w-[14px] rounded-full bg-[#2563EB] px-1 text-[9px] font-semibold leading-[14px] text-white dark:bg-indigo-500">
                          {switchableCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {showSwitcher && (
                    <div className="border-b border-[#EAEAEA] dark:border-white/[0.06]">
                      <AccountSwitcher
                        open={showSwitcher}
                        hasFetched={hasFetchedSwitcher}
                        setHasFetched={setHasFetchedSwitcher}
                        onCloseMenu={() => {
                          setShowUserMenu(false);
                          setShowSwitcher(false);
                        }}
                      />
                    </div>
                  )}

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111111] transition hover:bg-[#F7F6F3] dark:text-[#E8E8E7] dark:hover:bg-[#252525]"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSwitcher(false);
                    }}
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#2563EB]" />
                    Dashboard
                  </Link>

                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111111] transition hover:bg-[#F7F6F3] dark:text-[#E8E8E7] dark:hover:bg-[#252525]"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSwitcher(false);
                    }}
                  >
                    <User className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111111] transition hover:bg-[#F7F6F3] dark:text-[#E8E8E7] dark:hover:bg-[#252525]"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSwitcher(false);
                    }}
                  >
                    <Settings className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
                    Settings
                  </Link>

                  {IS_SUPER_ADMIN(user?.role) && (
                    <div className="mt-2 border-t border-[#EAEAEA] pt-2 dark:border-white/[0.06]">
                      <a
                        href={ADMIN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowSwitcher(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#2563EB] transition hover:bg-[#EFF6FF] dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                      >
                        <Shield className="h-4 w-4" />
                        Admin
                        <span className="ml-auto text-[10px] uppercase tracking-wider text-[#9B9A97] dark:text-[#6B6B6B]">
                          -&gt;
                        </span>
                      </a>
                    </div>
                  )}

                  <div className="mt-2 border-t border-[#EAEAEA] pt-2 dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowSwitcher(false);
                        void logout();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {showNotifications && (
          <NotificationPanel
            onClose={() => setShowNotifications(false)}
            onUnreadCountChange={handleUnreadNotificationCountChange}
          />
        )}

        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto relative">{children}</main>
      </div>
      <ChatRealtimeHandler />
    </div>
  );
}
