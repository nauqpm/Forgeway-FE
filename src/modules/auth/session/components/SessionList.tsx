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

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-4"><Loader2 className="w-4 h-4 animate-spin" />Đang tải...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Phiên đăng nhập</h3>
        {sessions.filter((s) => !s.isCurrent).length > 0 && (
          <button onClick={handleRevokeAll} disabled={revoking === 'all'}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 disabled:opacity-50">
            <X className="w-3.5 h-3.5" />Đăng xuất tất cả
          </button>
        )}
      </div>
      <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className={`flex items-center gap-4 p-4 rounded-xl border ${s.isCurrent ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200 bg-white'}`}>
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              {s.os?.toLowerCase().includes('mobile') ? <Smartphone className="w-5 h-5 text-gray-500" /> : <Monitor className="w-5 h-5 text-gray-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {s.browser || s.deviceInfo}{s.isCurrent && <span className="ml-2 text-xs text-indigo-600 font-semibold">(Hiện tại)</span>}
              </p>
              <p className="text-xs text-gray-500">{s.ipAddress} · {formatRelative(s.lastActiveAt)}</p>
            </div>
            {!s.isCurrent && (
              <button onClick={() => handleRevoke(s.id)} disabled={revoking === s.id}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 disabled:opacity-50">
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