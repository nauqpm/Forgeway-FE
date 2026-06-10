import { create } from 'zustand';

export interface ChatUser {
  _id: string;
  fullName: string;
  avatar?: string;
  email: string;
}

export interface Attachment {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface Message {
  _id: string;
  channelId: string;
  senderId: ChatUser;
  content: string;
  attachments?: Attachment[];
  type: 'text' | 'system' | string;
  replyToId?: string;
  createdAt: string;
  updatedAt?: string;
  reactions?: Record<string, string[]>; // emoji: [userIds]
}

export interface Channel {
  _id: string;
  name: string;
  description?: string;
  type: 'general' | 'announcement' | 'workspace' | 'dm';
  workspaceId?: string;
  unreadCount: number;
  lastMessage?: Message;
}

interface ChatStore {
  channels: Channel[];
  messagesByChannel: Record<string, Message[]>;
  activeChannelId: string | null;
  typingUsers: Record<string, Record<string, number>>; // channelId: { userId: timestamp }
  
  setChannels: (channels: Channel[]) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  setActiveChannel: (channelId: string | null) => void;
  
  setMessages: (channelId: string, messages: Message[]) => void;
  addMessage: (channelId: string, message: Message) => void;
  updateMessage: (channelId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (channelId: string, messageId: string) => void;
  
  setTyping: (channelId: string, userId: string) => void;
  removeTyping: (channelId: string, userId: string) => void;
  clearOldTyping: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  channels: [],
  messagesByChannel: {},
  activeChannelId: null,
  typingUsers: {},

  setChannels: (channels) => set({ channels }),
  
  updateChannel: (channelId, updates) => set((state) => ({
    channels: state.channels.map((c) => c._id === channelId ? { ...c, ...updates } : c)
  })),

  setActiveChannel: (activeChannelId) => set({ activeChannelId }),

  setMessages: (channelId, messages) => set((state) => ({
    messagesByChannel: {
      ...state.messagesByChannel,
      [channelId]: messages
    }
  })),

  addMessage: (channelId, message) => set((state) => {
    const existing = state.messagesByChannel[channelId] || [];
    // Avoid duplicates
    if (existing.some(m => m._id === message._id)) return state;
    
    return {
      messagesByChannel: {
        ...state.messagesByChannel,
        [channelId]: [...existing, message]
      }
    };
  }),

  updateMessage: (channelId, messageId, updates) => set((state) => ({
    messagesByChannel: {
      ...state.messagesByChannel,
      [channelId]: (state.messagesByChannel[channelId] || []).map((m) => 
        m._id === messageId ? { ...m, ...updates } : m
      )
    }
  })),

  deleteMessage: (channelId, messageId) => set((state) => ({
    messagesByChannel: {
      ...state.messagesByChannel,
      [channelId]: (state.messagesByChannel[channelId] || []).filter((m) => m._id !== messageId)
    }
  })),

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
  })
}));
