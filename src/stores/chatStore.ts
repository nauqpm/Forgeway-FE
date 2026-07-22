import { create } from 'zustand';
import type { Message } from '@/modules/client/chat/types/chat.types';

interface ChatStore {
  activeChannelId: string | null;
  activeThreadParentId: string | null; // null = closed, 'index' = thread index panel, string = specific thread parent msg id
  typingUsers: Record<string, Record<string, number>>; // channelId: { userId: timestamp }
  replyingToMessage: Message | null;
  replyingToThreadMessage: Message | null;

  // Tracks thread parentIds that have new replies the user hasn't seen yet
  unreadThreadIds: Set<string>;

  setActiveChannel: (channelId: string | null) => void;
  setActiveThreadParentId: (parentId: string | null) => void;

  setTyping: (channelId: string, userId: string) => void;
  removeTyping: (channelId: string, userId: string) => void;
  clearOldTyping: () => void;
  
  setReplyingToMessage: (message: Message | null) => void;
  setReplyingToThreadMessage: (message: Message | null) => void;

  markThreadUnread: (threadParentId: string) => void;
  markThreadRead: (threadParentId: string) => void;
  clearUnreadThreads: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeChannelId: null,
  activeThreadParentId: null,
  typingUsers: {},
  replyingToMessage: null,
  replyingToThreadMessage: null,
  unreadThreadIds: new Set<string>(),

  setActiveChannel: (activeChannelId) => set({ activeChannelId, activeThreadParentId: null, replyingToMessage: null, replyingToThreadMessage: null }), // Close thread on channel change, but keep unread thread badges
  setActiveThreadParentId: (activeThreadParentId) => set({ activeThreadParentId }),

  setTyping: (channelId, userId) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [channelId]: {
        ...(state.typingUsers[channelId] || {}),
        [userId]: Date.now()
      }
    }
  })),

  removeTyping: (channelId, userId) => set((state) => {
    const channelTyping = { ...(state.typingUsers[channelId] || {}) };
    delete channelTyping[userId];
    return {
      typingUsers: {
        ...state.typingUsers,
        [channelId]: channelTyping
      }
    };
  }),

  clearOldTyping: () => set((state) => {
    const now = Date.now();
    const newTypingUsers = { ...state.typingUsers };
    let changed = false;

    Object.keys(newTypingUsers).forEach((channelId) => {
      const channelTyping = { ...newTypingUsers[channelId] };
      let channelChanged = false;

      Object.keys(channelTyping).forEach((userId) => {
        if (now - channelTyping[userId] > 3000) { // 3 seconds TTL
          delete channelTyping[userId];
          channelChanged = true;
          changed = true;
        }
      });

      if (channelChanged) {
        newTypingUsers[channelId] = channelTyping;
      }
    });

    return changed ? { typingUsers: newTypingUsers } : state;
  }),
  
  setReplyingToMessage: (replyingToMessage) => set({ replyingToMessage }),
  setReplyingToThreadMessage: (replyingToThreadMessage) => set({ replyingToThreadMessage }),

  markThreadUnread: (threadParentId) => set((state) => {
    const next = new Set(state.unreadThreadIds);
    next.add(threadParentId);
    return { unreadThreadIds: next };
  }),

  markThreadRead: (threadParentId) => set((state) => {
    const next = new Set(state.unreadThreadIds);
    next.delete(threadParentId);
    return { unreadThreadIds: next };
  }),

  clearUnreadThreads: () => set({ unreadThreadIds: new Set() }),
}));
