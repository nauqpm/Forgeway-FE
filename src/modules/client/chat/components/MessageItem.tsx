'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, useChatStore } from '@/stores/chatStore';
import { format } from 'date-fns';
import { Paperclip, SmilePlus, Reply, MoreHorizontal, Trash2 } from 'lucide-react';
import { deleteMessageAPI } from '@/modules/client/chat/services/chatService';
import { useChatRealtime } from '@/modules/client/chat/hooks/useChatRealtime';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

interface MessageItemProps {
  message: Message;
  isSameUserAsPrevious: boolean;
  isMine: boolean;
}

const QUICK_EMOJIS = ['❤️', '👍', '😂', '😢', '❓'];

export default function MessageItem({ message, isSameUserAsPrevious, isMine }: MessageItemProps) {
  const sender = message.senderId;
  const isDeleted = message.deletedAt !== null;

  const authUser = useAuthStore(state => state.user);
  const currentUserId = (authUser as any)?._id || authUser?.id;
  const { sendReaction } = useChatRealtime();
  const setReplyingToMessage = useChatStore(state => state.setReplyingToMessage);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const replyParent = message.replyToId && typeof message.replyToId === 'object'
    ? (message.replyToId as Message)
    : null;

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessageAPI(message._id);
      } catch (err) {
        console.error("Failed to delete message:", err);
      }
    }
  };

  const handleToggleReaction = (emoji: string) => {
    sendReaction(message.channelId, message._id, emoji);
  };

  const handleSelectEmoji = (emoji: string) => {
    sendReaction(message.channelId, message._id, emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div 
      id={`msg-${message._id}`}
      className={cn(
        "group relative flex gap-4 px-4 py-0.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors flex-row",
        !isSameUserAsPrevious ? 'mt-3' : ''
      )}
    >
      
      {/* Hover Actions */}
      {!isDeleted && (
        <div className={cn(
          "absolute top-0 right-2 flex items-center gap-0.5 transition-opacity z-10 bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] px-1 py-0.5 shadow-none",
          showEmojiPicker ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <div className="relative">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn(
                "w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-[#F0F0EE] dark:hover:bg-white/10 transition-colors",
                showEmojiPicker ? "text-[#2563EB] bg-[#2563EB]/10" : "text-[#787774]"
              )} 
              title="Add reaction"
            >
              <SmilePlus className="w-3.5 h-3.5" />
            </button>
            
            {showEmojiPicker && (
              <div 
                ref={pickerRef}
                className="absolute bottom-full right-0 mb-1.5 flex items-center gap-1 bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-50 whitespace-nowrap"
              >
                {QUICK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectEmoji(emoji)}
                    className="w-7 h-7 flex items-center justify-center text-lg hover:bg-[#F0F0EE] dark:hover:bg-white/10 rounded-[4px] transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setReplyingToMessage(message)}
            className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors" 
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          {isMine && (
            <button 
              onClick={handleDelete}
              className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-red-50 dark:hover:bg-red-900/20 text-[#787774] hover:text-red-500 transition-colors" 
              title="Delete message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors" title="More">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Avatar column */}
      <div className="w-10 flex-shrink-0 flex justify-center mt-0.5">
        {!isSameUserAsPrevious ? (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium shadow-sm">
            {sender.avatar ? (
              <img 
                src={sender.avatar} 
                alt={sender.fullName} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const span = document.createElement('span');
                    span.innerText = sender.fullName?.charAt(0).toUpperCase() || 'U';
                    parent.appendChild(span);
                  }
                }}
              />
            ) : (
              <span>{sender.fullName?.charAt(0).toUpperCase()}</span>
            )}
          </div>
        ) : (
          <div className="w-10 text-[0.625rem] text-[#ABABAB] dark:text-[#6B6B6B] opacity-0 group-hover:opacity-100 flex items-center justify-center h-full">
            {format(new Date(message.createdAt), 'HH:mm')}
          </div>
        )}
      </div>

      {/* Content column */}
      <div className="flex flex-col flex-1 min-w-0 items-start">
        {replyParent && (
          <div 
            className="flex items-center gap-2 text-[11px] text-[#787774] dark:text-[#9B9A97] mb-1.5 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors cursor-pointer group/reply pl-2 border-l-2 border-[#2563EB] w-full"
            onClick={() => {
              const el = document.getElementById(`msg-${replyParent._id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            <span className="font-bold hover:underline">
              @{replyParent.senderId?.fullName || "User"}
            </span>
            <span className="truncate opacity-80 flex-1 text-left">
              {replyParent.content}
            </span>
          </div>
        )}

        {!isSameUserAsPrevious && (
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[0.875rem] font-semibold text-[#111111] dark:text-[#E8E8E7] hover:underline cursor-pointer">
              {sender.fullName}
            </span>
            <span className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
              {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm')}
            </span>
          </div>
        )}
        
        <div className={cn(
          "text-[0.875rem] leading-normal break-words whitespace-pre-wrap",
          isDeleted ? "text-[#ABABAB] dark:text-[#6B6B6B] italic text-[0.8125rem]" : "text-[#111111] dark:text-[#E8E8E7]"
        )}>
          {isDeleted ? "[Message deleted]" : message.content}
        </div>

        {/* Attachments */}
        {!isDeleted && message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 justify-start">
            {message.attachments.map((file, idx) => (
              <div key={idx} className="max-w-[300px] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] overflow-hidden bg-white dark:bg-[#252525]">
                {file.mimetype.startsWith('image/') ? (
                  <img src={file.url} alt={file.filename} className="max-h-[300px] object-contain" />
                ) : (
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F0F0EE] dark:bg-white/8 rounded flex items-center justify-center">
                      <Paperclip className="w-5 h-5 text-[#787774]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{file.filename}</p>
                      <p className="text-[10px] text-[#787774]">{Math.round(file.size / 1024)} KB</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {!isDeleted && message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1 justify-start">
            {Object.entries(message.reactions).map(([emoji, userIds]) => {
              const hasReacted = userIds.includes(String(currentUserId));
              return (
                <button 
                  key={emoji}
                  onClick={() => handleToggleReaction(emoji)}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] border transition-colors",
                    hasReacted
                      ? "bg-[#2563EB]/10 border-[#2563EB] text-[#2563EB] dark:bg-[#2563EB]/20"
                      : "bg-[#F0F0EE] dark:bg-white/8 border-transparent hover:border-[#2563EB] text-[#787774] dark:text-[#9B9A97]"
                  )}
                >
                  <span className="text-sm">{emoji}</span>
                  <span className={cn(
                    "text-[10px] font-bold",
                    hasReacted ? "text-[#2563EB]" : "text-[#787774] dark:text-[#9B9A97]"
                  )}>{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
