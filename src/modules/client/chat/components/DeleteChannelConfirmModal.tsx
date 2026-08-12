'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { useEscapeStack } from '@/shared/hooks/useEscapeStack';

interface DeleteChannelConfirmModalProps {
  isOpen: boolean;
  channelName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function DeleteChannelConfirmModal({
  isOpen,
  channelName,
  onConfirm,
  onClose,
}: DeleteChannelConfirmModalProps) {
  useEscapeStack(onClose, isOpen);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  // Reset input on open/close
  useEffect(() => {
    if (!isOpen) {
      setConfirmInput('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmed = confirmInput.trim() === channelName;

  const handleConfirmClick = async () => {
    if (!isConfirmed || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-xl shadow-2xl border border-[#EAEAEA] dark:border-white/[0.08] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111111] dark:text-[#E8E8E7]">
                Delete Channel
              </h3>
              <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wider mt-0.5">
                Warning: Permanent Action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="text-sm text-[#787774] dark:text-[#9B9A97] leading-relaxed space-y-2">
            <p className="break-words">
              Are you sure you want to delete the channel <strong className="text-[#111111] dark:text-[#E8E8E7] break-all">#{channelName}</strong>?
            </p>
            <p>
              All message history, uploaded files, links, and replies will be permanently deleted and cannot be recovered.
            </p>
          </div>
          
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wider">
              Type the channel name to confirm
            </label>
            <input
              type="text"
              placeholder={channelName}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              disabled={isDeleting}
              className="w-full px-3.5 h-10 bg-[#FBFBFA] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.08] rounded-lg text-sm text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB]/60 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:opacity-50"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#FBFBFA] dark:bg-[#1A1A1A] border-t border-[#EAEAEA] dark:border-white/[0.06]">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 h-9 text-xs font-semibold text-[#555555] dark:text-[#AAAAAA] hover:bg-[#F0F0EE] dark:hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={!isConfirmed || isDeleting}
            className="px-4 h-9 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Channel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
