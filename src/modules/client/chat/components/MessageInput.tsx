'use client';

import React, { useState, useRef } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { useChatRealtime } from '../hooks/useChatRealtime';

interface MessageInputProps {
  channelId: string;
}

export default function MessageInput({ channelId }: MessageInputProps) {
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
      <div className="relative flex items-end gap-2 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-2 focus-within:border-[#ABABAB] dark:focus-within:border-[#3B82F6] transition-colors">
        <button className="p-2 text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#E8E8E7] transition-colors">
          <Paperclip className="w-5 h-5" />
        </button>
        
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-transparent border-none outline-none text-[0.8125rem] py-2 resize-none max-h-[200px] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB]"
        />

        <div className="flex items-center gap-1">
          <button className="p-2 text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#E8E8E7] transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSend}
            disabled={!content.trim()}
            className="p-2 text-[#2563EB] dark:text-[#3B82F6] hover:bg-[#2563EB]/10 dark:hover:bg-[#3B82F6]/10 rounded-[6px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1 h-4">
        {/* Typing indicator could go here */}
      </div>
    </div>
  );
}
