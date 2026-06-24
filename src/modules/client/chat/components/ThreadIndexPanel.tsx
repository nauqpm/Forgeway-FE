'use client';

import React, { useState, useMemo } from 'react';
import { X, Loader2, MessageSquare, UserCheck } from 'lucide-react';
import { useActiveThreads, useChatChannels } from '../hooks/useChatQueries';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '@/modules/client/chat/types/chat.types';

interface ThreadIndexPanelProps {
  channelId: string;
  onClose: () => void;
}

export default function ThreadIndexPanel({ channelId, onClose }: ThreadIndexPanelProps) {
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const { data: threads = [], isLoading } = useActiveThreads(channelId);
  const { data: channels = [] } = useChatChannels();
  const channel = channels.find(c => c._id === channelId);

  const authUser = useAuthStore(state => state.user);
  const currentUserId = (authUser as any)?._id || authUser?.id;
  const setActiveThreadParentId = useChatStore(state => state.setActiveThreadParentId);

  // Filter threads
  const filteredThreads = useMemo(() => {
    if (filter === 'all') return threads;

    return threads.filter(thread => {
      // 1. User is the author of the parent message
      const parentAuthor = (thread.senderId && typeof thread.senderId === 'object') ? thread.senderId._id || thread.senderId.id : thread.senderId;
      if (String(parentAuthor) === String(currentUserId)) return true;

      // 2. User is one of the reply participants
      if (thread.lastReplyParticipants) {
        return thread.lastReplyParticipants.some(p => p && String(p.userId) === String(currentUserId));
      }

      return false;
    });
  }, [threads, filter, currentUserId]);

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

  return (
    <div className="w-[400px] flex-shrink-0 border-l border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] flex flex-col h-full min-h-0 overflow-hidden relative">
      {/* Header */}
      <header className="h-14 flex-shrink-0 border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between px-4">
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm text-[#111111] dark:text-[#E8E8E7]">Active Threads</span>
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
            const initialLetter = senderName.charAt(0).toUpperCase();
            const timeAgo = thread.lastReplyAt
              ? formatDistanceToNow(new Date(thread.lastReplyAt), { addSuffix: true })
              : '';

            return (
              <button
                key={thread._id || thread.id}
                onClick={() => setActiveThreadParentId(thread._id || thread.id || '')}
                className="w-full text-left p-3 border border-[#EAEAEA] dark:border-white/[0.06] hover:border-[#ABABAB] dark:hover:border-[#3B82F6] bg-white dark:bg-[#252525] rounded-[8px] hover:shadow-sm transition-all flex flex-col gap-2 group cursor-pointer"
              >
                {/* Thread Card Header */}
                <div className="flex items-center gap-2">
                  {/* Sender Avatar */}
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#2563EB] flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                    {avatar ? (
                      <img src={avatar} alt={senderName} className="h-full w-full object-cover" />
                    ) : (
                      <span>{initialLetter}</span>
                    )}
                  </div>
                  <span className="font-semibold text-xs text-[#111111] dark:text-[#E8E8E7] truncate flex-1">
                    {senderName}
                  </span>
                  <span className="text-[10px] text-[#ABABAB]">
                    {timeAgo}
                  </span>
                </div>

                {/* Parent Message Content Preview */}
                <p className="text-xs text-[#555555] dark:text-[#AAAAAA] line-clamp-2 break-words">
                  {thread.type === 'sticker' ? '[Sticker]' : thread.content}
                </p>

                {/* Replies Count & Avatars Footer */}
                <div className="flex items-center justify-between border-t border-[#F0F0EE] dark:border-white/[0.04] pt-2 mt-1">
                  <span className="text-[10px] font-bold text-[#2563EB] dark:text-[#60A5FA]">
                    {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                  </span>

                  {/* Avatars */}
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {thread.lastReplyParticipants?.filter(Boolean).map((p, idx) => (
                      <div
                        key={idx}
                        className="inline-block h-4.5 w-4.5 rounded-full ring-2 ring-white dark:ring-[#252525] bg-[#2563EB] overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-[8px]"
                        title={p.fullName}
                      >
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.fullName} className="h-full w-full object-cover" />
                        ) : (
                          <span>{p.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
