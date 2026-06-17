"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useChatStore, ChatUser } from '@/stores/chatStore';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { getMessagesAPI, getChannelMembersAPI } from '@/modules/client/chat/services/chatService';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import MemberPanel from './MemberPanel';
import { Hash, Megaphone, Loader2, Info, Search, Phone, Video, Users } from 'lucide-react';
import { useChatRealtime } from '../hooks/useChatRealtime';
import { getWorkspaceAvatarUrl } from '@/modules/client/workspaces/utils/workspaceAvatar';
import MeetingBanner from './MeetingBanner';
import Link from 'next/link';

export default function ChatWindow() {
  // Use specific selectors to prevent unnecessary re-renders and reference changes
  const activeChannelId = useChatStore(state => state.activeChannelId);
  const channels = useChatStore(state => state.channels);
  const messagesByChannel = useChatStore(state => state.messagesByChannel);
  const typingUsers = useChatStore(state => state.typingUsers);
  const clearOldTyping = useChatStore(state => state.clearOldTyping);
  const setMessages = useChatStore(state => state.setMessages);
  
  const { workspaces } = useWorkspaceStore();
  const currentUserId = useAuthStore(state => state.user?.id);
  const userRole = useAuthStore(state => state.user?.role);
  const { markAsRead, joinChannel, leaveChannel } = useChatRealtime();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const shouldScrollToBottomRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const prevChannelIdRef = useRef<string | null>(null);

  const activeChannel = channels.find(c => c._id === activeChannelId);
  
  const activeWorkspace = useMemo(() => {
    if (activeChannel?.type !== 'workspace' || !activeChannel?.workspaceId) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return workspaces.find(w => String(w._id || (w as any).id) === String(activeChannel.workspaceId));
  }, [activeChannel, workspaces]);

  const messages = useMemo(() => {
    const rawMessages = activeChannelId
      ? messagesByChannel[activeChannelId] || []
      : [];
    // Ensure chronological order (oldest to newest)
    return [...rawMessages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [activeChannelId, messagesByChannel]);

  useEffect(() => {
    if (!activeChannelId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setNextCursor(null);
    shouldScrollToBottomRef.current = true;
    
    getMessagesAPI(activeChannelId, { limit: 20 })
      .then(({ messages: msgs, nextCursor: cursor }) => {
        if (isMounted) {
          setMessages(activeChannelId, msgs);
          setNextCursor(cursor);
        }
      })
      .catch(err => {
        if (!isMounted) return;
        if (err.response?.status === 403) {
          setError("You don't have permission to view messages in this channel.");
        } else {
          setError("Failed to load messages. Please try again.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    
    markAsRead(activeChannelId);
    joinChannel(activeChannelId);

    // Fetch and populate channel members in store
    getChannelMembersAPI(activeChannelId)
      .then(members => {
        if (isMounted) {
          useChatStore.getState().updateChannel(activeChannelId, { members: members as ChatUser[] });
        }
      })
      .catch(err => {
        console.error("Failed to fetch channel members:", err);
      });

    return () => {
      isMounted = false;
      leaveChannel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId]); // Strictly ONLY run when activeChannelId changes to prevent polling loops

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const lastMsgId = lastMsg ? lastMsg._id : null;

    const channelChanged = activeChannelId !== prevChannelIdRef.current;
    const lastMsgChanged = lastMsgId !== lastMessageIdRef.current;

    prevChannelIdRef.current = activeChannelId;
    lastMessageIdRef.current = lastMsgId;

    if (shouldScrollToBottomRef.current) {
      if (scrollRef.current) {
        if (channelChanged || lastMsgChanged) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    } else {
      shouldScrollToBottomRef.current = true;
    }
  }, [messages, activeChannelId]);

  useEffect(() => {
    const interval = setInterval(clearOldTyping, 2000);
    return () => clearInterval(interval);
  }, [clearOldTyping]);

  const handleLoadMore = async () => {
    if (!activeChannelId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    
    const container = scrollRef.current;
    const previousScrollHeight = container ? container.scrollHeight : 0;
    const previousScrollTop = container ? container.scrollTop : 0;

    try {
      const { messages: olderMsgs, nextCursor: cursor } = await getMessagesAPI(activeChannelId, {
        limit: 20,
        cursor: nextCursor
      });
      
      const currentMsgs = messagesByChannel[activeChannelId] || [];
      const mergedMsgs = [...olderMsgs, ...currentMsgs];
      const uniqueMsgs = Array.from(new Map(mergedMsgs.map(m => [m._id, m])).values());
      
      shouldScrollToBottomRef.current = false;
      setMessages(activeChannelId, uniqueMsgs);
      setNextCursor(cursor);

      // Restore scroll position
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          const diff = newScrollHeight - previousScrollHeight;
          container.scrollTop = previousScrollTop + diff;
        }
      });
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!activeChannelId || !activeChannel) {
    return (
      <div className="flex-1 flex flex-col min-h-0 items-center justify-center bg-white dark:bg-[#202020] text-[#787774]">
        <div className="w-16 h-16 bg-[#F0F0EE] dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Hash className="w-8 h-8 opacity-20" />
        </div>
        <h3 className="text-lg font-semibold text-[#111111] dark:text-[#E8E8E7]">
          Select a channel to start
        </h3>
        <p className="text-sm">
          Messages will appear here once you select a conversation
        </p>
      </div>
    );
  }

  const typingForChannel = typingUsers[activeChannelId] || {};
  const typingUserIds = Object.keys(typingForChannel);

  // Helper to get typing text in English
  const getTypingText = () => {
    if (typingUserIds.length === 0) return null;
    if (typingUserIds.length === 1) {
      return "Someone is typing...";
    }
    return `${typingUserIds.length} people are typing...`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSenderId = (msg: any) => {
    if (!msg?.senderId) return null;
    if (typeof msg.senderId === "string") return msg.senderId;
    return msg.senderId._id || msg.senderId.id;
  };

  const isSuperAdmin = userRole === "super_admin";
  const isReadOnly = activeChannel.type === "announcement" && !isSuperAdmin;

  // handleStartMeeting has been replaced by Next.js Link targeting /meeting/init

  // Resolve DM display info (the other person)
  let headerName = activeChannel.name;
  let headerDescription = activeChannel.description;

  if (activeChannel.type === 'dm') {
    const members = activeChannel.members || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const otherMember = members.find((m: any) => String(m._id || m.id) !== String(currentUserId)) || members[0];

    if (otherMember && typeof otherMember === 'object') {
      headerName = otherMember.fullName || otherMember.email || "Direct Message";
      headerDescription = otherMember.email || "Direct Message";
    } else {
      headerName = activeChannel.name || "Direct Message";
      headerDescription = "Direct Message";
    }
  }

  return (
    <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden bg-white dark:bg-[#202020]">
    <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
      {/* Header */}
      <header className="h-14 flex-shrink-0 border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          {activeChannel.type === 'announcement' ? (
            <Megaphone className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" />
          ) : activeWorkspace ? (
            <div className="w-9 h-9 rounded-[6px] overflow-hidden flex-shrink-0 flex items-center justify-center bg-[#2563EB] text-white font-bold text-sm shadow-sm">
              <img 
                src={getWorkspaceAvatarUrl(activeWorkspace)} 
                alt={headerName} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent && !parent.querySelector('span')) {
                    const span = document.createElement('span');
                    span.innerText = headerName?.charAt(0).toUpperCase() || 'W';
                    parent.appendChild(span);
                  }
                }}
              />
            </div>
          ) : activeChannel.type === 'dm' ? (
            (() => {
              const members = activeChannel.members || [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const otherMember = members.find((m: any) => String(m._id || m.id) !== String(currentUserId)) || members[0];
              const displayAvatar = otherMember?.avatar;
              const initials = (otherMember?.fullName || otherMember?.email || "DM").charAt(0).toUpperCase();
              return (
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-[#2563EB] dark:bg-[#3B82F6] text-white font-bold text-sm shadow-sm">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={headerName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
              );
            })()
          ) : (
            <Hash className="w-5 h-5 text-[#ABABAB] dark:text-[#6B6B6B]" />
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#111111] dark:text-[#E8E8E7] text-sm truncate leading-snug">{headerName}</span>
              {activeWorkspace && activeWorkspace.key && (
                <span className="px-1.5 py-0.5 bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] rounded-[4px] text-[0.625rem] font-mono font-bold uppercase tracking-wider leading-none">
                  {activeWorkspace.key}
                </span>
              )}
            </div>
            
            <span className="text-[11px] text-[#787774] dark:text-[#9B9A97] truncate leading-none mt-0.5">
              {activeWorkspace?.description || headerDescription || (
                <>
                  {activeChannel.type === 'general' && "Everyone in the organization"}
                  {activeChannel.type === 'announcement' && "Only admins can post messages here"}
                  {activeChannel.type === 'workspace' && `Channel for workspace · ${activeChannel.name}`}
                  {activeChannel.type === 'dm' && "Direct conversation"}
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[#787774] dark:text-[#9B9A97]">
          <Link
            href={`/meeting/init?channel=${activeChannelId}&type=voice`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
            title="Start voice meeting"
          >
            <Phone className="w-4 h-4" />
          </Link>
          <Link
            href={`/meeting/init?channel=${activeChannelId}&type=video`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
            title="Start video meeting"
          >
            <Video className="w-4 h-4" />
          </Link>

          <div className="w-px h-4 bg-[#EAEAEA] dark:bg-white/[0.06] mx-1" />
          
          <button 
            className={`p-1 transition-colors rounded-md ${
              showMembers 
                ? 'text-[#2563EB] dark:text-[#3B82F6] bg-[#2563EB]/10 dark:bg-[#3B82F6]/15' 
                : 'hover:text-[#111111] dark:hover:text-[#E8E8E7]'
            }`}
            title="View members"
            onClick={() => setShowMembers(!showMembers)}
          >
            <Users className="w-4 h-4" />
          </button>
          <button 
            disabled 
            title="Coming soon" 
            className="p-1 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Active Meeting Banner */}
      <MeetingBanner channelId={activeChannelId} />

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-[#787774]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-3">
              <Info className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-[#787774] dark:text-[#9B9A97] max-w-[250px] italic">
              {error}
            </p>
          </div>
        ) : (
          <div className="py-4">
            {nextCursor && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-4 py-1.5 text-xs font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] bg-[#F0F0EE] dark:bg-white/5 hover:bg-[#EAEAEA] dark:hover:bg-white/10 rounded-[6px] transition-colors flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading history...
                    </>
                  ) : (
                    "Load older messages"
                  )}
                </button>
              </div>
            )}
            {messages.map((msg, idx) => {
              const previousMsg = messages[idx - 1];
              const currentSenderId = getSenderId(msg);
              const previousSenderId = getSenderId(previousMsg);

              const isSameUser =
                previousSenderId &&
                currentSenderId &&
                previousSenderId === currentSenderId;

              // Only group if within 5 minutes
              const timeDiff = previousMsg
                ? (new Date(msg.createdAt).getTime() -
                    new Date(previousMsg.createdAt).getTime()) /
                  1000 /
                  60
                : 10;

              const isSameUserAsPrevious = isSameUser && timeDiff < 5;
              const isMine = String(currentSenderId) === String(currentUserId);

              return (
                <MessageItem
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  key={msg._id || (msg as any).id}
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
        <div className="px-4 h-5 flex items-center">
          {!isReadOnly && typingUserIds.length > 0 && (
            <div className="text-[10px] text-[#787774] italic animate-pulse">
              {getTypingText()}
            </div>
          )}
        </div>

        {isReadOnly ? (
          <div className="px-4 py-6 text-center bg-[#FBFBFA] dark:bg-[#252525] border-t border-[#EAEAEA] dark:border-white/[0.06]">
            <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] font-medium italic">
              This channel is read-only. Only administrators can post updates.
            </p>
          </div>
        ) : (
          <MessageInput
            channelId={activeChannelId}
            channelName={activeChannel.name}
          />
        )}
      </div>
    </div>

    {/* Member Panel */}
    {showMembers && activeChannelId && (
      <MemberPanel
        channelId={activeChannelId}
        onClose={() => setShowMembers(false)}
      />
    )}
    </div>
  );
}
