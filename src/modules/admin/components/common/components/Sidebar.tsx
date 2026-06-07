"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  ChevronLeft,
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
const SIDEBAR_WORKSPACE_LIMIT = 3;
const MORE_WORKSPACE_LIMIT = 3;

type SidebarPopoverType = "for_you" | "recent" | "starred" | "more_workspaces";

const navActiveClass = "bg-[#EFF6FF] text-[#1E40AF] dark:bg-[rgba(37,99,235,0.15)] dark:text-[#93C5FD]";
const navInactiveClass = "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/5 dark:hover:text-[#E8E8E7]";
const iconActiveClass = "text-[#2563EB] dark:text-[#93C5FD]";
const iconInactiveClass = "text-[#ABABAB] group-hover:text-[#787774] dark:text-[#6B6B6B] dark:group-hover:text-[#9B9A97]";

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
      className={`flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all group relative ${collapsed ? "justify-center" : ""} ${
        isActive ? navActiveClass : navInactiveClass
      }`}
    >
      <item.icon
        className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? iconActiveClass : iconInactiveClass}`}
      />
      {!collapsed && (
        <>
          <span className="text-[13px] font-medium flex-1 text-left">{item.label}</span>
          {showBadge && item.badge && (
            <span className="text-[10px] bg-[#F0F0EE] text-[#787774] dark:bg-white/8 dark:text-[#9B9A97] px-1.5 py-0.5 rounded-[4px] font-medium">
              {item.badge}
            </span>
          )}
        </>
      )}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#2563EB] dark:bg-[#3B82F6] rounded-r-full" />
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
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all group ${
          isActive ? navActiveClass : navInactiveClass
        }`}
      >
        <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? iconActiveClass : iconInactiveClass}`} />
        {!collapsed && (
          <>
            <span className="text-[13px] font-medium flex-1 text-left">{item.label}</span>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        )}
      </button>

      {isActive && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActivePopover(null)} />
          <div
            className="app-popover fixed bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[10px] z-[9999] flex flex-col"
            style={{
              top: `${pos.top}px`,
              left: pos.left,
              boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
              <span className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">{item.label}</span>
              <button
                onClick={() => setActivePopover(null)}
                className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#ABABAB] dark:text-[#6B6B6B] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {type === "for_you" && (
              <div className="flex flex-col max-h-[60vh]">
                <div className="p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={forYouSearch}
                      onChange={(event) => setForYouSearch(event.target.value)}
                      placeholder="Search for you items"
                      className="w-full pl-9 pr-3 py-2 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-[13px] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:border-[#111111] dark:focus:border-[#3B82F6] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-2">
                  {forYouWorkspaces.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F0EE] dark:bg-white/5 text-[#787774] dark:text-[#9B9A97]">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h4 className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">
                        No workspace suggestions
                      </h4>
                      <p className="mt-1 text-[11px] text-[#787774] dark:text-[#9B9A97]">
                        Workspaces you own or join will appear here.
                      </p>
                    </div>
                  ) : filteredForYouWorkspaces.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F0EE] dark:bg-white/5 text-[#787774] dark:text-[#9B9A97]">
                        <Search className="h-5 w-5" />
                      </div>
                      <h4 className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">
                        No matching items
                      </h4>
                      <p className="mt-1 text-[11px] text-[#787774] dark:text-[#9B9A97]">
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
                            className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors"
                            onClick={() => {
                              setActivePopover(null);
                              onMobileClose?.();
                            }}
                          >
                            <div className="w-7 h-7 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] text-white flex items-center justify-center text-xs font-bold">
                              {workspace.name?.charAt(0) || "W"}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7] transition-colors">
                                {workspace.name}
                              </p>
                              <p className="truncate text-[11px] capitalize text-[#787774] dark:text-[#9B9A97]">
                                {workspace.ownershipLabel || workspace.relationship || workspace.role?.replace(/_/g, " ") || workspace.type || "Workspace"}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-[#EAEAEA] dark:border-white/[0.06]">
                  <Link
                    href="/for-you"
                    className="flex w-full items-center justify-between p-2 text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors"
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
                <div className="p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search recent items"
                      className="w-full pl-9 pr-3 py-2 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-[13px] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:border-[#111111] dark:focus:border-[#3B82F6] outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] mb-1 px-2 uppercase tracking-[0.06em]">Today</h4>
                    <div className="space-y-0.5">
                      <Link href="/workspaces/mock-1" className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded-[6px] bg-[#F0F0EE] dark:bg-white/8 border border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-center text-[#787774] dark:text-[#9B9A97]"><Columns className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7]">QUAN board</p>
                          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">6 seconds ago</p>
                        </div>
                      </Link>
                      <Link href="/workspaces/mock-2" className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white font-bold text-xs">Q</div>
                        <div>
                          <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7]">quan</p>
                          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">7 seconds ago</p>
                        </div>
                      </Link>
                      <Link href="/filter/my-tasks" className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#ABABAB] dark:text-[#6B6B6B]"><ListFilter className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7]">Reported by me</p>
                          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">14 seconds ago</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] mb-1 px-2 uppercase tracking-[0.06em]">More than 1 month ago</h4>
                    <div className="space-y-0.5">
                      <Link href="/workspaces/mock-3" className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded-[6px] bg-[#F0F0EE] dark:bg-white/8 border border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-center text-[#787774] dark:text-[#9B9A97]"><Columns className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7]">SCRUM board</p>
                          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">5 days ago</p>
                        </div>
                      </Link>
                      <Link href="/workspaces/mock-4" className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white font-bold text-xs"><Zap className="w-3.5 h-3.5" /></div>
                        <div>
                          <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7]">My Software Team</p>
                          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">5 days ago</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-2 border-t border-[#EAEAEA] dark:border-white/[0.06]">
                  <button className="w-full text-left p-2 text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors">
                    View all recent items
                  </button>
                </div>
              </div>
            )}

            {type === "starred" && (
              <div className="flex flex-col">
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="w-20 h-20 mb-4 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#F0F0EE] dark:bg-white/5 rounded-full scale-150 opacity-50" />
                    <Star className="w-10 h-10 text-[#ABABAB] dark:text-[#6B6B6B] relative z-10" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#2563EB] dark:bg-[#3B82F6] rounded-full flex items-center justify-center z-20 text-white dark:text-[#111111] border-2 border-white dark:border-[#1A1A1A]">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="text-[14px] font-semibold text-[#111111] dark:text-[#E8E8E7] mb-2 mt-4">You have not starred any items yet.</h4>
                  <p className="text-[13px] text-[#787774] dark:text-[#9B9A97] leading-relaxed">Star important items for quick access. They will appear here.</p>
                </div>
                <div className="p-2 border-t border-[#EAEAEA] dark:border-white/[0.06]">
                  <button className="w-full text-left p-2 text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors">
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
  const [sidebarWorkspaces, setsidebarWorkspaces] = useState<any[]>([]);
  const [forYouWorkspaces, setForYouWorkspaces] = useState<any[]>([]);
  const [activePopover, setActivePopover] = useState<SidebarPopoverType | null>(null);
  const [moreWorkspacesPos, setMoreWorkspacesPos] = useState({ top: 0, left: "0px" });
  const [moreWorkspaceSearch, setMoreWorkspaceSearch] = useState("");
  const moreWorkspacesBtnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const sidebarVisibleWorkspaces = sidebarWorkspaces.slice(0, SIDEBAR_WORKSPACE_LIMIT);
  const hiddenSidebarWorkspaces = sidebarWorkspaces.slice(SIDEBAR_WORKSPACE_LIMIT);
  const filteredMoreWorkspaces = useMemo(() => {
    const query = moreWorkspaceSearch.trim().toLowerCase();
    if (!query) return hiddenSidebarWorkspaces;

    return hiddenSidebarWorkspaces.filter((workspace) =>
      [workspace.name, workspace.key, workspace.slug, workspace.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [hiddenSidebarWorkspaces, moreWorkspaceSearch]);
  const visibleMoreWorkspaces = filteredMoreWorkspaces.slice(0, MORE_WORKSPACE_LIMIT);

  const handleToggleMoreWorkspaces = () => {
    if (activePopover === "more_workspaces") {
      setActivePopover(null);
      setMoreWorkspaceSearch("");
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
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        data-collapsed={collapsed}
        className={`app-sidebar fixed top-0 left-0 h-full bg-[#FBFBFA] dark:bg-[#252525] border-r border-[#EAEAEA] dark:border-white/[0.06] z-40 transition-all duration-200 flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo / Brand + Toggle — all inside sidebar, never floating outside */}
        <div
          className={`app-header flex items-center border-b border-[#EAEAEA] dark:border-white/[0.06] flex-shrink-0 ${
            collapsed ? "justify-between lg:justify-center" : "justify-between"
          }`}
        >
          {/* Logo wrapper: smooth slide-out when collapsed on desktop; always visible on mobile */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed
                ? "max-w-[240px] opacity-100 lg:max-w-0 lg:opacity-0 lg:pointer-events-none"
                : "max-w-[240px] opacity-100"
            }`}
          >
            <Link
              href="/"
              onClick={onMobileClose}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] whitespace-nowrap"
            >
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center p-1">
                <Image src={appleIcon} alt="SDLC Platform" width={38} height={38} className="h-9 w-9 rounded-[8px] object-contain" />
              </span>
              <span className="flex flex-col text-base font-bold leading-[0.95] tracking-tight text-[#2563EB] dark:text-[#60A5FA]">
                <span className="text-2xl">SDLC</span>
                <span>PLATFORM</span>
              </span>
            </Link>
          </div>

          {/* Desktop collapse/expand toggle — stays inside sidebar at all times */}
          <button
            onClick={() => onCollapse(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors flex-shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
            )}
          </button>

          {/* Mobile: close overlay button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
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
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white py-2 px-3 rounded-[6px] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors text-[13px] font-medium"
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
                className="w-9 h-9 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] flex items-center justify-center hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Navigation */}
          <div className="px-2 space-y-0.5">
              {/* Dashboard */}
              <NavItem item={mainNav[0]} pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />

              {/* Workspaces */}
              <div>
                <button
                  onClick={() => setWorkspaceOpen(!workspaceOpen)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors ${collapsed ? "justify-center" : ""}`}
                >
                  <BookOpen className="w-[18px] h-[18px] text-[#ABABAB] dark:text-[#6B6B6B]" />

                  {!collapsed && (
                    <>
                      <span className="text-[13px] font-medium flex-1 text-left">
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
                  <div className="ml-6 mt-1 space-y-0.5">
                    {sidebarVisibleWorkspaces.map((workspace) => (
                      <Link
                        key={workspace._id}
                        href={`/workspaces/${workspace.key}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[13px] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
                      >
                        <div className="w-4 h-4 rounded-[3px] bg-[#2563EB] dark:bg-[#3B82F6] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {workspace.name?.charAt(0)}
                        </div>
                        <span className="truncate">{workspace.name}</span>
                      </Link>
                    ))}

                    {hiddenSidebarWorkspaces.length > 0 && (
                      <button
                        ref={moreWorkspacesBtnRef}
                        onClick={handleToggleMoreWorkspaces}
                        className="w-full text-left flex items-center justify-between px-2 py-1.5 text-[13px] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] rounded-[6px] group transition-colors"
                      >
                        <span>More Workspaces</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {/* Documents */}
              <NavItem item={mainNav[6]} pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />
          </div>

          {/* Admin Section */}
          {SHOW_ADMIN_NAV && isAdmin && (
            <div className="mt-4 px-2">
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em] hover:text-[#787774] dark:hover:text-[#9B9A97] transition-colors"
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
                      className={`flex justify-center p-2 rounded-[6px] transition-colors ${pathname.startsWith(item.href) ? navActiveClass : navInactiveClass}`}
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
        <div className="flex-shrink-0 border-t border-[#EAEAEA] dark:border-white/[0.06] p-3 space-y-1">
          {!collapsed && currentWorkspace && (
            <div className="px-3 py-2 bg-[#F9F9F8] dark:bg-white/5 rounded-[6px] mb-2">
              <p className="text-[10px] text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em] font-semibold">
                Workspace
              </p>
              <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7] truncate">
                {currentWorkspace.name}
              </p>
            </div>
          )}
          <Link
            href="/settings"
            onClick={onMobileClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-[6px] transition-colors ${pathname === "/settings" ? navActiveClass : navInactiveClass}`}
          >
            <Settings className={`w-[18px] h-[18px] flex-shrink-0 ${pathname === "/settings" ? iconActiveClass : iconInactiveClass}`} />
            {!collapsed && <span className="text-[13px] font-medium">Settings</span>}
          </Link>
        </div>

      </aside>

      {/* More Workspaces Popover */}
      {activePopover === "more_workspaces" && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActivePopover(null)} />
          <div
            className="app-popover fixed bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[10px] z-[9999] flex flex-col"
            style={{
              top: `${moreWorkspacesPos.top}px`,
              left: moreWorkspacesPos.left,
              boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
              <span className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">Workspaces</span>
              <button
                onClick={() => setActivePopover(null)}
                className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#ABABAB] dark:text-[#6B6B6B] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={moreWorkspaceSearch}
                  onChange={(event) => setMoreWorkspaceSearch(event.target.value)}
                  placeholder="Search all Workspaces"
                  className="w-full pl-9 pr-3 py-2 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-[13px] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:border-[#111111] dark:focus:border-[#3B82F6] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="max-h-[260px] overflow-y-auto p-2">
              {hiddenSidebarWorkspaces.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F0EE] dark:bg-white/5 text-[#787774] dark:text-[#9B9A97]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <p className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">No more workspaces</p>
                  <p className="mt-1 text-[11px] text-[#787774] dark:text-[#9B9A97]">All available workspaces are already shown in the sidebar.</p>
                </div>
              ) : visibleMoreWorkspaces.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F0EE] dark:bg-white/5 text-[#787774] dark:text-[#9B9A97]">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">No matching workspaces</p>
                  <p className="mt-1 text-[11px] text-[#787774] dark:text-[#9B9A97]">Try another workspace name or key.</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {visibleMoreWorkspaces.map((workspace) => {
                    const routeKey = workspace.key || workspace.slug || workspace._id || workspace.id;
                    const isActiveWorkspace =
                      currentWorkspace?._id === workspace._id ||
                      currentWorkspace?.key === workspace.key ||
                      currentWorkspace?.slug === workspace.slug;

                    return (
                      <Link
                        key={workspace._id || workspace.id || routeKey}
                        href={`/workspaces/${routeKey}`}
                        onClick={() => {
                          setActivePopover(null);
                          setMoreWorkspaceSearch("");
                          onMobileClose();
                        }}
                        className={`flex w-full items-center gap-3 rounded-[6px] p-2 text-left transition-colors ${
                          isActiveWorkspace
                            ? navActiveClass
                            : navInactiveClass
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#111111] dark:bg-[#E8E8E7] text-xs font-bold text-white dark:text-[#111111]">
                          {workspace.name?.charAt(0) || workspace.key?.charAt(0) || "W"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold">{workspace.name || "Untitled workspace"}</p>
                          <p className="truncate text-[11px] text-[#787774] dark:text-[#9B9A97]">{workspace.key || workspace.slug || "Workspace"}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-[#EAEAEA] dark:border-white/[0.06] p-2">
              <Link
                href="/workspaces"
                onClick={() => setActivePopover(null)}
                className="w-full flex items-center gap-3 p-2 text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors"
              >
                <ListFilter className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
                View all Workspaces
              </Link>
              <Link
                href="/workspaces/create"
                onClick={() => setActivePopover(null)}
                className="w-full flex items-center gap-3 p-2 text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors"
              >
                <Plus className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
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
