'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { Hash, Megaphone, Loader2, Lock, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { getWorkspaceUI } from '@/shared/utils/workSpaceUI';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getWorkspaceAvatarUrl } from '@/modules/workspace/shared/utils/workspaceAvatar';
import { useWorkspaces } from '@/modules/workspace/shared/hooks/useWorkspaces';
import UserAvatar from '@/shared/components/UserAvatar';
import { useChatChannels } from '@/modules/client/chat/hooks/useChatQueries';
import type { Channel, ChatUser } from '@/modules/client/chat/types/chat.types';
import CreateChannelModal from './CreateChannelModal';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

export default function ChatSidebar() {
  const activeChannelId = useChatStore(state => state.activeChannelId);
  const setActiveChannel = useChatStore(state => state.setActiveChannel);
  const { data: channels = [], isLoading } = useChatChannels();
  const { data: workspaces = [] } = useWorkspaces();
  const authUser = useAuthStore(state => state.user);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (authUser as any)?._id || authUser?.id;
  const [activeTab, setActiveTab] = useState<'all' | 'channels' | 'dms'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createChannelWorkspaceId, setCreateChannelWorkspaceId] = useState('');
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({});

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramWorkspaceId = searchParams.get('workspaceId');
  const paramChannelId = searchParams.get('channelId');
  const paramThreadParentId = searchParams.get('threadParentId');

  const lastWorkspaceIdRef = useRef<string | null>(null);

  const sortedChannels = useMemo(() => {
    return [...(channels || [])].sort((a, b) => {
      const timeA = new Date(
        a.lastMessage?.createdAt ||
        a.lastMessage?.sentAt ||
        a.updatedAt ||
        a.createdAt ||
        0
      ).getTime();
      const timeB = new Date(
        b.lastMessage?.createdAt ||
        b.lastMessage?.sentAt ||
        b.updatedAt ||
        b.createdAt ||
        0
      ).getTime();
      return timeB - timeA;
    });
  }, [channels]);

  const activeWorkspaceId = useMemo(() => {
    if (paramWorkspaceId) return paramWorkspaceId;
    if (activeChannelId) {
      const activeChannel = channels.find(c => c._id === activeChannelId);
      if (activeChannel?.workspaceId) return String(activeChannel.workspaceId);
    }
    return null;
  }, [paramWorkspaceId, activeChannelId, channels]);



  const isChannelMember = (channel: Channel) => {
    if (!channel.channelMembers) return false;
    return channel.channelMembers.some(
      m => String(m.userId) === String(currentUserId)
    );
  };

  const toggleWorkspace = (wsId: string) => {
    setExpandedWorkspaces(prev => ({
      ...prev,
      [wsId]: !prev[wsId]
    }));
  };

  useEffect(() => {
    if (activeWorkspaceId) {
      setExpandedWorkspaces(prev => ({
        ...prev,
        [activeWorkspaceId]: true
      }));
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (paramWorkspaceId && channels.length > 0) {
      if (lastWorkspaceIdRef.current !== paramWorkspaceId) {
        const wsChannel = channels.find(
          c => c.type === 'workspace' && String(c.workspaceId) === String(paramWorkspaceId)
        );
        if (wsChannel) {
          setActiveChannel(wsChannel._id);
          lastWorkspaceIdRef.current = paramWorkspaceId;

          // Clear workspaceId from URL to clean it up
          const params = new URLSearchParams(searchParams.toString());
          params.delete('workspaceId');
          const query = params.toString();
          const newUrl = query ? `${pathname}?${query}` : pathname;
          router.replace(newUrl);
        }
      }
    }
  }, [paramWorkspaceId, channels, setActiveChannel, pathname, router, searchParams]);

  useEffect(() => {
    if (paramChannelId && channels.length > 0) {
      const channelExists = channels.some(c => c._id === paramChannelId);
      if (channelExists) {
        if (activeChannelId !== paramChannelId) {
          setActiveChannel(paramChannelId);
        }

        if (paramThreadParentId) {
          useChatStore.getState().setActiveThreadParentId(paramThreadParentId);
        }

        // Clear query parameters from URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete('channelId');
        params.delete('threadParentId');
        const query = params.toString();
        const newUrl = query ? `${pathname}?${query}` : pathname;
        router.replace(newUrl);
      }
    }
  }, [paramChannelId, paramThreadParentId, channels, activeChannelId, setActiveChannel, pathname, router, searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-[#787774]" />
      </div>
    );
  }
  // Global channels: fixed position order (announcement → general → public), not affected by new messages
  const GLOBAL_CHANNEL_ORDER: Record<string, number> = { announcement: 0, general: 1, public: 2 };
  const generalChannels = channels
    .filter(c => c.type === 'general' || c.type === 'announcement' || (c.type as string) === 'public')
    .sort((a, b) => (GLOBAL_CHANNEL_ORDER[a.type] ?? 99) - (GLOBAL_CHANNEL_ORDER[b.type] ?? 99));
  const dmChannels = sortedChannels.filter(c => c.type === 'dm');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getWorkspaceUnread = (wsId: string) => {
    const ch = channels.find(c => c.type === 'workspace' && String(c.workspaceId) === String(wsId));
    return ch ? ch.unreadCount : 0;
  };
  const getLastMessagePreview = (channel: Channel) => {
    if (channel.type === 'custom') {
      const member = channel.channelMembers?.find(
        m => String(m.userId) === String(currentUserId)
      );
      if (!member || member.joined === false) {
        return "Join to view messages";
      }
    }

    const lastMsg = channel.lastMessage;
    if (!lastMsg || (!lastMsg.content && !lastMsg.senderId && !lastMsg.type && (!lastMsg.attachments || lastMsg.attachments.length === 0))) return "Start a conversation";
    const sender = lastMsg.senderId;
    const msgSenderId = sender && typeof sender === 'object'
      ? (sender._id || sender.id)
      : sender;

    const isMine = String(msgSenderId) === String(currentUserId);
    const senderName = (() => {
      let name = '';
      if (sender && typeof sender === 'object') {
        name = sender.fullName?.trim() || (sender.email ? sender.email.split('@')[0] : '');
      }
      if (!name) {
        name = lastMsg.senderName?.trim() || '';
      }
      if (!name) {
        name = 'User';
      }
      return name;
    })();

    let formattedContent = '';
    if (lastMsg.type === 'sticker') {
      formattedContent = "[Sticker]";
    } else if (lastMsg.content && lastMsg.content.trim()) {
      let cleanContent = lastMsg.content.replace(/(?:\[@|@\[)([^\]]+)\]\(([^)]+)\)/g, '@$1');
      // Strip simple markdown formatting: **bold**, *italic*, __underline__, ~~strikethrough~~, `code`
      cleanContent = cleanContent.replace(/(\*\*|__|\*|_|~~|`)(.*?)\1/g, '$2');
      // Strip blockquote >
      cleanContent = cleanContent.replace(/^>\s+/gm, '');
      // Strip softbreak tokens, newlines, and collapse extra whitespaces
      cleanContent = cleanContent.replace(/@@@SOFTBREAK@@@/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (lastMsg.attachments && lastMsg.attachments.length > 0) {
        const firstAttachment = lastMsg.attachments[0];
        const isImage = firstAttachment.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(firstAttachment.url || firstAttachment.name || '');
        const tag = isImage ? '[Image]' : '[File]';
        formattedContent = `${tag} ${cleanContent}`;
      } else {
        formattedContent = cleanContent;
      }
    } else if (lastMsg.attachments && lastMsg.attachments.length > 0) {
      const firstAttachment = lastMsg.attachments[0];
      const isImage = firstAttachment.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(firstAttachment.url || firstAttachment.name || '');
      formattedContent = isImage ? '[Image]' : '[File]';
    } else if ((lastMsg.type as string) === 'image') {
      formattedContent = '[Image]';
    } else if (lastMsg.type === 'file') {
      formattedContent = '[File]';
    } else {
      formattedContent = '[Attachment]';
    }
    
    if (isMine) return `You: ${formattedContent}`;
    if (channel.type === 'dm') return formattedContent;
    return `${senderName}: ${formattedContent}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderChannelLink = (id: string, name: string, type: string, unreadCount: number = 0, lastMessage?: any, workspaceData?: any) => {
    const isActive = activeChannelId === id;
    const isUnread = unreadCount > 0;
    const channel = channels.find(c => c._id === id);
    
    let Icon = Hash;
    const iconColorClass = isActive ? "text-[#2563EB] dark:text-[#93C5FD]" : "text-[#ABABAB] dark:text-[#6B6B6B]";
    let _avatarBg = "bg-[#2563EB] dark:bg-[#3B82F6]";

    let displayName = name;
    let displayAvatar = null;
    let singleOtherUserId: string | null = null;
    let singleOtherUserEmail: string | null = null;

    // For DMs, resolve the other member's details
    if (type === 'dm' && channel) {
      const members = channel.members || [];
      const otherMembers = members.filter((m: ChatUser) => String(m._id || m.id) !== String(currentUserId));
      
      if (channel.name && channel.name !== 'Direct Message' && members.length > 2) {
        displayName = channel.name;
        displayAvatar = null;
      } else if (otherMembers.length > 0) {
        const names = otherMembers.map((m: ChatUser) => m.fullName || m.email?.split('@')[0] || "User");
        if (names.length > 3) {
          displayName = `${names.slice(0, 3).join(", ")} & ${names.length - 3} others`;
        } else {
          displayName = names.join(", ");
        }
        displayAvatar = otherMembers.length === 1 ? otherMembers[0].avatar : null;
        if (otherMembers.length === 1) {
          singleOtherUserId = String(otherMembers[0]._id || otherMembers[0].id);
          singleOtherUserEmail = otherMembers[0].email;
        }
      } else {
        displayName = "Just you";
        displayAvatar = null;
      }
    } else if (!displayName) {
      displayName = "Channel";
    }

    if (type === 'announcement') {
      Icon = Megaphone;
    } else if (type === 'workspace') {
      const ui = getWorkspaceUI(name);
      Icon = ui.icon;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _avatarBg = "bg-[#2563EB] dark:bg-[#3B82F6]";
    } else if (type === 'custom') {
      Icon = channel?.isPrivate ? Lock : Hash;
    }

    return (
      <button
        key={id}
        onClick={() => setActiveChannel(id)}
        className={cn(
          "w-full flex items-start gap-2 px-2 py-2 rounded-[6px] transition-colors group relative text-left",
          isActive 
            ? "bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#60A5FA] ring-1 ring-[#2563EB]/20" 
            : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/5 dark:hover:text-[#E8E8E7]"
        )}
      >
        {isUnread && !isActive && (
          <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#2563EB] shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
        )}

        {type === 'dm' ? (
          <div className="relative flex-shrink-0 mt-0.5">
            {singleOtherUserId ? (
              <UserAvatar
                userId={singleOtherUserId}
                name={displayName}
                email={singleOtherUserEmail || undefined}
                avatarUrl={displayAvatar || undefined}
                className="w-9 h-9"
              />
            ) : displayAvatar ? (
              <div className={cn("w-9 h-9 rounded-full text-white flex items-center justify-center shadow-sm overflow-hidden", "bg-[#2563EB] dark:bg-[#3B82F6]")}>
                <img 
                  src={displayAvatar} 
                  alt={displayName} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent && !parent.querySelector('span')) {
                      const span = document.createElement('span');
                      span.innerText = displayName?.charAt(0).toUpperCase() || 'U';
                      span.className = "text-[13px] font-bold";
                      parent.appendChild(span);
                    }
                  }}
                />
              </div>
            ) : (
              <div className={cn("w-9 h-9 rounded-full text-white flex items-center justify-center shadow-sm overflow-hidden", "bg-[#2563EB] dark:bg-[#3B82F6]")}>
                <span className="text-[13px] font-bold">{displayName?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
            )}
          </div>
        ) : type === 'workspace' ? (
          <div className="relative flex-shrink-0 mt-0.5">
            <div className={cn("w-7 h-7 rounded-[6px] text-white flex items-center justify-center shadow-sm overflow-hidden text-[0.75rem] font-bold", "bg-[#2563EB] dark:bg-[#3B82F6]")}>
              <img 
                src={getWorkspaceAvatarUrl(workspaceData)} 
                alt={name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent && !parent.querySelector('span')) {
                    const span = document.createElement('span');
                    span.innerText = name?.charAt(0).toUpperCase() || 'W';
                    parent.appendChild(span);
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors mt-1", iconColorClass)} />
        )}

        <div className="flex-1 min-w-0 flex flex-col items-start justify-center min-h-[36px]">
          <span className={cn(
            "truncate w-full text-left text-base transition-all", 
            isUnread ? "font-bold text-[#111111] dark:text-[#E8E8E7]" : "font-medium"
          )}>
            {displayName}
          </span>
          {channel && (
            <div className={cn(
              "text-xs truncate w-full text-left mt-[1px]",
              isUnread ? "text-[#111111] dark:text-[#E8E8E7] font-semibold" : "text-[#ABABAB]"
            )}>
              {getLastMessagePreview(channel)}
            </div>
          )}
        </div>

        {unreadCount > 0 && (
          <span className="self-center flex-shrink-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white text-[9px] font-bold rounded-full border-2 border-white dark:border-[#252525] leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  };

  const totalCount = generalChannels.length + (workspaces?.length || 0) + dmChannels.length;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FBFBFA] dark:bg-[#252525]">

      <div className="flex items-center px-[10px] pt-2 gap-[2px] border-b border-[#EAEAEA] dark:border-white/[0.06]">
        <button 
          onClick={() => setActiveTab('all')}
          className={cn(
            "flex-1 px-2 py-1.5 text-[0.75rem] transition-all rounded-t-[4px]",
            activeTab === 'all' 
              ? "bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] font-bold border-b-2 border-[#2563EB]" 
              : "text-[#787774] hover:bg-[#F0F0EE] dark:hover:bg-white/5"
          )}
        >
          All ({totalCount})
        </button>
        <button 
          onClick={() => setActiveTab('channels')}
          className={cn(
            "flex-1 px-2 py-1.5 text-[0.75rem] transition-all rounded-t-[4px]",
            activeTab === 'channels' 
              ? "bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] font-bold border-b-2 border-[#2563EB]" 
              : "text-[#787774] hover:bg-[#F0F0EE] dark:hover:bg-white/5"
          )}
        >
          Workspaces ({workspaces?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab('dms')}
          className={cn(
            "flex-1 px-2 py-1.5 text-[0.75rem] transition-all rounded-t-[4px]",
            activeTab === 'dms' 
              ? "bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] font-bold border-b-2 border-[#2563EB]" 
              : "text-[#787774] hover:bg-[#F0F0EE] dark:hover:bg-white/5"
          )}
        >
          DMs ({dmChannels.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-6">
        {activeTab === 'all' && (
          <div>
            <h3 className="px-2 mb-1 text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em]">Channels</h3>
            <div className="space-y-0.5">
              {generalChannels.map((c, idx) => renderChannelLink(c._id || `c-${idx}`, c.name, c.type, c.unreadCount, c.lastMessage))}
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'channels') && workspaces && workspaces.length > 0 && (
          <div>
            <h3 className="px-2 mb-1 text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em]">Workspaces</h3>
            <div className="space-y-1">
              {workspaces.map((ws, idx) => {
                const wsId = ws._id || (ws as { id?: string }).id || `ws-${idx}`;
                const isExpanded = !!expandedWorkspaces[wsId];
                
                const wsChannel = channels.find(c => c.type === 'workspace' && String(c.workspaceId) === String(wsId));
                const wsCustomChannels = sortedChannels.filter(
                  c => c.type === 'custom' && String(c.workspaceId) === String(wsId)
                );

                const wsChannelUnread = wsChannel ? wsChannel.unreadCount : 0;
                const customUnreadSum = wsCustomChannels.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                const totalWsUnread = wsChannelUnread + customUnreadSum;

                const isOwner = ws.ownerId?.toString() === currentUserId;
                const member = ws.members?.find((m: { userId?: { _id?: string; id?: string } | string }) => {
                  const uId = typeof m.userId === 'object' && m.userId ? m.userId._id || m.userId.id : m.userId;
                  return String(uId) === String(currentUserId);
                });
                const wsRole = isOwner ? 'workspace_admin' : (member?.role || 'member');
                const isWsViewer = wsRole === 'viewer';
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const isWsAdmin = (authUser as any)?.role === 'super_admin' || wsRole === 'workspace_admin';
                return (
                  <div key={wsId} className="space-y-0.5">
                    {/* Workspace Accordion Header */}
                    <div 
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 cursor-pointer group text-[#787774] dark:text-[#9B9A97] gap-2"
                      )}
                      onClick={() => toggleWorkspace(wsId)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200" />
                        )}
                        <div className="relative flex-shrink-0">
                          <div className="w-6 h-6 rounded-[4px] text-white flex items-center justify-center text-[10px] font-bold bg-[#2563EB] dark:bg-[#3B82F6] overflow-hidden">
                            <img 
                              src={getWorkspaceAvatarUrl(ws)} 
                              alt={ws.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent && !parent.querySelector('span')) {
                                  const span = document.createElement('span');
                                  span.innerText = ws.name?.charAt(0).toUpperCase() || 'W';
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          </div>
                        </div>
                        <span className="font-bold text-sm text-[#111111] dark:text-[#E8E8E7] truncate">
                          {ws.name}
                        </span>
                        <span className="text-[10px] text-[#ABABAB] dark:text-[#6B6B6B] flex-shrink-0">
                          ({wsCustomChannels.length}/20)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {totalWsUnread > 0 && !isExpanded && (
                          <span className="flex items-center justify-center min-w-[16px] h-4 px-1.5 bg-[#EF4444] text-white text-[8px] font-bold rounded-full leading-none">
                            {totalWsUnread}
                          </span>
                        )}
                        {!isWsViewer && wsCustomChannels.length < 20 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCreateChannelWorkspaceId(wsId);
                              setIsCreateModalOpen(true);
                            }}
                            className="p-1 rounded hover:bg-[#EAEAEA] dark:hover:bg-white/10 text-[#787774] opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Create custom channel"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Workspace Channels */}
                    {isExpanded && (
                      <div className="pl-4 ml-4 border-l border-[#EAEAEA] dark:border-white/[0.06] space-y-0.5">
                        {!isWsViewer && wsChannel && (
                          renderChannelLink(wsChannel._id, wsChannel.name, 'workspace', wsChannel.unreadCount, wsChannel.lastMessage, ws)
                        )}
                        {!isWsViewer && wsCustomChannels.map((c, cIdx) => {
                          const isMember = isChannelMember(c);
                          const isPrivate = c.isPrivate;
                          // Private channels are only shown if the user is a member/invited, or is a super/workspace admin
                          if (isPrivate && !isMember && !isWsAdmin) {
                            return null;
                          }
                          const dimClass = (!isMember && !isPrivate) ? "opacity-50 hover:opacity-80 transition-opacity" : "";
                          return (
                            <div key={c._id || `ws-custom-${cIdx}`} className={dimClass}>
                              {renderChannelLink(c._id || `ws-custom-${cIdx}`, c.name, c.type, c.unreadCount, c.lastMessage)}
                            </div>
                          );
                        })}
                        {!isWsViewer && wsCustomChannels.length === 0 && (
                          <div className="px-2 py-1.5 text-left">
                            <p className="text-[10px] text-[#ABABAB] italic">No custom channels</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'dms') && (
          <div>
            <h3 className="px-2 mb-1 text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em]">Direct Messages</h3>
            <div className="space-y-0.5">
              {dmChannels.length > 0 ? (
                dmChannels.map((c, idx) => renderChannelLink(c._id || `dm-${idx}`, c.name, c.type, c.unreadCount, c.lastMessage))
              ) : (
                <div className="px-2 py-3 text-center">
                  <p className="text-[0.75rem] text-[#ABABAB] italic">No recent conversations</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateChannelWorkspaceId('');
        }}
        workspaceId={createChannelWorkspaceId || activeWorkspaceId || ''}
      />
    </div>
  );
}


