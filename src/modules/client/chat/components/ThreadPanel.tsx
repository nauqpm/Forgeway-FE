'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Loader2, MessageSquare } from 'lucide-react';
import { useThreadReplies, useChatChannels } from '../hooks/useChatQueries';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import type { Message, MessagesPage, ChatUser } from '@/modules/client/chat/types/chat.types';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';

interface ThreadPanelProps {
  channelId: string;
  messageId: string;
  onClose: () => void;
}

export default function ThreadPanel({ channelId, messageId, onClose }: ThreadPanelProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const targetMessageId = searchParams.get('messageId');
  const authUser = useAuthStore(state => state.user);
  const currentUserId = (authUser as { _id?: string })?._id || authUser?.id;
  const scrolledMessageIdRef = useRef<string | null>(null);

  const { data: channels = [] } = useChatChannels();
  const channel = channels.find(c => c._id === channelId);

  const { data: replies = [], isLoading } = useThreadReplies(channelId, messageId);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Search for parent message in cache
  const parentMessage = useMemo(() => {
    if (!messageId || !channelId) return null;

    // 1. Try channel messages cache
    const channelMessages = queryClient.getQueryData<InfiniteData<MessagesPage>>(
      queryKeys.chat.messages(channelId)
    );
    if (channelMessages) {
      for (const page of channelMessages.pages) {
        const found = page.messages.find(m => (m._id || m.id) === messageId);
        if (found) return found;
      }
    }

    // 2. Try active threads cache
    const activeThreads = queryClient.getQueryData<Message[]>(
      queryKeys.chat.activeThreads(channelId)
    );
    if (activeThreads) {
      const found = activeThreads.find(m => (m._id || m.id) === messageId);
      if (found) return found;
    }

    return null;
  }, [messageId, channelId, queryClient]);

  // Scroll to targeted message if specified, otherwise scroll to bottom
  useEffect(() => {
    if (isLoading) return;

    if (targetMessageId) {
      if (scrolledMessageIdRef.current === targetMessageId) return;

      const timer = setTimeout(() => {
        const el = document.getElementById(`msg-${targetMessageId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-[#FFF3CD]', 'dark:bg-[#F59E0B]/10');
          scrolledMessageIdRef.current = targetMessageId;

          // Remove messageId from URL so it doesn't scroll on refresh
          const url = new URL(window.location.href);
          url.searchParams.delete('messageId');
          window.history.replaceState({}, '', url.toString());

          setTimeout(() => {
            el.classList.remove('bg-[#FFF3CD]', 'dark:bg-[#F59E0B]/10');
          }, 2000);
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [replies, isLoading, targetMessageId]);

  return (
    <div className="w-[400px] flex-shrink-0 border-l border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] flex flex-col h-full min-h-0 overflow-hidden relative">
      {/* Header */}
      <header className="h-14 flex-shrink-0 border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between px-4">
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm text-[#111111] dark:text-[#E8E8E7]">Thread</span>
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

      {/* Message List Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {/* Parent Message Section */}
        {parentMessage ? (
          <div className="border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#FBFBFA]/40 dark:bg-[#252525]/20 pb-2">
            <MessageItem
              message={parentMessage}
              isSameUserAsPrevious={false}
              isMine={String((parentMessage.senderId && typeof parentMessage.senderId === 'object') ? (parentMessage.senderId as ChatUser)._id || (parentMessage.senderId as ChatUser).id : parentMessage.senderId || '') === String(currentUserId)}
              hideThreadBadge={true}
            />
          </div>
        ) : (
          <div className="p-4 border-b border-[#EAEAEA] dark:border-white/[0.06] text-xs text-[#ABABAB] italic">
            Parent message details unavailable in cache. Showing replies only.
          </div>
        )}

        {/* Divider */}
        <div className="px-4 py-2 bg-[#FBFBFA] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center gap-1.5 text-[10px] font-bold text-[#ABABAB] uppercase tracking-wider">
          <MessageSquare className="w-3 h-3" />
          <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
        </div>

        {/* Replies List */}
        <div className="flex-1 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-[#787774]" />
            </div>
          ) : replies.length === 0 ? (
            <div className="py-12 text-center text-[#ABABAB] italic text-xs">
              No replies yet. Be the first to reply!
            </div>
          ) : (
            replies.map((reply, idx) => {
              const previousReply = replies[idx - 1];
              const getSenderId = (m: Message) => (m.senderId && typeof m.senderId === 'object') ? m.senderId._id || m.senderId.id : m.senderId;
              const currentSenderId = getSenderId(reply);
              const previousSenderId = previousReply ? getSenderId(previousReply) : null;

              const isSameUser = previousSenderId && currentSenderId && previousSenderId === currentSenderId;
              const timeDiff = previousReply
                ? (new Date(reply.createdAt).getTime() - new Date(previousReply.createdAt).getTime()) / 1000 / 60
                : 10;
              const isSameUserAsPrevious = !!(isSameUser && timeDiff < 5);

              return (
                <MessageItem
                  key={reply._id || reply.id}
                  message={reply}
                  isSameUserAsPrevious={isSameUserAsPrevious}
                  isMine={String(currentSenderId) === String(currentUserId)}
                  hideThreadBadge={true}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Reply Input */}
      <div className="flex-shrink-0 border-t border-[#EAEAEA] dark:border-white/[0.06]">
        <MessageInput
          channelId={channelId}
          channelName={channel?.name}
          threadParentId={messageId}
        />
      </div>
    </div>
  );
}
