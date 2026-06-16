'use client';

import { useEffect, useCallback, useRef } from 'react';
import { chatSocketClient } from '@/lib/socket/chat.client';
import { SOCKET_EVENTS } from '@/lib/socket/socket.events';
import { useChatStore } from '@/stores/chatStore';
import { getChannelsAPI, getChannelAPI } from '@/modules/client/chat/services/chatService';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';

const fetchingChannels = new Set<string>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchAndAddChannel = (channelId: string, addChannelAction: (channel: any) => void) => {
  if (fetchingChannels.has(channelId)) return;
  fetchingChannels.add(channelId);

  getChannelAPI(channelId)
    .then(channel => {
      addChannelAction(channel);
      chatSocketClient.joinChannel(channelId);
    })
    .catch(err => {
      console.error("Failed to fetch new channel details", err);
    })
    .finally(() => {
      fetchingChannels.delete(channelId);
    });
};

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    channels: _channels,
    addChannel
  } = useChatStore();

  const user = useAuthStore(state => state.user);
  const setChannels = useChatStore(state => state.setChannels);

  useEffect(() => {
    if (!user) return;
    getChannelsAPI()
      .then(allChannels => {
        setChannels(allChannels);
        const channelIds = allChannels.map(c => c._id);
        chatSocketClient.joinChannels(channelIds);
      })
      .catch(err => {
        console.error("Failed to load channels in background", err);
      });
  }, [user, setChannels]);

  const rateLimitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const markAsRead = useCallback((channelId: string) => {
    const socket = chatSocketClient.getSocket();
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.READ, { channelId });
      updateChannel(channelId, { unreadCount: 0 });
    }
  }, [updateChannel]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNewMessage = useCallback((envelope: any) => {
    const message = envelope.data || envelope;
    if (!message?.channelId) return;
    
    addMessage(message.channelId, message);
    
    const { activeChannelId, channels } = useChatStore.getState();
    const isCurrentChannel = activeChannelId === message.channelId;
    const channelExists = channels.some(c => c._id === message.channelId);

    // If it's a new DM channel not in our list, fetch and add it
    if (!channelExists) {
      fetchAndAddChannel(message.channelId, addChannel);
    }

    if (isCurrentChannel) {
      markAsRead(message.channelId);
    } else {
      const senderIdStr = typeof message.senderId === 'object' && message.senderId
        ? (message.senderId._id || message.senderId.id)
        : message.senderId;
      const currentUser = useAuthStore.getState().user;
      const currentUserId = (currentUser as any)?._id || currentUser?.id;
      const isMyOwnMessage = senderIdStr && currentUserId && senderIdStr.toString() === currentUserId.toString();

      if (!isMyOwnMessage) {
        incrementUnread(message.channelId);
      }
    }
    
    updateChannel(message.channelId, { lastMessage: message });
  }, [addMessage, updateChannel, incrementUnread, markAsRead, addChannel]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessageEdited = useCallback((envelope: any) => {
    const message = envelope.data || envelope;
    if (!message?._id || !message?.channelId) return;
    updateMessage(message.channelId, message._id, message);
  }, [updateMessage]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessageDeleted = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.messageId || !data?.channelId) return;
    deleteMessage(data.channelId, data.messageId);
    
    // Update sidebar lastMessage if the backend sent the updated one
    if (data.lastMessage !== undefined) {
      updateChannel(data.channelId, { lastMessage: data.lastMessage || undefined });
    }
  }, [deleteMessage, updateChannel]);

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

    const { channels } = useChatStore.getState();
    const channelExists = channels.some(c => c._id === data.channelId);

    if (!channelExists) {
      fetchAndAddChannel(data.channelId, addChannel);
    } else {
      if (data.unreadCount !== undefined) {
        updateChannel(data.channelId, { 
          unreadCount: data.unreadCount,
          ...(data.lastMessage ? { lastMessage: data.lastMessage } : {})
        });
      } else if (data.increment !== undefined) {
        const existingChannel = channels.find(c => c._id === data.channelId);
        const currentCount = existingChannel?.unreadCount || 0;
        updateChannel(data.channelId, { 
          unreadCount: currentCount + data.increment,
          ...(data.lastMessage ? { lastMessage: data.lastMessage } : {})
        });
      }
    }
  }, [updateChannel, addChannel]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    handleRateLimited
  ]);

  return null; // This component doesn't render anything
}
