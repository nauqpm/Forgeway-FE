'use client';

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import appleIcon from "../../../../../../app/apple-icon.png";
import Image from "next/image";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { isGlobalAdminRole } from "@/modules/auth/shared/utils/admin-role";
import WorkspaceAvatar from "@/modules/workspace/shared/components/WorkspaceAvatar";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";
import { useChatChannels } from "@/modules/client/chat/hooks/useChatQueries";
import {
  LayoutDashboard,
  BookOpen,
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
  Search,
  FolderOpen,
  Sparkles,
  MessageCircle,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const mainNav = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MessageCircle, label: "Chat", href: "/chat" },
  { icon: Sparkles, label: "For You", href: "/for-you" },
  { icon: Clock7, label: "Recent", href: "/recent" },
  { icon: Star, label: "Starred", href: "/starred" },
  { icon: BookOpen, label: 'Workspaces', href: '/workspaces' },

  { icon: FolderOpen, label: 'Documents', href: '/documents' },
];

const adminNav = [
  { icon: UserCog, label: 'User Management', href: '/dashboard/users' },
  { icon: Building2, label: 'Workspace Settings', href: '/dashboard/workspace' },
  { icon: Zap, label: 'Workflows', href: '/dashboard/workflows' },
  { icon: Shield, label: 'Permissions', href: '/dashboard/permissions' },
];

const SHOW_ADMIN_NAV = false;
const SIDEBAR_WORKSPACE_LIMIT = 3;
const MORE_WORKSPACE_LIMIT = 3;

type SidebarPopoverType = 'for_you' | 'recent' | 'starred' | 'more_workspaces';

const navActiveClass = 'bg-[#EFF6FF] text-[#1E40AF] dark:bg-[rgba(37,99,235,0.15)] dark:text-[#93C5FD]';
const navInactiveClass =
  'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/5 dark:hover:text-[#E8E8E7]';
const iconActiveClass = 'text-[#2563EB] dark:text-[#93C5FD]';
const iconInactiveClass =
  'text-[#ABABAB] group-hover:text-[#787774] dark:text-[#6B6B6B] dark:group-hover:text-[#9B9A97]';

const NavItem = ({
  item,
  pathname,
  onMobileClose,
  collapsed,
  badgeContent,
}: {
  item: (typeof mainNav)[0];
  pathname: string;
  onMobileClose: () => void;
  collapsed: boolean;
  badgeContent?: React.ReactNode;
}) => {
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
  return (
    <Link
      href={item.href}
      onClick={onMobileClose}
      className={`flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all group relative ${collapsed ? 'justify-center' : ''} ${
        isActive ? navActiveClass : navInactiveClass
      }`}
    >
      <item.icon
        className={`w-[1.125rem] h-[1.125rem] flex-shrink-0 ${isActive ? iconActiveClass : iconInactiveClass}`}
      />
      {!collapsed && (
        <>
          <span className="text-[0.8125rem] font-medium flex-1 text-left">{item.label}</span>
          {badgeContent}
        </>
      )}
      {collapsed && badgeContent && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border border-white dark:border-[#202020]" />
      )}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#2563EB] dark:bg-[#3B82F6] rounded-r-full" />
      )}
    </Link>
  );
};



