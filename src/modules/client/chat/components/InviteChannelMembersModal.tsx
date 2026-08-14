'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Loader2, Check } from 'lucide-react';
import api from '@/lib/axiosIns';
import { apiRoutes } from '@/config/apiRoutes';
import { inviteMembersAPI } from '../services/chatService';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/queryKeys';
import toast from 'react-hot-toast';
import { useEscapeStack } from '@/shared/hooks/useEscapeStack';

interface ChannelCandidateUser {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
}

interface ChannelCandidateMember {
  userId?: ChannelCandidateUser;
  role?: string;
}

interface InviteChannelMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  workspaceId: string;
  existingMemberIds: string[];
}

export default function InviteChannelMembersModal({
  isOpen,
  onClose,
  channelId,
  workspaceId,
  existingMemberIds,
}: InviteChannelMembersModalProps) {
  useEscapeStack(onClose, isOpen);
  const queryClient = useQueryClient();
  const [workspaceMembers, setWorkspaceMembers] = useState<ChannelCandidateMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  // Fetch workspace members when modal opens
  useEffect(() => {
    if (!isOpen || !workspaceId) return;

    setLoading(true);
    setSelectedUserIds([]);
    setSearch('');
    
    api
      .get(apiRoutes.WORKSPACES.MEMBERS(workspaceId))
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setWorkspaceMembers(data);
      })
      .catch((err) => {
        console.error('Failed to fetch workspace members:', err);
        setWorkspaceMembers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, workspaceId]);

  // Filter out existing channel members and apply search query
  const candidates = useMemo(() => {
    // Workspace member structures contain a `userId` sub-object
    const nonMembers = workspaceMembers.filter((m) => {
      const uId = m.userId?._id || m.userId?.id;
      if (!uId) return false;
      return !existingMemberIds.includes(String(uId));
    });

    if (!search.trim()) return nonMembers;
    const q = search.toLowerCase();
    return nonMembers.filter((m) => {
      const user = m.userId || {};
      return (
        user.fullName?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)
      );
    });
  }, [workspaceMembers, existingMemberIds, search]);

  const handleToggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleInvite = async () => {
    if (selectedUserIds.length === 0) return;
    setInviting(true);
    try {
      await inviteMembersAPI(channelId, selectedUserIds);
      toast.success('Successfully invited members to channel!');
      
      // Invalidate queries to refresh members list
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.members(channelId),
      });

      onClose();
    } catch (err: unknown) {
      console.error('Failed to invite members:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        error.response?.data?.message || error.message || 'Failed to invite members'
      );
    } finally {
      setInviting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#252525] rounded-[12px] border border-[#EAEAEA] dark:border-white/[0.06] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <header className="px-4 h-14 flex items-center justify-between border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <h2 className="font-semibold text-[#111111] dark:text-[#E8E8E7] text-sm">Add people to channel</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#787774] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB]" />
            <input 
              autoFocus
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-10 bg-[#FBFBFA] dark:bg-[#202020] border-none outline-none rounded-[8px] text-[0.875rem] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[300px] p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#787774]">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-xs">Loading workspace members...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-10 text-center text-[#787774]">
              <p className="text-xs italic">
                {search ? `No members found matching "${search}"` : 'All workspace members are already in this channel.'}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {candidates.map((member) => {
                const user = member.userId || {};
                const userId = user._id || user.id || '';
                const isSelected = selectedUserIds.includes(userId);
                return (
                  <button
                    key={userId}
                    disabled={inviting}
                    onClick={() => handleToggleSelect(userId)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors group text-left disabled:opacity-50"
                  >
                    <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors flex-shrink-0 ${
                      isSelected 
                        ? 'bg-[#2563EB] border-[#2563EB] text-white' 
                        : 'border-[#ABABAB] dark:border-white/20'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden flex-shrink-0">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.fullName} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent && !parent.querySelector('span')) {
                              const span = document.createElement('span');
                              span.innerText = user.fullName?.charAt(0).toUpperCase() || 'U';
                              parent.appendChild(span);
                            }
                          }}
                        />
                      ) : (
                        <span>{user.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] truncate">{user.fullName || user.email || 'User'}</p>
                      <p className="text-[0.75rem] text-[#787774] dark:text-[#9B9A97] truncate">{user.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="px-4 py-3 border-t border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-end gap-2 bg-[#FBFBFA] dark:bg-[#202020] flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 h-9 text-xs font-semibold rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] text-[#787774] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={selectedUserIds.length === 0 || inviting}
            onClick={handleInvite}
            className="flex items-center gap-1.5 px-4 h-9 text-xs font-semibold rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors disabled:opacity-50"
          >
            {inviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Add ({selectedUserIds.length})</span>
          </button>
        </footer>

        {inviting && (
          <div className="absolute inset-0 bg-white/60 dark:bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
              <p className="text-xs font-semibold text-[#111111] dark:text-[#E8E8E7]">Adding members...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
