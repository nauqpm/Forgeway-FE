'use client';

import React from 'react';
import type { Message } from '../types/chat.types';
import { renderMessageContent } from '../utils/messageContentRenderer';

interface MessageContentProps {
  message: Message;
  isDeleted?: boolean;
  currentUserId?: string;
  onMentionClick?: (userId: string, displayName: string, pos: { x: number; y: number }) => void;
}

export default function MessageContent({
  message,
  isDeleted = false,
  currentUserId,
  onMentionClick,
}: MessageContentProps) {
  if (isDeleted) {
    return (
      <div className="italic text-[#787774] dark:text-[#9B9A97] text-[0.8125rem]">
        [Message deleted]
      </div>
    );
  }

  if (message.type === 'sticker') {
    return (
      <div className="mt-1">
        <img
          src={message.stickerId && typeof message.stickerId === 'object' ? message.stickerId.url : message.content}
          alt="sticker"
          className="max-w-[120px] max-h-[120px] object-contain transition-transform duration-200 hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div className="text-[#111111] dark:text-[#E8E8E7] break-words [overflow-wrap:anywhere] [word-break:break-word] w-full min-w-0 text-justify chat-message-content">
      {renderMessageContent(message.content, currentUserId, onMentionClick)}
      {message.updatedAt && message.updatedAt !== message.createdAt && (
        <span className="text-[10px] text-[#ABABAB] dark:text-[#6B6B6B] ml-1.5 select-none font-normal italic">(edited)</span>
      )}
    </div>
  );
}
