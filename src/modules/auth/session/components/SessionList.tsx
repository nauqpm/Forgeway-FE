'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getSessionsAPI, revokeSessionAPI, revokeAllOtherSessionsAPI } from '../services/sessionService';
import { useTimezone } from '../hooks/useTimezone';
import type { Session } from '../../shared/types/auth.types';
import { Monitor, Smartphone, Loader2, Trash2, X } from 'lucide-react';

const SessionList: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const { formatRelative } = useTimezone();

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { sessions } = await getSessionsAPI();
      setSessions(sessions);
    } catch { /* Error handled silently */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try { await revokeSessionAPI(id); setSessions((s) => s.filter((x) => x.id !== id)); }
    catch { /* Error handled silently */ }
    finally { setRevoking(null); }
  };

  const handleRevokeAll = async () => {
    setRevoking('all');
    try { await revokeAllOtherSessionsAPI(); setSessions((s) => s.filter((x) => x.isCurrent)); }
    catch { /* Error handled silently */ }
    finally { setRevoking(null); }
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-[13px] text-[#787774] dark:text-[#9B9A97] py-4">
      <Loader2 className="w-4 h-4 animate-spin" />Loading...
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[#111111] dark:text-[#E8E8E7]">Login sessions</h3>
        {sessions.filter((s) => !s.isCurrent).length > 0 && (
          <button
            onClick={handleRevokeAll}
            disabled={revoking === 'all'}
            className="text-[13px] text-[#9F2F2D] dark:text-[#F87171] hover:underline flex items-center gap-1 disabled:opacity-50"
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
                : 'border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020]'
            }`}
          >
            <div className="flex-shrink-0 w-10 h-10 bg-[#F7F6F3] dark:bg-[#252525] rounded-[6px] flex items-center justify-center">
              {s.os?.toLowerCase().includes('mobile')
                ? <Smartphone className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
                : <Monitor className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7] truncate">
                {s.browser || s.deviceInfo}
                {s.isCurrent && (
                  <span className="ml-2 text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-semibold">(Current)</span>
                )}
              </p>
              <p className="text-[11px] text-[#ABABAB] dark:text-[#6B6B6B]">
                {s.ipAddress} · {formatRelative(s.lastActiveAt)}
              </p>
            </div>
            {!s.isCurrent && (
              <button
                onClick={() => handleRevoke(s.id)}
                disabled={revoking === s.id}
                className="flex-shrink-0 p-2 rounded-[4px] text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#9F2F2D] dark:hover:text-[#F87171] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] disabled:opacity-50 transition-colors"
              >
                {revoking === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionList;
