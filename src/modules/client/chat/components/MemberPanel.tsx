'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Loader2, Users, UserPlus, UserMinus } from 'lucide-react';
import { useChannelMembers, useCreateDM } from '@/modules/client/chat/hooks/useChatQueries';
import type { ChatMember } from '@/modules/client/chat/types/chat.types';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import type { AuthUser } from '@/modules/auth/shared/types/auth.types';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/queryKeys';
import type { Channel } from '@/modules/client/chat/types/chat.types';
import type { Workspace, WorkspaceMember } from '@/modules/workspace/shared/types/workspace.type';
import InviteChannelMembersModal from './InviteChannelMembersModal';
import { kickMemberAPI } from '@/modules/client/chat/services/chatService';
import toast from 'react-hot-toast';
import { Modal, ModalFooter } from '@/shared/components/ui/Modal';

interface MemberPanelProps {
  channelId: string;
  onClose: () => void;
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

  if (normalizedRole === 'channel_admin') {
    return (
      <span className={`${baseClass} bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400`}>
        Channel Admin
      </span>
    );
  }

  if (normalizedRole === 'channel_member') {
    return (
      <span className={`${baseClass} bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400`}>
        Channel Member
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
  const { data: members = [], isLoading } = useChannelMembers(channelId);
  const createDMMutation = useCreateDM();
  const [searchQuery, setSearchQuery] = useState('');

  const handleMemberClick = async (memberId: string) => {
    if (String(memberId) === String(currentUserId)) return;
    
    const loadingToast = toast.loading('Starting conversation...');
    try {
      await createDMMutation.mutateAsync([memberId]);
      toast.success('Create DM successfully', { id: loadingToast });
      onClose();
    } catch (error) {
      console.error('Failed to create DM:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || 'Failed to start conversation', { id: loadingToast });
    }
  };

  const queryClient = useQueryClient();
  const authUser = useAuthStore(state => state.user) as (AuthUser & { _id?: string }) | null;
  const currentUserId = authUser?._id || authUser?.id;
  const userRole = authUser?.role;

  const channels = queryClient.getQueryData<Channel[]>(queryKeys.chat.channels()) || [];
  const activeChannel = channels.find(c => c._id === channelId);

  const currentUserMember = members.find(
    (m) => String(m._id) === String(currentUserId)
  );
  const isChannelAdmin = currentUserMember?.role === 'channel_admin';

  // Get workspace role
  const workspaces = queryClient.getQueryData<Workspace[]>(['workspaces']) || [];
  const activeWorkspace = workspaces.find(
    (w) => String(w._id) === String(activeChannel?.workspaceId)
  );
  const wsMember = activeWorkspace?.members?.find(
    (m: WorkspaceMember) => String(m.userId) === String(currentUserId)
  );
  const wsRole = wsMember?.role;
  const isWorkspaceAdmin =
    wsRole === 'workspace_admin' ||
    String(activeWorkspace?.ownerId) === String(currentUserId);

  const canInvite = activeChannel?.type === 'custom' && (isChannelAdmin || isWorkspaceAdmin || userRole === 'super_admin');
  const canKick = canInvite;

  const [memberToKick, setMemberToKick] = useState<{ id: string; name: string } | null>(null);
  const [isKicking, setIsKicking] = useState(false);

  const handleKickMember = async () => {
    if (!memberToKick) return;
    setIsKicking(true);
    try {
      await kickMemberAPI(channelId, memberToKick.id);
      toast.success(`Removed ${memberToKick.name} from the channel`);
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.members(channelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
      setMemberToKick(null);
    } catch (error: unknown) {
      console.error('Failed to kick member:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setIsKicking(false);
    }
  };

  const getMemberDisplayRole = (member: ChatMember & { globalRole?: string }) => {
    if (member.globalRole === 'super_admin' || member.globalRole === 'superadmin') {
      return 'super_admin';
    }

    const wsMem = activeWorkspace?.members?.find(
      (m: WorkspaceMember) => {
        const uId = typeof m.userId === 'object' && m.userId ? m.userId._id || m.userId.id : m.userId;
        return String(uId) === String(member._id);
      }
    );

    if (wsMem?.role === 'workspace_admin' || String(activeWorkspace?.ownerId) === String(member._id)) {
      return 'workspace_admin';
    }

    return member.role;
  };

  const [showInviteModal, setShowInviteModal] = useState(false);

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
    return [...filteredMembers].sort((a: ChatMember, b: ChatMember) => {
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
          {!isLoading && (
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

      {/* Invite Button */}
      {canInvite && (
        <div className="px-3 py-2 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <button
            onClick={() => setShowInviteModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add people</span>
          </button>
        </div>
      )}

      {/* Member list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
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
                onClick={() => !createDMMutation.isPending && handleMemberClick(String(member._id))}
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
                      {member.fullName || member.email || 'User'}
                    </span>
                    {getRoleBadge(getMemberDisplayRole(member))}
                  </div>
                  {member.email && (
                    <p className="text-[11px] text-[#ABABAB] dark:text-[#6B6B6B] truncate leading-snug mt-0.5">
                      {member.email}
                    </p>
                  )}
                </div>

                 {/* Kick button */}
                {canKick && String(member._id) !== String(currentUserId) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberToKick({
                        id: String(member._id),
                        name: member.fullName || member.email || 'User',
                      });
                    }}
                    title="Remove member"
                    className="p-1 text-[#787774] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showInviteModal && activeChannel && (
        <InviteChannelMembersModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          channelId={channelId}
          workspaceId={activeChannel.workspaceId || ''}
          existingMemberIds={members.map(m => String(m._id))}
        />
      )}

      {memberToKick && (
        <Modal
          open={Boolean(memberToKick)}
          onClose={() => setMemberToKick(null)}
          title="Remove Member"
          size="sm"
          footer={
            <ModalFooter
              onCancel={() => setMemberToKick(null)}
              onConfirm={handleKickMember}
              confirmLabel="Remove"
              confirmVariant="danger"
              loading={isKicking}
            />
          }
        >
          <p className="text-xs text-[#787774] dark:text-[#9B9A97]">
            Are you sure you want to remove <strong className="text-[#111111] dark:text-[#E8E8E7]">{memberToKick.name}</strong> from this channel? They will no longer have access to the messages and files.
          </p>
        </Modal>
      )}
    </div>
  );
}
