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
  removeMessageFromCache,
} from '@/modules/client/chat/utils/chatQueryCache';
import { queryKeys } from '@/shared/constants/queryKeys';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
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
  const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspaceId);
  const rateLimitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || channels.length === 0) return;
    chatSocketClient.joinChannels(channels.map(channel => channel._id));
  }, [channels, user]);

  useEffect(() => {
    const socket = chatSocketClient.getSocket();
    if (!socket || !currentWorkspaceId) return;

    if (socket.connected) {
      socket.emit('chat.joinWorkspace', { workspaceId: currentWorkspaceId });
    }

    const onConnect = () => {
      socket.emit('chat.joinWorkspace', { workspaceId: currentWorkspaceId });
    };

    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
      if (socket.connected) {
        socket.emit('chat.leaveWorkspace', { workspaceId: currentWorkspaceId });
      }
    };
  }, [currentWorkspaceId]);

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

    if (message.attachments && message.attachments.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['chat', 'files-and-images', message.channelId] });
    }

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

    if (message.threadParentId) {
      queryClient.setQueryData<Message[]>(
        queryKeys.chat.threadReplies(message.channelId, message.threadParentId),
        (current = []) => current.map(m => (m._id || m.id) === message._id ? message : m)
      );
    }

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

    removeMessageFromCache(queryClient, data.channelId, data.messageId, data.threadParentId);

    if (data.lastMessage !== undefined) {
      updateChannelInCache(queryClient, data.channelId, () => ({
        lastMessage: data.lastMessage || undefined,
      }));
    }

    const activeThreadParentId = useChatStore.getState().activeThreadParentId;
    if (activeThreadParentId && String(activeThreadParentId) === String(data.messageId)) {
      toast.error('The original message for this thread has been deleted.');
    }
  }, [queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessageDeletedForMe = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.messageId || !data?.channelId) return;

    removeMessageFromCache(queryClient, data.channelId, data.messageId, data.threadParentId);
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

    if (data.threadParentId) {
      queryClient.setQueryData<Message[]>(
        queryKeys.chat.threadReplies(data.channelId, data.threadParentId),
        (current = []) => current.map(m => (m._id || m.id) === data.messageId ? { ...m, reactions: data.reactions } : m)
      );
    }
  }, [queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleThreadReplyCreated = useCallback((envelope: any) => {
    console.log("ChatRealtimeHandler: Received chat.thread.reply.created", envelope);
    const reply = (envelope.data || envelope) as Message;
    const channelId = typeof reply.channelId === 'object' ? String(reply.channelId) : String(reply.channelId || '');
    const parentId = typeof reply.threadParentId === 'object' ? String(reply.threadParentId) : String(reply.threadParentId || '');
    if (!channelId || !parentId) return;

    // 1. Add to thread replies query cache
    queryClient.setQueryData<Message[]>(
      queryKeys.chat.threadReplies(channelId, parentId),
      (current = []) => {
        const replyId = String(reply._id || reply.id);
        const exists = current.some(m => String(m._id || m.id) === replyId);
        if (exists) return current.map(m => String(m._id || m.id) === replyId ? reply : m);
        return [...current, reply];
      }
    );

    // 2. Invalidate active threads list query
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.activeThreads(channelId) });

    // 3. Update the parent message in the messages cache to reflect replyCount, lastReplyAt, lastReplyParticipants
    const senderId = getSenderId(reply);
    const sender = (reply.senderId && typeof reply.senderId === 'object') ? reply.senderId : null;
    const senderName = sender?.fullName || 'Deleted User';
    const senderAvatar = sender?.avatar || null;

    updateMessageInCache(queryClient, channelId, parentId, (parentMsg) => {
      const prevParticipants = parentMsg.lastReplyParticipants || [];
      const filteredParticipants = prevParticipants.filter(p => p && String(p.userId) !== String(senderId));
      const newParticipants = [
        ...filteredParticipants,
        { userId: senderId as string, fullName: senderName, avatar: senderAvatar || undefined }
      ].slice(-3); // Keep only the last 3 unique participants

      return {
        replyCount: (parentMsg.replyCount || 0) + 1,
        lastReplyAt: reply.createdAt,
        lastReplyParticipants: newParticipants
      };
    });

    // 4. Mark thread as unread if:
    //    - The reply is from someone else (not myself)
    //    - The user is not currently viewing that exact thread
    const currentUser = useAuthStore.getState().user;
    const currentUserId = (currentUser as { id: string; _id?: string } | null)?._id || currentUser?.id;
    const isMyOwnReply = senderId && currentUserId && String(senderId) === String(currentUserId);
    const activeThreadParentId = useChatStore.getState().activeThreadParentId;
    const isViewingThisThread = activeThreadParentId === parentId;

    if (!isMyOwnReply && !isViewingThisThread) {
      useChatStore.getState().markThreadUnread(channelId, parentId);
    }
  }, [queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChannelCreated = useCallback((envelope: any) => {
    const channel = (envelope.data || envelope) as Channel;
    if (!channel?._id) return;
    upsertChannelInCache(queryClient, channel);
    chatSocketClient.joinChannel(channel._id);
  }, [queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChannelUpdated = useCallback((envelope: any) => {
    const channel = (envelope.data || envelope) as Channel;
    if (!channel?._id) return;
    upsertChannelInCache(queryClient, channel);
  }, [queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChannelMemberAdded = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.channelId || !data?.userId) return;

    updateChannelInCache(queryClient, data.channelId, (channel) => {
      const currentMembers = channel.channelMembers || [];
      const exists = currentMembers.some(m => String(m.userId) === String(data.userId));
      if (exists) return {};

      return {
        channelMembers: [
          ...currentMembers,
          {
            userId: data.userId,
            role: data.role || 'channel_member',
            joinedAt: data.joinedAt || new Date().toISOString()
          }
        ]
      };
    });

    void queryClient.invalidateQueries({ queryKey: queryKeys.chat.members(data.channelId) });
  }, [queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChannelMemberRemoved = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.channelId || !data?.userId) return;

    updateChannelInCache(queryClient, data.channelId, (channel) => {
      const currentMembers = channel.channelMembers || [];
      return {
        channelMembers: currentMembers.filter(m => String(m.userId) !== String(data.userId))
      };
    });

    queryClient.setQueryData<Array<{ _id?: string; id?: string }>>(queryKeys.chat.members(data.channelId), (old) => {
      if (!old) return old;
      return old.filter(m => String(m._id) !== String(data.userId) && String(m.id) !== String(data.userId));
    });

    void queryClient.invalidateQueries({ queryKey: queryKeys.chat.members(data.channelId) });
  }, [queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChannelDeleted = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    const channelId = typeof data === 'string' ? data : (data.channelId || data._id || data.id);
    if (!channelId) return;

    queryClient.setQueryData<Channel[]>(queryKeys.chat.channels(), (current = []) =>
      current.filter(item => (item._id || item.id) !== channelId)
    );

    const activeChannelId = useChatStore.getState().activeChannelId;
    if (activeChannelId === channelId) {
      useChatStore.getState().setActiveChannel(null);
      toast.error("This channel has been deleted.");
    }
  }, [queryClient]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChannelVisibilityChanged = useCallback(async (envelope: any) => {
    const data = envelope.data || envelope;
    if (!data?.channelId) return;

    const currentUserId = user?.id || (user as { _id?: string })?._id;
    const isAffected = data.affectedUserIds?.includes(String(currentUserId));

    if (data.isPrivate && isAffected) {
      // 1. User is not a member of this private channel. Remove it from sidebar.
      queryClient.setQueryData<Channel[]>(queryKeys.chat.channels(), (current = []) =>
        current.filter(item => (item._id || item.id) !== data.channelId)
      );

      // 2. If user is currently viewing it, kick them out
      const activeChannelId = useChatStore.getState().activeChannelId;
      if (activeChannelId === data.channelId) {
        useChatStore.getState().setActiveChannel(null);
        toast.error("This channel is now private.");
      }
    } else {
      // 3. User is still allowed to view it (either it's public now or user is member/admin)
      try {
        const channel = await getChannelAPI(data.channelId);
        upsertChannelInCache(queryClient, channel);
      } catch (err) {
        console.error("Failed to fetch updated channel details on visibility change", err);
        // Fallback: Remove if fetch fails due to auth/access issues
        queryClient.setQueryData<Channel[]>(queryKeys.chat.channels(), (current = []) =>
          current.filter(item => (item._id || item.id) !== data.channelId)
        );
      }
    }
  }, [queryClient, user]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleKickedFromChannel = useCallback((envelope: any) => {
    const data = envelope.data || envelope;
    const channelId = data.channelId || data.id;
    if (!channelId) return;

    queryClient.setQueryData<Channel[]>(queryKeys.chat.channels(), (current = []) =>
      current.filter(item => (item._id || item.id) !== channelId)
    );

    const activeChannelId = useChatStore.getState().activeChannelId;
    if (activeChannelId === channelId) {
      useChatStore.getState().setActiveChannel(null);
      toast.error("You have been removed from this channel.");
    }
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
    socket.on(SOCKET_EVENTS.DELETED_FOR_ME, handleMessageDeletedForMe);
    socket.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
    socket.on(SOCKET_EVENTS.UNREAD_UPDATE, handleUnreadUpdate);
    socket.on(SOCKET_EVENTS.REACTION_UPDATED, handleReactionUpdated);
    socket.on(SOCKET_EVENTS.RATE_LIMITED, handleRateLimited);

    // Thread & Custom Channel events
    socket.on(SOCKET_EVENTS.THREAD_REPLY_CREATED, handleThreadReplyCreated);
    socket.on(SOCKET_EVENTS.CHANNEL_CREATED, handleChannelCreated);
    socket.on(SOCKET_EVENTS.CHANNEL_UPDATED, handleChannelUpdated);
    socket.on(SOCKET_EVENTS.CHANNEL_DELETED, handleChannelDeleted);
    socket.on(SOCKET_EVENTS.CHANNEL_MEMBER_ADDED, handleChannelMemberAdded);
    socket.on(SOCKET_EVENTS.CHANNEL_MEMBER_REMOVED, handleChannelMemberRemoved);
    socket.on(SOCKET_EVENTS.CHANNEL_VISIBILITY_CHANGED, handleChannelVisibilityChanged);
    socket.on(SOCKET_EVENTS.KICKED_FROM_CHANNEL, handleKickedFromChannel);

    return () => {
      socket.off(SOCKET_EVENTS.SENT, handleNewMessage);
      socket.off(SOCKET_EVENTS.EDITED, handleMessageEdited);
      socket.off(SOCKET_EVENTS.DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.DELETED_FOR_ME, handleMessageDeletedForMe);
      socket.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
      socket.off(SOCKET_EVENTS.UNREAD_UPDATE, handleUnreadUpdate);
      socket.off(SOCKET_EVENTS.REACTION_UPDATED, handleReactionUpdated);
      socket.off(SOCKET_EVENTS.RATE_LIMITED, handleRateLimited);

      socket.off(SOCKET_EVENTS.THREAD_REPLY_CREATED, handleThreadReplyCreated);
      socket.off(SOCKET_EVENTS.CHANNEL_CREATED, handleChannelCreated);
      socket.off(SOCKET_EVENTS.CHANNEL_UPDATED, handleChannelUpdated);
      socket.off(SOCKET_EVENTS.CHANNEL_DELETED, handleChannelDeleted);
      socket.off(SOCKET_EVENTS.CHANNEL_MEMBER_ADDED, handleChannelMemberAdded);
      socket.off(SOCKET_EVENTS.CHANNEL_MEMBER_REMOVED, handleChannelMemberRemoved);
      socket.off(SOCKET_EVENTS.CHANNEL_VISIBILITY_CHANGED, handleChannelVisibilityChanged);
      socket.off(SOCKET_EVENTS.KICKED_FROM_CHANNEL, handleKickedFromChannel);

      if (rateLimitIntervalRef.current) {
        clearInterval(rateLimitIntervalRef.current);
        rateLimitIntervalRef.current = null;
      }
    };
  }, [
    handleNewMessage,
    handleMessageEdited,
    handleMessageDeleted,
    handleMessageDeletedForMe,
    handleUserTyping,
    handleUnreadUpdate,
    handleReactionUpdated,
    handleRateLimited,
    handleThreadReplyCreated,
    handleChannelCreated,
    handleChannelUpdated,
    handleChannelMemberAdded,
    handleChannelMemberRemoved,
    handleChannelDeleted,
    handleChannelVisibilityChanged,
    handleKickedFromChannel,
  ]);

  return null;
}
