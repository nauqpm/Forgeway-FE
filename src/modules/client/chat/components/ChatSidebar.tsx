'use client';

import React, { useEffect, useState } from 'react';
import { useChatStore, Channel } from '@/stores/chatStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { getChannelsAPI } from '@/modules/client/chat/services/chatService';
import { Hash, Megaphone, MessageSquare, Loader2, MessageSquarePlus, User, UserPlus } from 'lucide-react';
import { getWorkspaceUI } from '@/utils/workSpaceUI';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

export default function ChatSidebar() {
  const { channels, setChannels, activeChannelId, setActiveChannel } = useChatStore();
  const { workspaces } = useWorkspaceStore();
  const [loading, setLoading] = useState(channels.length === 0);
  const [activeTab, setActiveTab] = useState<'all' | 'channels' | 'dms'>('all');

  useEffect(() => {
    getChannelsAPI()
      .then(setChannels)
      .finally(() => setLoading(false));
  }, [setChannels]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-[#787774]" />
      </div>
    );
  }

  const generalChannels = (channels || []).filter(c => c.type === 'general' || c.type === 'announcement' || c.type === 'public');
  const dmChannels = (channels || []).filter(c => c.type === 'dm');

  const getWorkspaceUnread = (wsId: string) => {
    const ch = channels.find(c => c._id === wsId);
    return ch ? ch.unreadCount : 0;
  };

  const renderChannelLink = (id: string, name: string, type: string, unreadCount: number = 0, lastMessage?: any) => {
    const isActive = activeChannelId === id;
    const isUnread = unreadCount > 0;
    
    let Icon = Hash;
    const iconColorClass = isActive ? "text-[#2563EB] dark:text-[#93C5FD]" : "text-[#ABABAB] dark:text-[#6B6B6B]";
    let avatarBg = "bg-[#2563EB] dark:bg-[#3B82F6]";

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
          "w-full flex items-start gap-2 px-2 py-2 rounded-[6px] transition-colors group relative",
          isActive 
            ? "bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#60A5FA] ring-1 ring-[#2563EB]/20" 
            : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/5 dark:hover:text-[#E8E8E7]"
        )}
      >
        {/* Unread dot indicator */}
        {isUnread && !isActive && (
          <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#2563EB] shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
        )}

        {type === 'dm' ? (
          <div className="relative flex-shrink-0 mt-0.5">
            <div className={cn("w-5 h-5 rounded-full text-white flex items-center justify-center shadow-sm", "bg-[#2563EB] dark:bg-[#3B82F6]")}>
              <User className="w-3 h-3" />
            </div>
            {/* Presence indicator - hardcoded offline */}
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
            isUnread ? "font-semibold text-[#111111] dark:text-[#E8E8E7]" : "font-normal"
          )}>
            {name}
          </span>
          {lastMessage && (
            <div className="text-[11px] text-[#ABABAB] truncate w-full text-left">
              {lastMessage.senderName ? `${lastMessage.senderName}: ` : ''}{lastMessage.content}
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
      {/* Tab Bar */}
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
          onClick={() => setActiveTab('channels')} // Internal name remains 'channels' for logic but label is Workspaces
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
