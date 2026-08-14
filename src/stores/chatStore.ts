import { create } from 'zustand';
import type { Message } from '@/modules/client/chat/types/chat.types';

interface ChatStore {
  activeChannelId: string | null;
  activeThreadParentId: string | null; // null = closed, 'index' = thread index panel, string = specific thread parent msg id
  typingUsers: Record<string, Record<string, number>>; // channelId: { userId: timestamp }
  replyingToMessage: Message | null;
  replyingToThreadMessage: Message | null;
  editingMessage: Message | null;
  editingThreadMessage: Message | null;

  // Tracks thread parentIds that have new replies the user hasn't seen yet per channel
  unreadThreadIds: Record<string, Set<string>>;

  setActiveChannel: (channelId: string | null) => void;
  setActiveThreadParentId: (parentId: string | null) => void;

  setTyping: (channelId: string, userId: string) => void;
  removeTyping: (channelId: string, userId: string) => void;
  clearOldTyping: () => void;
  
  setReplyingToMessage: (message: Message | null) => void;
  setReplyingToThreadMessage: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
  setEditingThreadMessage: (message: Message | null) => void;

  markThreadUnread: (channelId: string, threadParentId: string) => void;
  markThreadRead: (channelId: string, threadParentId: string) => void;
  clearUnreadThreads: (channelId?: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeChannelId: null,
  activeThreadParentId: null,
  typingUsers: {},
  replyingToMessage: null,
  replyingToThreadMessage: null,
  editingMessage: null,
  editingThreadMessage: null,
  unreadThreadIds: {},

  setActiveChannel: (activeChannelId) => set({ activeChannelId, activeThreadParentId: null, replyingToMessage: null, replyingToThreadMessage: null, editingMessage: null, editingThreadMessage: null }), // Close thread on channel change, but keep unread thread badges
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
  setEditingMessage: (editingMessage) => set({ editingMessage }),
  setEditingThreadMessage: (editingThreadMessage) => set({ editingThreadMessage }),

  markThreadUnread: (channelId, threadParentId) => set((state) => {
    const nextUnread = { ...state.unreadThreadIds };
    const channelSet = new Set(nextUnread[channelId] || []);
    channelSet.add(threadParentId);
    nextUnread[channelId] = channelSet;
    return { unreadThreadIds: nextUnread };
  }),

  markThreadRead: (channelId, threadParentId) => set((state) => {
    const nextUnread = { ...state.unreadThreadIds };
    if (!nextUnread[channelId]) return state; // Nothing to do
    
    const channelSet = new Set(nextUnread[channelId]);
    channelSet.delete(threadParentId);
    nextUnread[channelId] = channelSet;
    return { unreadThreadIds: nextUnread };
  }),

  clearUnreadThreads: (channelId) => set((state) => {
    if (channelId) {
      const nextUnread = { ...state.unreadThreadIds };
      delete nextUnread[channelId];
      return { unreadThreadIds: nextUnread };
    }
    return { unreadThreadIds: {} };
  }),
}));
