/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Loader2, FileText, Image as ImageIcon, File, Download, ExternalLink, Calendar, Video, Play } from 'lucide-react';
import MediaLightbox from './MediaLightbox';
import { useEscapeStack } from '@/shared/hooks/useEscapeStack';
import { useChannelMembers, useSearchChannelMessages } from '../hooks/useChatQueries';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axiosIns';
import { useChatStore } from '@/stores/chatStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useResizablePanel } from '@/shared/hooks/useResizablePanel';
import { ResizeHandle } from '@/shared/components/ResizeHandle';
import { renderMessageContent } from '../utils/messageContentRenderer';

interface ChatSearchPanelProps {
  channelId: string;
  onClose: () => void;
}

interface Attachment {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export default function ChatSearchPanel({ channelId, onClose }: ChatSearchPanelProps) {
  useEscapeStack(onClose);
  const [activeTab, setActiveTab] = useState<'messages' | 'files' | 'links'>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [senderSearchQuery, setSenderSearchQuery] = useState('');
  const [lightboxFile, setLightboxFile] = useState<{ url: string; originalName: string; mimeType?: string } | null>(null);

  const { data: members = [] } = useChannelMembers(channelId);

  const selectedSender = useMemo(() => {
    return members.find(m => m._id === selectedSenderId);
  }, [members, selectedSenderId]);

  const filteredMembersForDropdown = useMemo(() => {
    if (!senderSearchQuery.trim()) return members;
    const q = senderSearchQuery.toLowerCase();
    return members.filter(
      m => m.fullName?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    );
  }, [members, senderSearchQuery]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Messages Search Query
  const { data: searchResults = [], isFetching: isSearching } = useSearchChannelMessages(
    channelId,
    { q: debouncedQuery, senderId: selectedSenderId || undefined }
  );

  // Attachments Query
  // Attachments & Images Query
  const { data: allFiles = [], isFetching: isLoadingFiles } = useQuery<Attachment[]>({
    queryKey: ['chat', 'files-and-images', channelId],
    queryFn: async () => {
      const [attachmentsRes, imagesRes] = await Promise.all([
        api.get('/attachments', {
          params: { targetType: 'channel', targetId: channelId }
        }),
        api.get('/imagesapi', {
          params: { targetType: 'channel', targetId: channelId, limit: 100 }
        })
      ]);

      const attachmentsData = attachmentsRes.data?.data ?? attachmentsRes.data ?? [];

      const imagesResData = imagesRes.data;
      const imagesList = Array.isArray(imagesResData)
        ? imagesResData
        : (Array.isArray(imagesResData?.images)
          ? imagesResData.images
          : (Array.isArray(imagesResData?.data) ? imagesResData.data : []));

      const normalizedImages = imagesList.map((img: any) => ({
        _id: img._id,
        originalName: img.originalName || img.filename || 'image.jpg',
        mimeType: img.mimeType || img.mimetype || 'image/jpeg',
        size: img.size || 0,
        url: img.url,
        createdAt: img.createdAt || new Date().toISOString()
      }));

      const normalizedAttachments = (Array.isArray(attachmentsData) ? attachmentsData : []).map((att: any) => ({
        _id: att._id,
        originalName: att.originalName || att.filename || 'file',
        mimeType: att.mimeType || att.mimetype || 'application/octet-stream',
        size: att.size || 0,
        url: att.url,
        createdAt: att.createdAt || new Date().toISOString()
      }));

      return [...normalizedImages, ...normalizedAttachments];
    },
    enabled: activeTab === 'files' && Boolean(channelId),
  });

  // Links Query
  const { data: allLinks = [], isFetching: isLoadingLinks } = useQuery({
    queryKey: ['chat', 'links', channelId],
    queryFn: async () => {
      const response = await api.get(`/chat/channels/${channelId}/messages`, {
        params: { limit: 100 }
      });
      const messages = response.data?.messages || response.data?.data || response.data || [];

      const links: { url: string; sender: any; createdAt: string; message: any }[] = [];
      const urlRegex = /(https?:\/\/[^\s]+)/g;

      messages.forEach((msg: any) => {
        if (!msg.content) return;

        const matches = msg.content.match(urlRegex);
        if (matches) {
          matches.forEach((url: string) => {
            let cleanUrl = url;
            if (url.endsWith(')')) {
              const idx = msg.content.indexOf(url);
              if (idx > 0 && msg.content[idx - 1] === '(') {
                cleanUrl = url.slice(0, -1);
              }
            }

            links.push({
              url: cleanUrl,
              sender: msg.senderId,
              createdAt: msg.createdAt,
              message: msg
            });
          });
        }
      });

      return links;
    },
    enabled: activeTab === 'links' && Boolean(channelId),
  });

  const { mediaFiles, docFiles } = useMemo(() => {
    const media: Attachment[] = [];
    const docs: Attachment[] = [];

    allFiles.forEach((file) => {
      const mime = file.mimeType?.toLowerCase() || '';
      if (mime.startsWith('image/') || mime.startsWith('video/')) {
        media.push(file);
      } else {
        docs.push(file);
      }
    });

    return { mediaFiles: media, docFiles: docs };
  }, [allFiles]);

  const handleDownload = async (url: string, originalName: string) => {
    const loadingToast = toast.loading('Downloading file...');
    try {
      const response = await api.get('/attachments/download-by-url', {
        params: { url },
        responseType: 'blob',
      });
      const blob = response.data;
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = originalName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success('Download complete!', { id: loadingToast });
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.error('Failed to download file', { id: loadingToast });
    }
  };

  const isOfficeFile = (filename: string, mimeType?: string) => {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    if (officeExtensions.includes(ext)) return true;

    if (mimeType) {
      const officeMimes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      if (officeMimes.includes(mimeType)) return true;
    }
    return false;
  };

  const handleFileClick = async (url: string, originalName: string, mimeType: string) => {
    if (url && isOfficeFile(originalName, mimeType)) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      window.open(officeViewerUrl, '_blank');
      return;
    }

    const lowerMime = mimeType?.toLowerCase() || '';
    const isPdf = lowerMime === 'application/pdf';
    const isImg = lowerMime.startsWith('image/');
    const isTxt = lowerMime.startsWith('text/');

    const isPreviewable = isPdf || isImg || isTxt;

    if (isPreviewable) {
      const loadingToast = toast.loading('Opening file...');
      try {
        const response = await api.get('/attachments/download-by-url', {
          params: { url },
          responseType: 'blob',
        });
        const blob = response.data;
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        toast.dismiss(loadingToast);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
      } catch (error) {
        console.error('Failed to open file:', error);
        toast.error('Failed to open file', { id: loadingToast });
      }
    } else {
      handleDownload(url, originalName);
    }
  };

