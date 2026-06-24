export interface ChatUser {
  _id: string;
  id?: string;
  fullName: string;
  avatar?: string;
  email: string;
  phone?: string;
}

export interface Attachment {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface Message {
  _id: string;
  id?: string;
  channelId: string;
  senderId: ChatUser | string | null;
  content: string;
  attachments?: Attachment[];
  type: 'text' | 'system' | string;
  stickerId?: Sticker;
  replyToId?: string | Message;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  reactions?: Record<string, string[]>;
  sentAt?: string;
}

export interface Channel {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  type: 'general' | 'announcement' | 'workspace' | 'dm' | string;
  workspaceId?: string;
  unreadCount: number;
  lastMessage?: Message;
  members?: ChatUser[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMember extends ChatUser {
  role?: string;
}

export interface SearchUser {
  _id: string;
  id?: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface MentionMember {
  id: string;
  display: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface Sticker {
  _id: string;
  packId: string;
  code: string;
  url: string;
  isAnimated: boolean;
  width: number;
  height: number;
}

export interface StickerPack {
  _id: string;
  key: string;
  name: string;
  description?: string;
  bannerUrl: string;
  isActive: boolean;
  displayOrder: number;
  stickers: Sticker[];
}

export interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
}
