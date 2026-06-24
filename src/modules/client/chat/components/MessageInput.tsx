'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, X } from 'lucide-react';
import { MentionsInput, Mention } from 'react-mentions';
import { useChatRealtime } from '../hooks/useChatRealtime';
import { useChatStore } from '@/stores/chatStore';
import StickerPicker from './StickerPicker';
import { toast } from 'react-hot-toast';
import api from '@/lib/axiosIns';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

interface MessageInputProps {
  channelId: string;
  channelName?: string;
  threadParentId?: string;
}

export default function MessageInput({ channelId, channelName, threadParentId }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const { sendMessage, sendTyping } = useChatRealtime();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingSentRef = useRef<number>(0);
  const mentionSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (mentionSearchTimeoutRef.current) {
        clearTimeout(mentionSearchTimeoutRef.current);
      }
    };
  }, []);

  const replyingToMessage = useChatStore(state => state.replyingToMessage);
  const setReplyingToMessage = useChatStore(state => state.setReplyingToMessage);
  const replyingSender = typeof replyingToMessage?.senderId === 'object' && replyingToMessage.senderId
    ? replyingToMessage.senderId
    : null;

  // Auto-resize input when content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSend = () => {
    if (!content.trim()) return;
    if (content.length > 4000) {
      toast.error('Message cannot exceed 4000 characters');
      return;
    }
    sendMessage(channelId, content.trim(), undefined, replyingToMessage?._id, undefined, undefined, threadParentId);
    setContent('');
    setReplyingToMessage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSelectSticker = (stickerId: string) => {
    sendMessage(channelId, '', undefined, replyingToMessage?._id, 'sticker', stickerId, threadParentId);
    setReplyingToMessage(null);
    setShowStickerPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (
    e: { target: { value: string } }
  ) => {
    setContent(e.target.value);

    // Throttle typing event
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      sendTyping(channelId);
      lastTypingSentRef.current = now;
    }
  };

  const handleMentionSearch = (
    search: string,
    callback: (data: { id: string; display: string; email?: string; phone?: string; avatar?: string }[]) => void
  ) => {
    const query = search || '';

    if (mentionSearchTimeoutRef.current) {
      clearTimeout(mentionSearchTimeoutRef.current);
    }

    const isAllMatch = !query || 'all'.startsWith(query.toLowerCase());
    if (isAllMatch) {
      callback([{
        id: 'All',
        display: 'All',
        email: 'Mention everyone in this channel',
        phone: '',
        avatar: 'special-all'
      }]);
    }

    const fetchMembers = async () => {
      try {
        const response = await api.get(`/chat/channels/${channelId}/mention-members`, {
          params: { q: query }
        });
        const members = response.data || [];
        
        const mappedMembers: { id: string; display: string; email?: string; phone?: string; avatar?: string }[] = members.map((m: { _id?: string; id?: string; fullName?: string; email?: string; phone?: string; avatar?: string }) => {
          const display = m.fullName?.trim() || m.email?.split('@')[0] || String(m._id || m.id || 'User');
          return {
            id: m._id || m.id,
            display,
            email: m.email,
            phone: m.phone,
            avatar: m.avatar
          };
        });

        // Thêm tùy chọn @All nếu từ khóa khớp hoặc khi truy vấn trống
        if (isAllMatch) {
          mappedMembers.unshift({
            id: 'All',
            display: 'All',
            email: 'Mention everyone in this channel',
            phone: '',
            avatar: 'special-all'
          });
        }

        callback(mappedMembers.slice(0, 10));
      } catch (err) {
        console.error('Failed to search mention members:', err);
        callback([]);
      }
    };

    if (!query) {
      fetchMembers();
    } else {
      mentionSearchTimeoutRef.current = setTimeout(fetchMembers, 150);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-[#202020] relative">
      {showStickerPicker && (
        <StickerPicker
          onSelectSticker={(id) => handleSelectSticker(id)}
          onClose={() => setShowStickerPicker(false)}
        />
      )}
      <div className="border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] overflow-visible flex flex-col focus-within:border-[#ABABAB] dark:focus-within:border-[#3B82F6] transition-colors">
        {/* Input Area */}
        <div className="p-3 bg-[#FBFBFA] dark:bg-[#252525] flex flex-col gap-2 rounded-[8px]">
          {replyingToMessage && (
            <div className="flex items-center justify-between bg-[#F0F0EE] dark:bg-white/5 rounded-[6px] px-3 py-2 border-l-4 border-[#2563EB] text-xs mb-1">
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  Replying to {replyingSender?.fullName || replyingSender?.email || 'User'}
                </span>
                <span className="text-[#787774] dark:text-[#9B9A97] truncate mt-0.5">
                  {replyingToMessage.content}
                </span>
              </div>
              <button 
                onClick={() => setReplyingToMessage(null)}
                className="p-1 text-[#787774] hover:text-[#111111] dark:hover:text-[#E8E8E7] rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 ml-2"
                title="Cancel reply"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="w-full relative">
            <MentionsInput
              inputRef={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={channelName ? `Message into #${channelName}...` : 'Type a message...'}
              className="chat-m w-full bg-transparent"
              a11ySuggestionsListLabel="Suggested mentions"
              maxLength={4000}
            >
              <Mention
                trigger="@"
                data={handleMentionSearch}
                markup="[@__display__](__id__)"
                renderSuggestion={(
                  suggestion,
                  _search,
                  highlightedDisplay,
                ) => {
                  const avatarUrl = (suggestion as { id: string | number; display: string; avatar?: string; email?: string }).avatar;
                  const email = (suggestion as { id: string | number; display: string; avatar?: string; email?: string }).email;
                  const isAll = suggestion.id === 'All' || suggestion.id === 'all';

                  return (
                    <div className="flex items-center gap-3 py-1.5 px-3 hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors w-full text-left">
                      {/* Avatar container */}
                      <div className={cn(
                        "w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0",
                        isAll ? "bg-[#F59E0B]" : "bg-[#2563EB] dark:bg-[#3B82F6]"
                      )}>
                        {isAll ? (
                          <span className="text-[14px]">@</span>
                        ) : avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={suggestion.display} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent && !parent.querySelector('.mention-avatar-fallback')) {
                                const span = document.createElement('span');
                                span.className = 'mention-avatar-fallback';
                                span.innerText = suggestion.display?.toString().charAt(0).toUpperCase() || 'U';
                                parent.appendChild(span);
                              }
                            }}
                          />
                        ) : (
                          <span>{suggestion.display?.toString().charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      {/* User details */}
                      <div className="flex-1 min-w-0 flex flex-col text-left">
                        <span className="font-semibold text-[0.875rem] text-[#111111] dark:text-[#E8E8E7] truncate leading-tight">
                          {isAll ? "@All" : highlightedDisplay}
                        </span>
                        {email && (
                          <span className="text-[0.75rem] text-[#787774] dark:text-[#9B9A97] truncate leading-tight mt-0.5">
                            {email}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }}
                className="text-[#2563EB] bg-[#EFF6FF] dark:text-[#3B82F6] dark:bg-[rgba(37,99,235,0.12)] font-medium"
                displayTransform={(id, display) => `@${display}`}
              />
            </MentionsInput>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <button 
                disabled
                title="Coming soon"
                className="p-1.5 text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/8 rounded-[4px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => setShowStickerPicker(prev => !prev)}
                title="Stickers"
                className="p-1.5 text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/8 rounded-[4px] transition-colors"
              >
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
