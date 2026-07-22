'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { renderMessageContent } from '../utils/messageContentRenderer';
import type { Message } from '../types/chat.types';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'red' | 'orange';
  displayName: string;
  message: Message;
  currentUserId?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmVariant = 'red',
  displayName,
  message,
  currentUserId,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  const isOrange = confirmVariant === 'orange';
  const iconBgClass = isOrange ? 'bg-orange-50 dark:bg-orange-500/10' : 'bg-red-50 dark:bg-red-500/10';
  const iconTextClass = isOrange ? 'text-orange-500' : 'text-red-500';
  const btnBgClass = isOrange ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-500 hover:bg-red-600';

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
            <div className={`w-8 h-8 rounded-full ${iconBgClass} flex items-center justify-center`}>
              <AlertTriangle className={`w-4 h-4 ${iconTextClass}`} />
            </div>
            <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
              {title}
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
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] leading-relaxed">
            {description}
          </p>
          
          {/* Message Preview */}
          <div className="mt-3 p-3 bg-[#F7F6F3] dark:bg-white/[0.04] rounded-lg border border-[#EAEAEA] dark:border-white/[0.06]">
            <p className="text-[0.75rem] text-[#ABABAB] dark:text-[#6B6B6B] mb-1">{displayName}</p>
            <div className="text-[0.8125rem] text-[#555555] dark:text-[#AAAAAA] line-clamp-2 break-words">
              {message.type === 'sticker' ? '[Sticker]' : (message.content ? renderMessageContent(message.content, currentUserId) : '[Attachment]')}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[0.8125rem] font-medium text-[#555555] dark:text-[#AAAAAA] bg-[#F0F0EE] dark:bg-white/[0.08] hover:bg-[#E5E5E3] dark:hover:bg-white/[0.12] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-[0.8125rem] font-medium text-white ${btnBgClass} rounded-lg transition-colors shadow-sm cursor-pointer`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
