'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, User, Loader2, Users } from 'lucide-react';
import { createDMAPI, searchUsersAPI, getAllUsersAPI } from '../services/chatService';
import { useChatStore } from '@/stores/chatStore';

interface UserData {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewDMChatModal({ isOpen, onClose }: NewChatModalProps) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { setActiveChannel, setChannels, channels } = useChatStore();

  // Load all users on mount or when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAllUsersAPI()
        .then(data => setSuggestedUsers(Array.isArray(data) ? data : []))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && search) {
      const timer = setTimeout(() => {
        setLoading(true);
        searchUsersAPI(search)
          .then(data => {
            // Ensure data is an array
            setUsers(Array.isArray(data) ? data : []);
          })
          .finally(() => setLoading(false));
      }, 300); // Debounce search to optimize performance

      return () => clearTimeout(timer);
    } else if (!search) {
      setUsers([]);
    }
  }, [isOpen, search]);

  const handleStartChat = async (targetUserId: string) => {
    if (!targetUserId) return;
    setCreating(true);
    try {
      const channel = await createDMAPI(targetUserId);
      console.log('DM Channel Created/Retrieved:', channel);
      
      if (!channel.members || channel.members.length === 0) {
        console.warn('Backend returned DM channel without populated members!');
      }

      // Update local channels list if not already present
      if (!channels.some(c => c._id === channel._id)) {
        setChannels([...channels, channel]);
      }
      
      setActiveChannel(channel._id);
      onClose();
    } catch (error: any) {
      console.error('Failed to create DM:', error);
      alert(`Error starting chat: ${error.response?.data?.message || error.message}`);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  const displayUsers = search ? users : suggestedUsers;

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
          {!search && suggestedUsers.length > 0 && (
            <div className="px-2 py-1.5 mb-1 flex items-center gap-2 text-[0.625rem] font-bold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wider">
              <Users className="w-3 h-3" />
              Suggested Users
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#787774]">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-xs">Loading...</p>
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="py-10 text-center text-[#787774]">
              <p className="text-sm italic">{search ? `No users found matching "${search}"` : 'No users found'}</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {displayUsers.map((user, idx) => (
                <button
                  key={user._id || (user as any).id || `u-${idx}`}
                  disabled={creating}
                  onClick={() => handleStartChat(user._id || (user as any).id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors group text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden">
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
                    <p className="font-semibold text-[0.875rem] text-[#111111] dark:text-[#E8E8E7] truncate">{user.fullName}</p>
                    <p className="text-[0.75rem] text-[#787774] dark:text-[#9B9A97] truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
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
