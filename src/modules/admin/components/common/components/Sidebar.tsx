"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import appleIcon from "../../../../../../app/apple-icon.png";
import Image from "next/image";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useAuth } from "@/context/AuthContext";
import { isGlobalAdminRole } from "@/modules/auth/shared/utils/admin-role";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Zap,
  X,
  Shield,
  UserCog,
  Building2,
  Clock7,
  Star,
  ListFilter,
  Search,
  Columns,
  FolderOpen,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const mainNav = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Sparkles, label: "For You", href: "/for-you" },
  { icon: Clock7, label: "Recent", href: "/recent" },
  { icon: Star, label: "Starred", href: "/starred" },
  {
    icon: BookOpen,
    label: "Workspaces",
    href: "/workspaces",
    badge: null,
  },
  { icon: ListFilter, label: "Filter", href: "/filter" },
  { icon: FolderOpen, label: "Documents", href: "/documents" },
  { icon: BarChart3, label: "Reports", href: "/reports", badge: "Coming soon" },
];

const adminNav = [
  { icon: UserCog, label: "User Management", href: "/dashboard/users" },
  { icon: Building2, label: "Workspace Settings", href: "/dashboard/workspace" },
  { icon: Zap, label: "Workflows", href: "/dashboard/workflows" },
  { icon: Shield, label: "Permissions", href: "/dashboard/permissions" },
];

const SHOW_RECENT_NAV = false;
const SHOW_STARRED_NAV = false;
const SHOW_ADMIN_NAV = false;

const optionFilter = [
  { title: "My tasks", slug: "my-tasks" },
  { title: "Created by me", slug: "created-by-me" },
  { title: "My incomplete tasks", slug: "my-incomplete" },
  { title: "Incomplete", slug: "incomplete" },
  { title: "Recently created", slug: "recently-created" },
  { title: "Recently viewed", slug: "recently-viewed" },
  { title: "Recently updated", slug: "recently-updated" },
  { title: "Recently completed", slug: "recently-completed" },
];

type SidebarPopoverType = "for_you" | "recent" | "starred" | "more_workspaces";

const NavItem = ({
  item,
  showBadge,
  pathname,
  onMobileClose,
  collapsed,
}: {
  item: (typeof mainNav)[0];
  showBadge?: boolean;
  pathname: string;
  onMobileClose: () => void;
  collapsed: boolean;
}) => {
  const isActive =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href));
  return (
    <Link
      href={item.href}
      onClick={onMobileClose}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative ${
        isActive
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
      }`}
    >
      <item.icon
        className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:text-gray-500 dark:group-hover:text-gray-300"}`}
      />
      {!collapsed && (
        <>
          <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
          {showBadge && item.badge && (
            <span className="text-[10px] bg-slate-200 text-slate-500 dark:bg-gray-700 dark:text-gray-400 px-1.5 py-0.5 rounded font-medium">
              {item.badge}
            </span>
          )}
        </>
      )}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-full" />
      )}
    </Link>
  );
};

