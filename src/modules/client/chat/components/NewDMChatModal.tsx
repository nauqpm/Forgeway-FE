'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, User, Loader2 } from 'lucide-react';
import { useSearchUsers, useCreateDM } from '../hooks/useChatQueries';
import type { SearchUser } from '@/modules/client/chat/types/chat.types';
import { toast } from 'react-hot-toast';
import { useEscapeStack } from '@/shared/hooks/useEscapeStack';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewDMChatModal({ isOpen, onClose }: NewChatModalProps) {
  useEscapeStack(onClose, isOpen);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: users = [], isFetching: loading } = useSearchUsers(debouncedSearch);
  const createDMMutation = useCreateDM();
  const creating = createDMMutation.isPending;

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setDebouncedSearch('');
      setSelectedUserIds([]);
    }
  }, [isOpen]);

  const toggleUserSelection = (targetUserId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(targetUserId)
        ? prev.filter((id) => id !== targetUserId)
        : [...prev, targetUserId]
    );
  };

  const handleStartChat = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await createDMMutation.mutateAsync(selectedUserIds);
      toast.success('Create DM successfully');
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Failed to create DM:', error);
      toast.error(error.response?.data?.message || error.message || 'Không thể tạo cuộc trò chuyện!');
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
          <h2 className="font-semibold text-[#111111] dark:text-[#E8E8E7]">New Message</h2>
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
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-10 bg-[#FBFBFA] dark:bg-[#202020] border-none outline-none rounded-[8px] text-[0.875rem] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[350px] p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#787774]">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-xs">Loading...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-[#787774]">
              <p className="text-sm italic">
                {search ? `No users found matching "${search}"` : 'No users available'}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {users.map((user: SearchUser, idx: number) => {
                const isSelected = selectedUserIds.includes(user._id || user.id || '');
                return (
                  <button
                    key={user._id || user.id || `u-${idx}`}
                    disabled={creating}
                    onClick={() => toggleUserSelection(user._id || user.id || '')}
                    className="w-full flex items-center justify-between p-2.5 rounded-[8px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors group text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden flex-shrink-0">
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
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[0.875rem] text-[#111111] dark:text-[#E8E8E7] truncate">{user.fullName || user.email || 'User'}</p>
                        <p className="text-[0.75rem] text-[#787774] dark:text-[#9B9A97] truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-[#2563EB] border-[#2563EB]' 
                        : 'border-[#EAEAEA] dark:border-[#383838]'
                    }`}>
                      {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between bg-[#FBFBFA] dark:bg-[#202020]">
          <p className="text-sm text-[#787774] font-medium">
            {selectedUserIds.length} selected
          </p>
          <button 
            onClick={handleStartChat}
            disabled={selectedUserIds.length === 0 || creating}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-[8px] font-semibold text-sm hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Chat
          </button>
        </div>

        {creating && (
          <div className="absolute inset-0 bg-white/60 dark:bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
              <p className="text-xs font-semibold text-[#111111] dark:text-[#E8E8E7]">Creating conversation...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
