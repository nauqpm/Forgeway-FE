'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useChatStore, Channel } from '@/stores/chatStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { getChannelsAPI } from '@/modules/client/chat/services/chatService';
import { Hash, Megaphone, Loader2 } from 'lucide-react';
import { getWorkspaceUI } from '@/utils/workSpaceUI';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

export default function ChatSidebar() {
  const { channels, setChannels, activeChannelId, setActiveChannel } = useChatStore();
  const { workspaces } = useWorkspaceStore();
  const authUser = useAuthStore(state => state.user);
  const currentUserId = (authUser as any)?._id || authUser?.id;
  const [loading, setLoading] = useState(channels.length === 0);
  const [activeTab, setActiveTab] = useState<'all' | 'channels' | 'dms'>('all');

  const fetchSidebarData = useCallback(async () => {
    try {
      const allChannels = await getChannelsAPI();
      setChannels(allChannels);
    } catch (error) {
      console.error("Failed to fetch channels", error);
    } finally {
      setLoading(false);
    }
  }, [setChannels]);

  useEffect(() => {
    setLoading(true);
    fetchSidebarData();
  }, [fetchSidebarData]);

  const sortedChannels = useMemo(() => {
    return [...(channels || [])].sort((a, b) => {
      const timeA = new Date(a.lastMessage?.createdAt || (a as any).updatedAt || (a as any).createdAt || 0).getTime();
      const timeB = new Date(b.lastMessage?.createdAt || (b as any).updatedAt || (b as any).createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [channels]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-[#787774]" />
      </div>
    );
  }

  const generalChannels = sortedChannels.filter(c => c.type === 'general' || c.type === 'announcement' || (c.type as string) === 'public');
  const dmChannels = sortedChannels.filter(c => c.type === 'dm');

  const getWorkspaceUnread = (wsId: string) => {
    const ch = channels.find(c => c._id === wsId);
    return ch ? ch.unreadCount : 0;
  };

  const getLastMessagePreview = (channel: Channel) => {
    const lastMsg = channel.lastMessage;
    if (!lastMsg) return "Start a conversation";
    
    const msgSenderId = typeof lastMsg.senderId === 'object' 
      ? ((lastMsg.senderId as any)._id || (lastMsg.senderId as any).id) 
      : lastMsg.senderId;

    const isMine = String(msgSenderId) === String(currentUserId);
    const senderName = (lastMsg.senderId as any)?.fullName || "User";
    
    if (isMine) return `You: ${lastMsg.content}`;
    if (channel.type === 'dm') return lastMsg.content;
    return `${senderName}: ${lastMsg.content}`;
  };

  const renderChannelLink = (id: string, name: string, type: string, unreadCount: number = 0, lastMessage?: any) => {
    const isActive = activeChannelId === id;
    const isUnread = unreadCount > 0;
    const channel = channels.find(c => c._id === id);
    
    let Icon = Hash;
    const iconColorClass = isActive ? "text-[#2563EB] dark:text-[#93C5FD]" : "text-[#ABABAB] dark:text-[#6B6B6B]";
    let avatarBg = "bg-[#2563EB] dark:bg-[#3B82F6]";

    let displayName = name;
    let displayAvatar = null;

    // For DMs, resolve the other member's details
    if (type === 'dm' && channel) {
      const members = channel.members || [];
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
      avatarBg = "bg-[#2563EB] dark:bg-[#3B82F6]";
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
            <div className={cn("w-5 h-5 rounded-full text-white flex items-center justify-center shadow-sm overflow-hidden", "bg-[#2563EB] dark:bg-[#3B82F6]")}>
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
                      span.className = "text-[8px] font-bold";
                      parent.appendChild(span);
                    }
                  }}
                />
              ) : (
                <span className="text-[8px] font-bold">{displayName?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#FBFBFA] dark:border-[#252525] bg-[#D1D5DB]" />
          </div>
        ) : type === 'workspace' ? (
          <div className={cn("w-5 h-5 rounded-[6px] text-white flex items-center justify-center text-[0.625rem] font-bold flex-shrink-0 shadow-sm mt-0.5", avatarBg)}>
            {name?.charAt(0)}
          </div>
        ) : (
          <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors mt-0.5", iconColorClass)} />
        )}

        <div className="flex-1 min-w-0 flex flex-col items-start">
          <span className={cn(
            "truncate w-full text-left text-[0.8125rem] transition-all", 
            isUnread ? "font-bold text-[#111111] dark:text-[#E8E8E7]" : "font-normal"
          )}>
            {displayName}
          </span>
          {channel && (
            <div className={cn(
              "text-[11px] truncate w-full text-left",
              isUnread ? "text-[#111111] dark:text-[#E8E8E7] font-medium" : "text-[#ABABAB]"
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
    <div className="flex flex-col h-full overflow-hidden bg-[#FBFBFA] dark:bg-[#252525]">
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
                const wsId = ws._id || (ws as any).id || `ws-${idx}`;
                return renderChannelLink(wsId, ws.name, 'workspace', getWorkspaceUnread(wsId));
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


