'use client';

import React from 'react';
import { SmilePlus, Reply, MessageSquare, Trash2, Pencil, RotateCcw } from 'lucide-react';
import ActionTooltip from './ActionTooltip';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

interface MessageHoverActionsProps {
  isMine: boolean;
  isDeleted?: boolean;
  hideThreadBadge?: boolean;
  showEmojiPicker: boolean;
  positionBelow: boolean;
  pickerRef: React.RefObject<HTMLDivElement | null>;
  quickEmojis: string[];
  onToggleEmojiPicker: () => void;
  onSelectEmoji: (emoji: string) => void;
  onReply: () => void;
  onReplyInThread: () => void;
  onDeleteForMe: () => void;
  onEdit: () => void;
  onDeleteForEveryone: () => void;
}

export default function MessageHoverActions({
  isMine,
  isDeleted = false,
  hideThreadBadge = false,
  showEmojiPicker,
  positionBelow,
  pickerRef,
  quickEmojis,
  onToggleEmojiPicker,
  onSelectEmoji,
  onReply,
  onReplyInThread,
  onDeleteForMe,
  onEdit,
  onDeleteForEveryone,
}: MessageHoverActionsProps) {
  if (isDeleted) return null;

  return (
    <div className={cn(
      "absolute -top-6 right-4 flex items-center gap-0.5 transition-all z-30 bg-white dark:bg-[#1C1C1C] border border-[#EAEAEA] dark:border-white/[0.08] rounded-md px-1 py-0.5 shadow-md",
      showEmojiPicker ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
    )}>
      <ActionTooltip label="Add reaction">
        <div className="relative">
          <button 
            onClick={onToggleEmojiPicker}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-[#F0F0EE] dark:hover:bg-white/10 transition-colors cursor-pointer",
              showEmojiPicker ? "text-[#2563EB] bg-[#2563EB]/10" : "text-[#787774]"
            )} 
          >
            <SmilePlus className="w-3.5 h-3.5" />
          </button>
          
          {showEmojiPicker && (
            <div 
              ref={pickerRef}
              className={cn(
                "absolute right-0 flex items-center gap-1 bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-50 whitespace-nowrap select-none",
                positionBelow ? "top-full mt-1.5" : "bottom-full mb-1.5"
              )}
            >
              {quickEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => onSelectEmoji(emoji)}
                  className="w-7 h-7 flex items-center justify-center text-lg hover:bg-[#F0F0EE] dark:hover:bg-white/10 rounded-[4px] transition-colors cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </ActionTooltip>

      <ActionTooltip label="Reply">
        <button 
          onClick={onReply}
          className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors cursor-pointer" 
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
      </ActionTooltip>

      {!hideThreadBadge && (
        <ActionTooltip label="Reply in thread">
          <button 
            onClick={onReplyInThread}
            className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors cursor-pointer" 
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </ActionTooltip>
      )}

      <ActionTooltip label="Delete for me" align="right">
        <button 
          onClick={onDeleteForMe}
          className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-red-50 dark:hover:bg-red-900/20 text-[#787774] hover:text-red-500 transition-colors cursor-pointer" 
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </ActionTooltip>

      {isMine && (
        <>
          <ActionTooltip label="Edit message" align="right">
            <button 
              onClick={onEdit}
              className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors cursor-pointer" 
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </ActionTooltip>

          <ActionTooltip label="Delete for everyone" align="right">
            <button 
              onClick={onDeleteForEveryone}
              className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-orange-50 dark:hover:bg-orange-900/20 text-[#787774] hover:text-orange-500 transition-colors cursor-pointer" 
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </ActionTooltip>
        </>
      )}
    </div>
  );
}