export default function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentWorkspace, workspaces: sidebarWorkspaces } = useCurrentWorkspace();
  const { user } = useAuth();
  const { data: channels = [] } = useChatChannels();

  const getWorkspaceUnread = (wsId: string) => {
    const ch = channels.find(
      (c) => c.type === "workspace" && String(c.workspaceId) === String(wsId)
    );
    return ch ? ch.unreadCount : 0;
  };

  const totalUnreadCount = useMemo(() => {
    return channels.reduce((sum, ch) => sum + (ch.unreadCount || 0), 0);
  }, [channels]);

  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/dashboard"));
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  const [activePopover, setActivePopover] = useState<SidebarPopoverType | null>(null);
  const [moreWorkspacesPos, setMoreWorkspacesPos] = useState({ top: 0, left: '0px' });
  const [moreWorkspaceSearch, setMoreWorkspaceSearch] = useState('');
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
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [hiddenSidebarWorkspaces, moreWorkspaceSearch]);
  const visibleMoreWorkspaces = filteredMoreWorkspaces.slice(0, MORE_WORKSPACE_LIMIT);

  const handleToggleMoreWorkspaces = () => {
    if (activePopover === 'more_workspaces') {
      setActivePopover(null);
      setMoreWorkspaceSearch('');
    } else {
      if (moreWorkspacesBtnRef.current) {
        const rect = moreWorkspacesBtnRef.current.getBoundingClientRect();
        setMoreWorkspacesPos({
          top: rect.top,
          left: collapsed ? 'calc(var(--app-sidebar-collapsed) + 12px)' : 'calc(var(--app-sidebar-expanded) + 12px)',
        });
      }
      setActivePopover('more_workspaces');
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = isGlobalAdminRole(user?.role);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onMobileClose} />}

      {/* Sidebar */}
      <aside
        data-collapsed={collapsed}
        className={`app-sidebar fixed top-0 left-0 h-full bg-[#FBFBFA] dark:bg-[#252525] border-r border-[#EAEAEA] dark:border-white/[0.06] z-40 transition-all duration-200 flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo / Brand + Toggle — all inside sidebar, never floating outside */}
        <div
          className={`app-header flex items-center border-b border-[#EAEAEA] dark:border-white/[0.06] flex-shrink-0 ${
            collapsed ? 'justify-between lg:justify-center' : 'justify-between'
          }`}
        >
          {/* Logo wrapper: smooth slide-out when collapsed on desktop; always visible on mobile */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed ? 'max-w-60 opacity-100 lg:max-w-0 lg:opacity-0 lg:pointer-events-none' : 'max-w-60 opacity-100'
            }`}
          >
            <Link
              href="/"
              onClick={onMobileClose}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] whitespace-nowrap"
            >
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center p-1">
                <Image
                  src={appleIcon}
                  alt="SDLC Platform"
                  width={38}
                  height={38}
                  className="h-9 w-9 rounded-[8px] object-contain"
                />
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
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white py-2 px-3 rounded-[6px] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors text-[0.8125rem] font-medium"
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

              {/* Chat */}
              <NavItem 
                item={mainNav[1]} 
                pathname={pathname} 
                onMobileClose={onMobileClose} 
                collapsed={collapsed}
                badgeContent={
                  totalUnreadCount > 0 ? (
                    <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-[#EF4444] text-white text-[9px] font-bold rounded-full leading-none shrink-0">
                      {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                    </span>
                  ) : undefined
                }
              />

              {/* Workspaces */}
              <div>
                <button
                  onClick={() => setWorkspaceOpen(!workspaceOpen)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors ${collapsed ? "justify-center" : ""}`}
                >
                  <BookOpen className="w-[1.125rem] h-[1.125rem] text-[#ABABAB] dark:text-[#6B6B6B]" />

                  {!collapsed && (
                    <>
                      <span className="text-[0.8125rem] font-medium flex-1 text-left">
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
                  {sidebarVisibleWorkspaces.map((workspace) => {
                    const routeKey = workspace.key || workspace.slug || workspace._id;

                    return (
                      <Link
                        key={workspace._id || routeKey}
                        href={`/workspaces/${routeKey}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
                      >
                        <WorkspaceAvatar workspace={workspace} size="xs" />
                        <span className="truncate">{workspace.name}</span>
                      </Link>
                    );
                  })}

                  {hiddenSidebarWorkspaces.length > 0 && (
                    <button
                      ref={moreWorkspacesBtnRef}
                      onClick={handleToggleMoreWorkspaces}
                      className="w-full text-left flex items-center justify-between px-2 py-1.5 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] rounded-[6px] group transition-colors"
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
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em] hover:text-[#787774] dark:hover:text-[#9B9A97] transition-colors"
              >
                {!collapsed && (
                  <>
                    {adminOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <span>Administration</span>
                  </>
                )}
                {collapsed && <span className="w-full text-center">Admin</span>}
              </button>
              {adminOpen && !collapsed && (
                <div className="space-y-0.5 mt-1">
                  {adminNav.map((item) => (
                    <NavItem
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      onMobileClose={onMobileClose}
                      collapsed={collapsed}
                    />
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
                      <item.icon className="w-[1.125rem] h-[1.125rem]" />
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
            <div className="mb-2 flex items-center gap-2 rounded-[6px] bg-[#F9F9F8] px-3 py-2 dark:bg-white/5">
              <WorkspaceAvatar workspace={currentWorkspace} size="sm" />
              <div className="min-w-0">
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-[#ABABAB] dark:text-[#6B6B6B]">
                  Workspace
                </p>
                <p className="truncate text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
                  {currentWorkspace.name}
                </p>
              </div>
            </div>
          )}
          <Link
            href="/settings"
            onClick={onMobileClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-[6px] transition-colors ${pathname === '/settings' ? navActiveClass : navInactiveClass}`}
          >
            <Settings
              className={`w-[1.125rem] h-[1.125rem] flex-shrink-0 ${pathname === '/settings' ? iconActiveClass : iconInactiveClass}`}
            />
            {!collapsed && <span className="text-[0.8125rem] font-medium">Settings</span>}
          </Link>
        </div>
      </aside>

      {/* More Workspaces Popover */}
      {activePopover === 'more_workspaces' &&
        mounted &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setActivePopover(null)} />
            <div
              className="app-popover fixed bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[10px] z-[9999] flex flex-col"
              style={{
                top: `${moreWorkspacesPos.top}px`,
                left: moreWorkspacesPos.left,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-center justify-between p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
                <span className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Workspaces</span>
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
                    className="w-full pl-9 pr-3 py-2 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:border-[#111111] dark:focus:border-[#3B82F6] outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="max-h-[16.25rem] overflow-y-auto p-2">
                {hiddenSidebarWorkspaces.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F0EE] dark:bg-white/5 text-[#787774] dark:text-[#9B9A97]">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">No more workspaces</p>
                    <p className="mt-1 text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">All available workspaces are already shown in the sidebar.</p>
                  </div>
                ) : visibleMoreWorkspaces.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F0EE] dark:bg-white/5 text-[#787774] dark:text-[#9B9A97]">
                      <Search className="h-5 w-5" />
                    </div>
                    <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">No matching workspaces</p>
                    <p className="mt-1 text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">Try another workspace name or key.</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {visibleMoreWorkspaces.map((workspace) => {
                      const routeKey = workspace.key || workspace.slug || workspace._id;
                      const isActiveWorkspace =
                        currentWorkspace?._id === workspace._id ||
                        currentWorkspace?.key === workspace.key ||
                        currentWorkspace?.slug === workspace.slug;
                      const wsId = workspace._id || "";
                      const hasUnread = getWorkspaceUnread(wsId) > 0;

                      return (
                        <Link
                          key={workspace._id || routeKey}
                          href={`/workspaces/${routeKey}`}
                          onClick={() => {
                            setActivePopover(null);
                            setMoreWorkspaceSearch("");
                            onMobileClose();
                          }}
                          className={`flex w-full items-center justify-between rounded-[6px] p-2 text-left transition-colors ${
                            isActiveWorkspace
                              ? navActiveClass
                              : navInactiveClass
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <WorkspaceAvatar workspace={workspace} size="md" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[0.8125rem] font-semibold">{workspace.name || "Untitled workspace"}</p>
                              <p className="truncate text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">{workspace.key || workspace.slug || "Workspace"}</p>
                            </div>
                          </div>
                          {hasUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0 ml-2 mr-1" />
                          )}
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
                  className="w-full flex items-center gap-3 p-2 text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
                  View all Workspaces
                </Link>
                <Link
                  href="/workspaces/create"
                  onClick={() => setActivePopover(null)}
                  className="w-full flex items-center gap-3 p-2 text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors"
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
