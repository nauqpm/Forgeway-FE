'use client';

import React, { useEffect, useState } from 'react';
import { useChatStore, Channel } from '@/stores/chatStore';
import { getChannelsAPI } from '@/modules/client/chat/services/chatService';
import { Hash, Megaphone, MessageSquare, Loader2 } from 'lucide-react';
import { getWorkspaceUI } from '@/utils/workSpaceUI';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

export default function ChatSidebar() {
  const { channels, setChannels, activeChannelId, setActiveChannel } = useChatStore();
  const [loading, setLoading] = useState(channels.length === 0);

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

  const generalChannels = (channels || []).filter(c => c.type === 'general' || c.type === 'announcement');
  const workspaceChannels = (channels || []).filter(c => c.type === 'workspace');
  const dmChannels = (channels || []).filter(c => c.type === 'dm');

  const renderChannelLink = (channel: Channel) => {
    const isActive = activeChannelId === channel._id;
    let Icon = Hash;
    const iconColorClass = isActive ? "text-[#2563EB] dark:text-[#93C5FD]" : "text-[#ABABAB] dark:text-[#6B6B6B]";
    let avatarBg = "bg-[#2563EB] dark:bg-[#3B82F6]";

    if (channel.type === 'announcement') {
      Icon = Megaphone;
    } else if (channel.type === 'dm') {
      Icon = MessageSquare;
    } else if (channel.type === 'workspace') {
      const ui = getWorkspaceUI(channel.name);
      Icon = ui.icon;
      avatarBg = ui.color;
    }

    return (
      <button
        key={channel._id}
        onClick={() => setActiveChannel(channel._id)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[0.8125rem] transition-colors group",
          isActive 
            ? "bg-[#EFF6FF] text-[#1E40AF] dark:bg-[rgba(37,99,235,0.15)] dark:text-[#93C5FD]" 
            : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/5 dark:hover:text-[#E8E8E7]"
        )}
      >
        {channel.type === 'workspace' ? (
          <div className={cn("w-4 h-4 rounded-[3px] text-white flex items-center justify-center text-[0.625rem] font-bold flex-shrink-0", avatarBg)}>
            {channel.name?.charAt(0)}
          </div>
        ) : (
          <Icon className={cn("w-4 h-4 flex-shrink-0", iconColorClass)} />
        )}
        <span className="truncate flex-1 text-left">{channel.name}</span>
        {channel.unreadCount > 0 && (
          <span className="bg-[#9F2F2D] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {channel.unreadCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full py-3 px-2 overflow-y-auto space-y-6">
      <div>
        <h3 className="px-2 mb-1 text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em]">Channels</h3>
        <div className="space-y-0.5">
          {generalChannels.map(renderChannelLink)}
        </div>
      </div>

      {workspaceChannels.length > 0 && (
        <div>
          <h3 className="px-2 mb-1 text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em]">Workspaces</h3>
          <div className="space-y-0.5">
            {workspaceChannels.map(renderChannelLink)}
          </div>
        </div>
      )}

      {dmChannels.length > 0 && (
        <div>
          <h3 className="px-2 mb-1 text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em]">Direct Messages</h3>
          <div className="space-y-0.5">
            {dmChannels.map(renderChannelLink)}
          </div>
        </div>
      )}
    </div>
  );
}
