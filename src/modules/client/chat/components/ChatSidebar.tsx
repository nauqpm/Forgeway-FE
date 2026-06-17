'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { Hash, Megaphone, Loader2 } from 'lucide-react';
import { getWorkspaceUI } from '@/utils/workSpaceUI';
import { useSearchParams } from 'next/navigation';
import { getWorkspaceAvatarUrl } from '@/modules/client/workspaces/utils/workspaceAvatar';
import { useWorkspaces } from '@/modules/client/workspaces/hooks/useWorkspaces';
import { useChatChannels } from '@/modules/client/chat/hooks/useChatQueries';
import type { Channel } from '@/modules/client/chat/types/chat.types';

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

  const searchParams = useSearchParams();
  const paramWorkspaceId = searchParams.get('workspaceId');

  const lastWorkspaceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (paramWorkspaceId && channels.length > 0) {
      if (lastWorkspaceIdRef.current !== paramWorkspaceId) {
        const wsChannel = channels.find(
          c => c.type === 'workspace' && String(c.workspaceId) === String(paramWorkspaceId)
        );
        if (wsChannel) {
          setActiveChannel(wsChannel._id);
          lastWorkspaceIdRef.current = paramWorkspaceId;
        }
      }
    }
  }, [paramWorkspaceId, channels, setActiveChannel]);

  const sortedChannels = useMemo(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return [...(channels || [])].sort((a, b) => {
      const timeA = new Date(
        a.lastMessage?.createdAt ||
        (a.lastMessage as any)?.sentAt ||
        (a as any).updatedAt ||
        (a as any).createdAt ||
        0
      ).getTime();
      const timeB = new Date(
        b.lastMessage?.createdAt ||
        (b.lastMessage as any)?.sentAt ||
        (b as any).updatedAt ||
        (b as any).createdAt ||
        0
      ).getTime();
      /* eslint-enable @typescript-eslint/no-explicit-any */
      return timeB - timeA;
    });
  }, [channels]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-[#787774]" />
      </div>
    );
  }

  const generalChannels = sortedChannels.filter(c => c.type === 'general' || c.type === 'announcement' || (c.type as string) === 'public');
  const dmChannels = sortedChannels.filter(c => c.type === 'dm');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getWorkspaceUnread = (wsId: string) => {
    const ch = channels.find(c => c.type === 'workspace' && String(c.workspaceId) === String(wsId));
    return ch ? ch.unreadCount : 0;
  };

  const getLastMessagePreview = (channel: Channel) => {
    const lastMsg = channel.lastMessage;
    if (!lastMsg || (!lastMsg.content && !lastMsg.senderId)) return "Start a conversation";
    
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const msgSenderId = typeof lastMsg.senderId === 'object'
      ? ((lastMsg.senderId as any)._id || (lastMsg.senderId as any).id)
      : lastMsg.senderId;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const isMine = String(msgSenderId) === String(currentUserId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const senderName = (lastMsg.senderId as any)?.fullName || "User";
    const formattedContent = lastMsg.deletedAt 
      ? "[Message deleted]" 
      : lastMsg.type === 'sticker'
      ? "[Sticker]"
      : (lastMsg.content || '').replace(/(?:\[@|@\[)([^\]]+)\]\(([^)]+)\)/g, '@$1');
    
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

    // For DMs, resolve the other member's details
    if (type === 'dm' && channel) {
      const members = channel.members || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const otherMember = members.find((m: any) => String(m._id || m.id) !== String(currentUserId)) || members[0];
      
      if (otherMember && typeof otherMember === 'object') {
        displayName = otherMember.fullName || otherMember.email || "Direct Message";
        displayAvatar = otherMember.avatar;
      } else {
        displayName = name || "Direct Message";
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
            <div className={cn("w-9 h-9 rounded-full text-white flex items-center justify-center shadow-sm overflow-hidden", "bg-[#2563EB] dark:bg-[#3B82F6]")}>
              {displayAvatar ? (
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
              ) : (
                <span className="text-[13px] font-bold">{displayName?.charAt(0).toUpperCase()}</span>
              )}
            </div>
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
          <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1 bg-[#EF4444] text-white text-[9px] font-bold rounded-full border-2 border-white dark:border-[#252525]">
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
            <div className="space-y-0.5">
              {workspaces.map((ws, idx) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const wsId = ws._id || (ws as any).id || `ws-${idx}`;
                const wsChannel = channels.find(c => c.type === 'workspace' && String(c.workspaceId) === String(wsId));
                const targetChannelId = wsChannel ? wsChannel._id : wsId;
                const unreadCount = wsChannel ? wsChannel.unreadCount : 0;
                return renderChannelLink(targetChannelId, ws.name, 'workspace', unreadCount, wsChannel?.lastMessage, ws);
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
    </div>
  );
}


