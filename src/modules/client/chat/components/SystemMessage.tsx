'use client';

import React from 'react';
import { format } from 'date-fns';
import type { Message, ChatUser } from '../types/chat.types';
import { renderMessageContent } from '../utils/messageContentRenderer';

interface SystemMessageProps {
  message: Message;
  sender: ChatUser;
  displayName: string;
  initialLetter: string;
  currentUserId?: string;
}

export default function SystemMessage({
  message,
  sender,
  displayName,
  initialLetter,
  currentUserId,
}: SystemMessageProps) {
  return (
    <div 
      id={`msg-${message._id}`}
      className="flex items-center justify-center w-full my-4 px-4 gap-4 select-none"
    >
      <div className="flex-1 h-px bg-[#EAEAEA] dark:bg-white/[0.06]"></div>
      <div className="bg-[#F0F0EE] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] text-[0.7rem] sm:text-[0.75rem] px-3 py-1.5 sm:py-1 rounded-2xl border border-[#EAEAEA] dark:border-white/[0.04] shadow-sm flex items-start sm:items-center gap-2 justify-center text-left sm:text-center max-w-[90%] md:max-w-[75%]">
        <div className="mt-0.5 sm:mt-0 shrink-0">
          {sender.avatar ? (
            <img src={sender.avatar} alt={displayName} className="w-4 h-4 rounded-full object-cover" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-[#2563EB] flex items-center justify-center text-[9px] text-white font-bold">
              {initialLetter}
            </div>
          )}
        </div>
        <div className="flex-1 break-words leading-snug sm:leading-normal chat-message-content">
          <strong className="font-medium text-[#111111] dark:text-[#E8E8E7]">{displayName}</strong>{' '}
          {renderMessageContent(message.content, currentUserId)}
          <span className="inline-block text-[#ABABAB] dark:text-[#6B6B6B] ml-1.5 text-[0.65rem] sm:text-[0.6875rem] font-normal whitespace-nowrap">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
        </div>
      </div>
      <div className="flex-1 h-px bg-[#EAEAEA] dark:bg-white/[0.06]"></div>
    </div>
  );
}
