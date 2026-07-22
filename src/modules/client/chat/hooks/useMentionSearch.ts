import { useRef, useEffect, useCallback } from 'react';
import api from '@/lib/axiosIns';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';

export interface MentionMemberItem {
  id: string;
  display: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export function useMentionSearch(channelId?: string | null) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authUser = useAuthStore(state => state.user);
  const currentUserId = (authUser as { _id?: string; id?: string } | null)?._id || authUser?.id;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMentionSearch = useCallback(
    (
      search: string,
      callback: (data: MentionMemberItem[]) => void
    ) => {
      const query = search || '';

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const isAllMatch = !query || 'all'.startsWith(query.toLowerCase());
      if (isAllMatch) {
        callback([{
          id: 'All',
          display: 'All',
          email: 'Mention everyone in this channel',
          phone: '',
          avatar: 'special-all'
        }]);
      }

      const fetchMembers = async () => {
        try {
          const response = await api.get(`/chat/channels/${channelId}/mention-members`, {
            params: { q: query }
          });
          const members = response.data || [];
          
          const mappedMembers: MentionMemberItem[] = members
            .filter((m: { _id?: string; id?: string }) => {
              const memberId = m._id || m.id;
              return !currentUserId || String(memberId) !== String(currentUserId);
            })
            .map((m: { _id?: string; id?: string; fullName?: string; email?: string; phone?: string; avatar?: string }) => {
              const display = m.fullName?.trim() || m.email?.split('@')[0] || String(m._id || m.id || 'User');
              return {
                id: m._id || (m.id as string),
                display,
                email: m.email,
                phone: m.phone,
                avatar: m.avatar
              };
            });

          if (isAllMatch) {
            mappedMembers.unshift({
              id: 'All',
              display: 'All',
              email: 'Mention everyone in this channel',
              phone: '',
              avatar: 'special-all'
            });
          }

          callback(mappedMembers.slice(0, 10));
        } catch (err) {
          console.error('Failed to search mention members:', err);
          callback([]);
        }
      };

      if (!query) {
        fetchMembers();
      } else {
        timeoutRef.current = setTimeout(fetchMembers, 150);
      }
    },
    [channelId, currentUserId]
  );

  return { handleMentionSearch };
}
