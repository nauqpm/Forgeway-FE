'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import type { ChatUser, Message, Channel } from '@/modules/client/chat/types/chat.types';
import { format } from 'date-fns';
import { Paperclip, SmilePlus, Reply, Trash2, X, AlertTriangle, Pencil, MessageSquare, Download, Play } from 'lucide-react';
import { useChatRealtime } from '@/modules/client/chat/hooks/useChatRealtime';
import { MentionsInput, Mention } from 'react-mentions';
import api from '@/lib/axiosIns';
import { useChatChannels } from '@/modules/client/chat/hooks/useChatQueries';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

interface MessageItemProps {
  message: Message;
  isSameUserAsPrevious: boolean;
  isMine: boolean;
  hideThreadBadge?: boolean;
  showContextBadge?: boolean;
  contextName?: string;
}

const QUICK_EMOJIS = ['❤️', '👍', '😂', '😢', '❓', '😮'];

export default function MessageItem({
  message,
  isSameUserAsPrevious,
  isMine,
  hideThreadBadge = false,
  showContextBadge = false,
  contextName
}: MessageItemProps) {
  const sender = (message.senderId && typeof message.senderId === 'object')
    ? message.senderId
    : ({ _id: String(message.senderId || ''), fullName: 'Deleted User', email: '' } as ChatUser);
  const displayName = sender.fullName || sender.email || 'Deleted User';
  const initialLetter = displayName.charAt(0).toUpperCase();
  const isDeleted = Boolean(message.deletedAt);

  const authUser = useAuthStore(state => state.user);
  const currentUserId = (authUser as { _id?: string; id?: string } | null)?._id || authUser?.id;
  const { sendReaction, sendDeleteMessage, sendEditMessage } = useChatRealtime();
  const setReplyingToMessage = useChatStore(state => state.setReplyingToMessage);
  const setActiveThreadParentId = useChatStore(state => state.setActiveThreadParentId);

  const activeChannelId = useChatStore(state => state.activeChannelId);
  const { data: channels = [] } = useChatChannels();
  const activeChannel = channels.find((c: Channel) => c._id === activeChannelId);
  const channelMembers = activeChannel?.members || [];

  const getReactionTooltip = (userIds: string[]) => {
    const names = userIds.map(id => {
      if (String(id) === String(currentUserId)) {
        return 'You';
      }
      const member = channelMembers.find((m: ChatUser) => String(m._id || (m as { id?: string }).id) === String(id));
      return member ? (member.fullName || member.email) : 'Unknown User';
    });
    return names.join('\n');
  };

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [positionBelow, setPositionBelow] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [lightboxFile, setLightboxFile] = useState<{ url: string; name: string; mimeType?: string } | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const mentionSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (mentionSearchTimeoutRef.current) {
        clearTimeout(mentionSearchTimeoutRef.current);
      }
    };
  }, []);

  const replyParent = message.replyToId && typeof message.replyToId === 'object'
    ? (message.replyToId as Message)
    : null;

  const replySender = (replyParent?.senderId && typeof replyParent.senderId === 'object')
    ? replyParent.senderId
    : null;
  const replyDisplayName = replySender
    ? (replySender.fullName || replySender.email || 'Deleted User')
    : 'Deleted User';
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

  const parseUrlsInText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const result = [];
    let lastIdx = 0;
    let match;
    
    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        result.push(text.substring(lastIdx, match.index));
      }
      const url = match[0];
      result.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2563EB] dark:text-[#3B82F6] hover:underline break-all"
        >
          {url}
        </a>
      );
      lastIdx = urlRegex.lastIndex;
    }
    
    if (lastIdx < text.length) {
      result.push(text.substring(lastIdx));
    }
    
    return result;
  };

  const renderMessageContent = (content?: string) => {
    if (!content) return '';
    const mentionRegex = /(?:\[@|@\[)([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textSegment = content.substring(lastIndex, match.index);
        parts.push(...parseUrlsInText(textSegment));
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
      const textSegment = content.substring(lastIndex);
      parts.push(...parseUrlsInText(textSegment));
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
    if (isEditing && editInputRef.current) {
      const len = editInputRef.current.value.length;
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

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
        const response = await api.get(`/chat/channels/${message.channelId}/mention-members`, {
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

  const handleSaveEdit = () => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    try {
      sendEditMessage(message.channelId, message._id, trimmed);
    } catch (err) {
      console.error("Failed to edit message:", err);
    }
    setIsEditing(false);
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

  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleDownloadFile = async (file: { url: string; name?: string; mimeType?: string }) => {
    if (isDownloading) return;
    const filename = file.name || 'file';
    setIsDownloading(file.url);
    try {
      const response = await api.get('/attachments/download-by-url', {
        params: { url: file.url },
        responseType: 'blob',
      });
      const blob = response.data;
      const mime = file.mimeType || blob.type || '';
      const blobUrl = URL.createObjectURL(blob);
      
      const isPreviewable = mime === 'application/pdf' || mime.startsWith('image/') || mime.startsWith('text/');
      
      if (isPreviewable) {
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000); // 5 minutes delay
      } else {
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Failed to download or preview file:', err);
      // Fallback
      window.open(file.url, '_blank');
    } finally {
      setIsDownloading(null);
    }
  };

  const [expandedPreviews, setExpandedPreviews] = useState<Record<string, boolean>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Record<string, boolean>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
  const loadingPreviewsRef = useRef<Record<string, boolean>>({});
  const messageRef = useRef<HTMLDivElement>(null);
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    loadingPreviewsRef.current = loadingPreviews;
  }, [loadingPreviews]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const loadPreview = useCallback(async (url: string) => {
    if (previewUrlsRef.current[url] || loadingPreviewsRef.current[url]) return;

    setLoadingPreviews(prev => ({ ...prev, [url]: true }));
    try {
      const response = await api.get('/attachments/download-by-url', {
        params: { url },
        responseType: 'blob',
      });
      const blob = response.data;
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrls(prev => ({ ...prev, [url]: blobUrl }));
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setLoadingPreviews(prev => ({ ...prev, [url]: false }));
    }
  }, []);



  // Set up IntersectionObserver to detect when message enters viewport
  useEffect(() => {
    if (isDeleted || !message.attachments) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInViewport(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading slightly before it enters the viewport
      }
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [message.attachments, isDeleted]);

  // Load preview when the message is in viewport AND preview is expanded
  useEffect(() => {
    if (!isInViewport || isDeleted || !message.attachments) return;

    message.attachments.forEach(file => {
      const mime = file.mimeType || '';
      const isPdf = mime === 'application/pdf';
      const isTxt = mime.startsWith('text/');
      const canPreview = isPdf || isTxt;

      if (canPreview && file.url && expandedPreviews[file.url]) {
        loadPreview(file.url);
      }
    });
  }, [isInViewport, isDeleted, message.attachments, expandedPreviews, loadPreview]);

  const togglePreview = async (url: string) => {
    if (loadingPreviews[url]) return;

    if (expandedPreviews[url]) {
      setExpandedPreviews(prev => ({ ...prev, [url]: false }));
      return;
    }

    setExpandedPreviews(prev => ({ ...prev, [url]: true }));
    await loadPreview(url);
  };

  const hasReactions = !isDeleted && message.reactions && Object.keys(message.reactions).length > 0;
  const spacingClasses = !isSameUserAsPrevious
    ? (hasReactions ? 'mt-2.5 pt-1 pb-2' : 'mt-2.5 pt-1 pb-1')
    : (hasReactions ? 'mt-0.5 pt-0.5 pb-2' : 'mt-0.5 pt-0.5 pb-0.5');

  if (message.type === 'system') {
    return (
      <div 
        id={`msg-${message._id}`}
        className="flex items-center justify-center w-full my-4 px-4 gap-4"
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
          <span className="flex-1 break-words leading-snug sm:leading-normal">
            <strong className="font-medium text-[#111111] dark:text-[#E8E8E7]">{displayName}</strong>{' '}
            {renderMessageContent(message.content)}
            <span className="inline-block text-[#ABABAB] dark:text-[#6B6B6B] ml-1.5 text-[0.65rem] sm:text-[0.6875rem] font-normal whitespace-nowrap">
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
          </span>
        </div>
        <div className="flex-1 h-px bg-[#EAEAEA] dark:bg-white/[0.06]"></div>
      </div>
    );
  }

  return (
    <div 
      ref={messageRef}
      id={`msg-${message._id}`}
      className={cn(
        "group relative flex gap-4 transition-colors flex-row",
        shouldHighlight 
          ? "bg-[#FFF9E6] dark:bg-[#F59E0B]/5 hover:bg-[#FFF3CD] dark:hover:bg-[#F59E0B]/10 border-l-[3px] border-[#F59E0B] pl-[13px] pr-4" 
          : "hover:bg-[#F7F6F3] dark:hover:bg-white/5 border-l-[3px] border-transparent pl-[13px] pr-4",
        spacingClasses
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

          <button 
            onClick={() => setActiveThreadParentId(message._id)}
            className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors" 
            title="Reply in thread"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          {isMine && (
            <>
              <button 
                onClick={() => {
                  setIsEditing(true);
                  setEditContent(message.content);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors" 
                title="Edit message"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleDelete}
                className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-red-50 dark:hover:bg-red-900/20 text-[#787774] hover:text-red-500 transition-colors" 
                title="Delete message"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
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
            {replySender?.avatar ? (
              <img 
                src={replySender.avatar} 
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
              {replyParent.deletedAt
                ? "[Message deleted]"
                : replyParent.type === 'sticker'
                ? "[Sticker]"
                : renderMessageContent(replyParent.content)}
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
            {showContextBadge && contextName && (
              <span className="text-[10px] font-semibold bg-[#F0F0EE] dark:bg-white/5 text-[#787774] dark:text-[#9B9A97] px-1.5 py-0.5 rounded-[4px] border border-[#EAEAEA] dark:border-white/[0.04]">
                in #{contextName}
              </span>
            )}
          </div>
        )}
        
        {isEditing ? (
          <div className="w-full mt-1.5 flex flex-col gap-2">
            <div className="w-full p-2 bg-white dark:bg-[#202020] border border-[#2563EB] dark:border-[#3B82F6] rounded-md focus-within:ring-1 focus-within:ring-[#2563EB] overflow-visible">
              <MentionsInput
                inputRef={editInputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
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
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-xs font-medium text-[#555555] dark:text-[#AAAAAA] bg-[#F0F0EE] dark:bg-white/[0.08] hover:bg-[#E5E5E3] dark:hover:bg-white/[0.12] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className={cn(
            "text-[0.875rem] leading-normal break-words whitespace-pre-wrap w-full",
            isDeleted ? "text-[#ABABAB] dark:text-[#6B6B6B] italic text-[0.8125rem]" : ""
          )}>
            {isDeleted ? (
              "[Message deleted]"
            ) : message.type === 'sticker' ? (
              <div className="relative group/sticker max-w-[120px] max-h-[120px] rounded-lg overflow-hidden my-1">
                <img
                  src={message.stickerId && typeof message.stickerId === 'object' ? message.stickerId.url : message.content}
                  alt="sticker"
                  className="max-w-[120px] max-h-[120px] object-contain transition-transform duration-200 hover:scale-105"
                />
              </div>
            ) : (
              <span className="text-[#111111] dark:text-[#E8E8E7]">
                {renderMessageContent(message.content)}
                {message.updatedAt && message.updatedAt !== message.createdAt && (
                  <span className="text-[10px] text-[#ABABAB] dark:text-[#6B6B6B] ml-1.5 select-none font-normal italic">(edited)</span>
                )}
              </span>
            )}
          </div>
        )}

        {/* Attachments */}
        {!isDeleted && message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 justify-start">
            {message.attachments.map((file, idx) => {
              const mime = file.mimeType || '';
              const filename = file.name || 'File';
              const isImg = mime.startsWith('image/');
              const isVideo = mime.startsWith('video/');
              const isPdf = mime === 'application/pdf';
              const isTxt = mime.startsWith('text/');
              const canPreview = isPdf || isTxt;
              const isExpanded = !!expandedPreviews[file.url];
              const isLoading = !!loadingPreviews[file.url];

              return (
                <div 
                  key={idx} 
                  className={cn(
                    "border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] overflow-hidden bg-white dark:bg-[#252525] shadow-sm transition-all duration-200",
                    isImg || isVideo ? "max-w-full sm:max-w-[350px]" : isExpanded ? "w-full sm:w-[480px] max-w-full" : "max-w-full sm:max-w-[350px]"
                  )}
                >
                  {isImg ? (
                    <img 
                      src={file.url} 
                      alt={filename} 
                      className="w-full h-auto max-h-[300px] object-contain block hover:opacity-95 transition-opacity cursor-pointer" 
                      onClick={() => setLightboxFile({ url: file.url, name: filename, mimeType: file.mimeType })}
                    />
                  ) : isVideo ? (
                    <div 
                      className="relative group cursor-pointer bg-black flex items-center justify-center w-full max-h-[300px] aspect-video overflow-hidden"
                      onClick={() => setLightboxFile({ url: file.url, name: filename, mimeType: file.mimeType })}
                    >
                      <video 
                        src={file.url} 
                        preload="metadata"
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
                          <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col w-full">
                      <div className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F0F0EE] dark:bg-white/8 rounded flex items-center justify-center shrink-0">
                          <Paperclip className="w-5 h-5 text-[#787774]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 w-full">
                            <button 
                              onClick={() => handleDownloadFile(file)}
                              disabled={isDownloading === file.url}
                              className="text-xs font-medium hover:underline text-[#2563EB] dark:text-[#3B82F6] block truncate text-left disabled:opacity-60 disabled:no-underline flex-1"
                            >
                              {isDownloading === file.url ? 'Downloading...' : filename}
                            </button>
                            {canPreview && (
                              <button
                                onClick={() => togglePreview(file.url)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors shrink-0"
                                title={isExpanded ? "Collapse preview" : "Expand preview"}
                              >
                                {isLoading && !previewUrls[file.url] ? (
                                  <span className="w-2.5 h-2.5 border border-[#787774] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <span className="text-[9px] select-none">{isExpanded ? '▲' : '▼'}</span>
                                )}
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-[#787774] dark:text-[#9B9A97]">{Math.round(file.size / 1024)} KB</p>
                        </div>
                      </div>
                      
                      {/* Expanded Preview Container */}
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-[#FAF9F6] dark:bg-[#1C1C1C]">
                          <div className="mt-3 rounded-[6px] overflow-hidden border border-[#EAEAEA] dark:border-white/[0.06] bg-white h-[300px] flex items-center justify-center">
                            {previewUrls[file.url] ? (
                              isPdf ? (
                                <iframe 
                                  src={previewUrls[file.url]} 
                                  className="w-full h-full border-none" 
                                  title={filename}
                                />
                              ) : (
                                <iframe 
                                  src={previewUrls[file.url]} 
                                  className="w-full h-full border-none bg-white p-3 font-mono text-[11px] overflow-auto" 
                                  title={filename}
                                />
                              )
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-[#787774]">
                                <span className="w-5 h-5 border-2 border-[#787774] border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px]">Loading preview...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
                  title={getReactionTooltip(userIds)}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] border transition-colors",
                    hasReacted
                      ? "bg-[#2563EB]/10 border-[#2563EB] text-[#2563EB] dark:bg-[#3B82F6]/15 dark:border-[#3B82F6] dark:text-[#3B82F6]"
                      : "bg-[#F0F0EE] dark:bg-white/[0.08] border-transparent hover:border-[#2563EB] dark:hover:border-[#3B82F6] text-[#787774] dark:text-[#9B9A97]"
                  )}
                >
                  <span className="text-sm">{emoji}</span>
                  <span className={cn(
                    "text-[10px] font-bold",
                    hasReacted ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#787774] dark:text-[#9B9A97]"
                  )}>{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}
        {/* Thread replies badge */}
        {!isDeleted && !hideThreadBadge && message.replyCount && message.replyCount > 0 ? (
          <button
            onClick={() => setActiveThreadParentId(message._id)}
            className="mt-2 flex items-center gap-2 hover:bg-[#F0F0EE] dark:hover:bg-white/5 px-2.5 py-1 rounded-[6px] transition-colors border border-[#EAEAEA] dark:border-white/[0.06] text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] cursor-pointer"
          >
            <div className="flex -space-x-1.5 overflow-hidden">
              {message.lastReplyParticipants?.filter(Boolean).map((p, idx) => (
                <div 
                  key={idx} 
                  className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-[#202020] bg-[#2563EB] overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold" 
                  title={p.fullName}
                >
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[9px]">{p.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
              ))}
            </div>
            <span>
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </span>
            <span className="text-[10px] text-[#ABABAB] font-normal pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
              View thread
            </span>
          </button>
        ) : null}
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
                  {message.type === 'sticker' ? '[Sticker]' : (message.content ? renderMessageContent(message.content) : '[Attachment]')}
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
      {/* Lightbox Preview Modal */}
      {lightboxFile && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center cursor-zoom-out"
          onClick={() => setLightboxFile(null)}
        >
          {/* Top Bar */}
          <div 
            className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-6 text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-medium truncate max-w-[70%]">
              {lightboxFile.name}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDownloadFile(lightboxFile)}
                disabled={isDownloading === lightboxFile.url}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setLightboxFile(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {lightboxFile.mimeType?.toLowerCase().startsWith('video/') ? (
            <video
              src={lightboxFile.url}
              controls
              preload="metadata"
              className="max-w-[90vw] max-h-[85vh] rounded-md shadow-2xl mt-10 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightboxFile.url}
              alt="Preview"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-md shadow-2xl select-none mt-10"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
