'use client';

import { useCallback } from 'react';
import { chatSocketClient } from '@/lib/socket/chat.client';
import { SOCKET_EVENTS } from '@/lib/socket/socket.events';
import { useChatStore } from '@/stores/chatStore';

/**
 * Hook to provide chat-related socket actions.
 * Listeners are handled globally by ChatRealtimeHandler.
 */
export function useChatRealtime() {
  const { updateChannel } = useChatStore();

  const sendTyping = useCallback((channelId: string) => {
    const socket = chatSocketClient.getSocket();
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.TYPING, { channelId });
    }
  }, []);

  const sendMessage = useCallback((channelId: string, content: string, attachments?: { url: string; filename: string; mimetype: string; size: number }[], replyToId?: string, type?: string) => {
    const socket = chatSocketClient.connect();
    if (socket) {
      socket.emit(SOCKET_EVENTS.SEND, { channelId, content, attachments, replyToId, type });
    }
  }, []);

  const markAsRead = useCallback((channelId: string) => {
    const socket = chatSocketClient.connect();
    if (socket) {
      socket.emit(SOCKET_EVENTS.READ, { channelId });
      // Reset local unread count
      updateChannel(channelId, { unreadCount: 0 });
    }
  }, [updateChannel]);

  const joinChannel = useCallback((channelId: string) => {
    chatSocketClient.joinChannel(channelId);
  }, []);

  const leaveChannel = useCallback(() => {
    chatSocketClient.leaveChannel();
  }, []);

  const sendReaction = useCallback((channelId: string, messageId: string, emoji: string) => {
    const socket = chatSocketClient.connect();
    if (socket) {
      socket.emit(SOCKET_EVENTS.REACTION, { channelId, messageId, emoji });
    }
  }, []);

  const sendDeleteMessage = useCallback((channelId: string, messageId: string) => {
    const socket = chatSocketClient.connect();
    if (socket) {
      socket.emit(SOCKET_EVENTS.DELETE, { channelId, messageId });
    }
  }, []);

  return {
    sendMessage,
    sendTyping,
    markAsRead,
    joinChannel,
    leaveChannel,
    sendReaction,
    sendDeleteMessage,
    isConnected: chatSocketClient.getSocket()?.connected ?? false
  };
}