  const handleMessageClick = (msg: any) => {
    const messageId = msg._id || msg.id;

    if (msg.threadParentId) {
      // If it is a reply, open the thread panel
      useChatStore.getState().setActiveThreadParentId(msg.threadParentId);

      // Append threadParentId and messageId to URL
      const params = new URLSearchParams(window.location.search);
      params.set('channelId', channelId);
      params.set('threadParentId', msg.threadParentId);
      params.set('messageId', messageId);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    } else {
      // If it is a main message, close thread index / panel
      useChatStore.getState().setActiveThreadParentId(null);

      // Append channelId and messageId to URL
      const params = new URLSearchParams(window.location.search);
      params.set('channelId', channelId);
      params.set('messageId', messageId);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const { width: panelWidth, handleMouseDown, handleReset } = useResizablePanel({
    defaultWidth: 360,
    minWidth: 280,
    maxWidth: 600,
    side: 'left',
    storageKey: 'al_chat_right_panel_w',
  });

  return (
    <div
      style={{ width: `${panelWidth}px` }}
      className="flex-shrink-0 border-l border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] flex flex-col h-full animate-[slideInRight_0.2s_ease-out] relative"
    >
      <ResizeHandle onMouseDown={handleMouseDown} onDoubleClick={handleReset} side="left" />
      {/* Header */}
      <div className="h-14 flex-shrink-0 border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
          <h3 className="text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Search Channel
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EAEAEA] dark:border-white/[0.06] px-2 bg-[#FBFBFA] dark:bg-[#1C1C1C]">
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'messages'
            ? 'border-[#2563EB] text-[#2563EB] dark:border-[#3B82F6] dark:text-[#3B82F6]'
            : 'border-transparent text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7]'
            }`}
        >
          Messages
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'files'
            ? 'border-[#2563EB] text-[#2563EB] dark:border-[#3B82F6] dark:text-[#3B82F6]'
            : 'border-transparent text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7]'
            }`}
        >
          Files & Images
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'links'
            ? 'border-[#2563EB] text-[#2563EB] dark:border-[#3B82F6] dark:text-[#3B82F6]'
            : 'border-transparent text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7]'
            }`}
        >
          Links
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {activeTab === 'messages' ? (
          <>
            {/* Search Filters */}
            <div className="p-3 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#FBFBFA]/50 dark:bg-[#1E1E1E]/30 space-y-2">
              {/* Keyword Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" />
                <input
                  type="text"
                  placeholder="Search message text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-white/[0.03] border border-[#EAEAEA] dark:border-white/[0.06] rounded-md text-[#111111] dark:text-[#E8E8E7] placeholder-[#ABABAB] dark:placeholder-[#6B6B6B] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors"
                />
              </div>

              {/* Sender Filter (Custom Searchable Dropdown) */}
              <div className="relative">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSenderDropdown(!showSenderDropdown)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-white dark:bg-white/[0.03] border border-[#EAEAEA] dark:border-white/[0.06] rounded-md text-[#111111] dark:text-[#E8E8E7] text-left hover:bg-[#F7F6F3] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {selectedSender ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-[8px] font-bold overflow-hidden flex-shrink-0">
                            {selectedSender.avatar ? (
                              <img src={selectedSender.avatar} alt={selectedSender.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{(selectedSender.fullName || selectedSender.email || 'U').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="truncate max-w-[150px]">{selectedSender.fullName || selectedSender.email}</span>
                        </div>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSenderId('');
                          }}
                          className="p-0.5 hover:bg-[#EAEAEA] dark:hover:bg-white/10 rounded text-[#787774] dark:text-[#9B9A97] cursor-pointer ml-1"
                          title="Clear filter"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[#ABABAB] dark:text-[#6B6B6B]">Filter by sender...</span>
                        <span className="text-[9px] text-[#787774] dark:text-[#9B9A97]">▼</span>
                      </div>
                    )}
                  </button>

                  {showSenderDropdown && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div className="fixed inset-0 z-10" onClick={() => setShowSenderDropdown(false)} />

                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-md shadow-lg max-h-60 overflow-y-auto flex flex-col">
                        {/* Search inside dropdown */}
                        <div className="p-2 border-b border-[#EAEAEA] dark:border-white/[0.06] sticky top-0 bg-white dark:bg-[#252525] z-10">
                          <input
                            type="text"
                            placeholder="Search members..."
                            value={senderSearchQuery}
                            onChange={(e) => setSenderSearchQuery(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs bg-[#F7F6F3] dark:bg-white/[0.04] border border-[#EAEAEA] dark:border-white/[0.06] rounded text-[#111111] dark:text-[#E8E8E7] focus:outline-none"
                          />
                        </div>
                        <div className="py-1">
                          {/* Option 'All members' removed per user request */}
                          {filteredMembersForDropdown.map((m) => (
                            <button
                              key={m._id}
                              type="button"
                              onClick={() => {
                                setSelectedSenderId(m._id);
                                setShowSenderDropdown(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-[#F7F6F3] dark:hover:bg-white/[0.04] transition-colors"
                            >
                              <div className="w-6 h-6 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold overflow-hidden flex-shrink-0">
                                {m.avatar ? (
                                  <img src={m.avatar} alt={m.fullName || m.email} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{(m.fullName || m.email || 'U').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#111111] dark:text-[#E8E8E7] truncate leading-none">
                                  {m.fullName || m.email || 'User'}
                                </p>
                                {m.email && (
                                  <p className="text-[10px] text-[#ABABAB] dark:text-[#6B6B6B] truncate leading-none mt-1">
                                    {m.email}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                          {filteredMembersForDropdown.length === 0 && (
                            <div className="px-3 py-2 text-xs text-[#ABABAB] dark:text-[#6B6B6B] italic text-center">
                              No members found
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Message Results */}
            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-[#787774]" />
                </div>
              ) : !debouncedQuery.trim() && !selectedSenderId ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-[#ABABAB] dark:text-[#6B6B6B]">
                  <Search className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs">Type a keyword or select a member to start searching.</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#ABABAB] dark:text-[#6B6B6B]">
                  No matching messages found.
                </div>
              ) : (
                <div className="divide-y divide-[#EAEAEA]/50 dark:divide-white/[0.03]">
                  {searchResults.map((msg: any) => {
                    const sender = msg.senderId;
                    const senderName = sender?.fullName || sender?.email || 'User';
                    const dateStr = format(new Date(msg.createdAt), 'MMM d, h:mm a');

                    return (
                      <div
                        key={msg._id || msg.id}
                        onClick={() => handleMessageClick(msg)}
                        className="p-3 hover:bg-[#F7F6F3]/60 dark:hover:bg-white/[0.02] cursor-pointer transition-colors text-left"
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Avatar */}
                          <div className="w-6 h-6 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden mt-0.5">
                            {sender?.avatar ? (
                              <img src={sender.avatar} alt={senderName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{senderName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {/* Body */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-[#111111] dark:text-[#E8E8E7] truncate">
                                {senderName}
                              </span>
                              <span className="text-[9px] text-[#ABABAB] dark:text-[#6B6B6B] whitespace-nowrap flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {dateStr}
                              </span>
                            </div>
                            {msg.threadParentId && (
                              <span className="inline-block mt-0.5 px-1 py-0.2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded text-[8px] font-bold uppercase tracking-wide">
                                Reply in thread
                              </span>
                            )}
                            <div className="text-xs text-[#555555] dark:text-[#C4C4C3] line-clamp-3 mt-1 break-words">
                              {renderMessageContent(msg.content || (msg.stickerId ? 'Sent a sticker' : ''))}
                            </div>

                            {/* Previews for Attachments in Search Result */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {msg.attachments.map((file: any, idx: number) => {
                                  const mime = file.mimeType || file.mimetype || '';
                                  const isImg = mime.toLowerCase().startsWith('image/');

                                  if (isImg) {
                                    return (
                                      <div
                                        key={idx}
                                        className="relative w-12 h-12 rounded-[4px] overflow-hidden border border-[#EAEAEA] dark:border-white/[0.06] bg-[#F7F6F3] dark:bg-[#1E1E1E] cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                                        onClick={() => setLightboxFile({ url: file.url, originalName: file.name || 'Image', mimeType: file.mimeType })}
                                        title={file.name || 'Image'}
                                      >
                                        <img
                                          src={file.url}
                                          alt={file.name || 'preview'}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => handleFileClick(file.url, file.name || 'File', file.mimeType || '')}
                                        className="flex items-center gap-1.5 px-2 py-0.5 bg-[#F7F6F3] dark:bg-white/[0.02] hover:bg-[#EAEAEA] dark:hover:bg-white/10 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[4px] text-[10px] text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] max-w-full transition-colors cursor-pointer group text-left"
                                        title={`Open or Download ${file.name || 'File'}`}
                                      >
                                        <FileText className="w-3 h-3 text-[#787774] dark:text-[#9B9A97] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] flex-shrink-0" />
                                        <span className="truncate max-w-[120px]">{file.name || 'File'}</span>
                                        <Download className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-0.5" />
                                      </button>
                                    );
                                  }
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'files' ? (
          /* Files & Images Tab */
          <div className="flex-1 p-3 space-y-4">
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-[#787774]" />
              </div>
            ) : allFiles.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#ABABAB] dark:text-[#6B6B6B] italic">
                No files or images sent in this channel yet.
              </div>
            ) : (
              <>
                {/* Media Section */}
                {mediaFiles.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Media ({mediaFiles.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {mediaFiles.map((file) => {
                        const isVideo = file.mimeType?.toLowerCase().startsWith('video/');
                        return (
                          <div
                            key={file._id}
                            className="relative aspect-square rounded-[6px] overflow-hidden border border-[#EAEAEA] dark:border-white/[0.06] bg-[#F7F6F3] dark:bg-[#1E1E1E] group cursor-pointer"
                            onClick={() => setLightboxFile({ url: file.url, originalName: file.originalName || 'Media', mimeType: file.mimeType })}
                          >
                            {isVideo ? (
                              <div className="relative w-full h-full bg-black flex items-center justify-center">
                                <video
                                  src={file.url}
                                  preload="metadata"
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={file.url}
                                alt={file.originalName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                {docFiles.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Documents ({docFiles.length})
                    </h4>
                    <div className="space-y-1.5">
                      {docFiles.map((file) => {
                        const isPdf = file.mimeType?.toLowerCase() === 'application/pdf';
                        const isVideo = file.mimeType?.toLowerCase().startsWith('video/');

                        return (
                          <div
                            key={file._id}
                            className="flex items-center justify-between p-2 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-[#FBFBFA]/50 dark:bg-white/[0.02] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.04] transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {isPdf ? (
                                <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                              ) : isVideo ? (
                                <Video className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              ) : (
                                <File className="w-4 h-4 text-[#787774] flex-shrink-0" />
                              )}
                              <div className="min-w-0 flex-1 text-left">
                                <button
                                  type="button"
                                  onClick={() => handleFileClick(file.url, file.originalName, file.mimeType)}
                                  className="text-xs text-[#111111] dark:text-[#E8E8E7] hover:text-[#2563EB] dark:hover:text-[#3B82F6] hover:underline truncate font-medium block w-full text-left"
                                >
                                  {file.originalName}
                                </button>
                                <p className="text-[10px] text-[#ABABAB] dark:text-[#6B6B6B] mt-0.5">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDownload(file.url, file.originalName)}
                              className="p-1 text-[#787774] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/5 rounded transition-colors flex-shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Links Tab */
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            {isLoadingLinks ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-[#787774]" />
              </div>
            ) : allLinks.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#ABABAB] dark:text-[#6B6B6B] italic">
                No links shared in this channel yet.
              </div>
            ) : (
              <div className="divide-y divide-[#EAEAEA]/50 dark:divide-white/[0.03]">
                {allLinks.map((linkItem, idx) => {
                  const senderName = linkItem.sender?.fullName || linkItem.sender?.email || 'User';
                  const dateStr = format(new Date(linkItem.createdAt), 'MMM d, h:mm a');

                  return (
                    <div
                      key={idx}
                      className="p-3 hover:bg-[#F7F6F3]/60 dark:hover:bg-white/[0.02] transition-colors text-left flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-[8px] font-bold overflow-hidden flex-shrink-0">
                            {linkItem.sender?.avatar ? (
                              <img src={linkItem.sender.avatar} alt={senderName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{senderName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-[#111111] dark:text-[#E8E8E7] truncate max-w-[120px]">
                            {senderName}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#ABABAB] dark:text-[#6B6B6B]">
                          {dateStr}
                        </span>
                      </div>

                      <a
                        href={linkItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#2563EB] dark:text-[#3B82F6] hover:underline font-medium break-all flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        {linkItem.url}
                      </a>

                      <div className="flex items-end justify-between gap-2 mt-1">
                        <p className="text-[11px] text-[#787774] dark:text-[#9B9A97] line-clamp-2 italic flex-1 break-words">
                          {`"${linkItem.message.content}"`}
                        </p>
                        <button
                          onClick={() => handleMessageClick(linkItem.message)}
                          className="text-[9px] font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:underline whitespace-nowrap bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded"
                        >
                          Jump
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Lightbox Preview Modal */}
      <MediaLightbox
        file={lightboxFile ? {
          url: lightboxFile.url,
          name: lightboxFile.originalName,
          mimeType: lightboxFile.mimeType,
        } : null}
        onDownload={(file) => handleDownload(file.url, file.name)}
        onClose={() => setLightboxFile(null)}
      />
    </div>
  );
}
