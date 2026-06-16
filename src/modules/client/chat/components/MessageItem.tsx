'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, useChatStore } from '@/stores/chatStore';
import { format } from 'date-fns';
import { Paperclip, SmilePlus, Reply, Trash2, X, AlertTriangle } from 'lucide-react';
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
  const displayName = sender.fullName || sender.email || 'User';
  const initialLetter = displayName.charAt(0).toUpperCase();
  const isDeleted = message.deletedAt !== null;

  const authUser = useAuthStore(state => state.user);
  const currentUserId = (authUser as { _id?: string; id?: string } | null)?._id || authUser?.id;
  const { sendReaction, sendDeleteMessage } = useChatRealtime();
  const setReplyingToMessage = useChatStore(state => state.setReplyingToMessage);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [positionBelow, setPositionBelow] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const replyParent = message.replyToId && typeof message.replyToId === 'object'
    ? (message.replyToId as Message)
    : null;

  const replySender = replyParent?.senderId;
  const replyDisplayName = replySender
    ? (typeof replySender === 'object' ? (replySender.fullName || replySender.email || 'User') : 'User')
    : 'User';
  const replyInitialLetter = replyDisplayName.charAt(0).toUpperCase();

  const isMentioned = (() => {
    if (!currentUserId || !message.content) return false;
    if (message.content.includes('[@All](All)') || message.content.includes('[@all](all)')) return true;
    const mentionRegex = new RegExp(`\\[@[^\\]]+\\]\\(${currentUserId}\\)`, 'g');
    return mentionRegex.test(message.content);
  })();

  const isReplyToMe = (() => {
    if (!replyParent || !currentUserId) return false;
    const parentSender = replyParent.senderId;
    const parentSenderId = typeof parentSender === 'object' && parentSender 
      ? (parentSender._id || (parentSender as { _id?: string; id?: string }).id) 
      : parentSender;
    return String(parentSenderId) === String(currentUserId);
  })();

  const shouldHighlight = isMentioned || isReplyToMe;

  const renderMessageContent = (content: string) => {
    const mentionRegex = /(?:\[@|@\[)([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      const displayName = match[1];
      const userId = match[2];
      const isMe = String(userId) === String(currentUserId) || userId === 'All' || userId === 'all';
      
      parts.push(
        <span
          key={match.index}
          className={cn(
            "px-1 py-0.5 rounded-[3px] font-medium text-[0.875rem]",
            isMe 
              ? "text-[#F59E0B] dark:text-[#FBBF24] bg-[#FFF9E6] dark:bg-[#F59E0B]/20" 
              : "text-[#2563EB] dark:text-[#3B82F6] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]"
          )}
        >
          @{displayName}
        </span>
      );
      lastIndex = mentionRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

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

  useEffect(() => {
    if (showEmojiPicker && pickerRef.current) {
      const parent = pickerRef.current.parentElement;
      if (parent) {
        const buttonEl = parent.querySelector('button');
        if (buttonEl) {
          const buttonRect = buttonEl.getBoundingClientRect();
          const scrollContainer = buttonEl.closest('.overflow-y-auto');
          if (scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const relativeTop = buttonRect.top - containerRect.top;
            if (relativeTop < 50) {
              setPositionBelow(true);
              return;
            }
          }
        }
      }
      setPositionBelow(false);
    }
  }, [showEmojiPicker]);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    try {
      sendDeleteMessage(message.channelId, message._id);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
    setShowDeleteConfirm(false);
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
        "group relative flex gap-4 transition-colors flex-row",
        shouldHighlight 
          ? "bg-[#FFF9E6] dark:bg-[#F59E0B]/5 hover:bg-[#FFF3CD] dark:hover:bg-[#F59E0B]/10 border-l-[3px] border-[#F59E0B] pl-[13px] pr-4" 
          : "hover:bg-[#F7F6F3] dark:hover:bg-white/5 border-l-[3px] border-transparent pl-[13px] pr-4",
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
                className={cn(
                  "absolute right-0 flex items-center gap-1 bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-50 whitespace-nowrap",
                  positionBelow ? "top-full mt-1.5" : "bottom-full mb-1.5"
                )}
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
        </div>
      )}

      {/* Avatar column */}
      <div className="w-10 flex-shrink-0 flex justify-center mt-0.5">
        {!isSameUserAsPrevious ? (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium shadow-sm">
            {sender.avatar ? (
              <img 
                src={sender.avatar} 
                alt={displayName} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const span = document.createElement('span');
                    span.innerText = initialLetter;
                    parent.appendChild(span);
                  }
                }}
              />
            ) : (
              <span>{initialLetter}</span>
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
            {replyParent.senderId?.avatar ? (
              <img 
                src={replyParent.senderId.avatar} 
                alt={replyDisplayName} 
                className="w-4 h-4 rounded-full object-cover shrink-0" 
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent && !parent.querySelector('.reply-avatar-fallback')) {
                    const span = document.createElement('span');
                    span.className = 'reply-avatar-fallback w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[9px] font-bold shrink-0';
                    span.innerText = replyInitialLetter;
                    parent.insertBefore(span, parent.firstChild);
                  }
                }}
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                {replyInitialLetter}
              </div>
            )}
            <span className="font-bold hover:underline">
              @{replyDisplayName}
            </span>
            <span className="truncate opacity-80 flex-1 text-left">
              {replyParent.deletedAt ? "[Message deleted]" : renderMessageContent(replyParent.content)}
            </span>
          </div>
        )}

        {!isSameUserAsPrevious && (
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[0.875rem] font-semibold text-[#111111] dark:text-[#E8E8E7] hover:underline cursor-pointer">
              {displayName}
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
          {isDeleted ? "[Message deleted]" : renderMessageContent(message.content)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setShowDeleteConfirm(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] animate-[fadeIn_0.15s_ease-out]" />
          
          {/* Modal */}
          <div 
            className="relative bg-white dark:bg-[#2A2A2A] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-[400px] max-w-[90vw] animate-[scaleIn_0.2s_ease-out] border border-[#E5E5E5] dark:border-white/[0.08]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  Delete Message
                </h3>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Body */}
            <div className="px-5 pb-4">
              <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] leading-relaxed">
                Are you sure you want to delete this message? This action cannot be undone
              </p>
              
              {/* Message Preview */}
              <div className="mt-3 p-3 bg-[#F7F6F3] dark:bg-white/[0.04] rounded-lg border border-[#EAEAEA] dark:border-white/[0.06]">
                <p className="text-[0.75rem] text-[#ABABAB] dark:text-[#6B6B6B] mb-1">{displayName}</p>
                <p className="text-[0.8125rem] text-[#555555] dark:text-[#AAAAAA] line-clamp-2 break-words">
                  {message.content ? renderMessageContent(message.content) : '[Attachment]'}
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 pb-5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-[0.8125rem] font-medium text-[#555555] dark:text-[#AAAAAA] bg-[#F0F0EE] dark:bg-white/[0.08] hover:bg-[#E5E5E3] dark:hover:bg-white/[0.12] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-[0.8125rem] font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
              >
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
