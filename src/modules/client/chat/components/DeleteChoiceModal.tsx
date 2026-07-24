'use client';

import React from 'react';
import { Trash2, X } from 'lucide-react';
import { TrashForMeIcon, TrashForEveryoneIcon } from './MessageContextMenu';
import { renderMessageContent } from '../utils/messageContentRenderer';
import type { Message } from '../types/chat.types';

interface DeleteChoiceModalProps {
  isOpen: boolean;
  displayName: string;
  message: Message;
  currentUserId?: string;
  onDeleteForEveryone: () => void;
  onDeleteForMe: () => void;
  onClose: () => void;
}

export default function DeleteChoiceModal({
  isOpen,
  displayName,
  message,
  currentUserId,
  onDeleteForEveryone,
  onDeleteForMe,
  onClose,
}: DeleteChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white dark:bg-[#1C1C1C] rounded-xl shadow-2xl border border-[#EAEAEA] dark:border-white/[0.08] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
              Delete message
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-5 pb-4">
          {/* Message Preview */}
          <div className="mb-4 p-3 bg-[#F7F6F3] dark:bg-white/[0.04] rounded-lg border border-[#EAEAEA] dark:border-white/[0.06]">
            <p className="text-[0.75rem] text-[#ABABAB] dark:text-[#6B6B6B] mb-1">{displayName}</p>
            <div className="text-[0.8125rem] text-[#555555] dark:text-[#AAAAAA] line-clamp-2 break-words">
              {message.type === 'sticker' ? '[Sticker]' : (message.content ? renderMessageContent(message.content, currentUserId) : '[Attachment]')}
            </div>
          </div>

          <p className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] mb-2.5">
            Who do you want to delete this message for?
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onClose();
                onDeleteForEveryone();
              }}
              className="w-full p-3 flex items-start gap-3 rounded-lg border border-[#EAEAEA] dark:border-white/[0.08] hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-orange-500/10 transition-all text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <TrashForEveryoneIcon className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] group-hover:text-orange-600 dark:group-hover:text-orange-400">
                  Delete for everyone
                </p>
                <p className="text-[0.75rem] text-[#787774] dark:text-[#9B9A97] mt-0.5">
                  Permanently remove this message for all members
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                onDeleteForMe();
              }}
              className="w-full p-3 flex items-start gap-3 rounded-lg border border-[#EAEAEA] dark:border-white/[0.08] hover:border-red-500/50 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-all text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <TrashForMeIcon className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] group-hover:text-red-600 dark:group-hover:text-red-400">
                  Delete for me
                </p>
                <p className="text-[0.75rem] text-[#787774] dark:text-[#9B9A97] mt-0.5">
                  Hide this message for you only on all your devices
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[0.8125rem] font-medium text-[#555555] dark:text-[#AAAAAA] bg-[#F0F0EE] dark:bg-white/[0.08] hover:bg-[#E5E5E3] dark:hover:bg-white/[0.12] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
