'use client';

import React from 'react';
import { Reply, MessageSquare, Copy, Pencil, Trash2, User, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Message } from '../types/chat.types';

export function TrashForMeIcon({ className = "w-4 h-4 text-red-500" }: { className?: string }) {
  return (
    <div className="relative inline-flex items-center justify-center shrink-0 w-4 h-4 mr-0.5">
      <Trash2 className={className} />
      <User className="w-2.5 h-2.5 absolute -bottom-1 -right-1 text-current stroke-[2.5] bg-white dark:bg-[#1C1C1C] rounded-full" />
    </div>
  );
}

export function TrashForEveryoneIcon({ className = "w-4 h-4 text-orange-500" }: { className?: string }) {
  return (
    <div className="relative inline-flex items-center justify-center shrink-0 w-4 h-4 mr-0.5">
      <Trash2 className={className} />
      <Users className="w-2.5 h-2.5 absolute -bottom-1 -right-1.5 text-current stroke-[2.5] bg-white dark:bg-[#1C1C1C] rounded-full" />
    </div>
  );
}

interface MessageContextMenuProps {
  contextMenuPos: { x: number; y: number } | null;
  contextMenuRef: React.RefObject<HTMLDivElement | null>;
  message: Message;
  isMine: boolean;
  isWorkspaceAdmin?: boolean;
  hideThreadBadge?: boolean;
  quickEmojis: string[];
  onSelectEmoji: (emoji: string) => void;
  onReply: () => void;
  onReplyInThread: () => void;
  onEdit: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onClose: () => void;
}

export default function MessageContextMenu({
  contextMenuPos,
  contextMenuRef,
  message,
  isMine,
  isWorkspaceAdmin = false,
  hideThreadBadge = false,
  quickEmojis,
  onSelectEmoji,
  onReply,
  onReplyInThread,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  onClose,
}: MessageContextMenuProps) {
  if (!contextMenuPos) return null;

  return (
    <div
      ref={contextMenuRef}
      className="fixed z-[99999] w-56 p-1.5 bg-white dark:bg-[#1C1C1C] border border-[#EAEAEA] dark:border-white/[0.08] rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 text-[#111111] dark:text-[#E8E8E7] animate-in fade-in zoom-in-95 duration-100 select-none"
      style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick Reaction Bar */}
      <div className="grid grid-cols-6 gap-1 p-1 bg-[#F7F6F3] dark:bg-white/[0.04] rounded-lg mb-1">
        {quickEmojis.map(emoji => (
          <button
            key={emoji}
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-white dark:hover:bg-white/10 rounded-[6px] transition-colors cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="my-1 h-px bg-[#EAEAEA] dark:bg-white/[0.06]" />

      {/* Action Items */}
      <button
        onClick={() => {
          onReply();
          onClose();
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[0.8125rem] font-medium hover:bg-[#F0F0EE] dark:hover:bg-white/10 rounded-md transition-colors cursor-pointer"
      >
        <span>Reply</span>
        <Reply className="w-3.5 h-3.5 text-[#787774] dark:text-[#9B9A97]" />
      </button>

      {!hideThreadBadge && (
        <button
          onClick={() => {
            onReplyInThread();
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-[0.8125rem] font-medium hover:bg-[#F0F0EE] dark:hover:bg-white/10 rounded-md transition-colors cursor-pointer"
        >
          <span>Reply in thread</span>
          <MessageSquare className="w-3.5 h-3.5 text-[#787774] dark:text-[#9B9A97]" />
        </button>
      )}

      {message.content && (
        <button
          onClick={() => {
            const cleanText = message.content
              .replace(/(?:\[@|@\[)([^\]]+)\]\(([^)]+)\)/g, '@$1')
              .replace(/@@@SOFTBREAK@@@/g, '\n');
            navigator.clipboard.writeText(cleanText);
            toast.success('Text copied to clipboard');
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-[0.8125rem] font-medium hover:bg-[#F0F0EE] dark:hover:bg-white/10 rounded-md transition-colors cursor-pointer"
        >
          <span>Copy text</span>
          <Copy className="w-3.5 h-3.5 text-[#787774] dark:text-[#9B9A97]" />
        </button>
      )}

      <div className="my-1 h-px bg-[#EAEAEA] dark:bg-white/[0.06]" />

      {isMine && (
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-[0.8125rem] font-medium hover:bg-[#F0F0EE] dark:hover:bg-white/10 rounded-md transition-colors cursor-pointer"
        >
          <span>Edit message</span>
          <Pencil className="w-3.5 h-3.5 text-[#787774] dark:text-[#9B9A97]" />
        </button>
      )}

      <button
        onClick={() => {
          onDeleteForMe();
          onClose();
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[0.8125rem] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors cursor-pointer"
      >
        <span>Delete for me</span>
        <TrashForMeIcon className="w-3.5 h-3.5 text-red-500" />
      </button>

      {(isMine || isWorkspaceAdmin) && (
        <button
          onClick={() => {
            onDeleteForEveryone();
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-[0.8125rem] font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors cursor-pointer"
        >
          <span>Delete for everyone</span>
          <TrashForEveryoneIcon className="w-3.5 h-3.5 text-orange-500" />
        </button>
      )}
    </div>
  );
}
