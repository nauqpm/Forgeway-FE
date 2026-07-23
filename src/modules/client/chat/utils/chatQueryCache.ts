import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/queryKeys';
import type { Channel, Message, MessagesPage } from '@/modules/client/chat/types/chat.types';

const getMessageId = (message: Pick<Message, '_id' | 'id'>) => message._id || message.id;

const sortMessages = (messages: Message[]) =>
  [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

export const upsertChannelInCache = (queryClient: QueryClient, channel: Channel) => {
  queryClient.setQueryData<Channel[]>(queryKeys.chat.channels(), (current = []) => {
    const channelId = channel._id || channel.id;
    if (!channelId) return current;

    const exists = current.some((item) => (item._id || item.id) === channelId);
    if (!exists) return [channel, ...current];

    return current.map((item) =>
      (item._id || item.id) === channelId ? { ...item, ...channel } : item
    );
  });
};

export const updateChannelInCache = (
  queryClient: QueryClient,
  channelId: string,
  getUpdates: (channel: Channel) => Partial<Channel>
) => {
  queryClient.setQueryData<Channel[]>(queryKeys.chat.channels(), (current = []) =>
    current.map((channel) =>
      (channel._id || channel.id) === channelId
        ? { ...channel, ...getUpdates(channel) }
        : channel
    )
  );
};

export const upsertMessageInCache = (
  queryClient: QueryClient,
  channelId: string,
  message: Message
) => {
  console.log("chatQueryCache: upsertMessageInCache called", { channelId, message });
  queryClient.setQueryData<InfiniteData<MessagesPage>>(
    queryKeys.chat.messages(channelId),
    (current) => {
      console.log("chatQueryCache: current messages cache data is", current);
      if (!current) {
        console.log("chatQueryCache: current cache is empty, doing nothing to avoid cache pollution");
        return undefined;
      }

      const messageId = getMessageId(message);
      const existingMessage = current.pages.some((page) =>
        page.messages.some((item) => messageId && getMessageId(item) === messageId)
      );
      const pages = current.pages.map((page, pageIndex) => {
        const existing = page.messages || [];
        const updatedMessages = existing.map((item) => {
          return messageId && getMessageId(item) === messageId ? { ...item, ...message } : item;
        });

        if (!existingMessage && pageIndex === 0) {
          updatedMessages.push(message);
        }

        return {
          ...page,
          messages: sortMessages(updatedMessages),
        };
      });

      return {
        ...current,
        pages,
      };
    }
  );
};

export const updateMessageInCache = (
  queryClient: QueryClient,
  channelId: string,
  messageId: string,
  getUpdates: (message: Message) => Partial<Message>
) => {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(
    queryKeys.chat.messages(channelId),
    (current) => {
      if (!current) return current;

      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          messages: page.messages.map((message) => {
            const isMatch = getMessageId(message) === messageId;
            return isMatch
              ? { ...message, ...getUpdates(message) }
              : message;
          }),
        })),
      };
    }
  );
};

export const removeMessageFromCache = (
  queryClient: QueryClient,
  channelId: string,
  messageId: string,
  threadParentId?: string
) => {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(
    queryKeys.chat.messages(channelId),
    (current) => {
      if (!current) return current;
      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          messages: page.messages.filter((m) => getMessageId(m) !== messageId),
        })),
      };
    }
  );

  if (threadParentId) {
    queryClient.setQueryData<Message[]>(
      queryKeys.chat.threadReplies(channelId, threadParentId),
      (current = []) => current.filter((m) => getMessageId(m) !== messageId)
    );
  } else {
    // If a top-level parent message was deleted, clear all its thread replies from cache
    queryClient.setQueryData<Message[]>(
      queryKeys.chat.threadReplies(channelId, messageId),
      []
    );
    queryClient.removeQueries({
      queryKey: queryKeys.chat.threadReplies(channelId, messageId),
    });
  }

  queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
  queryClient.invalidateQueries({ queryKey: queryKeys.chat.activeThreads(channelId) });
  queryClient.invalidateQueries({ queryKey: ['chat', 'messages', 'search', channelId] });
};
