'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import sdlcLogo from "../../../../../../app/Logo_AutomationLand_AI_SDLC-removebg.png";
import Image from "next/image";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import type { AuthUser } from "@/modules/auth/shared/types/auth.types";
import { isGlobalAdminRole } from "@/modules/auth/shared/utils/admin-role";
import WorkspaceAvatar from "@/modules/workspace/shared/components/WorkspaceAvatar";
import WorkspaceStarButton from "@/modules/workspace/shared/components/WorkspaceStarButton";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";
import type { Workspace } from "@/modules/workspace/shared/types/workspace.type";
import { useChatChannels } from "@/modules/client/chat/hooks/useChatQueries";
import { useChatStore } from "@/stores/chatStore";
import type { Channel } from "@/modules/client/chat/types/chat.types";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import { workspaceService } from "@/modules/workspace/shared/services/workspaceService";
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
  FolderOpen,
  Sparkles,
  MessageCircle,
  Hash,
  Lock,
  Megaphone,
} from "lucide-react";
import { useResizablePanel } from "@/shared/hooks/useResizablePanel";
import { ResizeHandle } from "@/shared/components/ResizeHandle";
import { useEscapeStack } from "@/shared/hooks/useEscapeStack";

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
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all group relative ${collapsed ? 'justify-center' : ''} ${isActive ? navActiveClass : navInactiveClass
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
  useEscapeStack(onMobileClose, mobileOpen);
  const pathname = usePathname();
  const { currentWorkspace, workspaces: sidebarWorkspaces } = useCurrentWorkspace();
  const { user } = useAuth();
  const { data: channels = [] } = useChatChannels();
  const queryClient = useQueryClient();
  const [orderedWorkspaces, setOrderedWorkspaces] = useState<Workspace[]>(sidebarWorkspaces || []);
  const chatWorkspaces = useMemo(
    () => [...(sidebarWorkspaces || [])].sort((a, b) => a.name.localeCompare(b.name)),
    [sidebarWorkspaces],
  );

  useEffect(() => {
    if (sidebarWorkspaces) {
      setOrderedWorkspaces(sidebarWorkspaces);
    }
  }, [sidebarWorkspaces]);

  const totalUnreadCount = useMemo(() => {
    return channels.reduce((sum, ch) => sum + (ch.unreadCount || 0), 0);
  }, [channels]);

  const router = useRouter();
  const activeChannelId = useChatStore((state) => state.activeChannelId);
  const [chatOpen, setChatOpen] = useState(true);
  const [wsCustomOpen, setWsCustomOpen] = useState<Record<string, boolean>>({});
  const toggleWsCustomOpen = (wsId: string) => {
    setWsCustomOpen((prev) => ({
      ...prev,
      [wsId]: !prev[wsId],
    }));
  };
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/dashboard"));
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [starredOpen, setStarredOpen] = useState(true);

  const getWorkspaceTotalUnread = (wsId: string) => {
    const wsChannel = channels.find(
      (c) => c.type === "workspace" && String(c.workspaceId) === String(wsId)
    );
    const wsCustomChannels = channels.filter(
      (c) => c.type === "custom" && String(c.workspaceId) === String(wsId)
    );
    const wsChannelUnread = wsChannel ? wsChannel.unreadCount || 0 : 0;
    const customUnreadSum = wsCustomChannels.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    return wsChannelUnread + customUnreadSum;
  };

  const renderSidebarChannel = (channel: Channel, overrideName?: string) => {
    const isSelected = activeChannelId === channel._id;
    const isUnread = (channel.unreadCount || 0) > 0;
    const displayName = overrideName || channel.name || "Channel";
    let IconComponent = Hash;

    if (channel.type === 'announcement') {
      IconComponent = Megaphone;
    } else if (channel.isPrivate) {
      IconComponent = Lock;
    }

    return (
      <button
        key={channel._id}
        onClick={() => {
          useChatStore.getState().setActiveChannel(channel._id);
          router.push("/chat");
          onMobileClose();
        }}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] text-[0.8125rem] transition-colors ${isSelected && pathname.startsWith('/chat')
          ? 'bg-[#EFF6FF] text-[#1E40AF] dark:bg-[rgba(37,99,235,0.15)] dark:text-[#93C5FD]'
          : 'text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]'
          }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <IconComponent
            className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected && pathname.startsWith('/chat')
              ? 'text-[#2563EB] dark:text-[#93C5FD]'
              : 'text-[#ABABAB] dark:text-[#6B6B6B]'
              }`}
          />
          <span className={`truncate text-left ${isUnread ? 'font-bold text-[#111111] dark:text-[#E8E8E7]' : ''}`}>
            {displayName}
          </span>
        </div>
        {isUnread && (
          <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-[#EF4444] text-white text-[9px] font-bold rounded-full leading-none shrink-0 ml-2">
            {channel.unreadCount}
          </span>
        )}
      </button>
    );
  };

  const [mounted, setMounted] = useState(false);
  const starredWorkspaces = useMemo(
    () => orderedWorkspaces.filter((workspace) => workspace.isStarred),
    [orderedWorkspaces],
  );
  const unstarredWorkspaces = useMemo(
    () => orderedWorkspaces.filter((workspace) => !workspace.isStarred),
    [orderedWorkspaces],
  );
  const isWorkspaceSectionActive = pathname.startsWith('/workspaces') || pathname === '/starred';

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    if (sourceIndex === destIndex) return;

    const reorderedUnstarred = Array.from(unstarredWorkspaces);
    const [removed] = reorderedUnstarred.splice(sourceIndex, 1);
    if (!removed) return;
    reorderedUnstarred.splice(destIndex, 0, removed);

    let unstarredIndex = 0;
    const newOrdered = orderedWorkspaces.map((workspace) =>
      workspace.isStarred
        ? workspace
        : reorderedUnstarred[unstarredIndex++] ?? workspace,
    );

    const previousOrder = [...orderedWorkspaces];
    setOrderedWorkspaces(newOrdered);

    try {
      const orderIds = newOrdered.map((w) => w._id || (w as { id?: string }).id).filter(Boolean) as string[];
      await workspaceService.updateWorkspaceOrder(orderIds);
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
    } catch (error) {
      console.error("Failed to update workspace order", error);
      setOrderedWorkspaces(previousOrder);
    }
  };


  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = isGlobalAdminRole(user?.role);

  const { width: mainSidebarWidth, handleMouseDown, handleReset } = useResizablePanel({
    defaultWidth: 240,
    minWidth: 190,
    maxWidth: 380,
    side: 'right',
    storageKey: 'al_main_sidebar_w',
    onWidthChange: (w) => {
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--app-sidebar-expanded', `${w}px`);
      }
    },
  });

  useEffect(() => {
    if (mounted && !collapsed && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--app-sidebar-expanded', `${mainSidebarWidth}px`);
    }
  }, [mounted, collapsed, mainSidebarWidth]);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onMobileClose} />}

      {/* Sidebar */}
      <aside
        data-collapsed={collapsed}
        className={`app-sidebar fixed top-0 left-0 h-full bg-[#FBFBFA] dark:bg-[#252525] border-r border-[#EAEAEA] dark:border-white/[0.06] z-40 transition-all duration-200 flex flex-col group/main-sidebar ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {!collapsed && (
          <ResizeHandle onMouseDown={handleMouseDown} onDoubleClick={handleReset} side="right" />
        )}
        {/* Logo / Brand + Toggle — all inside sidebar, never floating outside */}
        <div
          className={`app-header flex items-center border-b border-[#EAEAEA] dark:border-white/[0.06] flex-shrink-0 ${collapsed ? 'justify-between lg:justify-center' : 'justify-between'
            }`}
        >
          {/* Logo wrapper: smooth slide-out when collapsed on desktop; always visible on mobile */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'max-w-60 opacity-100 lg:max-w-0 lg:opacity-0 lg:pointer-events-none' : 'max-w-60 opacity-100'
              }`}
          >
            <Link
              href="/"
              onClick={onMobileClose}
              className="flex items-center px-3 py-1.5 rounded-[8px] whitespace-nowrap"
            >
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
              <Link
                href="/workspaces/create"
                onClick={onMobileClose}
                title="Create workspace"
                className="w-9 h-9 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] flex items-center justify-center hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Main Navigation */}
          <div className="px-2 space-y-0.5">
            {/* Dashboard */}
            <NavItem item={mainNav[0]} pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />

            {/* Chat */}
            <div>
              {collapsed ? (
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
              ) : (
                <>
                  <div
                    className={`flex items-center justify-between w-full rounded-[6px] transition-all group ${pathname.startsWith('/chat')
                      ? 'bg-[#EFF6FF] text-[#1E40AF] dark:bg-[rgba(37,99,235,0.15)] dark:text-[#93C5FD]'
                      : 'hover:bg-[#F7F6F3] dark:hover:bg-white/5 text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7]'
                      }`}
                  >
                    <Link
                      href="/chat"
                      onClick={onMobileClose}
                      className="flex-1 flex items-center gap-3 px-3 py-2 rounded-l-[6px] min-w-0 text-inherit"
                    >
                      <MessageCircle
                        className={`w-[1.125rem] h-[1.125rem] flex-shrink-0 ${pathname.startsWith('/chat') ? iconActiveClass : iconInactiveClass
                          }`}
                      />
                      <span className="text-[0.8125rem] font-medium flex-1 text-left truncate">Chat</span>
                      {totalUnreadCount > 0 && (
                        <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-[#EF4444] text-white text-[9px] font-bold rounded-full leading-none shrink-0 mr-1">
                          {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setChatOpen(!chatOpen);
                      }}
                      className={`p-1.5 rounded-[4px] mr-2 flex-shrink-0 transition-all ${pathname.startsWith('/chat')
                        ? 'hover:bg-black/5 dark:hover:bg-white/10 text-[#1E40AF] dark:text-[#93C5FD]'
                        : 'hover:bg-[#EAEAEA] dark:hover:bg-white/10 text-[#ABABAB] dark:text-[#6B6B6B] group-hover:text-[#787774] dark:group-hover:text-[#9B9A97]'
                        }`}
                      title={chatOpen ? "Collapse Chat" : "Expand Chat"}
                    >
                      {chatOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {chatOpen && (
                    <div className="ml-6 mt-1 space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {/* Global Channels */}
                      <div>
                        <div className="px-2 py-1 text-[0.625rem] font-bold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em]">
                          Global Channels
                        </div>
                        <div className="space-y-0.5 mt-0.5">
                          {channels
                            .filter((c) => c.type === 'general' || c.type === 'announcement' || c.type === 'public')
                            .map((channel) => renderSidebarChannel(channel))}
                          {channels.filter((c) => c.type === 'general' || c.type === 'announcement' || c.type === 'public').length === 0 && (
                            <p className="px-2 py-1 text-[10px] text-[#ABABAB] italic">No global channels</p>
                          )}
                        </div>
                      </div>

                      {/* Workspace Channels */}
                      <div>
                        <div className="px-2 py-1 text-[0.625rem] font-bold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em]">
                          Workspace Channels
                        </div>
                        <div className="space-y-1 mt-0.5">
                          {mounted ? (
                            <DragDropContext onDragEnd={() => undefined}>
                              <Droppable droppableId="sidebar-chat-workspaces">
                                {(provided) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-1"
                                  >
                                    {chatWorkspaces.map((ws, index) => {
                                      const wsId = ws._id;
                                      const wsChannel = channels.find(
                                        (c) => c.type === 'workspace' && String(c.workspaceId) === String(wsId)
                                      );
                                      const wsCustomChannels = channels.filter(
                                        (c) => c.type === 'custom' && String(c.workspaceId) === String(wsId)
                                      );
                                      const isExpanded = !!wsCustomOpen[wsId];
                                      const totalWsUnread = getWorkspaceTotalUnread(wsId);

                                      const currentUserId = (user as AuthUser & { _id?: string })?._id || user?.id;
                                      const isOwner = ws.ownerId?.toString() === String(currentUserId);
                                      const member = ws.members?.find((m: { userId?: string | { _id?: string; id?: string } }) => {
                                        const uId = typeof m.userId === 'object' && m.userId ? m.userId._id || m.userId.id : m.userId;
                                        return String(uId) === String(currentUserId);
                                      });
                                      const wsRole = isOwner ? 'workspace_admin' : (member?.role || 'member');
                                      const isWsViewer = wsRole === 'viewer';

                                      if (!wsChannel && wsCustomChannels.length === 0) return null;

                                      const uniqueId = String(ws._id || ws.id);

                                      return (
                                        <Draggable
                                          key={`chat-${uniqueId}`}
                                          draggableId={`chat-${uniqueId}`}
                                          index={index}
                                          isDragDisabled
                                        >
                                          {(draggableProvided, snapshot) => (
                                            <div
                                              ref={draggableProvided.innerRef}
                                              {...draggableProvided.draggableProps}
                                              {...draggableProvided.dragHandleProps}
                                              className={`space-y-0.5 rounded-[6px] transition-all border border-transparent ${snapshot.isDragging
                                                ? "bg-[#EFF6FF] dark:bg-white/10"
                                                : ""
                                                }`}
                                            >
                                              {/* Workspace Accordion Header */}
                                              <div
                                                onClick={() => {
                                                  toggleWsCustomOpen(wsId);
                                                  if (wsChannel) {
                                                    useChatStore.getState().setActiveChannel(wsChannel._id);
                                                    router.push("/chat");
                                                    onMobileClose();
                                                  }
                                                }}
                                                className="w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] transition-colors cursor-pointer text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]"
                                              >
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                  {isExpanded ? (
                                                    <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200" />
                                                  ) : (
                                                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200" />
                                                  )}
                                                  <WorkspaceAvatar workspace={ws} size="xs" />
                                                  <span className="font-bold text-[0.8125rem] truncate flex-1">
                                                    {ws.name}
                                                  </span>
                                                </div>
                                                {totalWsUnread > 0 && !isExpanded && (
                                                  <span className="flex items-center justify-center min-w-[16px] h-4 px-1.5 bg-[#EF4444] text-white text-[8px] font-bold rounded-full ml-2">
                                                    {totalWsUnread}
                                                  </span>
                                                )}
                                              </div>

                                              {/* Expanded Workspace Channels List */}
                                              {isExpanded && (
                                                <div className="pl-4 ml-3 border-l border-[#EAEAEA] dark:border-white/[0.06] space-y-0.5 mt-0.5">
                                                  {!isWsViewer && wsChannel && renderSidebarChannel(wsChannel, wsChannel.name)}
                                                  {!isWsViewer && wsCustomChannels.map((c) => renderSidebarChannel(c))}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </Draggable>
                                      );
                                    })}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContext>
                          ) : (
                            chatWorkspaces.map((ws) => {
                              const wsId = ws._id;
                              const wsChannel = channels.find(
                                (c) => c.type === 'workspace' && String(c.workspaceId) === String(wsId)
                              );
                              const wsCustomChannels = channels.filter(
                                (c) => c.type === 'custom' && String(c.workspaceId) === String(wsId)
                              );
                              const isExpanded = !!wsCustomOpen[wsId];
                              const totalWsUnread = getWorkspaceTotalUnread(wsId);

                              const currentUserId = (user as AuthUser & { _id?: string })?._id || user?.id;
                              const isOwner = ws.ownerId?.toString() === String(currentUserId);
                              const member = ws.members?.find((m: { userId?: string | { _id?: string; id?: string } }) => {
                                const uId = typeof m.userId === 'object' && m.userId ? m.userId._id || m.userId.id : m.userId;
                                return String(uId) === String(currentUserId);
                              });
                              const wsRole = isOwner ? 'workspace_admin' : (member?.role || 'member');
                              const isWsViewer = wsRole === 'viewer';

                              if (!wsChannel && wsCustomChannels.length === 0) return null;

                              return (
                                <div
                                  key={wsId}
                                  className="space-y-0.5 rounded-[6px] border border-transparent"
                                >
                                  {/* Workspace Accordion Header */}
                                  <div
                                    onClick={() => {
                                      toggleWsCustomOpen(wsId);
                                      if (wsChannel) {
                                        useChatStore.getState().setActiveChannel(wsChannel._id);
                                        router.push("/chat");
                                        onMobileClose();
                                      }
                                    }}
                                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] transition-colors cursor-pointer text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {isExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200" />
                                      )}
                                      <WorkspaceAvatar workspace={ws} size="xs" />
                                      <span className="font-bold text-[0.8125rem] truncate flex-1">
                                        {ws.name}
                                      </span>
                                    </div>
                                    {totalWsUnread > 0 && !isExpanded && (
                                      <span className="flex items-center justify-center min-w-[16px] h-4 px-1.5 bg-[#EF4444] text-white text-[8px] font-bold rounded-full ml-2">
                                        {totalWsUnread}
                                      </span>
                                    )}
                                  </div>

                                  {/* Expanded Workspace Channels List */}
                                  {isExpanded && (
                                    <div className="pl-4 ml-3 border-l border-[#EAEAEA] dark:border-white/[0.06] space-y-0.5 mt-0.5">
                                      {!isWsViewer && wsChannel && renderSidebarChannel(wsChannel, wsChannel.name)}
                                      {!isWsViewer && wsCustomChannels.map((c) => renderSidebarChannel(c))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                          {orderedWorkspaces.filter((ws) => {
                            const wsId = ws._id;
                            const hasWsChannel = channels.some((c) => c.type === 'workspace' && String(c.workspaceId) === String(wsId));
                            const hasCustom = channels.some((c) => c.type === 'custom' && String(c.workspaceId) === String(wsId));
                            return hasWsChannel || hasCustom;
                          }).length === 0 && (
                              <p className="px-2 py-1 text-[10px] text-[#ABABAB] italic">No workspace channels</p>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Workspaces */}
            <div>
              {collapsed ? (
                <Link
                  href="/workspaces"
                  onClick={onMobileClose}
                  title="Workspaces"
                  className={`w-full flex items-center justify-center px-3 py-2 rounded-[6px] transition-colors ${isWorkspaceSectionActive ? navActiveClass : `text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]`
                    }`}
                >
                  <BookOpen className={`w-[1.125rem] h-[1.125rem] ${isWorkspaceSectionActive ? iconActiveClass : 'text-[#ABABAB] dark:text-[#6B6B6B]'}`} />
                </Link>
              ) : (
                <div className={`w-full flex items-center rounded-[6px] transition-colors group ${isWorkspaceSectionActive
                  ? navActiveClass
                  : 'text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]'
                  }`}>
                  <Link
                    href="/workspaces"
                    onClick={onMobileClose}
                    className="flex items-center gap-3 py-2 pl-3 flex-1 min-w-0"
                  >
                    <BookOpen className={`w-[1.125rem] h-[1.125rem] ${isWorkspaceSectionActive ? iconActiveClass : 'text-[#ABABAB] dark:text-[#6B6B6B]'}`} />
                    <span className="text-[0.8125rem] font-medium flex-1 text-left">Workspaces</span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setWorkspaceOpen(!workspaceOpen);
                    }}
                    className="py-2 pr-3 pl-1 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                  >
                    {workspaceOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              )}
              {/* SUB NAV */}
              {workspaceOpen && !collapsed && (
                <div className="ml-6 mt-1 space-y-0.5 max-h-[300px] overflow-y-auto pr-1"
                     onWheel={(event) => {
                       event.stopPropagation();
                       event.currentTarget.scrollTop += event.deltaY * 0.20;
                     }}>
                  {starredWorkspaces.length > 0 && (
                    <div className="mb-2">
                      <button
                        type="button"
                        onClick={() => setStarredOpen((current) => !current)}
                        className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-[0.6875rem] font-semibold text-[#787774] transition-colors hover:bg-[#F7F6F3] dark:text-[#9B9A97] dark:hover:bg-white/5"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span className="flex-1 text-left">Starred</span>
                        <span className="text-[0.625rem] font-medium opacity-70">{starredWorkspaces.length}</span>
                        {starredOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </button>

                      {starredOpen && (
                        <div className="ml-2 mt-0.5 space-y-0.5 border-l border-[#EAEAEA] pl-2 dark:border-white/[0.06]">
                          {starredWorkspaces.map((workspace) => {
                            const routeKey = workspace.key || workspace.slug || workspace._id;
                            return (
                              <Link
                                key={`starred-${workspace._id}`}
                                href={`/workspaces/${routeKey}`}
                                onClick={onMobileClose}
                                className="flex min-w-0 items-center gap-2 rounded-[6px] px-2 py-1.5 text-[0.8125rem] text-[#787774] transition-colors hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/5 dark:hover:text-[#E8E8E7]"
                                title={workspace.name}
                              >
                                <WorkspaceAvatar workspace={workspace} size="xs" />
                                <span className="flex-1 truncate">{workspace.name}</span>
                                <WorkspaceStarButton workspace={workspace} />
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-[0.6875rem] font-semibold text-[#787774] dark:text-[#9B9A97]">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span className="flex-1">Workspaces</span>
                      <span className="text-[0.625rem] font-medium opacity-70">{unstarredWorkspaces.length}</span>
                    </div>
                    <div className="ml-2 mt-0.5 space-y-0.5 border-l border-[#EAEAEA] pl-2 dark:border-white/[0.06]">
                      {mounted ? (
                        <DragDropContext onDragEnd={handleDragEnd}>
                          <Droppable droppableId="sidebar-workspaces">
                            {(provided) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-0.5"
                              >
                                {unstarredWorkspaces.map((workspace, index) => {
                                  const routeKey = workspace.key || workspace.slug || workspace._id;
                                  const uniqueId = String(workspace._id || workspace.id);

                                  return (
                                    <Draggable
                                      key={uniqueId}
                                      draggableId={uniqueId}
                                      index={index}
                                    >
                                      {(draggableProvided, snapshot) => (
                                        <div
                                          ref={draggableProvided.innerRef}
                                          {...draggableProvided.draggableProps}
                                          {...draggableProvided.dragHandleProps}
                                          className={`will-change-transform rounded-[6px] border border-transparent transition-colors ${snapshot.isDragging
                                            ? "bg-[#EFF6FF] shadow-sm dark:bg-white/10"
                                            : ""
                                            }`}
                                          style={{
                                            ...draggableProvided.draggableProps.style,
                                            transition: snapshot.isDropAnimating
                                              ? 'transform 160ms cubic-bezier(0.2, 0, 0, 1)'
                                              : draggableProvided.draggableProps.style?.transition,
                                          }}
                                        >
                                          <Link
                                            href={`/workspaces/${routeKey}`}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[0.8125rem] transition-colors min-w-0 w-full text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]"
                                            title={workspace.name}
                                          >
                                            <WorkspaceAvatar workspace={workspace} size="xs" className="shrink-0" />
                                            <span className="truncate flex-1">{workspace.name}</span>
                                            <WorkspaceStarButton workspace={workspace} />
                                          </Link>
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                      ) : (
                        unstarredWorkspaces.map((workspace) => {
                          const routeKey = workspace.key || workspace.slug || workspace._id;

                          return (
                            <Link
                              key={workspace._id || routeKey}
                              href={`/workspaces/${routeKey}`}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[0.8125rem] transition-colors min-w-0 w-full border border-transparent text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]"
                              title={workspace.name}
                            >
                              <WorkspaceAvatar workspace={workspace} size="xs" className="shrink-0" />
                              <span className="truncate flex-1">{workspace.name}</span>
                              <WorkspaceStarButton workspace={workspace} />
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
            {/* Documents */}
            <NavItem item={mainNav[5]} pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />
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
            <div className="mb-2 flex items-center gap-2 rounded-[6px] bg-[#F9F9F8] px-3 py-2 dark:bg-white/5 min-w-0 w-full" title={currentWorkspace.name}>
              <WorkspaceAvatar workspace={currentWorkspace} size="sm" className="shrink-0" />
              <div className="min-w-0 flex-1">
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


    </>
  );
}
