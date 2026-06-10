'use client';

import React, { useState, useRef } from 'react';
import { Send, Smile, Paperclip, Bold, Italic, Code } from 'lucide-react';
import { useChatRealtime } from '../hooks/useChatRealtime';

interface MessageInputProps {
  channelId: string;
  channelName?: string;
}

export default function MessageInput({ channelId, channelName }: MessageInputProps) {
  const [content, setContent] = useState('');
  const { sendMessage, sendTyping } = useChatRealtime();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingSentRef = useRef<number>(0);

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage(channelId, content.trim());
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;

    // Throttle typing event
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      sendTyping(channelId);
      lastTypingSentRef.current = now;
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-[#202020]">
      <div className="border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] overflow-hidden flex flex-col focus-within:border-[#ABABAB] dark:focus-within:border-[#3B82F6] transition-colors">
        {/* Input Area */}
        <div className="p-3 bg-[#FBFBFA] dark:bg-[#252525] flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={channelName ? `Message into #${channelName}...` : 'Type a message...'}
            rows={1}
            className="w-full bg-transparent border-none outline-none text-[0.875rem] resize-none max-h-[200px] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB]"
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/8 rounded-[4px] transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/8 rounded-[4px] transition-colors">
                <Smile className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={handleSend}
              disabled={!content.trim()}
              className="p-1.5 bg-[#111111] text-white dark:bg-[#E8E8E7] dark:text-[#111111] rounded-[6px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
