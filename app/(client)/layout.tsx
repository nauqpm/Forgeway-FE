"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import Sidebar from "@/modules/shared/components/common/components/Sidebar";
import NotificationPanel from "@/modules/shared/components/common/components/NotificationPanel";
import { notificationService } from "@/common/services/notification.service";
import { useNotificationRealtime } from "@/hooks/realtime/use-notification-realtime";
import { useWorkspaceRealtime } from "@/hooks/realtime/use-workspace-realtime";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Filters } from "@/modules/client/workspaces/types/filter.type";
import AppHeader from "@/modules/client/common/layout/AppHeader";

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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { setCurrentWorkspace, currentWorkspace, setWorkspaces, workspaces, workspacesLoaded } = useWorkspaceStore();
  const router = useRouter();
  const pathname = usePathname();

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isTaskSearchReady, setIsTaskSearchReady] = useState(false);
  const taskSearchHydrationPathRef = useRef<string | null>(null);

  // Task search filters state
  const workspaceKey = pathname?.startsWith("/workspaces/") ? pathname.split("/")[2] : "";
  const [taskSearchFilters, setTaskSearchFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    workspaceKey,
  });

  // Default workspace keys for search
  const searchProjects = (workspaces.length > 0 ? workspaces : currentWorkspace ? [currentWorkspace] : [])
    .filter(Boolean)
    .map((workspace) => {
      const id = workspace._id || (workspace as { id?: string }).id;
      const key = workspace.key || workspace.slug;
      return id && key ? { id, name: workspace.name, key } : null;
    })
    .filter((workspace): workspace is { id: string; name: string; key: string } => Boolean(workspace));
  const defaultSearchWorkspaceKeys = workspaceKey
    ? [workspaceKey]
    : searchProjects.map((workspace) => workspace.key);

  // Refresh notification count
  const refreshUnreadNotificationCount = useCallback(() => {
    if (!isAuthenticated) return;
    notificationService
      .unreadCount()
      .then(setUnreadNotificationCount)
      .catch(() => setUnreadNotificationCount(0));
  }, [isAuthenticated]);

  // Setup real-time connections
  useNotificationRealtime({
    enabled: isAuthenticated,
    onCreated: refreshUnreadNotificationCount,
    onRead: refreshUnreadNotificationCount,
    onReadAll: refreshUnreadNotificationCount,
  });
  useWorkspaceRealtime({ enabled: isAuthenticated });

  // Load workspaces on mount
  useEffect(() => {
    refreshUnreadNotificationCount();
  }, [refreshUnreadNotificationCount]);

  useEffect(() => {
    if (isAuthenticated && !workspacesLoaded) {
      import("@/common/services/api.service").then(({ default: api }) => {
        import("@/config/apiRoutes").then(({ apiRoutes }) => {
          api.get(apiRoutes.WORKSPACES.BASE)
            .then((res) => {
              const data = (res as { data?: unknown }).data;
              const workspaces = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];
              setWorkspaces(workspaces);
            })
            .catch(() => {});
        });
      });
    }
  }, [isAuthenticated, workspacesLoaded, setWorkspaces]);

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Hydrate filters from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsTaskSearchReady(false);
      return;
    }
    if (!workspaceKey && !workspacesLoaded) return;

    const hydrationPath = pathname || "";
    if (taskSearchHydrationPathRef.current === hydrationPath) return;

    const params = new URLSearchParams(window.location.search);
    const csv = (value: string | null) => value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
    const label = (value: string) =>
      value
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

    setTaskSearchFilters((prev) => ({
      ...prev,
      workspaceKey,
      workspaceKeys: csv(params.get("workspaceKeys")).length > 0
        ? csv(params.get("workspaceKeys"))
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
  }, [pathname, workspaceKey, workspacesLoaded, defaultSearchWorkspaceKeys.join(",")]);

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
    <div className="min-h-screen bg-[#F2FAFF] dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] transition-colors duration-200">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        data-sidebar={sidebarCollapsed ? "collapsed" : "expanded"}
        className="app-shell-offset transition-all duration-300"
      >
        <AppHeader
          sidebarCollapsed={sidebarCollapsed}
          onMobileOpen={() => setMobileOpen(true)}
          taskSearchFilters={taskSearchFilters}
          setTaskSearchFilters={setTaskSearchFilters}
          isTaskSearchReady={isTaskSearchReady}
          defaultSearchWorkspaceKeys={defaultSearchWorkspaceKeys}
          workspaceKey={workspaceKey}
        />

        {showNotifications && (
          <NotificationPanel
            onClose={() => setShowNotifications(false)}
            onUnreadCountChange={setUnreadNotificationCount}
          />
        )}

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
