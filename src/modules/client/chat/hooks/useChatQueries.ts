import { useMutation, useQuery, useQueryClient, useInfiniteQuery, type QueryClient, type QueryFunctionContext, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/queryKeys';
import {
  createDMAPI,
  getChannelMembersAPI,
  getChannelsAPI,
  getMentionMembersAPI,
  getMessagesAPI,
  getStickersAPI,
  resetUnreadCountAPI,
  searchUsersAPI,
  getThreadRepliesAPI,
  getActiveThreadsAPI,
} from '@/modules/client/chat/services/chatService';
import { getActiveMeetingAPI } from '@/modules/client/meeting/services/meeting.api';
import { useChatStore } from '@/stores/chatStore';
import type { MentionMember, MessagesPage, Message } from '@/modules/client/chat/types/chat.types';
import { updateChannelInCache, upsertChannelInCache } from '@/modules/client/chat/utils/chatQueryCache';

type ActiveThreadsResponse = { threads: Message[]; nextCursor: string | null };

export const useChatChannels = () => {
  return useQuery({
    queryKey: queryKeys.chat.channels(),
    queryFn: getChannelsAPI,
    staleTime: 60_000,
  });
};

export const useChatMessages = (channelId: string | null) => {
  return useInfiniteQuery<MessagesPage>({
    queryKey: queryKeys.chat.messages(channelId || ''),
    queryFn: ({ pageParam, signal }) =>
      getMessagesAPI(channelId as string, {
        limit: 20,
        cursor: typeof pageParam === 'string' ? pageParam : undefined,
      }, { signal }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: Boolean(channelId),
  });
};

export const useChannelMembers = (channelId: string | null) => {
  return useQuery({
    queryKey: queryKeys.chat.members(channelId || ''),
    queryFn: () => getChannelMembersAPI(channelId as string),
    enabled: Boolean(channelId),
    staleTime: 60_000,
  });
};

export const useSearchUsers = (searchQuery: string) => {
  const trimmedQuery = searchQuery.trim();

  return useQuery({
    queryKey: queryKeys.chat.searchUsers(trimmedQuery),
    queryFn: () => searchUsersAPI(trimmedQuery),
    staleTime: 30_000,
  });
};

export const useMentionMembers = (channelId: string | null, searchQuery: string) => {
  const trimmedQuery = searchQuery.trim();

  return useQuery({
    queryKey: queryKeys.chat.mentionMembers(channelId || '', trimmedQuery),
    queryFn: () => getMentionMembersAPI(channelId as string, trimmedQuery),
    enabled: Boolean(channelId && trimmedQuery),
    staleTime: 30_000,
  });
};

export const fetchMentionMembers = (
  queryClient: QueryClient,
  channelId: string,
  searchQuery: string
): Promise<MentionMember[]> => {
  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) return Promise.resolve([]);

  return queryClient.fetchQuery({
    queryKey: queryKeys.chat.mentionMembers(channelId, trimmedQuery),
    queryFn: () => getMentionMembersAPI(channelId, trimmedQuery),
    staleTime: 30_000,
  });
};

export const useActiveMeeting = (channelId: string | null) => {
  return useQuery({
    queryKey: queryKeys.chat.activeMeeting(channelId || ''),
    queryFn: () => getActiveMeetingAPI(channelId as string),
    enabled: Boolean(channelId),
    staleTime: 15_000,
  });
};

export const useStickers = () => {
  return useQuery({
    queryKey: queryKeys.chat.stickers(),
    queryFn: getStickersAPI,
    staleTime: 5 * 60_000,
  });
};

export const useCreateDM = () => {
  const queryClient = useQueryClient();
  const setActiveChannel = useChatStore((state) => state.setActiveChannel);

  return useMutation({
    mutationFn: createDMAPI,
    onSuccess: (channel) => {
      upsertChannelInCache(queryClient, channel);
      setActiveChannel(channel._id);
    },
  });
};

export const useMarkChannelRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetUnreadCountAPI,
    onMutate: (channelId) => {
      updateChannelInCache(queryClient, channelId, () => ({ unreadCount: 0 }));
    },
    onSettled: (_data, _error, channelId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channel(channelId) });
    },
  });
};

export const useThreadReplies = (channelId: string | null, messageId: string | null) => {
  return useQuery({
    queryKey: queryKeys.chat.threadReplies(channelId || '', messageId || ''),
    queryFn: () => getThreadRepliesAPI(channelId as string, messageId as string),
    enabled: Boolean(channelId && messageId),
    staleTime: 5_000,
  });
};

export const useActiveThreads = (channelId: string | null) => {
  return useInfiniteQuery<ActiveThreadsResponse, Error, InfiniteData<ActiveThreadsResponse>, readonly ["chat", "messages", "threads", string], string | undefined>({
    queryKey: queryKeys.chat.activeThreads(channelId || ''),
    queryFn: async ({ pageParam }: QueryFunctionContext<readonly ["chat", "messages", "threads", string], string | undefined>) =>
      getActiveThreadsAPI(channelId as string, {
        limit: 20,
        cursor: typeof pageParam === 'string' ? pageParam : undefined,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: Boolean(channelId),
  });
};
