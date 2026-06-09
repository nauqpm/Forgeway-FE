'use client';

import React from 'react';
import { Message } from '@/stores/chatStore';
import { format } from 'date-fns';

interface MessageItemProps {
  message: Message;
  isSameUserAsPrevious: boolean;
  isMine: boolean;
}

export default function MessageItem({ message, isSameUserAsPrevious, isMine }: MessageItemProps) {
  const sender = message.senderId;

  return (
    <div className={`group flex gap-3 px-4 py-0.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors ${!isSameUserAsPrevious ? 'mt-4' : ''} ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar column */}
      <div className="w-10 flex-shrink-0 flex justify-center">
        {!isMine && !isSameUserAsPrevious ? (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium">
            {sender.avatar ? (
              <img src={sender.avatar} alt={sender.fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{sender.fullName.charAt(0).toUpperCase()}</span>
            )}
          </div>
        ) : !isMine && isSameUserAsPrevious ? (
          <div className="w-10 text-[0.625rem] text-[#ABABAB] dark:text-[#6B6B6B] opacity-0 group-hover:opacity-100 flex items-center justify-center h-full">
            {format(new Date(message.createdAt), 'HH:mm')}
          </div>
        ) : null}
      </div>

      {/* Content column */}
      <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && !isSameUserAsPrevious && (
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[0.8125rem] font-bold text-[#111111] dark:text-[#E8E8E7] hover:underline cursor-pointer">
              {sender.fullName}
            </span>
            <span className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
          </div>
        )}
        
        <div className={`relative px-3 py-2 text-[0.8125rem] leading-normal break-words whitespace-pre-wrap rounded-[12px] ${
          isMine 
            ? 'bg-[#2563EB] text-white rounded-tr-none' 
            : 'bg-[#F0F0EE] dark:bg-white/10 text-[#111111] dark:text-[#E8E8E7] rounded-tl-none'
        }`}>
          {message.content}
          
          {isMine && (
            <div className="absolute -left-12 bottom-0 text-[0.625rem] text-[#ABABAB] dark:text-[#6B6B6B] opacity-0 group-hover:opacity-100 transition-opacity">
              {format(new Date(message.createdAt), 'HH:mm')}
            </div>
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={`mt-2 flex flex-wrap gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {message.attachments.map((file, idx) => (
              <div key={idx} className="max-w-[300px] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] overflow-hidden bg-white dark:bg-[#252525]">
                {file.mimetype.startsWith('image/') ? (
                  <img src={file.url} alt={file.filename} className="max-h-[300px] object-contain" />
                ) : (
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F0F0EE] dark:bg-white/8 rounded flex items-center justify-center">
                      <PaperclipIcon className="w-5 h-5 text-[#787774]" />
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
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={`mt-1 flex flex-wrap gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(message.reactions).map(([emoji, userIds]) => (
              <button 
                key={emoji}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-[#F0F0EE] dark:bg-white/8 rounded-[4px] border border-transparent hover:border-[#2563EB] transition-colors"
              >
                <span className="text-xs">{emoji}</span>
                <span className="text-[10px] font-bold text-[#787774]">{userIds.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PaperclipIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
