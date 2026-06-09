'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { getMessagesAPI } from '@/modules/client/chat/services/chatService';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import { Hash, Megaphone, Loader2, Info, Search, Phone, Video } from 'lucide-react';
import { useChatRealtime } from '../hooks/useChatRealtime';

export default function ChatWindow() {
  const { activeChannelId, channels, messagesByChannel, setMessages, typingUsers, clearOldTyping } = useChatStore();
  const currentUserId = useAuthStore(state => state.user?.id);
  const { markAsRead, joinChannel, leaveChannel } = useChatRealtime();
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find(c => c._id === activeChannelId);
  
  const messages = useMemo(() => {
    const rawMessages = activeChannelId ? messagesByChannel[activeChannelId] || [] : [];
    // Ensure chronological order (oldest to newest)
    return [...rawMessages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [activeChannelId, messagesByChannel]);

  useEffect(() => {
    if (activeChannelId) {
      setLoading(true);
      getMessagesAPI(activeChannelId)
        .then(msgs => setMessages(activeChannelId, msgs))
        .finally(() => setLoading(false));
      
      markAsRead(activeChannelId);
      joinChannel(activeChannelId);
    }

    return () => {
      if (activeChannelId) {
        leaveChannel();
      }
    };
  }, [activeChannelId, setMessages, markAsRead, joinChannel, leaveChannel]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(clearOldTyping, 2000);
    return () => clearInterval(interval);
  }, [clearOldTyping]);

  if (!activeChannelId || !activeChannel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#202020] text-[#787774]">
        <div className="w-16 h-16 bg-[#F0F0EE] dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Hash className="w-8 h-8 opacity-20" />
        </div>
        <h3 className="text-lg font-semibold text-[#111111] dark:text-[#E8E8E7]">Welcome to Chat</h3>
        <p className="text-sm">Select a channel to start messaging</p>
      </div>
    );
  }

  const typingForChannel = typingUsers[activeChannelId] || {};
  const typingUserIds = Object.keys(typingForChannel);

  const getSenderId = (msg: any) => {
    if (!msg?.senderId) return null;
    if (typeof msg.senderId === 'string') return msg.senderId;
    return msg.senderId._id || msg.senderId.id;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#202020]">
      {/* Header */}
      <header className="h-14 flex-shrink-0 border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          {activeChannel.type === 'announcement' ? (
            <Megaphone className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" />
          ) : (
            <Hash className="w-5 h-5 text-[#ABABAB] dark:text-[#6B6B6B]" />
          )}
          <span className="font-bold text-[#111111] dark:text-[#E8E8E7] truncate">{activeChannel.name}</span>
        </div>

        <div className="flex items-center gap-4 text-[#787774] dark:text-[#9B9A97]">
          <button className="hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"><Phone className="w-4 h-4" /></button>
          <button className="hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"><Video className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-[#EAEAEA] dark:bg-white/[0.06]" />
          <button className="hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"><Search className="w-4 h-4" /></button>
          <button className="hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"><Info className="w-4 h-4" /></button>
        </div>
      </header>

      {/* Messages area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-[#787774]" />
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg, idx) => {
              const previousMsg = messages[idx - 1];
              const currentSenderId = getSenderId(msg);
              const previousSenderId = getSenderId(previousMsg);
              
              const isSameUser = previousSenderId && currentSenderId && previousSenderId === currentSenderId;
              
              // Only group if within 5 minutes
              const timeDiff = previousMsg 
                ? (new Date(msg.createdAt).getTime() - new Date(previousMsg.createdAt).getTime()) / 1000 / 60
                : 10;
              
              const isMine = currentUserId === currentSenderId;
              const isSameUserAsPrevious = isSameUser && timeDiff < 5;

              return (
                <MessageItem 
                  key={msg._id} 
                  message={msg} 
                  isSameUserAsPrevious={isSameUserAsPrevious}
                  isMine={isMine}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="flex-shrink-0 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020]">
        <div className="px-4 h-6 flex items-center">
          {typingUserIds.length > 0 && (
            <div className="text-[10px] text-[#787774] italic animate-pulse">
              {typingUserIds.length === 1 
                ? 'Someone is typing...' 
                : `${typingUserIds.length} people are typing...`}
            </div>
          )}
        </div>
        <MessageInput channelId={activeChannelId} />
      </div>
    </div>
  );
}
