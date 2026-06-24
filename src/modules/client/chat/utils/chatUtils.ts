import type { Channel } from '../types/chat.types';

/**
 * Utility to resolve the channel name context for a message.
 * Returns the channel name (without hash prefix) if found, otherwise null.
 */
export const getMessageContext = (messageChannelId: string, channels: Channel[]): string | null => {
  if (!messageChannelId || !channels) return null;
  const channel = channels.find(c => String(c._id || c.id) === String(messageChannelId));
  return channel ? channel.name : null;
};
