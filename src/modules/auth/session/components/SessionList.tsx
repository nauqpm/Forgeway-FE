'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSessionsAPI, revokeSessionAPI, revokeAllOtherSessionsAPI } from '../services/sessionService';
import { useTimezone } from '../hooks/useTimezone';
import { Monitor, Smartphone, Loader2, Trash2, X } from 'lucide-react';

const AUTH_SESSIONS_QUERY_KEY = ['auth', 'sessions'] as const;

const SessionList: React.FC = () => {
  const queryClient = useQueryClient();
  const { formatRelative } = useTimezone();

  const sessionsQuery = useQuery({
    queryKey: AUTH_SESSIONS_QUERY_KEY,
    queryFn: async () => {
      const { sessions } = await getSessionsAPI();
      return sessions;
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: revokeSessionAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_SESSIONS_QUERY_KEY });
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: revokeAllOtherSessionsAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_SESSIONS_QUERY_KEY });
    },
  });

  const sessions = sessionsQuery.data ?? [];
  const revokingId = revokeSessionMutation.isPending ? revokeSessionMutation.variables : null;
  const isRevokingAll = revokeAllMutation.isPending;

  if (sessionsQuery.isLoading) return (
    <div className="flex items-center gap-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] py-4">
      <Loader2 className="w-4 h-4 animate-spin" />Loading...
    </div>
  );

  if (sessionsQuery.isError) return (
    <div className="text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171] py-4">
      Could not load login sessions.
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Login sessions</h3>
        {sessions.filter((s) => !s.isCurrent).length > 0 && (
          <button
            onClick={() => revokeAllMutation.mutate()}
            disabled={isRevokingAll}
            className="text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171] hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />Sign out all
          </button>
        )}
      </div>
      <div className="space-y-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`flex items-center gap-4 p-4 rounded-[8px] border ${
              s.isCurrent
                ? 'border-[#2563EB]/20 dark:border-[rgba(37,99,235,0.2)] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.06)]'
                : 'border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020]'
            }`}
          >
            <div className="flex-shrink-0 w-10 h-10 bg-[#F7F6F3] dark:bg-[#252525] rounded-[6px] flex items-center justify-center">
              {s.os?.toLowerCase().includes('mobile')
                ? <Smartphone className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
                : <Monitor className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] truncate">
                {s.browser || s.deviceInfo}
                {s.isCurrent && (
                  <span className="ml-2 text-[0.6875rem] text-[#2563EB] dark:text-[#3B82F6] font-semibold">(Current)</span>
                )}
              </p>
              <p className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
                {s.ipAddress} &middot; {formatRelative(s.lastActiveAt)}
              </p>
            </div>
            {!s.isCurrent && (
              <button
                onClick={() => revokeSessionMutation.mutate(s.id)}
                disabled={revokingId === s.id || isRevokingAll}
                className="flex-shrink-0 p-2 rounded-[4px] text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#9F2F2D] dark:hover:text-[#F87171] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] disabled:opacity-50 transition-colors"
              >
                {revokingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionList;
