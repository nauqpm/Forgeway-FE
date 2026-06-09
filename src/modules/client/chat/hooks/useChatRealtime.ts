'use client';

import { useEffect, useCallback } from 'react';
import { chatSocketClient } from '@/lib/socket/chat.client';
import { SOCKET_EVENTS } from '@/lib/socket/socket.events';
import { useChatStore, Message } from '@/stores/chatStore';
import type { RealtimeEnvelope } from '@/lib/socket/socket.types';

export function useChatRealtime() {
  const { 
    addMessage, 
    updateMessage, 
    deleteMessage, 
    setTyping, 
    updateChannel
  } = useChatStore();

  const handleNewMessage = useCallback((envelope: any) => {
    const message = envelope.data || envelope;
    if (!message?.channelId) return;
    addMessage(message.channelId, message);
    updateChannel(message.channelId, { lastMessage: message });
  }, [addMessage, updateChannel]);

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
    updateChannel(data.channelId, { unreadCount: data.unreadCount });
  }, [updateChannel]);

  const handleReactionUpdated = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.messageId || !data?.channelId) return;
    updateMessage(data.channelId, data.messageId, { reactions: data.reactions });
  }, [updateMessage]);

  useEffect(() => {
    const socket = chatSocketClient.connect();
    if (!socket) return;

    socket.on(SOCKET_EVENTS.SENT, handleNewMessage);
    socket.on(SOCKET_EVENTS.EDITED, handleMessageEdited);
    socket.on(SOCKET_EVENTS.DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
    socket.on(SOCKET_EVENTS.UNREAD_UPDATE, handleUnreadUpdate);
    socket.on(SOCKET_EVENTS.REACTION_UPDATED, handleReactionUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.SENT, handleNewMessage);
      socket.off(SOCKET_EVENTS.EDITED, handleMessageEdited);
      socket.off(SOCKET_EVENTS.DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
      socket.off(SOCKET_EVENTS.UNREAD_UPDATE, handleUnreadUpdate);
      socket.off(SOCKET_EVENTS.REACTION_UPDATED, handleReactionUpdated);
    };
  }, [
    handleNewMessage, 
    handleMessageEdited, 
    handleMessageDeleted, 
    handleUserTyping, 
    handleUnreadUpdate,
    handleReactionUpdated
  ]);

  const sendTyping = useCallback((channelId: string) => {
    const socket = chatSocketClient.getSocket();
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.TYPING, { channelId });
    }
  }, []);

  const sendMessage = useCallback((channelId: string, content: string, attachments?: { url: string; filename: string; mimetype: string; size: number }[]) => {
    const socket = chatSocketClient.getSocket();
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.SEND, { channelId, content, attachments });
    }
  }, []);

  const markAsRead = useCallback((channelId: string) => {
    const socket = chatSocketClient.getSocket();
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.READ, { channelId });
    }
  }, []);

  const joinChannel = useCallback((channelId: string) => {
    chatSocketClient.joinChannel(channelId);
  }, []);

  const leaveChannel = useCallback(() => {
    chatSocketClient.leaveChannel();
  }, []);

  return {
    sendMessage,
    sendTyping,
    markAsRead,
    joinChannel,
    leaveChannel,
    isConnected: chatSocketClient.getSocket()?.connected ?? false
  };
}
