'use client';

import { useEffect, useCallback, useRef } from 'react';
import { chatSocketClient } from '@/lib/socket/chat.client';
import { SOCKET_EVENTS } from '@/lib/socket/socket.events';
import { useChatStore } from '@/stores/chatStore';
import { getChannelsAPI, getChannelAPI } from '@/modules/client/chat/services/chatService';
import toast from 'react-hot-toast';

/**
 * Global component to handle all chat socket events.
 * This should be placed in a high-level layout to ensure listeners are always active.
 */
export default function ChatRealtimeHandler() {
  const { 
    addMessage, 
    updateMessage, 
    deleteMessage, 
    setTyping, 
    updateChannel,
    incrementUnread,
    channels,
    addChannel
  } = useChatStore();

  const rateLimitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const markAsRead = useCallback((channelId: string) => {
    const socket = chatSocketClient.getSocket();
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.READ, { channelId });
    }
    updateChannel(channelId, { unreadCount: 0 });
  }, [updateChannel]);

  const handleNewMessage = useCallback((envelope: any) => {
    const message = envelope.data || envelope;
    if (!message?.channelId) return;
    
    addMessage(message.channelId, message);
    
    const { activeChannelId, channels } = useChatStore.getState();
    const isCurrentChannel = activeChannelId === message.channelId;
    const channelExists = channels.some(c => c._id === message.channelId);

    // If it's a new DM channel not in our list, fetch and add it
    if (!channelExists) {
      getChannelAPI(message.channelId).then(channel => {
        addChannel(channel);
      }).catch(err => {
        console.error("Failed to fetch new channel details", err);
      });
    }

    if (isCurrentChannel) {
      markAsRead(message.channelId);
    } else {
      incrementUnread(message.channelId);
    }
    
    updateChannel(message.channelId, { lastMessage: message });
  }, [addMessage, updateChannel, incrementUnread, markAsRead, addChannel]);

  const handleMessageEdited = useCallback((envelope: any) => {
    const message = envelope.data || envelope;
    if (!message?._id || !message?.channelId) return;
    updateMessage(message.channelId, message._id, message);
  }, [updateMessage]);

  const handleMessageDeleted = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.messageId || !data?.channelId) return;
    deleteMessage(data.channelId, data.messageId);
  }, [deleteMessage]);

  const handleUserTyping = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.userId || !data?.channelId) return;
    setTyping(data.channelId, data.userId);
  }, [setTyping]);

  const handleUnreadUpdate = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.channelId) return;

    const { channels } = useChatStore.getState();
    const channelExists = channels.some(c => c._id === data.channelId);

    if (!channelExists) {
      getChannelAPI(data.channelId).then(channel => {
        addChannel(channel);
      }).catch(err => {
        console.error("Failed to fetch new channel details", err);
      });
    } else {
      updateChannel(data.channelId, { 
        unreadCount: data.unreadCount,
        ...(data.lastMessage ? { lastMessage: data.lastMessage } : {})
      });
    }
  }, [updateChannel, addChannel]);

  const handleReactionUpdated = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.messageId || !data?.channelId) return;
    updateMessage(data.channelId, data.messageId, { reactions: data.reactions });
  }, [updateMessage]);

  const handleRateLimited = useCallback((payload: { retryAfterMs?: number }) => {
    if (rateLimitIntervalRef.current) {
      clearInterval(rateLimitIntervalRef.current);
    }

    const retryAfterMs = payload?.retryAfterMs ?? 10000;
    const toastId = "chat-rate-limit-toast";
    let timeLeft = Math.ceil(retryAfterMs / 1000);

    toast.error(`Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ${timeLeft} giây.`, {
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
        toast.error(`Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ${timeLeft} giây.`, {
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
    handleRateLimited
  ]);

  return null; // This component doesn't render anything
}
