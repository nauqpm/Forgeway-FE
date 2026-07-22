"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import MemberPanel from './MemberPanel';
import ChatSearchPanel from './ChatSearchPanel';
import { Hash, Megaphone, Loader2, Info, Search, Video, Users, MessageSquare, ChevronLeft, Edit2, X } from 'lucide-react';
import { useChatRealtime } from '../hooks/useChatRealtime';
import { getWorkspaceAvatarUrl } from '@/modules/workspace/shared/utils/workspaceAvatar';
import MeetingBanner from './MeetingBanner';
import Link from 'next/link';
import { useWorkspaces } from '@/modules/workspace/shared/hooks/useWorkspaces';
import { useChatChannels, useChatMessages, useUpdateChannel } from '@/modules/client/chat/hooks/useChatQueries';
import { joinChannelAPI } from '../services/chatService';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/queryKeys';
import ThreadPanel from './ThreadPanel';
import ThreadIndexPanel from './ThreadIndexPanel';
import toast from 'react-hot-toast';
import type { Channel, ChatUser } from '../types/chat.types';

export default function ChatWindow() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const targetMessageId = searchParams.get('messageId');
  // Use specific selectors to prevent unnecessary re-renders and reference changes
  const activeChannelId = useChatStore(state => state.activeChannelId);
  const activeThreadParentId = useChatStore(state => state.activeThreadParentId);
  const setActiveThreadParentId = useChatStore(state => state.setActiveThreadParentId);
  const typingUsers = useChatStore(state => state.typingUsers);
  const clearOldTyping = useChatStore(state => state.clearOldTyping);
  const unreadThreadIds = useChatStore(state => state.unreadThreadIds);
  const unreadThreadsCount = unreadThreadIds.size;
  
  const { data: channels = [] } = useChatChannels();
  
  const [unreadCountAtOpen, setUnreadCountAtOpen] = useState<number>(0);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | null>(null);
  const prevActiveChannelIdRef = useRef<string | null>(null);
  const scrolledMessageIdRef = useRef<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateThreadModal, setShowCreateThreadModal] = useState(false);
  const updateChannelMutation = useUpdateChannel();

  // Capture the unread count before we mark the channel as read
  if (activeChannelId !== prevActiveChannelIdRef.current) {
    prevActiveChannelIdRef.current = activeChannelId;
    const channel = channels.find(c => c._id === activeChannelId);
    setUnreadCountAtOpen(channel?.unreadCount || 0);
    setFirstUnreadMessageId(null); // Reset first unread message ID on channel change
    scrolledMessageIdRef.current = null; // Reset scroll tracker on channel change
    setIsEditingName(false);
    setSearchQuery(""); // Reset local search query on channel change
    setShowCreateThreadModal(false); // Close create thread modal on channel change
  }

  const handleSaveName = async () => {
    if (!activeChannelId) return;
    if (!editNameValue.trim()) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateChannelMutation.mutateAsync({ channelId: activeChannelId, updateData: { name: editNameValue.trim() } });
      toast.success("Conversation renamed successfully");
      setIsEditingName(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to rename conversation");
    }
  };

  const {
    data: messagesData,
    isLoading: loading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useChatMessages(activeChannelId, unreadCountAtOpen);
  const { data: workspaces = [] } = useWorkspaces();
  const authUser = useAuthStore(state => state.user);
  const currentUserId = (authUser as { _id?: string })?._id || authUser?.id;
  const userRole = useAuthStore(state => state.user?.role);

  const activeChannel = channels.find(c => c._id === activeChannelId);

  const [joining, setJoining] = useState(false);

  const isWorkspaceAdmin = useMemo(() => {
    if (userRole === 'super_admin') return true;
    if (!activeChannel?.workspaceId) return false;
    const ws = workspaces.find(w => String(w._id || (w as { id?: string }).id) === String(activeChannel.workspaceId));
    if (!ws) return false;
    const isOwner = String(ws.ownerId) === String(currentUserId);
    const member = ws.members?.find((m: { userId?: { _id?: string; id?: string } | string }) => {
      const uId = typeof m.userId === 'object' && m.userId ? m.userId._id || m.userId.id : m.userId;
      return String(uId) === String(currentUserId);
    });
    const role = isOwner ? 'workspace_admin' : ((member as { role?: string })?.role || 'member');
    return role === 'workspace_admin';
  }, [activeChannel?.workspaceId, workspaces, currentUserId, userRole]);

  const { markAsRead, joinChannel, leaveChannel } = useChatRealtime();
  const [showMembers, setShowMembers] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottomRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const prevChannelIdRef = useRef<string | null>(null);

  const isMemberOfActiveChannel = useMemo(() => {
    if (!activeChannel) return false;
    if (activeChannel.type !== 'custom') return true;
    if (isWorkspaceAdmin) return true;
    if (!activeChannel.channelMembers) return false;
    return activeChannel.channelMembers.some(
      m => String(m.userId) === String(currentUserId)
    );
  }, [activeChannel, currentUserId, isWorkspaceAdmin]);

  const handleJoinChannel = async () => {
    if (!activeChannelId) return;
    setJoining(true);
    try {
      const updatedChannel = await joinChannelAPI(activeChannelId);
      // Update channels list in cache
      queryClient.setQueryData<Channel[]>(queryKeys.chat.channels(), (current = []) =>
        current.map(c => (c._id || c.id) === activeChannelId ? updatedChannel : c)
      );
      // Invalidate active channel details and messages query to trigger refetch
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat.channel(activeChannelId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(activeChannelId) });
      refetch();
      toast.success(`Joined #${activeChannel?.name || 'channel'}!`);
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(errorObj.response?.data?.message || errorObj.message || "Failed to join channel");
    } finally {
      setJoining(false);
    }
  };
  
  const activeWorkspace = useMemo(() => {
    if (activeChannel?.type !== 'workspace' || !activeChannel?.workspaceId) return null;
    return workspaces.find(w => String(w._id || (w as { id?: string }).id) === String(activeChannel.workspaceId));
  }, [activeChannel, workspaces]);
  const messages = useMemo(() => {
    let rawMessages = messagesData?.pages.flatMap((page) => page.messages) || [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      rawMessages = rawMessages.filter(msg => {
        const contentMatch = msg.content?.toLowerCase().includes(query);
        const sender = msg.senderId;
        const senderName = (sender && typeof sender === 'object' ? sender.fullName : undefined) || msg.senderName;
        const senderMatch = senderName?.toLowerCase().includes(query);
        return contentMatch || senderMatch;
      });
    }

    // Ensure chronological order (oldest to newest)
    return [...rawMessages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [messagesData, searchQuery]);
  useEffect(() => {
    if (unreadCountAtOpen <= 0 || messages.length === 0 || firstUnreadMessageId) return;

    let unreadCount = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const senderId = typeof msg.senderId === 'object' && msg.senderId
        ? msg.senderId._id || msg.senderId.id
        : msg.senderId;

      // Only count messages from other users
      if (String(senderId) !== String(currentUserId)) {
        unreadCount++;
        if (unreadCount === unreadCountAtOpen) {
          setFirstUnreadMessageId((msg._id || msg.id) || null);
          break;
        }
      }
    }
  }, [messages, unreadCountAtOpen, currentUserId, firstUnreadMessageId]);

  useEffect(() => {
    if (!activeChannelId) return;
    shouldScrollToBottomRef.current = true;

    // Clear the messages cache for this channel to force a fresh fetch of the latest messages
    queryClient.removeQueries({ queryKey: queryKeys.chat.messages(activeChannelId) });

    markAsRead(activeChannelId);
    joinChannel(activeChannelId);
    setShowMembers(false);
    setShowSearch(false);

    return () => {
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
          // Always scroll directly to the bottom of the chat window
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }, 50);
        }
      }
    } else {
      shouldScrollToBottomRef.current = true;
    }
  }, [messages, activeChannelId]);

  useEffect(() => {
    if (loading || !targetMessageId || activeThreadParentId) return;
    if (scrolledMessageIdRef.current === targetMessageId) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(`msg-${targetMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-[#FFF3CD]', 'dark:bg-[#F59E0B]/10');
        scrolledMessageIdRef.current = targetMessageId;

        // Remove messageId from URL so it doesn't scroll on refresh
        const url = new URL(window.location.href);
        url.searchParams.delete('messageId');
        window.history.replaceState({}, '', url.toString());

        setTimeout(() => {
          el.classList.remove('bg-[#FFF3CD]', 'dark:bg-[#F59E0B]/10');
        }, 2000);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [messages, loading, targetMessageId, activeThreadParentId]);

  useEffect(() => {
    const interval = setInterval(clearOldTyping, 2000);
    return () => clearInterval(interval);
  }, [clearOldTyping]);

  const handleLoadMore = async () => {
    if (!activeChannelId || !hasNextPage || isFetchingNextPage) return;
    
    const container = scrollRef.current;
    const previousScrollHeight = container ? container.scrollHeight : 0;
    const previousScrollTop = container ? container.scrollTop : 0;

    try {
      shouldScrollToBottomRef.current = false;
      await fetchNextPage();

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
    }
  };

  const errorMessage = useMemo(() => {
    if (!isError) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (error as any)?.response?.status;
    if (status === 403) return "You don't have permission to view messages in this channel.";
    return "Failed to load messages. Please try again.";
  }, [error, isError]);

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
    const otherMembers = members.filter((m: ChatUser) => String(m._id || m.id) !== String(currentUserId));

    if (activeChannel.name && activeChannel.name !== 'Direct Message' && members.length > 2) {
      headerName = activeChannel.name;
      headerDescription = `${members.length} members`;
    } else if (otherMembers.length > 0) {
      const names = otherMembers.map((m: ChatUser) => m.fullName || m.email?.split('@')[0] || "User");
      if (names.length > 3) {
        headerName = `${names.slice(0, 3).join(", ")} & ${names.length - 3} others`;
      } else {
        headerName = names.join(", ");
      }
      headerDescription = otherMembers.length === 1 ? otherMembers[0].email || "Direct Message" : `${members.length} members`;
    } else {
      headerName = "Just you";
      headerDescription = "Direct Message";
    }
  }

  return (
    <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden bg-white dark:bg-[#202020]">
    <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
      {/* Header */}
      <header className="h-14 flex-shrink-0 border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            className="md:hidden p-1 -ml-2 mr-1 text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7] transition-colors"
            onClick={() => useChatStore.getState().setActiveChannel(null)}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
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
              const otherMembers = members.filter((m: ChatUser) => String(m._id || m.id) !== String(currentUserId));
              const displayAvatar = otherMembers.length === 1 ? otherMembers[0]?.avatar : null;
              let initials = "";
              if (members.length > 2 && (!activeChannel.name || activeChannel.name === 'Direct Message')) {
                initials = otherMembers.length.toString();
              } else if (otherMembers.length === 1) {
                initials = (otherMembers[0]?.fullName || otherMembers[0]?.email || "User").charAt(0).toUpperCase();
              } else {
                initials = headerName?.charAt(0).toUpperCase() || "G";
              }
              
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
                <>
                  <span className="font-bold text-[#111111] dark:text-[#E8E8E7] text-sm truncate leading-snug">{headerName}</span>
                  {(activeChannel.type === 'custom' || (activeChannel.type === 'dm' && (activeChannel.members?.length ?? 0) > 2)) && (
                    <button 
                      onClick={() => {
                        setEditNameValue(activeChannel.name === 'Direct Message' ? headerName : activeChannel.name);
                        setIsEditingName(true);
                      }} 
                      className="p-1 rounded-full bg-[#E5E7EB] dark:bg-[#383838] hover:bg-[#D1D5DB] dark:hover:bg-[#404040] transition-colors text-[#4B5563] dark:text-[#A3A3A3]"
                      title="Edit conversation name"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  {activeWorkspace && activeWorkspace.key && (
                    <span className="px-1.5 py-0.5 bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] rounded-[4px] text-[0.625rem] font-mono font-bold uppercase tracking-wider leading-none">
                      {activeWorkspace.key}
                    </span>
                  )}
                </>
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
            className={`p-1 transition-colors rounded-md relative ${
              activeThreadParentId === 'index'
                ? 'text-[#2563EB] dark:text-[#3B82F6] bg-[#2563EB]/10 dark:bg-[#3B82F6]/15' 
                : 'hover:text-[#111111] dark:hover:text-[#E8E8E7]'
            }`}
            title="View active threads"
            onClick={() => {
              setShowMembers(false);
              setShowSearch(false);
              setActiveThreadParentId(activeThreadParentId === 'index' ? null : 'index');
            }}
          >
            <MessageSquare className="w-4 h-4" />
            {unreadThreadsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-[#EF4444] text-white text-[8px] font-bold rounded-full border-2 border-white dark:border-[#202020] animate-pulse leading-none">
                {unreadThreadsCount > 99 ? '99+' : unreadThreadsCount}
              </span>
            )}
          </button>

          <button 
            className={`p-1 transition-colors rounded-md ${
              showMembers 
                ? 'text-[#2563EB] dark:text-[#3B82F6] bg-[#2563EB]/10 dark:bg-[#3B82F6]/15' 
                : 'hover:text-[#111111] dark:hover:text-[#E8E8E7]'
            }`}
            title="View members"
            onClick={() => {
              setActiveThreadParentId(null);
              setShowSearch(false);
              setShowMembers(!showMembers);
            }}
          >
            <Users className="w-4 h-4" />
          </button>
          <button 
            className={`p-1 transition-colors rounded-md ${
              showSearch 
                ? 'text-[#2563EB] dark:text-[#3B82F6] bg-[#2563EB]/10 dark:bg-[#3B82F6]/15' 
                : 'hover:text-[#111111] dark:hover:text-[#E8E8E7]'
            }`}
            title="Search channel"
            onClick={() => {
              setActiveThreadParentId(null);
              setShowMembers(false);
              setShowSearch(!showSearch);
            }}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </header>
      {/* Active Meeting Banner */}
      <MeetingBanner channelId={activeChannelId} />

      {/* Search & Create Thread Bar for Workspace/Custom Channels */}
      {activeChannel && activeChannel.workspaceId && (activeChannel.type === 'workspace' || activeChannel.type === 'custom') && isMemberOfActiveChannel && (
        <div className="p-3 flex items-center gap-3 bg-white dark:bg-[#202020] border-b border-[#EAEAEA] dark:border-white/[0.06] select-none">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
            <input
              type="text"
              placeholder="Search messages in this channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[0.8125rem] bg-[#F7F6F3] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-lg text-[#111111] dark:text-[#E8E8E7] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowCreateThreadModal(true)}
            className="flex items-center gap-1.5 px-4 h-9 text-xs font-semibold rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer shadow-sm select-none"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Create Thread</span>
          </button>
        </div>
      )}

      {/* Sync/Load Error Banner (when there is cached history) */}
      {errorMessage && messages.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 px-4 py-2 flex items-center justify-between gap-3 text-xs text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Failed to sync latest messages. Showing cached history.</span>
          </div>
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="px-2 py-1 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/70 text-red-700 dark:text-red-300 rounded font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Retrying..." : "Retry"}
          </button>
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-[#787774]" />
          </div>
        ) : errorMessage && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-3">
              <Info className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-[#787774] dark:text-[#9B9A97] max-w-[250px] italic mb-4">
              {errorMessage}
            </p>
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-[6px] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Retrying...
                </>
              ) : (
                "Retry"
              )}
            </button>
          </div>
        ) : (
          <div className="py-4">
            {hasNextPage && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  className="px-4 py-1.5 text-xs font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] bg-[#F0F0EE] dark:bg-white/5 hover:bg-[#EAEAEA] dark:hover:bg-white/10 rounded-[6px] transition-colors flex items-center gap-2"
                >
                  {isFetchingNextPage ? (
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
              const isFirstUnread = msg._id === firstUnreadMessageId;

              return (
                <React.Fragment key={msg._id || (msg as { id?: string }).id}>
                  {isFirstUnread && (
                    <div className="flex items-center my-4 px-4 select-none">
                      <div className="flex-1 h-px bg-red-500/30"></div>
                      <span className="mx-4 text-[10px] font-bold text-red-500 uppercase tracking-wider px-2.5 py-0.5 bg-red-500/10 dark:bg-red-500/20 rounded-full border border-red-500/20">
                        New Messages
                      </span>
                      <div className="flex-1 h-px bg-red-500/30"></div>
                    </div>
                  )}
                  <MessageItem
                    message={msg}
                    isSameUserAsPrevious={isSameUserAsPrevious}
                    isMine={isMine}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {!(activeChannel && activeChannel.workspaceId && (activeChannel.type === 'workspace' || activeChannel.type === 'custom') && isMemberOfActiveChannel) ? (
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
          ) : !isMemberOfActiveChannel ? (
            <div className="px-4 py-6 text-center bg-[#FBFBFA] dark:bg-[#252525] border-t border-[#EAEAEA] dark:border-white/[0.06] flex flex-col items-center justify-center gap-3">
              <p className="text-[0.875rem] text-[#787774] dark:text-[#9B9A97] font-medium">
                You are viewing <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">#{activeChannel.name}</span>. This is a {activeChannel.isPrivate ? 'private' : 'public'} custom channel.
              </p>
              {(!activeChannel.isPrivate || isWorkspaceAdmin) && (
                <button
                  onClick={handleJoinChannel}
                  disabled={joining}
                  className="flex items-center gap-1.5 px-4 h-9 text-xs font-semibold rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {joining && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Join Channel</span>
                </button>
              )}
            </div>
          ) : (
            <MessageInput
              channelId={activeChannelId}
              channelName={activeChannel.name}
            />
          )}
        </div>
      ) : null}
    </div>


    {/* Member Panel */}
    {showMembers && activeChannelId && (
      <MemberPanel
        channelId={activeChannelId}
        onClose={() => setShowMembers(false)}
      />
    )}

    {/* Search Panel */}
    {showSearch && activeChannelId && (
      <ChatSearchPanel
        channelId={activeChannelId}
        onClose={() => setShowSearch(false)}
      />
    )}

    {/* Thread List Index Panel */}
    {activeThreadParentId === 'index' && activeChannelId && (
      <ThreadIndexPanel
        channelId={activeChannelId}
        onClose={() => setActiveThreadParentId(null)}
      />
    )}

    {/* Thread Detail Panel */}
    {activeThreadParentId && activeThreadParentId !== 'index' && activeChannelId && (
      <ThreadPanel
        channelId={activeChannelId}
        messageId={activeThreadParentId}
        onClose={() => setActiveThreadParentId(null)}
      />
    )}

      {showCreateThreadModal && activeChannel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#202020] rounded-xl shadow-xl w-full max-w-lg overflow-visible border border-[#EAEAEA] dark:border-white/[0.06] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#EAEAEA] dark:border-white/[0.06] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[#111111] dark:text-[#E8E8E7] text-base">Create a new Thread</h3>
                <p className="text-xs text-[#787774] dark:text-[#9B9A97] mt-0.5 leading-relaxed">
                  This thread will be posted in{" "}
                  <span className="font-semibold truncate max-w-[200px] inline-block align-bottom" title={`#${activeChannel.name}`}>
                    #{activeChannel.name}
                  </span>{" "}
                  and will automatically notify all members.
                </p>
              </div>
              <button 
                onClick={() => setShowCreateThreadModal(false)} 
                className="text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7] transition-colors p-1.5 rounded-lg hover:bg-[#F0F0EE] dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-visible">
              <MessageInput
                channelId={activeChannelId}
                channelName={activeChannel.name}
                autoMentionAll={true}
                onSuccess={() => setShowCreateThreadModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {isEditingName && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#202020] rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-[#EAEAEA] dark:border-white/[0.06] flex flex-col">
            <div className="px-6 py-4 border-b border-[#EAEAEA] dark:border-white/[0.06] flex justify-between items-center">
              <h3 className="font-bold text-[#111111] dark:text-[#E8E8E7]">Edit Conversation Name</h3>
              <button onClick={() => setIsEditingName(false)} className="text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-[#787774] dark:text-[#9B9A97] mb-2">
                Conversation Name
              </label>
              <input
                autoFocus
                className="w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.06] rounded-lg bg-[#F7F6F3] dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editNameValue.trim()) handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                maxLength={50}
                placeholder="Enter a new name..."
              />
            </div>
            <div className="px-6 py-4 bg-[#F7F6F3] dark:bg-black/20 border-t border-[#EAEAEA] dark:border-white/[0.06] flex justify-end gap-2">
              <button
                onClick={() => setIsEditingName(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#4B5563] dark:text-[#A3A3A3] hover:bg-[#E5E7EB] dark:hover:bg-[#383838] transition-colors"
                disabled={updateChannelMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
                disabled={updateChannelMutation.isPending || !editNameValue.trim()}
              >
                {updateChannelMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
