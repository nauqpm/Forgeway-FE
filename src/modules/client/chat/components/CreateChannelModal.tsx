'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Lock, Globe, AlertCircle } from 'lucide-react';
import { createChannelAPI } from '../services/chatService';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/queryKeys';
import { useChatStore } from '@/stores/chatStore';
import { upsertChannelInCache } from '@/modules/client/chat/utils/chatQueryCache';
import toast from 'react-hot-toast';
import { useChatChannels } from '../hooks/useChatQueries';
import { useEscapeStack } from '@/shared/hooks/useEscapeStack';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export default function CreateChannelModal({ isOpen, onClose, workspaceId }: CreateChannelModalProps) {
  useEscapeStack(onClose, isOpen);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const setActiveChannel = useChatStore(state => state.setActiveChannel);

  const { data: channels = [] } = useChatChannels();
  const customChannelsCount = useMemo(() => {
    if (!workspaceId) return 0;
    return channels.filter(
      c => c.type === 'custom' && String(c.workspaceId) === String(workspaceId)
    ).length;
  }, [channels, workspaceId]);

  const isLimitReached = customChannelsCount >= 20;
  const isInputDisabled = loading || isLimitReached;

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
    setName(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Channel name is required');
      return;
    }
    const isValidName = /^[a-zA-Z0-9\s-_àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]+$/.test(trimmedName);
    if (!isValidName) {
      toast.error('Channel name can only contain letters, numbers, spaces, hyphens, and underscores');
      return;
    }
    if (!workspaceId) {
      toast.error('No active workspace selected');
      return;
    }

    setLoading(true);
    try {
      const channel = await createChannelAPI({
        name: trimmedName,
        workspaceId,
        isPrivate,
        description: description.trim() || undefined,
      });

      upsertChannelInCache(queryClient, channel);
      setActiveChannel(channel._id);
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
      
      toast.success(`Channel #${name} created successfully!`);
      onClose();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Failed to create channel:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to create channel');
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
          <div className="flex flex-col">
            <h2 className="font-semibold text-[#111111] dark:text-[#E8E8E7]">Create a channel</h2>
            <span className="text-[10px] text-[#787774] dark:text-[#9B9A97]">
              {customChannelsCount} of 20 channels created
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#787774] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isLimitReached && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-[8px] text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-[18px] h-[18px] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Channel limit reached</p>
                <p className="mt-0.5 opacity-90">This workspace has reached the maximum limit of 20 custom channels.</p>
              </div>
            </div>
          )}

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
                disabled={isInputDisabled}
                className="w-full pl-7 pr-4 h-10 bg-[#FBFBFA] dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] text-[0.875rem] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] focus:ring-1 focus:ring-[#2563EB] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-[#787774] mt-1">
              Names can contain Vietnamese, spaces, and must be shorter than 80 characters.
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
              disabled={isInputDisabled}
              className="w-full p-3 min-h-[80px] max-h-[140px] bg-[#FBFBFA] dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] text-[0.875rem] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] focus:ring-1 focus:ring-[#2563EB] outline-none resize-y disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Visibility Toggle Options */}
          <div>
            <label className="block text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wider mb-2">
              Visibility
            </label>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-[8px] border transition-colors ${
                isLimitReached 
                  ? 'border-gray-200 dark:border-white/[0.04] opacity-50 cursor-not-allowed'
                  : !isPrivate 
                    ? 'border-[#2563EB]/40 bg-[#2563EB]/5 dark:bg-[#2563EB]/10 cursor-pointer' 
                    : 'border-[#EAEAEA] dark:border-white/[0.06] hover:bg-[#F7F6F3] dark:hover:bg-white/5 cursor-pointer'
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  disabled={isInputDisabled}
                  className="mt-1 disabled:cursor-not-allowed"
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

              <label className={`flex items-start gap-3 p-3 rounded-[8px] border transition-colors ${
                isLimitReached 
                  ? 'border-gray-200 dark:border-white/[0.04] opacity-50 cursor-not-allowed'
                  : isPrivate 
                    ? 'border-[#2563EB]/40 bg-[#2563EB]/5 dark:bg-[#2563EB]/10 cursor-pointer' 
                    : 'border-[#EAEAEA] dark:border-white/[0.06] hover:bg-[#F7F6F3] dark:hover:bg-white/5 cursor-pointer'
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  disabled={isInputDisabled}
                  className="mt-1 disabled:cursor-not-allowed"
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
              disabled={isInputDisabled}
              className="flex items-center gap-1.5 px-4 h-9 text-xs font-semibold rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
