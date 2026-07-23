'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { useChatStore } from '@/stores/chatStore';
import type { ChatUser, Message, Channel } from '@/modules/client/chat/types/chat.types';
import { useChatRealtime } from '@/modules/client/chat/hooks/useChatRealtime';
import { useChatChannels, useChannelMembers, useDeleteMessageForMeMutation } from '@/modules/client/chat/hooks/useChatQueries';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';

import UserProfileCard from './UserProfileCard';
import SystemMessage from './SystemMessage';
import MessageHoverActions from './MessageHoverActions';
import MessageContextMenu from './MessageContextMenu';
import MessageEditForm from './MessageEditForm';
import MessageContent from './MessageContent';
import MessageAttachments from './MessageAttachments';
import ConfirmActionModal from './ConfirmActionModal';
import MediaLightbox, { LightboxFile } from './MediaLightbox';

import { useAttachmentPreview } from '../hooks/useAttachmentPreview';
import { useMentionSearch } from '../hooks/useMentionSearch';
import { getMessagePreviewText } from '../utils/messageContentRenderer';

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
  const setReplyingToThreadMessage = useChatStore(state => state.setReplyingToThreadMessage);
  const setActiveThreadParentId = useChatStore(state => state.setActiveThreadParentId);

  const activeChannelId = useChatStore(state => state.activeChannelId);
  const { data: channels = [] } = useChatChannels();
  const activeChannel = channels.find((c: Channel) => c._id === activeChannelId);
  
  const { data: fetchedMembers = [] } = useChannelMembers(message.channelId || activeChannelId);
  const channelMembers = fetchedMembers.length > 0 ? fetchedMembers : (activeChannel?.members || []);

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

  // State & Refs
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [positionBelow, setPositionBelow] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteForMeConfirm, setShowDeleteForMeConfirm] = useState(false);
  const { mutate: deleteForMeMutate } = useDeleteMessageForMeMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [lightboxFile, setLightboxFile] = useState<LightboxFile | null>(null);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [profileCardPos, setProfileCardPos] = useState({ x: 0, y: 0 });
  const [cardUser, setCardUser] = useState<ChatUser | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const messageRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Custom Hooks
  const { handleMentionSearch } = useMentionSearch(message.channelId || activeChannelId);
  const {
    isDownloading,
    expandedPreviews,
    previewUrls,
    loadingPreviews,
    togglePreview,
    handleDownloadFile,
  } = useAttachmentPreview(messageRef, message.attachments, isDeleted);

  // Event Handlers & Effects
  useEffect(() => {
    if (!contextMenuPos) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuPos(null);
      }
    };
    const handleScrollOrResize = () => setContextMenuPos(null);

    window.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [contextMenuPos]);

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

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isDeleted) return;
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 230;
    const menuHeight = 330;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    setContextMenuPos({ x: Math.max(10, x), y: Math.max(10, y) });
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCardUser(sender as ChatUser);
    setProfileCardPos({ x: rect.left, y: rect.bottom });
    setShowProfileCard(true);
  };

  const handleMentionClick = (userId: string, targetDisplayName: string, pos: { x: number; y: number }) => {
    const member = channelMembers.find((m: ChatUser) => String(m._id || (m as { id?: string }).id) === String(userId));
    if (member) {
      setCardUser(member);
    } else {
      setCardUser({
        _id: userId,
        fullName: targetDisplayName,
        email: '',
      } as ChatUser);
    }
    setProfileCardPos(pos);
    setShowProfileCard(true);
  };

  const handleToggleReaction = (emoji: string) => {
    sendReaction(message.channelId, message._id, emoji, message.threadParentId);
  };

  const handleSelectEmoji = (emoji: string) => {
    sendReaction(message.channelId, message._id, emoji, message.threadParentId);
    setShowEmojiPicker(false);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    sendEditMessage(message.channelId, message._id, editContent.trim(), message.threadParentId);
    setIsEditing(false);
  };

  const confirmDeleteForEveryone = () => {
    sendDeleteMessage(message.channelId, message._id, message.threadParentId);
    setShowDeleteConfirm(false);
  };

  const confirmDeleteForMe = () => {
    deleteForMeMutate({
      messageId: message._id,
      channelId: message.channelId || activeChannelId || '',
      threadParentId: message.threadParentId,
    });
    setShowDeleteForMeConfirm(false);
  };

  // Reply calculation
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
  const hasReactions = !isDeleted && message.reactions && Object.keys(message.reactions).length > 0;
  const spacingClasses = !isSameUserAsPrevious
    ? (hasReactions ? 'mt-3 pt-1.5 pb-2.5' : 'mt-3 pt-1.5 pb-1.5')
    : (hasReactions ? 'mt-1 pt-0.5 pb-2' : 'mt-1 pt-0.5 pb-1');

  // Branch 1: System Message
  if (message.type === 'system') {
    return (
      <SystemMessage
        message={message}
        sender={sender}
        displayName={displayName}
        initialLetter={initialLetter}
        currentUserId={currentUserId}
      />
    );
  }

  // Branch 2: Standard User Message
  return (
    <div 
      ref={messageRef}
      id={`msg-${message._id}`}
      onContextMenu={handleContextMenu}
      className={cn(
        "group relative flex gap-4 transition-all flex-row mx-2 rounded-lg hover:z-20",
        shouldHighlight 
          ? "bg-[#FFF9E6] dark:bg-[#F59E0B]/5 hover:bg-[#FFF3CD] dark:hover:bg-[#F59E0B]/10 border-l-[3px] border-[#F59E0B] pl-[13px] pr-4" 
          : "hover:bg-[#F7F6F3] dark:hover:bg-white/5 border-l-[3px] border-transparent pl-[13px] pr-4",
        spacingClasses
      )}
    >
      {/* Hover Actions Toolbar */}
      <MessageHoverActions
        isMine={isMine}
        isDeleted={isDeleted}
        hideThreadBadge={hideThreadBadge}
        showEmojiPicker={showEmojiPicker}
        positionBelow={positionBelow}
        pickerRef={pickerRef}
        quickEmojis={QUICK_EMOJIS}
        onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
        onSelectEmoji={handleSelectEmoji}
        onReply={() => {
          if (hideThreadBadge) setReplyingToThreadMessage(message);
          else setReplyingToMessage(message);
        }}
        onReplyInThread={() => setActiveThreadParentId(message._id)}
        onDeleteForMe={() => setShowDeleteForMeConfirm(true)}
        onEdit={() => {
          setIsEditing(true);
          setEditContent(message.content);
        }}
        onDeleteForEveryone={() => setShowDeleteConfirm(true)}
      />

      {/* Avatar column */}
      <div className="w-10 flex-shrink-0 flex justify-center mt-0.5">
        {!isSameUserAsPrevious ? (
          <div 
            className="w-10 h-10 rounded-full overflow-hidden bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium shadow-sm cursor-pointer"
            onClick={handleUserClick}
          >
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
      <div className="flex flex-col flex-1 min-w-0 items-start max-w-full overflow-hidden">
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
              {getMessagePreviewText(replyParent)}
            </span>
          </div>
        )}

        {!isSameUserAsPrevious && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span 
              className="text-[0.875rem] font-semibold text-[#111111] dark:text-[#E8E8E7] hover:underline cursor-pointer"
              onClick={handleUserClick}
            >
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
          <MessageEditForm
            editContent={editContent}
            editInputRef={editInputRef}
            setEditContent={setEditContent}
            onMentionSearch={handleMentionSearch}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <MessageContent
            message={message}
            isDeleted={isDeleted}
            currentUserId={currentUserId}
            onMentionClick={handleMentionClick}
          />
        )}

        {/* Attachments List */}
        <MessageAttachments
          attachments={message.attachments}
          isDeleted={isDeleted}
          isDownloading={isDownloading}
          expandedPreviews={expandedPreviews}
          previewUrls={previewUrls}
          loadingPreviews={loadingPreviews}
          onDownloadFile={handleDownloadFile}
          onTogglePreview={togglePreview}
          onOpenLightbox={(file) => setLightboxFile(file)}
        />

        {/* Reaction badges */}
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
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] border transition-colors cursor-pointer",
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
                    <span className="text-[10px]">{p.fullName?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              ))}
            </div>
            <span>
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </span>
            <span className="text-[#ABABAB] dark:text-[#6B6B6B] text-[10px] font-normal">
              Last reply {message.lastReplyAt ? format(new Date(message.lastReplyAt), 'HH:mm') : ''}
            </span>
          </button>
        ) : null}
      </div>

      {/* Delete for Everyone Dialog Modal */}
      <ConfirmActionModal
        isOpen={showDeleteConfirm}
        title="Delete message"
        description="Are you sure you want to delete this message for everyone? This action cannot be undone."
        confirmLabel="Delete for everyone"
        confirmVariant="orange"
        displayName={displayName}
        message={message}
        currentUserId={currentUserId}
        onConfirm={confirmDeleteForEveryone}
        onClose={() => setShowDeleteConfirm(false)}
      />

      {/* Delete for Me Dialog Modal */}
      <ConfirmActionModal
        isOpen={showDeleteForMeConfirm}
        title="Delete for me"
        description="This message will be hidden for you on all devices. Other members in this chat will still be able to see it."
        confirmLabel="Delete for me"
        confirmVariant="red"
        displayName={displayName}
        message={message}
        currentUserId={currentUserId}
        onConfirm={confirmDeleteForMe}
        onClose={() => setShowDeleteForMeConfirm(false)}
      />

      {/* Lightbox Preview Modal */}
      <MediaLightbox
        file={lightboxFile}
        isDownloading={Boolean(isDownloading)}
        onDownload={handleDownloadFile}
        onClose={() => setLightboxFile(null)}
      />
      
      {/* User Profile Card */}
      {showProfileCard && (
        <UserProfileCard 
          user={cardUser || (sender as ChatUser)} 
          position={profileCardPos} 
          onClose={() => setShowProfileCard(false)} 
          isCurrentUser={String((cardUser || sender)._id || (cardUser || sender).id) === String(currentUserId)}
        />
      )}

      {/* Right Click Context Menu */}
      <MessageContextMenu
        contextMenuPos={contextMenuPos}
        contextMenuRef={contextMenuRef}
        message={message}
        isMine={isMine}
        hideThreadBadge={hideThreadBadge}
        quickEmojis={QUICK_EMOJIS}
        onSelectEmoji={handleSelectEmoji}
        onReply={() => {
          if (hideThreadBadge) setReplyingToThreadMessage(message);
          else setReplyingToMessage(message);
        }}
        onReplyInThread={() => setActiveThreadParentId(message._id)}
        onEdit={() => {
          setIsEditing(true);
          setEditContent(message.content);
        }}
        onDeleteForMe={() => setShowDeleteForMeConfirm(true)}
        onDeleteForEveryone={() => setShowDeleteConfirm(true)}
        onClose={() => setContextMenuPos(null)}
      />
    </div>
  );
}
