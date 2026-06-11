'use client';

import { useEffect, useCallback } from 'react';
import { chatSocketClient } from '@/lib/socket/chat.client';
import { SOCKET_EVENTS } from '@/lib/socket/socket.events';
import { useChatStore } from '@/stores/chatStore';
import { getChannelsAPI } from '@/modules/client/chat/services/chatService';

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
    channels
  } = useChatStore();

  // Automatically join all channels when they are loaded to receive background updates
  useEffect(() => {
    if (channels && channels.length > 0) {
      const channelIds = channels.map(c => c._id);
      chatSocketClient.joinChannels(channelIds);
    }
  }, [channels]); // Runs whenever the channel list changes (e.g., after getChannelsAPI)

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
    
    const { activeChannelId, channels, setChannels } = useChatStore.getState();
    const isCurrentChannel = activeChannelId === message.channelId;
    const channelExists = channels.some(c => c._id === message.channelId);

    // If it's a new DM channel not in our list, refresh the whole channel list
    if (!channelExists) {
      getChannelsAPI().then(allChannels => {
        setChannels(allChannels);
      });
    }

    if (isCurrentChannel) {
      markAsRead(message.channelId);
    } else {
      const channel = channels.find(c => c._id === message.channelId);
      updateChannel(message.channelId, { 
        unreadCount: (channel?.unreadCount || 0) + 1
      });
    }
    
    updateChannel(message.channelId, { lastMessage: message });
  }, [addMessage, updateChannel, markAsRead]);

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

  return null; // This component doesn't render anything
}
