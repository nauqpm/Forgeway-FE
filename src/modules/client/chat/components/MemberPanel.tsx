'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { X, Search, Loader2, Users } from 'lucide-react';
import { getChannelMembersAPI } from '@/modules/client/chat/services/chatService';


interface MemberPanelProps {
  channelId: string;
  onClose: () => void;
}

interface MemberInfo {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: string;
}

const getRoleBadge = (role?: string) => {
  if (!role) return null;
  
  const normalizedRole = role.toLowerCase();
  
  const baseClass = "whitespace-nowrap inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider";
  
  if (normalizedRole === 'super_admin' || normalizedRole === 'superadmin') {
    return (
      <span className={`${baseClass} bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400`}>
        Super Admin
      </span>
    );
  }
  
  if (normalizedRole === 'workspace_admin') {
    return (
      <span className={`${baseClass} bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400`}>
        Workspace Admin
      </span>
    );
  }

  if (normalizedRole === 'member') {
    return (
      <span className={`${baseClass} bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`}>
        Member
      </span>
    );
  }

  if (normalizedRole === 'viewer') {
    return (
      <span className={`${baseClass} bg-[#F7F6F3] dark:bg-white/[0.06] text-[#787774] dark:text-[#9B9A97]`}>
        Viewer
      </span>
    );
  }

  if (normalizedRole === 'user') {
    return (
      <span className={`${baseClass} bg-[#F7F6F3] dark:bg-white/[0.06] text-[#787774] dark:text-[#9B9A97]`}>
        User
      </span>
    );
  }

  return null;
};

export default function MemberPanel({ channelId, onClose }: MemberPanelProps) {
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getChannelMembersAPI(channelId)
      .then((data) => {
        if (isMounted) setMembers(data as MemberInfo[]);
      })
      .catch((err) => {
        console.error('Failed to load channel members:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [channelId]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.fullName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.includes(q)
    );
  }, [members, searchQuery]);

  // Sort: admins first, then alphabetically
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const roleOrder = (r?: string) => {
        if (!r) return 3;
        const nr = r.toLowerCase();
        if (nr === 'super_admin' || nr === 'superadmin') return 0;
        if (nr === 'workspace_admin' || nr === 'admin') return 1;
        return 3;
      };
      const diff = roleOrder(a.role) - roleOrder(b.role);
      if (diff !== 0) return diff;
      return (a.fullName || '').localeCompare(b.fullName || '');
    });
  }, [filteredMembers]);

  return (
    <div className="w-[280px] flex-shrink-0 border-l border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] flex flex-col h-full animate-[slideInRight_0.2s_ease-out]">
      {/* Header */}
      <div className="h-14 flex-shrink-0 border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
          <h3 className="text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Members
          </h3>
          {!loading && (
            <span className="px-1.5 py-0.5 bg-[#F0F0EE] dark:bg-white/[0.06] text-[#787774] dark:text-[#9B9A97] rounded-[4px] text-[10px] font-bold">
              {members.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[#EAEAEA] dark:border-white/[0.06]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F6F3] dark:bg-white/[0.04] border border-[#EAEAEA] dark:border-white/[0.06] rounded-md text-[#111111] dark:text-[#E8E8E7] placeholder-[#ABABAB] dark:placeholder-[#6B6B6B] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors"
          />
        </div>
      </div>

      {/* Member list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-[#787774]" />
          </div>
        ) : sortedMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-xs text-[#ABABAB] dark:text-[#6B6B6B]">
              {searchQuery ? 'No members found' : 'No members'}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {sortedMembers.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-[#F7F6F3] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent && !parent.querySelector('span')) {
                          const span = document.createElement('span');
                          span.innerText = member.fullName?.charAt(0).toUpperCase() || 'U';
                          parent.appendChild(span);
                        }
                      }}
                    />
                  ) : (
                    <span>{member.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] truncate leading-snug">
                      {member.fullName || 'Unknown'}
                    </span>
                    {getRoleBadge(member.role)}
                  </div>
                  {member.email && (
                    <p className="text-[11px] text-[#ABABAB] dark:text-[#6B6B6B] truncate leading-snug mt-0.5">
                      {member.email}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
