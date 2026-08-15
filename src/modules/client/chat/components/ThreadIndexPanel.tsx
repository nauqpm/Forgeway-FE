'use client';

import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { X, Loader2, MessageSquare, UserCheck } from 'lucide-react';
import { useActiveThreads, useChatChannels } from '../hooks/useChatQueries';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import UserAvatar from '@/shared/components/UserAvatar';
import { useResizablePanel } from '@/shared/hooks/useResizablePanel';
import { ResizeHandle } from '@/shared/components/ResizeHandle';
import type { Message } from '@/modules/client/chat/types/chat.types';
import { useEscapeStack } from '@/shared/hooks/useEscapeStack';

interface ThreadIndexPanelProps {
  channelId: string;
  onClose: () => void;
}

export default function ThreadIndexPanel({ channelId, onClose }: ThreadIndexPanelProps) {
  useEscapeStack(onClose);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const setActiveThreadParentId = useChatStore(state => state.setActiveThreadParentId);
  const unreadThreadIds = useChatStore(state => state.unreadThreadIds);
  const markThreadRead = useChatStore(state => state.markThreadRead);

  const authUser = useAuthStore(state => state.user);
  const currentUserId = (authUser as { _id?: string; id?: string })?._id || authUser?.id;

  const { width: panelWidth, handleMouseDown, handleReset } = useResizablePanel({
    defaultWidth: 400,
    minWidth: 280,
    maxWidth: 650,
    side: 'left',
    storageKey: 'al_chat_right_panel_w',
  });

  const { data: channels = [] } = useChatChannels();
  const channel = channels.find(c => c._id === channelId);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useActiveThreads(channelId);

  const threads = useMemo<Message[]>(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.threads);
  }, [data]);

  // Filter threads
  const filteredThreads = useMemo(() => {
    if (filter === 'all') return threads;

    return threads.filter(thread => {
      // 1. User is the author of the parent message
      const parentAuthor = (thread.senderId && typeof thread.senderId === 'object') ? thread.senderId._id || thread.senderId.id : thread.senderId;
      if (String(parentAuthor) === String(currentUserId)) return true;

      // 2. User is one of the reply participants
      if (thread.lastReplyParticipants) {
        return thread.lastReplyParticipants.some(
          (p): p is { userId: string; fullName: string; avatar?: string } =>
            Boolean(p) && String(p.userId) === String(currentUserId)
        );
      }

      return false;
    });
  }, [threads, filter, currentUserId]);

  // Count how many unread threads are in the filtered list
  const unreadCount = useMemo(() => {
    const channelUnreads = unreadThreadIds[channelId];
    if (!channelUnreads) return 0;
    return filteredThreads.filter(t => channelUnreads.has(t._id || t.id || '')).length;
  }, [filteredThreads, unreadThreadIds, channelId]);

  const getSenderName = (thread: Message) => {
    if (thread.senderId && typeof thread.senderId === 'object') {
      return thread.senderId.fullName || thread.senderId.email || 'User';
    }
    return 'User';
  };

  const getSenderAvatar = (thread: Message) => {
    if (thread.senderId && typeof thread.senderId === 'object') {
      return thread.senderId.avatar;
    }
    return undefined;
  };

  const handleOpenThread = (thread: Message) => {
    const threadId = thread._id || thread.id || '';
    markThreadRead(channelId, threadId);
    setActiveThreadParentId(threadId);
  };

  return (
    <div 
      style={{ width: `${panelWidth}px` }}
      className="flex-shrink-0 border-l border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] flex flex-col h-full min-h-0 overflow-hidden relative"
    >
      <ResizeHandle onMouseDown={handleMouseDown} onDoubleClick={handleReset} side="left" />
      {/* Header */}
      <header className="h-14 flex-shrink-0 border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between px-4">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[#111111] dark:text-[#E8E8E7]">Active Threads</span>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white text-[9px] font-bold rounded-full animate-pulse leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs text-[#787774] dark:text-[#9B9A97] truncate">
            {channel ? `#${channel.name}` : 'loading channel...'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#787774] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Filter Bar */}
      <div className="px-3 py-2 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#FBFBFA]/60 dark:bg-[#252525]/20 flex items-center gap-1.5">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-[#111111] text-white dark:bg-[#E8E8E7] dark:text-[#111111]'
              : 'text-[#787774] hover:bg-[#F7F6F3] dark:hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>All Threads ({threads.length})</span>
        </button>
        <button
          onClick={() => setFilter('mine')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            filter === 'mine'
              ? 'bg-[#111111] text-white dark:bg-[#E8E8E7] dark:text-[#111111]'
              : 'text-[#787774] hover:bg-[#F7F6F3] dark:hover:bg-white/5'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Your Threads</span>
        </button>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#787774]" />
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[#787774] dark:text-[#9B9A97] italic">
              {filter === 'mine' ? 'You have not participated in any threads yet.' : 'No active threads in this channel.'}
            </p>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const senderName = getSenderName(thread);
            const avatar = getSenderAvatar(thread);
            const timeAgo = thread.lastReplyAt
              ? formatDistanceToNow(new Date(thread.lastReplyAt), { addSuffix: true })
              : '';
            const threadId = thread._id || thread.id || '';
            const isUnread = Boolean(unreadThreadIds[channelId]?.has(threadId));

            return (
              <button
                key={threadId}
                onClick={() => handleOpenThread(thread)}
                className={`w-full text-left p-3 border rounded-[8px] hover:shadow-sm transition-all flex flex-col gap-2 group cursor-pointer relative ${
                  isUnread
                    ? 'border-[#2563EB]/40 dark:border-[#3B82F6]/40 bg-[#EFF6FF] dark:bg-[#1E3A8A]/20 shadow-[0_0_0_2px_rgba(37,99,235,0.08)]'
                    : 'border-[#EAEAEA] dark:border-white/[0.06] hover:border-[#ABABAB] dark:hover:border-[#3B82F6] bg-white dark:bg-[#252525]'
                }`}
              >
                {/* Unread pulsing dot indicator */}
                {isUnread && (
                  <span className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]"></span>
                  </span>
                )}

                {/* Thread Card Header */}
                <div className="flex items-center gap-2 pr-4">
                  {/* Sender Avatar */}
                  <UserAvatar 
                    userId={typeof thread.senderId !== 'string' && thread.senderId ? String(thread.senderId._id || thread.senderId.id || '') : undefined}
                    name={senderName}
                    avatarUrl={avatar || undefined}
                    className="w-6 h-6 text-[10px]"
                  />
                  <span className={`font-semibold text-xs truncate flex-1 ${isUnread ? 'text-[#1D4ED8] dark:text-[#93C5FD]' : 'text-[#111111] dark:text-[#E8E8E7]'}`}>
                    {senderName}
                  </span>
                  <span className={`text-[10px] ${isUnread ? 'text-[#2563EB] dark:text-[#60A5FA] font-semibold' : 'text-[#ABABAB]'}`}>
                    {timeAgo}
                  </span>
                </div>

                {/* Parent Message Content Preview */}
                <p className={`text-xs line-clamp-2 break-words ${isUnread ? 'text-[#374151] dark:text-[#D1D5DB] font-medium' : 'text-[#555555] dark:text-[#AAAAAA]'}`}>
                  {thread.type === 'sticker'
                    ? '[Sticker]'
                    : (thread.content || '').replace(/(?:\[@|@\[)([^\]]+)\]\(([^)]+)\)/g, '@$1')}
                </p>

                {/* Replies Count & Avatars Footer */}
                <div className="flex items-center justify-between border-t border-[#F0F0EE] dark:border-white/[0.04] pt-2 mt-1">
                  <span className="text-[10px] font-bold text-[#2563EB] dark:text-[#60A5FA]">
                    {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                  </span>

                  {/* Avatars */}
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {thread.lastReplyParticipants
                      ?.filter(
                        (p): p is { userId: string; fullName: string; avatar?: string } => Boolean(p)
                      )
                      .map((p, idx) => (
                      <div key={idx} className="inline-block ring-2 ring-white dark:ring-[#252525] rounded-full">
                        <UserAvatar 
                          userId={p.userId}
                          name={p.fullName}
                          avatarUrl={p.avatar}
                          className="h-[18px] w-[18px] text-[8px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })
        )}

        {filteredThreads.length > 0 && hasNextPage && (
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-4 py-1.5 text-xs font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] bg-[#F0F0EE] dark:bg-white/5 hover:bg-[#EAEAEA] dark:hover:bg-white/10 rounded-[6px] transition-colors flex items-center gap-2 cursor-pointer w-full justify-center"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more threads"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

