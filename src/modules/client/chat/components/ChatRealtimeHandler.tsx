'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatSocketClient } from '@/lib/socket/chat.client';
import { SOCKET_EVENTS } from '@/lib/socket/socket.events';
import { useChatStore } from '@/stores/chatStore';
import { getChannelAPI } from '@/modules/client/chat/services/chatService';
import { useChatChannels } from '@/modules/client/chat/hooks/useChatQueries';
import {
  updateChannelInCache,
  updateMessageInCache,
  upsertChannelInCache,
  upsertMessageInCache,
} from '@/modules/client/chat/utils/chatQueryCache';
import { queryKeys } from '@/common/constants/queryKeys';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import type { Channel, Message } from '@/modules/client/chat/types/chat.types';

const fetchingChannels = new Set<string>();

const getSenderId = (message: Message) => {
  const sender = message.senderId;
  if (!sender) return null;
  return typeof sender === 'object' ? sender._id || sender.id || null : sender;
};

/**
 * Global component to handle all chat socket events.
 * This should be placed in a high-level layout to ensure listeners are always active.
 */
export default function ChatRealtimeHandler() {
  const queryClient = useQueryClient();
  const { data: channels = [] } = useChatChannels();
  const setTyping = useChatStore(state => state.setTyping);
  const user = useAuthStore(state => state.user);
  const rateLimitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || channels.length === 0) return;
    chatSocketClient.joinChannels(channels.map(channel => channel._id));
  }, [channels, user]);

  const ensureChannelInCache = useCallback((channelId: string) => {
    const cachedChannels = queryClient.getQueryData<Channel[]>(queryKeys.chat.channels()) || [];
    const exists = cachedChannels.some(channel => (channel._id || channel.id) === channelId);
    if (exists || fetchingChannels.has(channelId)) return;

    fetchingChannels.add(channelId);
    getChannelAPI(channelId)
      .then(channel => {
        upsertChannelInCache(queryClient, channel);
        chatSocketClient.joinChannel(channelId);
      })
      .catch(err => {
        console.error("Failed to fetch new channel details", err);
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
      })
      .finally(() => {
        fetchingChannels.delete(channelId);
      });
  }, [queryClient]);

  const markAsRead = useCallback((channelId: string) => {
    const socket = chatSocketClient.getSocket();
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.READ, { channelId });
    }
    updateChannelInCache(queryClient, channelId, () => ({ unreadCount: 0 }));
  }, [queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNewMessage = useCallback((envelope: any) => {
    console.log("ChatRealtimeHandler: Received chat.message.sent event", envelope);
    const message = (envelope.data || envelope) as Message;
    if (!message?.channelId) {
      console.warn("ChatRealtimeHandler: Message does not have channelId", message);
      return;
    }

    console.log("ChatRealtimeHandler: Upserting message to cache", message.channelId, message);
    upsertMessageInCache(queryClient, message.channelId, message);
    ensureChannelInCache(message.channelId);

    const activeChannelId = useChatStore.getState().activeChannelId;
    console.log("ChatRealtimeHandler: activeChannelId is", activeChannelId);
    const isCurrentChannel = activeChannelId && message.channelId && String(activeChannelId) === String(message.channelId);
    const senderId = getSenderId(message);
    const currentUser = useAuthStore.getState().user;
    const currentUserId = (currentUser as { id: string; _id?: string } | null)?._id || currentUser?.id;
    const isMyOwnMessage = senderId && currentUserId && senderId.toString() === currentUserId.toString();

    if (isCurrentChannel) {
      markAsRead(message.channelId);
    }

    updateChannelInCache(queryClient, message.channelId, (channel) => {
      const lastMsgId = channel.lastMessage?._id || channel.lastMessage?.id;
      const newMsgId = message._id || message.id;
      
      const lastMsgTime = new Date(channel.lastMessage?.createdAt || channel.lastMessage?.sentAt || 0).getTime();
      const newMsgTime = new Date(message.createdAt).getTime();

      const isAlreadyProcessed = 
        (lastMsgId && newMsgId && String(lastMsgId) === String(newMsgId)) ||
        (lastMsgTime > 0 && lastMsgTime === newMsgTime);

      return {
        lastMessage: message,
        unreadCount: isCurrentChannel || isMyOwnMessage || isAlreadyProcessed
          ? channel.unreadCount || 0
          : (channel.unreadCount || 0) + 1,
      };
    });
  }, [ensureChannelInCache, markAsRead, queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessageEdited = useCallback((envelope: any) => {
    const message = (envelope.data || envelope) as Message;
    if (!message?._id || !message?.channelId) return;
    updateMessageInCache(queryClient, message.channelId, message._id, () => message);

    updateChannelInCache(queryClient, message.channelId, (channel) => {
      const lastMsgId = channel.lastMessage?._id || channel.lastMessage?.id;
      const editedMsgId = message._id || message.id;
      
      const lastMsgTime = new Date(channel.lastMessage?.createdAt || channel.lastMessage?.sentAt || 0).getTime();
      const editedMsgTime = new Date(message.createdAt).getTime();

      const isLastMessage = 
        (lastMsgId && editedMsgId && String(lastMsgId) === String(editedMsgId)) || 
        (lastMsgTime > 0 && lastMsgTime === editedMsgTime);

      if (isLastMessage) {
        return {
          lastMessage: {
            ...channel.lastMessage,
            ...message,
          },
        };
      }
      return {};
    });
  }, [queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessageDeleted = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.messageId || !data?.channelId) return;

    updateMessageInCache(queryClient, data.channelId, data.messageId, () => ({
      deletedAt: new Date().toISOString(),
    }));

    if (data.lastMessage !== undefined) {
      updateChannelInCache(queryClient, data.channelId, () => ({
        lastMessage: data.lastMessage || undefined,
      }));
    }
  }, [queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUserTyping = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.userId || !data?.channelId) return;
    setTyping(data.channelId, data.userId);
  }, [setTyping]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUnreadUpdate = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.channelId) return;

    const cachedChannels = queryClient.getQueryData<Channel[]>(queryKeys.chat.channels()) || [];
    const existingChannel = cachedChannels.find(channel => (channel._id || channel.id) === data.channelId);

    if (!existingChannel) {
      ensureChannelInCache(data.channelId);
      return;
    }

    updateChannelInCache(queryClient, data.channelId, (channel) => {
      const lastMsgId = channel.lastMessage?._id || channel.lastMessage?.id;
      const newMsgId = data.lastMessage?._id || data.lastMessage?.id;
      
      const lastMsgTime = new Date(channel.lastMessage?.createdAt || channel.lastMessage?.sentAt || 0).getTime();
      const newMsgTime = new Date(data.lastMessage?.createdAt || data.lastMessage?.sentAt || 0).getTime();

      const isAlreadyProcessed = 
        (lastMsgId && newMsgId && String(lastMsgId) === String(newMsgId)) ||
        (lastMsgTime > 0 && lastMsgTime === newMsgTime);

      const unreadCount = data.unreadCount !== undefined
        ? data.unreadCount
        : isAlreadyProcessed
        ? channel.unreadCount || 0
        : (channel.unreadCount || 0) + (data.increment || 0);

      return {
        unreadCount,
        ...(data.lastMessage ? { lastMessage: data.lastMessage } : {}),
      };
    });
  }, [ensureChannelInCache, queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleReactionUpdated = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.messageId || !data?.channelId) return;
    updateMessageInCache(queryClient, data.channelId, data.messageId, () => ({
      reactions: data.reactions,
    }));
  }, [queryClient]);

  const handleRateLimited = useCallback((payload: { retryAfterMs?: number }) => {
    if (rateLimitIntervalRef.current) {
      clearInterval(rateLimitIntervalRef.current);
    }

    const retryAfterMs = payload?.retryAfterMs ?? 10000;
    const toastId = "chat-rate-limit-toast";
    let timeLeft = Math.ceil(retryAfterMs / 1000);

    toast.error(`Please slow down. Try again in ${timeLeft} seconds.`, {
      id: toastId,
      duration: retryAfterMs,
    });

    rateLimitIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        if (rateLimitIntervalRef.current) {
          clearInterval(rateLimitIntervalRef.current);
          rateLimitIntervalRef.current = null;
        }
        toast.dismiss(toastId);
      } else {
        toast.error(`Please slow down. Try again in ${timeLeft} seconds.`, {
          id: toastId,
          duration: timeLeft * 1000,
        });
      }
    }, 1000);
  }, []);

  useEffect(() => {
    const socket = chatSocketClient.connect();
    if (!socket) return;

    socket.on(SOCKET_EVENTS.SENT, handleNewMessage);
    socket.on(SOCKET_EVENTS.EDITED, handleMessageEdited);
    socket.on(SOCKET_EVENTS.DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
    socket.on(SOCKET_EVENTS.UNREAD_UPDATE, handleUnreadUpdate);
    socket.on(SOCKET_EVENTS.REACTION_UPDATED, handleReactionUpdated);
    socket.on(SOCKET_EVENTS.RATE_LIMITED, handleRateLimited);

    return () => {
      socket.off(SOCKET_EVENTS.SENT, handleNewMessage);
      socket.off(SOCKET_EVENTS.EDITED, handleMessageEdited);
      socket.off(SOCKET_EVENTS.DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
      socket.off(SOCKET_EVENTS.UNREAD_UPDATE, handleUnreadUpdate);
      socket.off(SOCKET_EVENTS.REACTION_UPDATED, handleReactionUpdated);
      socket.off(SOCKET_EVENTS.RATE_LIMITED, handleRateLimited);

      if (rateLimitIntervalRef.current) {
        clearInterval(rateLimitIntervalRef.current);
        rateLimitIntervalRef.current = null;
      }
    };
  }, [
    handleNewMessage,
    handleMessageEdited,
    handleMessageDeleted,
    handleUserTyping,
    handleUnreadUpdate,
    handleReactionUpdated,
    handleRateLimited,
  ]);

  return null;
}
