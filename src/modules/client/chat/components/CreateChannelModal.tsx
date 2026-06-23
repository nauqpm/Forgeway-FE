'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Lock, Globe } from 'lucide-react';
import { createChannelAPI } from '../services/chatService';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/queryKeys';
import { useChatStore } from '@/stores/chatStore';
import toast from 'react-hot-toast';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export default function CreateChannelModal({ isOpen, onClose, workspaceId }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const setActiveChannel = useChatStore(state => state.setActiveChannel);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setIsPrivate(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // lowercase, alphanumeric and hyphens only
    const value = e.target.value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    setName(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Channel name is required');
      return;
    }
    if (!workspaceId) {
      toast.error('No active workspace selected');
      return;
    }

    setLoading(true);
    try {
      const channel = await createChannelAPI({
        name: name.trim(),
        workspaceId,
        isPrivate,
        description: description.trim() || undefined,
      });

      // Refetch channel list
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
      
      // Navigate/Select the newly created channel
      setActiveChannel(channel._id);
      
      toast.success(`Channel #${name} created successfully!`);
      onClose();
    } catch (error: any) {
      console.error('Failed to create channel:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#252525] rounded-[12px] border border-[#EAEAEA] dark:border-white/[0.06] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <header className="px-4 h-14 flex items-center justify-between border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <h2 className="font-semibold text-[#111111] dark:text-[#E8E8E7]">Create a channel</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#787774] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wider mb-1.5">
              Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">#</span>
              <input
                autoFocus
                type="text"
                maxLength={80}
                placeholder="e.g. plan-launch"
                value={name}
                onChange={handleNameChange}
                disabled={loading}
                className="w-full pl-7 pr-4 h-10 bg-[#FBFBFA] dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] text-[0.875rem] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] focus:ring-1 focus:ring-[#2563EB] outline-none"
              />
            </div>
            <p className="text-[10px] text-[#787774] mt-1">
              Names must be lowercase, without spaces or periods, and shorter than 80 characters.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wider mb-1.5">
              Description <span className="text-[10px] text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              maxLength={250}
              placeholder="What’s this channel about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
              className="w-full p-3 min-h-[80px] max-h-[140px] bg-[#FBFBFA] dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] text-[0.875rem] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] focus:ring-1 focus:ring-[#2563EB] outline-none resize-y"
            />
          </div>

          {/* Visibility Toggle Options */}
          <div>
            <label className="block text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wider mb-2">
              Visibility
            </label>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${
                !isPrivate 
                  ? 'border-[#2563EB]/40 bg-[#2563EB]/5 dark:bg-[#2563EB]/10' 
                  : 'border-[#EAEAEA] dark:border-white/[0.06] hover:bg-[#F7F6F3] dark:hover:bg-white/5'
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  disabled={loading}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-[0.875rem] text-[#111111] dark:text-[#E8E8E7]">
                    <Globe className="w-3.5 h-3.5 text-[#787774]" />
                    <span>Public</span>
                  </div>
                  <p className="text-xs text-[#787774] mt-0.5">
                    Anyone in the workspace can view, search, and join this channel.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${
                isPrivate 
                  ? 'border-[#2563EB]/40 bg-[#2563EB]/5 dark:bg-[#2563EB]/10' 
                  : 'border-[#EAEAEA] dark:border-white/[0.06] hover:bg-[#F7F6F3] dark:hover:bg-white/5'
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  disabled={loading}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-[0.875rem] text-[#111111] dark:text-[#E8E8E7]">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Private</span>
                  </div>
                  <p className="text-xs text-[#787774] mt-0.5">
                    Can only be joined or viewed by invitation from an existing member.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 h-9 text-xs font-semibold rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] text-[#787774] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 h-9 text-xs font-semibold rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
