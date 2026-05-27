"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import Sidebar from "@/modules/admin/components/common/components/Sidebar";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import NotificationPanel from "@/modules/admin/components/common/components/NotificationPanel";
import { Loader2, Menu, Sun, Moon, Monitor, User, Settings, LogOut, Shield, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import JiraSearchDropdown from "@/modules/client/workspaces/components/JiraSearchDropdown";
import { Filters } from "@/modules/client/workspaces/types/filter.type";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { setCurrentWorkspace, currentWorkspace, setWorkspaces, workspaces, workspacesLoaded } = useWorkspaceStore();
  const { theme, setTheme } = useTheme();
  const { hasAdminAccess } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();
  const workspaceKey = pathname?.startsWith("/workspaces/") ? pathname.split("/")[2] : "";
  const activeWorkspaceKey = workspaceKey || currentWorkspace?.key || currentWorkspace?.slug || "AL";
  const [taskSearchFilters, setTaskSearchFilters] = useState<Filters>({
    search: "",
    assigneeId: null,
    reporterId: null,
    taskKey: null,
    workspaceKey,
    lastUpdated: null,
    priority: null,
    type: null,
    assignees: [],
    types: [],
    statuses: [],
    priorities: [],
    backlog: false,
    archived: false,
  });
  const [isTaskSearchReady, setIsTaskSearchReady] = useState(false);

  const searchProjects = (workspaces.length > 0 ? workspaces : currentWorkspace ? [currentWorkspace] : [])
    .map((workspace) => ({
      id: workspace._id,
      name: workspace.name,
      key: workspace.key || workspace.slug,
    }))
    .filter((workspace) => Boolean(workspace.key));
  const searchAssignees = (currentWorkspace?.members ?? []).map((member) => {
    const memberId =
      typeof member.userId === "string"
        ? member.userId
        : member.userId._id || member.userId.id || "member";

    return {
      id: memberId,
      name: memberId === user?.id ? user?.fullName || user?.email || "You" : memberId,
    };
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !workspacesLoaded) {
      api.get(apiRoutes.WORKSPACES.BASE).then((res) => {
        setWorkspaces(res.data?.data ?? res.data);
      }).catch(() => {});
    }
  }, [isAuthenticated, workspacesLoaded, setWorkspaces]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!workspaceKey || typeof window === "undefined") {
      setIsTaskSearchReady(false);
      setTaskSearchFilters((prev) => ({ ...prev, workspaceKey }));
      return;
    }

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
      search: params.get("search") || "",
      taskKey: params.get("taskKey"),
      statuses: csv(params.get("status")).map((item) => {
        if (item === "todo") return "To Do";
        if (item === "inprogress") return "In Progress";
        return label(item);
      }),
      types: csv(params.get("type")).map(label),
      priorities: csv(params.get("priority")).map(label),
      assignees: csv(params.get("assigneeId")),
      reporterId: params.get("reporterId"),
      backlog: params.get("backlog") === "true",
      archived: params.get("archived") === "true",
    }));
    setIsTaskSearchReady(true);
  }, [workspaceKey]);

  useEffect(() => {
    if (!workspaceKey || !isTaskSearchReady || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const setOrDelete = (key: string, value?: string | null) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };
    const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");

    setOrDelete("search", taskSearchFilters.search.trim());
    setOrDelete("taskKey", taskSearchFilters.taskKey);
    setOrDelete("status", taskSearchFilters.statuses.map(normalize).join(","));
    setOrDelete("type", taskSearchFilters.types.map(normalize).join(","));
    setOrDelete("priority", taskSearchFilters.priorities.map(normalize).join(","));
    setOrDelete("assigneeId", taskSearchFilters.assignees.join(","));
    setOrDelete("reporterId", taskSearchFilters.reporterId);
    if (taskSearchFilters.backlog) params.set("backlog", "true");
    else params.delete("backlog");
    if (taskSearchFilters.archived) params.set("archived", "true");
    else params.delete("archived");

    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
    window.dispatchEvent(new CustomEvent("taskFiltersChanged", { detail: taskSearchFilters }));
  }, [isTaskSearchReady, pathname, taskSearchFilters, workspaceKey]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Dang xac thuc...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
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
        <header className="app-header bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="hidden w-[clamp(520px,44vw,680px)] md:block">
              <JiraSearchDropdown
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
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={`Theme: ${theme}`}
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              ) : theme === 'system' ? (
                <Monitor className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <Sun className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>

            {/* Notification */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
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
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User avatar + dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-indigo-500 transition flex items-center justify-center bg-indigo-600 text-white text-sm font-medium"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.fullName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? "U"}</span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.fullName ?? "User"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { router.push("/account"); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User className="w-4 h-4" /> Hồ sơ cá nhân
                  </button>
                  <button
                    onClick={() => { router.push("/settings"); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Cài đặt
                  </button>
                  {hasAdminAccess() && (
                    <button
                      onClick={() => { router.push("/admin"); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Shield className="w-4 h-4" /> Trang quản trị
                    </button>
                  )}
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <button
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}


