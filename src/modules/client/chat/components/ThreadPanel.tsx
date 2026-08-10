'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Loader2, MessageSquare, AlertCircle, ArrowDown } from 'lucide-react';
import { useThreadReplies, useChatChannels } from '../hooks/useChatQueries';
import { useWorkspaces } from '@/modules/workspace/shared/hooks/useWorkspaces';
import { useQueryClient, useQuery, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import type { Message, MessagesPage, ChatUser } from '@/modules/client/chat/types/chat.types';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import { useResizablePanel } from '@/shared/hooks/useResizablePanel';
import { ResizeHandle } from '@/shared/components/ResizeHandle';
import { getMessageByIdAPI } from '../services/chatService';

interface ThreadPanelProps {
  channelId: string;
  messageId: string;
  onClose: () => void;
}

export default function ThreadPanel({ channelId, messageId, onClose }: ThreadPanelProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const authUser = useAuthStore(state => state.user);
  const currentUserId = (authUser as { _id?: string })?._id || authUser?.id;
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const { width: panelWidth, handleMouseDown, handleReset } = useResizablePanel({
    defaultWidth: 400,
    minWidth: 280,
    maxWidth: 650,
    side: 'left',
    storageKey: 'al_chat_right_panel_w',
  });

  const { data: channels = [] } = useChatChannels();
  const channel = channels.find(c => c._id === channelId);

  const { data: workspaces = [] } = useWorkspaces();
  const userRole = useAuthStore(state => state.user?.role);

  const isWorkspaceAdmin = React.useMemo(() => {
    if (channel?.type === 'dm') return false;
    if (userRole === 'super_admin') return true;
    if (!channel?.workspaceId) return false;
    const ws = workspaces.find(w => String(w._id || (w as { id?: string }).id) === String(channel.workspaceId));
    if (!ws) return false;
    const isOwner = String(ws.ownerId) === String(currentUserId);
    const member = ws.members?.find((m: { userId?: { _id?: string; id?: string } | string }) => {
      const uId = typeof m.userId === 'object' && m.userId ? m.userId._id || m.userId.id : m.userId;
      return String(uId) === String(currentUserId);
    });
    const role = isOwner ? 'workspace_admin' : ((member as { role?: string })?.role || 'member');
    return role === 'workspace_admin';
  }, [channel?.type, channel?.workspaceId, workspaces, currentUserId, userRole]);

  const { data: replies = [], isLoading } = useThreadReplies(channelId, messageId);

  const visibleReplies = React.useMemo(() => {
    return replies;
  }, [replies]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Search for parent message in cache — subscribe to cache changes for realtime updates
  const getParentFromCache = useCallback(() => {
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
    const activeThreads = queryClient.getQueryData<InfiniteData<{ threads: Message[] }>>(
      queryKeys.chat.activeThreads(channelId)
    );
    if (activeThreads?.pages) {
      for (const page of activeThreads.pages) {
        const found = page.threads?.find(m => (m._id || m.id) === messageId);
        if (found) return found;
      }
    }

    return null;
  }, [messageId, channelId, queryClient]);

  const [parentFromCache, setParentFromCache] = useState<Message | null>(getParentFromCache);

  // Subscribe to cache changes so parentMessage updates realtime
  useEffect(() => {
    setParentFromCache(getParentFromCache());
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      // Defer to avoid "setState during render" warning when cache updates mid-render
      setTimeout(() => {
        setParentFromCache(getParentFromCache());
      }, 0);
    });
    return unsubscribe;
  }, [getParentFromCache, queryClient]);

  // Fallback: fetch parent message from API when it's not available in cache.
  // This happens when the user hasn't scrolled far back in the channel to load that message.
  const { data: parentFromAPI, isFetching: isFetchingParent } = useQuery<Message | null>({
    queryKey: ['chat', 'message', channelId, messageId],
    queryFn: async () => {
      try {
        return await getMessageByIdAPI(channelId, messageId);
      } catch {
        return null;
      }
    },
    enabled: Boolean(channelId && messageId && !parentFromCache),
    staleTime: 30_000,
    retry: false,
  });

  const parentMessage: Message | null = parentFromCache ?? parentFromAPI ?? null;

  const [scrollTargetId, setScrollTargetId] = useState<string | null>(
    () => searchParams.get('messageId')
  );

  useEffect(() => {
    const targetId = searchParams.get('messageId');
    setScrollTargetId(targetId);
  }, [searchParams, messageId]);
  useEffect(() => {
    if (!scrollTargetId || isLoading) return;

    let cancelled = false;
    let attempts = 0;

    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(`msg-${scrollTargetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-[#FFF3CD]', 'dark:bg-[#F59E0B]/10');

        // Clear the target so this effect won't fire again for the same message
        setScrollTargetId(null);

        const url = new URL(window.location.href);
        url.searchParams.delete('messageId');
        window.history.replaceState({}, '', url.toString());

        setTimeout(() => {
          el.classList.remove('bg-[#FFF3CD]', 'dark:bg-[#F59E0B]/10');
        }, 2000);
      } else if (attempts < 15) {
        // Element not in DOM yet — retry while replies are still rendering
        attempts++;
        setTimeout(tryScroll, 150);
      }
    };

    const timer = setTimeout(tryScroll, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [scrollTargetId, isLoading, replies]);

  // Effect 3: Scroll to bottom for new incoming replies (only when no scroll target).
  useEffect(() => {
    if (isLoading || scrollTargetId) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // intentionally not including scrollTargetId in deps —
    // we only want this to fire when replies actually change, not when target clears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replies, isLoading]);

  return (
    <div
      style={{ width: `${panelWidth}px` }}
      className="flex-shrink-0 border-l border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] flex flex-col h-full min-h-0 overflow-hidden relative"
    >
      <ResizeHandle onMouseDown={handleMouseDown} onDoubleClick={handleReset} side="left" />
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

      {/* Content Area */}
      {isFetchingParent && !parentMessage ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#787774]" />
        </div>
      ) : !parentMessage ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#111111] dark:text-[#E8E8E7] mb-1">
            Thread Deleted
          </h3>
          <p className="text-xs text-[#787774] dark:text-[#9B9A97] max-w-[260px] mb-4">
            The original message for this thread has been deleted. All replies have been removed.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium rounded-md transition-colors shadow-sm"
          >
            Close Thread
          </button>
        </div>
      ) : (
        <>
          {/* Message List Area */}
          <div
            ref={scrollRef}
            onScroll={() => {
              const container = scrollRef.current;
              if (!container) return;
              const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
              setShowScrollBottom(distanceFromBottom > 500);
            }}
            className="flex-1 overflow-y-auto min-h-0 flex flex-col relative"
          >
            {/* Parent Message Section */}
            <div className="border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#FBFBFA]/40 dark:bg-[#252525]/20 pt-3.5 pb-2">
              <MessageItem
                message={parentMessage}
                isSameUserAsPrevious={false}
                isMine={String((parentMessage.senderId && typeof parentMessage.senderId === 'object') ? (parentMessage.senderId as ChatUser)._id || (parentMessage.senderId as ChatUser).id : parentMessage.senderId || '') === String(currentUserId)}
                hideThreadBadge={true}
                isWorkspaceAdmin={isWorkspaceAdmin}
              />
            </div>

            {/* Divider */}
            <div className="px-4 py-2 bg-[#FBFBFA] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center gap-1.5 text-[10px] font-bold text-[#ABABAB] uppercase tracking-wider">
              <MessageSquare className="w-3 h-3" />
              <span>{visibleReplies.length} {visibleReplies.length === 1 ? 'reply' : 'replies'}</span>
            </div>

            {/* Replies List */}
            <div className="flex-1 pt-3.5 pb-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-[#787774]" />
                </div>
              ) : visibleReplies.length === 0 ? (
                <div className="py-12 text-center text-[#ABABAB] italic text-xs">
                  No replies yet. Be the first to reply!
                </div>
              ) : (
                visibleReplies.map((reply, idx) => {
                  const previousReply = visibleReplies[idx - 1];
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
                      isWorkspaceAdmin={isWorkspaceAdmin}
                    />
                  );
                })
              )}
            </div>

            {/* Floating scroll to bottom button */}
            {showScrollBottom && (
              <button
                onClick={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                  }
                }}
                className="sticky bottom-4 right-4 ml-auto mr-4 mb-2 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white rounded-full shadow-lg text-xs font-semibold transition-all transform hover:scale-105 active:scale-95 animate-fade-in"
                title="Scroll to latest replies"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Latest Replies</span>
              </button>
            )}
          </div>

          {/* Reply Input */}
          <div className="flex-shrink-0">
            <MessageInput
              channelId={channelId}
              channelName={channel?.name}
              threadParentId={messageId}
            />
          </div>
        </>
      )}
    </div>
  );
}
