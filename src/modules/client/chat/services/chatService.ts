import api from '@/config/api';
import type { Channel, Message } from '@/stores/chatStore';

const normalizeArray = <T>(res: any): T[] => {
  const body = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    // Try to find an array property (common for paginated results like { messages: [], total: 10 })
    const possibleArray = body.messages || body.channels || body.data || Object.values(body).find(Array.isArray);
    if (Array.isArray(possibleArray)) return possibleArray;
  }
  return [];
};

export const getChannelsAPI = async (): Promise<Channel[]> => {
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

export const getMessagesAPI = async (
  channelId: string,
  params?: { limit?: number; cursor?: string }
): Promise<Message[]> => {
  const response = await api.get(`/chat/channels/${channelId}/messages`, {
    params
  });
  const data = normalizeArray<any>(response);
  
  return data.map(item => ({
    ...item,
    _id: item._id || item.id
  }));
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