const PopoverNavItem = ({
  item,
  type,
  activePopover,
  setActivePopover,
  collapsed,
  mounted,
  forYouWorkspaces = [],
  onMobileClose,
}: {
  item: (typeof mainNav)[0];
  type: "for_you" | "recent" | "starred";
  activePopover: SidebarPopoverType | null;
  setActivePopover: (val: SidebarPopoverType | null) => void;
  collapsed: boolean;
  mounted: boolean;
  forYouWorkspaces?: any[];
  onMobileClose?: () => void;
}) => {
  const isActive = activePopover === type;
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: "0px" });
  const [forYouSearch, setForYouSearch] = useState("");
  const filteredForYouWorkspaces = forYouWorkspaces.filter((workspace) => {
    const query = forYouSearch.trim().toLowerCase();
    if (!query) return true;

    return [
      workspace.name,
      workspace.key,
      workspace.slug,
      workspace.type,
      workspace.role,
      workspace.relationship,
      workspace.ownershipLabel,
      workspace.status,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const handleToggle = () => {
    if (isActive) {
      setActivePopover(null);
    } else {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setPos({
          top: rect.top,
          left: collapsed
            ? "calc(var(--app-sidebar-collapsed) + 12px)"
            : "calc(var(--app-sidebar-expanded) + 12px)",
        });
      }
      setActivePopover(type);
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
          isActive
            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        }`}
      >
        <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:text-gray-500 dark:group-hover:text-gray-300"}`} />
        {!collapsed && (
          <>
            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        )}
      </button>

      {isActive && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActivePopover(null)} />
          <div
            className="app-popover fixed bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl z-[9999] flex flex-col"
            style={{ top: `${pos.top}px`, left: pos.left }}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-gray-800">
              <span className="font-semibold text-slate-900 dark:text-gray-100">{item.label}</span>
              <button onClick={() => setActivePopover(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-md text-slate-500 dark:text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {type === "for_you" && (
              <div className="flex flex-col max-h-[60vh]">
                <div className="p-3 border-b border-slate-100 dark:border-gray-800">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 dark:text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={forYouSearch}
                      onChange={(event) => setForYouSearch(event.target.value)}
                      placeholder="Search for you items"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-750 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-2">
                  {forYouWorkspaces.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                        No workspace suggestions
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                        Workspaces you own or join will appear here.
                      </p>
                    </div>
                  ) : filteredForYouWorkspaces.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-gray-800 dark:text-gray-500">
                        <Search className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                        No matching items
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                        Try another workspace name, key, role, or status.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {filteredForYouWorkspaces.slice(0, 8).map((workspace) => {
                        const routeKey = workspace.key || workspace.slug || workspace.id || workspace._id;

                        return (
                          <Link
                            key={workspace.id || workspace._id || routeKey}
                            href={`/workspaces/${routeKey}`}
                            className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg group transition-colors"
                            onClick={() => {
                              setActivePopover(null);
                              onMobileClose?.();
                            }}
                          >
                            <div className="w-7 h-7 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                              {workspace.name?.charAt(0) || "W"}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {workspace.name}
                              </p>
                              <p className="truncate text-[11px] capitalize text-slate-500 dark:text-gray-500">
                                {workspace.ownershipLabel || workspace.relationship || workspace.role?.replace(/_/g, " ") || workspace.type || "Workspace"}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-gray-800">
                  <Link
                    href="/for-you"
                    className="flex w-full items-center justify-between p-2 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => {
                      setActivePopover(null);
                      onMobileClose?.();
                    }}
                  >
                    <span>View all for you items</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            {type === "recent" && (
              <div className="flex flex-col max-h-[60vh]">
                <div className="p-3 border-b border-slate-100 dark:border-gray-800">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 dark:text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search recent items"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-750 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-gray-500 mb-1 px-2 uppercase tracking-wider">Today</h4>
                    <div className="space-y-0.5">
                      <Link href="/workspaces/mock-1" className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 flex items-center justify-center text-slate-500 dark:text-gray-400 group-hover:border-slate-300 dark:group-hover:border-gray-600"><Columns className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">QUAN board</p>
                          <p className="text-[11px] text-slate-500 dark:text-gray-500">6 seconds ago</p>
                        </div>
                      </Link>
                      <Link href="/workspaces/mock-2" className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">Q</div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">quan</p>
                          <p className="text-[11px] text-slate-500 dark:text-gray-500">7 seconds ago</p>
                        </div>
                      </Link>
                      <Link href="/filter/my-tasks" className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded flex items-center justify-center text-slate-400 dark:text-gray-500 group-hover:text-slate-600 dark:group-hover:text-gray-300"><ListFilter className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Reported by me</p>
                          <p className="text-[11px] text-slate-500 dark:text-gray-500">14 seconds ago</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-gray-500 mb-1 px-2 uppercase tracking-wider">More than 1 month ago</h4>
                    <div className="space-y-0.5">
                      <Link href="/workspaces/mock-3" className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 flex items-center justify-center text-slate-500 dark:text-gray-400 group-hover:border-slate-300 dark:group-hover:border-gray-600"><Columns className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">SCRUM board</p>
                          <p className="text-[11px] text-slate-500 dark:text-gray-500">5 days ago</p>
                        </div>
                      </Link>
                      <Link href="/workspaces/mock-4" className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm"><Zap className="w-3.5 h-3.5" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">My Software Team</p>
                          <p className="text-[11px] text-slate-500 dark:text-gray-500">5 days ago</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-gray-800">
                  <button className="w-full text-left p-2 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    View all recent items
                  </button>
                </div>
              </div>
            )}

            {type === "starred" && (
              <div className="flex flex-col">
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="w-20 h-20 mb-4 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-full scale-150 opacity-50" />
                    <Star className="w-10 h-10 text-indigo-300 dark:text-indigo-500 relative z-10 fill-indigo-100/50 dark:fill-indigo-900/50" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center z-20 text-white shadow-sm border-2 border-white dark:border-gray-900">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="text-[15px] font-bold text-slate-900 dark:text-gray-100 mb-2 mt-4">You have not starred any items yet.</h4>
                  <p className="text-[13px] text-slate-500 dark:text-gray-400 leading-relaxed">Star important items for quick access. They will appear here.</p>
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-gray-800">
                  <button className="w-full text-left p-2 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    View all starred items
                  </button>
                </div>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default function Sidebar({
  collapsed,
  onCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuth();
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/dashboard"));
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sidebarWorkspaces, setsidebarWorkspaces] = useState<any[]>([]);
  const [forYouWorkspaces, setForYouWorkspaces] = useState<any[]>([]);
  const [activePopover, setActivePopover] = useState<SidebarPopoverType | null>(null);
  const [moreWorkspacesPos, setMoreWorkspacesPos] = useState({ top: 0, left: "0px" });
  const moreWorkspacesBtnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  const handleToggleMoreWorkspaces = () => {
    if (activePopover === "more_workspaces") {
      setActivePopover(null);
    } else {
      if (moreWorkspacesBtnRef.current) {
        const rect = moreWorkspacesBtnRef.current.getBoundingClientRect();
        setMoreWorkspacesPos({
          top: rect.top,
          left: collapsed
            ? "calc(var(--app-sidebar-collapsed) + 12px)"
            : "calc(var(--app-sidebar-expanded) + 12px)",
        });
      }
      setActivePopover("more_workspaces");
    }
  };

  useEffect(() => {
    setMounted(true);
    api
      .get(apiRoutes.FOR_YOU)
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        setForYouWorkspaces(Array.isArray(payload) ? payload : payload?.workspaces ?? []);
      })
      .catch(() => setForYouWorkspaces([]));

    if (currentWorkspace) {
      api.get(apiRoutes.WORKSPACES.BASE, { params: { workspaceId: currentWorkspace._id } })
        .then((res) => setsidebarWorkspaces(res.data))
        .catch(() => setsidebarWorkspaces([]));
    } else {
      setsidebarWorkspaces([]);
    }
  }, [currentWorkspace]);

  const isAdmin = isGlobalAdminRole(user?.role);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        data-collapsed={collapsed}
        className={`app-sidebar fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 z-40 transition-all duration-200 flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo / Brand */}
        <div
          className={`app-header flex items-center border-b border-slate-100 dark:border-gray-800 flex-shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Link
            href="/"
            onClick={onMobileClose}
            className={`flex items-center rounded-xl py-1.5 ${
              collapsed ? "w-full justify-center px-0" : "gap-2 px-2.5"
            }`}
          >
            <span className="grid h-11 w-11 flex-shrink-0 place-items-center p-1 shadow-indigo-500/20">
              <Image src={appleIcon} alt="SDLC Platform" width={38} height={38} className="h-9 w-9 rounded-lg object-contain" />
            </span>
            {!collapsed && (
              <span className="flex flex-col text-base font-bold leading-[0.95] tracking-tight text-blue-600">
                <span className="text-2xl">SDLC</span>
                <span>PLATFORM</span>
              </span>
            )}
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto py-3">
          {/* Create button */}
          {!collapsed && (
            <div className="px-3 mb-3">
              <Link
                href="/workspaces/create"
                onClick={() => {
                  setShowCreateMenu(false);
                  onMobileClose();
                }}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create workspace
              </Link>
            </div>
          )}
          {collapsed && (
            <div className="px-3 mb-3 flex justify-center">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Navigation */}
          <div className="px-2 space-y-0.5">
              <div className="px-2 space-y-0.5">
              {/* Dashboard */}
              <NavItem item={mainNav[0]} pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />

              {/* Workspaces */}
              <div>
                <button
                  onClick={() => setWorkspaceOpen(!workspaceOpen)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <BookOpen className="w-[18px] h-[18px] text-slate-400 dark:text-gray-500" />

                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">
                        Workspaces
                      </span>
                      {workspaceOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>

                {/* SUB NAV */}
                {workspaceOpen && !collapsed && (
                  <div className="ml-6 mt-1 space-y-1">
                    {sidebarWorkspaces.slice(0, 5).map((workspace) => (
                      <Link
                        key={workspace._id}
                        href={`/workspaces/${workspace.key}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-4 h-4 rounded bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                          {workspace.name?.charAt(0)}
                        </div>
                        <span className="truncate">{workspace.name}</span>
                      </Link>
                    ))}

                    {/* More */}
                    <button
                      ref={moreWorkspacesBtnRef}
                      onClick={handleToggleMoreWorkspaces}
                      className="w-full text-left flex items-center justify-between px-2 py-1.5 text-sm text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg group transition-colors"
                    >
                      <span>More Workspaces</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                )}
              </div>
              {/* Filters */}
              <div>
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ListFilter className="w-[18px] h-[18px] text-slate-400 dark:text-gray-500" />

                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">
                        Filters
                      </span>
                      {filterOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>

                {/* SUB NAV */}
                {filterOpen && !collapsed && (
                  <div className="ml-6 mt-1 space-y-1">
                    {optionFilter.map((filter) => (
                      <Link
                        key={filter.slug}
                        href={`/filter/${filter.slug}`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition ${
                          pathname.includes(filter.slug)
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                            : "text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span className="truncate">{filter.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents */}
              <NavItem item={mainNav[6]} pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />
            </div>
          </div>

          {/* Admin Section */}
          {SHOW_ADMIN_NAV && isAdmin && (
            <div className="mt-4 px-2">
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
              >
                {!collapsed && (
                  <>
                    {adminOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span>Administration</span>
                  </>
                )}
                {collapsed && <span className="w-full text-center">Admin</span>}
              </button>
              {adminOpen && !collapsed && (
                <div className="space-y-0.5 mt-1">
                  {adminNav.map((item) => (
                    <NavItem key={item.href} item={item} pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />
                  ))}
                </div>
              )}
              {adminOpen && collapsed && (
                <div className="space-y-0.5 mt-1">
                  {adminNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      className={`flex justify-center p-2 rounded-lg transition-colors ${pathname.startsWith(item.href) ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-gray-500 hover:bg-slate-50 dark:hover:bg-gray-800"}`}
                    >
                      <item.icon className="w-[18px] h-[18px]" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom: Workspace + Settings */}
        <div className="flex-shrink-0 border-t border-slate-100 dark:border-gray-800 p-3 space-y-1">
          {!collapsed && currentWorkspace && (
            <div className="px-3 py-2 bg-slate-50 dark:bg-gray-800 rounded-lg mb-2">
              <p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider font-semibold">
                Workspace
              </p>
              <p className="text-sm font-medium text-slate-800 dark:text-gray-200 truncate">
                {currentWorkspace.name}
              </p>
            </div>
          )}
          <Link
            href="/settings"
            onClick={onMobileClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === "/settings" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-800 dark:hover:text-gray-100"}`}
          >
            <Settings className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => onCollapse(!collapsed)}
          className="absolute -right-3 top-[52px] w-6 h-6 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-gray-800 lg:flex shadow-sm transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-gray-500" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-gray-500 rotate-90" />
          )}
        </button>
      </aside>

      {/* More Workspaces Popover */}
      {activePopover === "more_workspaces" && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActivePopover(null)} />
          <div
            className="app-popover fixed bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl z-[9999] flex flex-col"
            style={{ top: `${moreWorkspacesPos.top}px`, left: moreWorkspacesPos.left }}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-gray-800">
              <span className="font-semibold text-slate-900 dark:text-gray-100">Workspaces</span>
              <button onClick={() => setActivePopover(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-md text-slate-500 dark:text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100 dark:border-gray-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search all Workspaces"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-750 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-2">
              <Link href="/workspaces" onClick={() => setActivePopover(null)} className="w-full flex items-center gap-3 p-2 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <ListFilter className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                View all Workspaces
              </Link>
              <Link href="/workspaces/create" onClick={() => setActivePopover(null)} className="w-full flex items-center gap-3 p-2 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Plus className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                Create Workspace
              </Link>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
