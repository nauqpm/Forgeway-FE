import api from '@/config/api';
import type { Channel, Message } from '@/stores/chatStore';

const normalizeArray = <T>(res: any): T[] => {
  const data = res?.data;
  if (Array.isArray(data)) return data;
  
  const body = data?.data ?? data;
  if (Array.isArray(body)) return body;
  
  if (body && typeof body === 'object') {
    const possibleArray = body.users || body.channels || body.messages || body.items || body.list || Object.values(body).find(Array.isArray);
    if (Array.isArray(possibleArray)) return possibleArray;
  }
  
  return [];
};

const normalizeUsers = (users: any[]): any[] => {
  return users.map(user => ({
    ...user,
    _id: user._id || user.id || (user as any).userId
  }));
};

/**
 * Helper to generate a timestamp for cache busting.
 * Only use this for endpoints that aren't strictly validated on BE.
 */
const getCacheBustParam = () => ({ _t: Date.now() });

export const getChannelsAPI = async (): Promise<Channel[]> => {
  // Removed _t to avoid 400 Bad Request on strict BE validation
  const response = await api.get('/chat/channels');
  const data = normalizeArray<any>(response);
  
  return data.map(item => ({
    ...item,
    _id: item._id || item.id,
    type: item.type === 'public' ? 'general' : item.type,
    unreadCount: item.unreadCount || 0,
    description: item.description
  }));
};

export const getChannelAPI = async (channelId: string): Promise<Channel> => {
  const response = await api.get(`/chat/${channelId}`);
  const data = response.data?.data ?? response.data;
  return {
    ...data,
    _id: data._id || data.id,
    type: data.type === 'public' ? 'general' : data.type,
    unreadCount: data.unreadCount || 0,
    description: data.description
  };
};

export const getMessagesAPI = async (
  channelId: string,
  params?: { limit?: number; cursor?: string }
): Promise<{ messages: Message[]; nextCursor: string | null }> => {
  // Removed _t to avoid 400 Bad Request on strict BE validation
  const response = await api.get(`/chat/channels/${channelId}/messages`, {
    params
  });
  const body = response.data?.data ?? response.data;
  const messagesData = Array.isArray(body?.messages) ? body.messages : (Array.isArray(body) ? body : []);
  const nextCursor = body?.nextCursor || null;
  
  const messages = messagesData.map((item: any) => ({
    ...item,
    _id: item._id || item.id
  }));

  return {
    messages,
    nextCursor
  };
};

export const resetUnreadCountAPI = async (channelId: string): Promise<void> => {
  await api.post(`/chat/channels/${channelId}/read`);
};

export const addReactionAPI = async (
  messageId: string,
  emoji: string
): Promise<void> => {
  await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
};

export const createDMAPI = async (targetUserId: string): Promise<Channel> => {
  const response = await api.post('/chat/dm', { targetUserId });
  const data = response.data?.data ?? response.data;
  return {
    ...data,
    _id: data._id || data.id,
    unreadCount: data.unreadCount || 0
  };
};

export const searchUsersAPI = async (search?: string): Promise<any[]> => {
  try {
    const response = await api.get('/chat/users/search', {
      params: { q: search, ...getCacheBustParam() }
    });
    return normalizeUsers(normalizeArray<any>(response));
  } catch (error: any) {
    try {
      const fallback = await api.get('/users/all', { 
        params: { search, ...getCacheBustParam() }
      });
      return normalizeUsers(normalizeArray<any>(fallback));
    } catch (fError) {
      return [];
    }
  }
};

export const deleteMessageAPI = async (messageId: string): Promise<void> => {
  await api.delete(`/chat/messages/${messageId}`);
};

export const getChannelMembersAPI = async (channelId: string): Promise<any[]> => {
  const response = await api.get(`/chat/channels/${channelId}/members`);
  const data = response.data?.data ?? response.data;
  return Array.isArray(data) ? data : [];
};

