'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Send, Smile, Paperclip, X, Bold, Italic, Strikethrough, Code, Quote, List, ListOrdered } from 'lucide-react';
import { useEditor, EditorContent, ReactRenderer, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import LinkExtension from '@tiptap/extension-link';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import { TextSelection } from '@tiptap/pm/state';

import { useChatRealtime } from '../hooks/useChatRealtime';
import { useChatStore } from '@/stores/chatStore';
import EmojiStickerPicker from './EmojiStickerPicker';
import { toast } from 'react-hot-toast';
import { useChatChannels } from '../hooks/useChatQueries';
import api from '@/lib/axiosIns';
import imageService from '@/shared/utils/imageService';
import { useWorkspaces } from '@/modules/workspace/shared/hooks/useWorkspaces';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { searchUsersAPI } from '../services/chatService';
import MentionList, { MentionItem } from './MentionList';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

interface MessageInputProps {
  channelId: string;
  channelName?: string;
  threadParentId?: string;
  autoMentionAll?: boolean;
  onSuccess?: () => void;
  ignoreReply?: boolean;
}

interface TiptapNode {
  type?: string;
  text?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marks?: { type: string; attrs?: Record<string, any> }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attrs?: Record<string, any>;
  content?: TiptapNode[];
}

// Convert Tiptap JSON content tree into standard Chat Markdown
function serializeTiptapContent(editor: Editor | null): string {
  if (!editor) return '';
  const json = editor.getJSON();
  if (!json || !json.content) return '';

  const processNode = (node: TiptapNode): string => {
    if (node.type === 'mention') {
      const label = node.attrs?.label || node.attrs?.id || 'User';
      const id = node.attrs?.id || label;
      return `[@${label}](${id})`;
    }

    if (node.type === 'text') {
      let text = node.text || '';
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') text = `**${text}**`;
          else if (mark.type === 'italic') text = `*${text}*`;
          else if (mark.type === 'strike') text = `~~${text}~~`;
          else if (mark.type === 'code') text = `\`${text}\``;
          else if (mark.type === 'link') {
            const href = mark.attrs?.href || text;
            text = href;
          }
        }
      }
      return text;
    }

    if (node.type === 'paragraph') {
      return node.content ? node.content.map(processNode).join('') : '';
    }

    if (node.type === 'hardBreak') return '@@@SOFTBREAK@@@';

    if (node.type === 'codeBlock') {
      const innerText = node.content ? node.content.map(processNode).join('') : '';
      return `\`\`\`\n${innerText}\n\`\`\``;
    }

    if (node.type === 'blockquote') {
      const innerText = node.content ? node.content.map(processNode).join('@@@SOFTBREAK@@@') : '';
      return `> ${innerText}`;
    }

    if (node.type === 'bulletList') {
      return node.content
        ? node.content.map((item: TiptapNode) => `- ${item.content ? item.content.map(processNode).join('@@@SOFTBREAK@@@') : ''}`).join('\n')
        : '';
    }

    if (node.type === 'orderedList') {
      return node.content
        ? node.content.map((item: TiptapNode, i: number) => `${i + 1}. ${item.content ? item.content.map(processNode).join('@@@SOFTBREAK@@@') : ''}`).join('\n')
        : '';
    }

    if (node.content) {
      return node.content.map(processNode).join('');
    }

    return '';
  };

  return json.content.map((paragraph: TiptapNode) => processNode(paragraph)).join('\n').trim();
}

export default function MessageInput({
  channelId,
  channelName,
  threadParentId,
  autoMentionAll = false,
  onSuccess,
  ignoreReply = false,
}: MessageInputProps) {
  const authUser = useAuthStore(state => state.user);
  const currentUserId = (authUser as { _id?: string; id?: string } | null)?._id || authUser?.id;
  const { data: channels = [] } = useChatChannels();
  const { data: workspaces = [] } = useWorkspaces();

  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [, setSelectionTick] = useState(0);
  const { sendMessage, sendTyping } = useChatRealtime();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentRef = useRef<number>(0);

  const [uploadedFiles, setUploadedFiles] = useState<{
    id: string;
    url: string;
    name: string;
    size: number;
    mimeType: string;
    isImage: boolean;
    status: 'uploading' | 'completed';
    progress: number;
    key: string;
  }[]>([]);

  const globalReplyingToMessage = useChatStore(state => state.replyingToMessage);
  const globalSetReplyingToMessage = useChatStore(state => state.setReplyingToMessage);
  const threadReplyingToMessage = useChatStore(state => state.replyingToThreadMessage);
  const setThreadReplyingToMessage = useChatStore(state => state.setReplyingToThreadMessage);

  const replyingToMessage = ignoreReply ? null : (threadParentId ? threadReplyingToMessage : globalReplyingToMessage);
  const setReplyingToMessage = threadParentId ? setThreadReplyingToMessage : globalSetReplyingToMessage;
  const replyingSender = typeof replyingToMessage?.senderId === 'object' && replyingToMessage.senderId
    ? replyingToMessage.senderId
    : null;

  const channelIdRef = useRef(channelId);
  React.useEffect(() => {
    channelIdRef.current = channelId;
  }, [channelId]);

  const isMentionOpenRef = useRef(false);

  // 1. Configure Tiptap Mention Suggestion Plugin
  const mentionSuggestion = useMemo(() => ({
    char: '@',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findSuggestionMatch: (config: any) => {
      const $from = config?.$position || config?.state?.selection?.$from;
      if (!$from) return null;
      const nodeBefore = $from.nodeBefore;
      if (!nodeBefore || !nodeBefore.isText || !nodeBefore.text) return null;

      const textBefore = nodeBefore.text;
      const regex = /(^|\s)@([^\s]*)$/;
      const match = regex.exec(textBefore);
      if (!match) return null;

      const from = $from.pos - match[0].length + match[1].length;
      const to = $from.pos;

      return {
        range: { from, to },
        query: match[2],
        text: match[0].slice(match[1].length),
      };
    },
    items: async ({ query }: { query: string }): Promise<MentionItem[]> => {
      try {
        const cleanQuery = (query || '').replace(/^@+/, '').trim();
        const apiQuery = cleanQuery.replace(/@+$/, '').trim();
        const isAllMatch = !cleanQuery || 'all'.startsWith(cleanQuery.toLowerCase());

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let members: any[] = [];
        const activeChannelId = channelIdRef.current || channelId;
        if (activeChannelId) {
          try {
            const response = await api.get(`/chat/channels/${activeChannelId}/mention-members`, {
              params: { q: apiQuery }
            });
            const data = response.data?.data ?? response.data;
            members = Array.isArray(data) ? data : [];
          } catch (e) {
            console.warn('Channel mention members search failed, falling back to global search:', e);
          }
        }

        if (members.length === 0) {
          try {
            const fallbackUsers = await searchUsersAPI(apiQuery);
            members = fallbackUsers;
          } catch (e) {
            console.error('Fallback user search failed:', e);
          }
        }

        const mappedMembers: MentionItem[] = members
          .filter((m: { _id?: string; id?: string }) => {
            const memberId = m._id || m.id;
            return !currentUserId || String(memberId) !== String(currentUserId);
          })
          .map((m: { _id?: string; id?: string; fullName?: string; email?: string; avatar?: string }) => {
            const name = m.fullName?.trim();
            const email = m.email?.trim();
            const label = name || email?.split('@')[0] || 'User';
            return {
              id: String(m._id || m.id),
              label,
              email: m.email,
              avatar: m.avatar,
            };
          });

        if (isAllMatch) {
          mappedMembers.unshift({
            id: 'All',
            label: 'All',
            email: 'Mention everyone in this channel',
            avatar: 'special-all'
          });
        }

        mappedMembers.sort((a, b) => {
          if (a.id === 'All') return -1;
          if (b.id === 'All') return 1;

          const q = apiQuery.toLowerCase();
          const aEmail = (a.email || '').toLowerCase();
          const bEmail = (b.email || '').toLowerCase();
          const aLabel = (a.label || '').toLowerCase();
          const bLabel = (b.label || '').toLowerCase();

          const aExact = aEmail === q || aLabel === q;
          const bExact = bEmail === q || bLabel === q;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          const aStarts = aEmail.startsWith(q) || aLabel.startsWith(q);
          const bStarts = bEmail.startsWith(q) || bLabel.startsWith(q);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;

          return 0;
        });

        return mappedMembers.slice(0, 10);
      } catch (err) {
        console.error('Mention search error:', err);
        return [];
      }
    },
    render: () => {
      let component: ReactRenderer | null = null;
      let popupContainer: HTMLDivElement | null = null;

      return {
        onStart: (props: SuggestionProps) => {
          isMentionOpenRef.current = true;
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          popupContainer = document.createElement('div');
          popupContainer.style.position = 'fixed';
          popupContainer.style.zIndex = '99999';
          document.body.appendChild(popupContainer);

          const rect = props.clientRect?.();
          if (rect) {
            popupContainer.style.left = `${rect.left}px`;
            popupContainer.style.bottom = `${window.innerHeight - rect.top + 6}px`;
            popupContainer.style.top = 'auto';
          }

          popupContainer.appendChild(component.element);
        },
        onUpdate(props: SuggestionProps) {
          component?.updateProps(props);

          const rect = props.clientRect?.();
          if (rect && popupContainer) {
            popupContainer.style.left = `${rect.left}px`;
            popupContainer.style.bottom = `${window.innerHeight - rect.top + 6}px`;
            popupContainer.style.top = 'auto';
          }
        },
        onKeyDown(props: SuggestionKeyDownProps) {
          if (props.event.key === 'Escape') {
            isMentionOpenRef.current = false;
            if (popupContainer) {
              popupContainer.remove();
              popupContainer = null;
            }
            return true;
          }

          const handled = (component?.ref as { onKeyDown?: (props: SuggestionKeyDownProps) => boolean })?.onKeyDown?.(props) || false;
          if (handled && (props.event.key === 'Enter' || props.event.key === 'Tab')) {
            isMentionOpenRef.current = false;
          }
          return handled;
        },
        onExit() {
          isMentionOpenRef.current = false;
          if (popupContainer) {
            popupContainer.remove();
            popupContainer = null;
          }
          component?.destroy();
        },
      };
    },
  }), [channelId, currentUserId]);

  // 2. Initialize Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        heading: false,
      }),
      Placeholder.configure({
        placeholder: channelName
          ? `Message into #${channelName.length > 20 ? channelName.substring(0, 20) + '...' : channelName}...`
          : 'Type a message...',
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: mentionSuggestion,
      }),
      LinkExtension.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#2563EB] dark:text-[#3B82F6] underline',
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'tiptap-chat-editor min-h-[24px] focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        if (isMentionOpenRef.current) {
          return false;
        }

        if (event.key === 'Enter' && !event.isComposing) {
          if (!event.shiftKey) {
            event.preventDefault();
            handleSendRef.current();
            return true;
          } else {
            const { state } = view;
            const { $from } = state.selection;
            let inList = false;
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === 'listItem') {
                inList = true;
                break;
              }
            }

            if (inList && editorRef.current?.commands?.splitListItem) {
              const handled = editorRef.current.commands.splitListItem('listItem');
              if (handled) {
                event.preventDefault();
                return true;
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
      const now = Date.now();
      if (now - lastTypingSentRef.current > 2000) {
        sendTyping(channelId);
        lastTypingSentRef.current = now;
      }
    },
    onSelectionUpdate: () => {
      setSelectionTick((prev) => prev + 1);
    },
    onTransaction: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
      setSelectionTick((prev) => prev + 1);
    },
  }, [channelId]);

  // 3. File Upload Handler
  const uploadFiles = async (filesToUpload: File[]) => {
    const currentChannel = channels.find(c => c._id === channelId);
    const workspaceId = currentChannel?.workspaceId;
    const currentWorkspace = workspaces.find(w => w._id === workspaceId);
    const workspaceName = currentWorkspace?.name;

    for (const file of filesToUpload) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Tệp "${file.name}" vượt quá giới hạn 10MB!`);
        continue;
      }

      const tempKey = Math.random().toString(36).substring(2, 9) + '-' + Date.now();
      const isImg = file.type.startsWith('image/');
      const localPreviewUrl = isImg ? URL.createObjectURL(file) : undefined;

      const newFileItem = {
        key: tempKey,
        id: '',
        url: localPreviewUrl || '',
        name: file.name || (isImg ? 'image.png' : 'file'),
        size: file.size,
        mimeType: file.type,
        isImage: isImg,
        status: 'uploading' as const,
        progress: 0
      };

      setUploadedFiles(prev => [...prev, newFileItem]);

      try {
        if (isImg) {
          const response = await imageService.uploadImage(
            file,
            true,
            workspaceId,
            'channel',
            channelId,
            channelName,
            workspaceName,
            (progress) => {
              setUploadedFiles(prev => prev.map(f => f.key === tempKey ? { ...f, progress } : f));
            }
          );

          setUploadedFiles(prev => prev.map(f => f.key === tempKey ? {
            ...f,
            id: response._id,
            url: response.url,
            status: 'completed',
            progress: 100,
            mimeType: response.mimetype || file.type
          } : f));
        } else {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('targetType', 'channel');
          formData.append('targetId', channelId);
          if (workspaceId) formData.append('workspaceId', workspaceId);
          if (workspaceName) formData.append('workspaceName', workspaceName);
          if (channelName) formData.append('targetName', channelName);

          const response = await api.post('/attachments', formData, {
            onUploadProgress: (event) => {
              if (event.total) {
                const progress = Math.min(100, Math.round((event.loaded * 100) / event.total));
                setUploadedFiles(prev => prev.map(f => f.key === tempKey ? { ...f, progress } : f));
              }
            }
          });

          const att = response.data;
          setUploadedFiles(prev => prev.map(f => f.key === tempKey ? {
            ...f,
            id: att._id,
            url: att.url,
            status: 'completed',
            progress: 100,
            mimeType: att.mimeType || att.mimetype || file.type
          } : f));
        }
        toast.success(`Tải lên tệp "${file.name || 'image'}" thành công!`);
      } catch (err) {
        console.error('File upload failed:', err);
        toast.error(`Tải lên tệp "${file.name || 'image'}" thất bại!`);
        setUploadedFiles(prev => prev.filter(f => f.key !== tempKey));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesToUpload = Array.from(e.target.files);
      uploadFiles(filesToUpload);
      e.target.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const filesToUpload: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) filesToUpload.push(file);
      }
    }

    if (filesToUpload.length > 0) {
      uploadFiles(filesToUpload);
    }
  };

  const handleRemoveFile = async (key: string) => {
    const fileToRemove = uploadedFiles.find(f => f.key === key);
    if (!fileToRemove) return;

    setUploadedFiles(prev => prev.filter(f => f.key !== key));

    if (fileToRemove.id) {
      try {
        if (fileToRemove.isImage) {
          await api.delete(`/imagesapi/${fileToRemove.id}`);
        } else {
          await api.delete(`/attachments/${fileToRemove.id}`);
        }
      } catch (err) {
        console.error('Failed to delete file from server:', err);
      }
    }
  };

  const toggleFormattedBlock = (type: 'bulletList' | 'orderedList' | 'blockquote') => {
    if (!editor) return;

    if (editor.isActive(type)) {
      if (type === 'bulletList') editor.chain().focus().toggleBulletList().run();
      else if (type === 'orderedList') editor.chain().focus().toggleOrderedList().run();
      else if (type === 'blockquote') editor.chain().focus().toggleBlockquote().run();
      return;
    }

    const { state, dispatch } = editor.view;
    const { selection } = state;
    const { from, to, $from } = selection;
    const tr = state.tr;
    let modifiedDoc = false;

    const parentStart = $from.start($from.depth);
    const parentEnd = $from.end($from.depth);
    const searchFrom = Math.min(from, parentStart);
    const searchTo = Math.max(to, parentEnd);

    // 1. Strip leading literal list prefixes (like "1. ", "- ", "* ")
    state.doc.nodesBetween(searchFrom, searchTo, (node, pos) => {
      if (node.isText && node.text) {
        const match = node.text.match(/^(\d+\.|[-*+])\s+/);
        if (match) {
          tr.delete(pos, pos + match[0].length);
          modifiedDoc = true;
        }
      }
    });

    // 2. Find and handle hardBreaks
    const hardBreakPositions: number[] = [];
    state.doc.nodesBetween(searchFrom, searchTo, (node, pos) => {
      if (node.type.name === 'hardBreak') {
        hardBreakPositions.push(pos);
      }
    });

    if (hardBreakPositions.length > 0) {
      modifiedDoc = true;
      for (let i = hardBreakPositions.length - 1; i >= 0; i--) {
        const pos = hardBreakPositions[i];
        tr.delete(pos, pos + 1);
        tr.split(pos);
      }

      const newFrom = tr.mapping.map(from);
      const newTo = tr.mapping.map(to);
      const safeFrom = Math.min(newFrom, tr.doc.content.size - 1);
      const safeTo = Math.min(newTo, tr.doc.content.size - 1);

      tr.setSelection(TextSelection.create(tr.doc, safeFrom, safeTo));
    }

    if (modifiedDoc) {
      dispatch(tr);
    }

    if (type === 'bulletList') editor.chain().focus().toggleBulletList().run();
    else if (type === 'orderedList') editor.chain().focus().toggleOrderedList().run();
    else if (type === 'blockquote') editor.chain().focus().toggleBlockquote().run();
  };

  // 4. Send Message Handler
  const handleSend = () => {
    if (!editor) return;

    const contentText = serializeTiptapContent(editor);
    const hasFiles = uploadedFiles.some(f => f.status === 'completed');

    if (!contentText.trim() && !hasFiles) return;

    if (contentText.length > 4000) {
      toast.error('Message cannot exceed 4000 characters');
      return;
    }

    const isUploading = uploadedFiles.some(f => f.status === 'uploading');
    if (isUploading) {
      toast.error('Vui lòng đợi tệp tải lên hoàn tất!');
      return;
    }

    const completedAttachments = uploadedFiles
      .filter(f => f.status === 'completed')
      .map(file => ({
        url: file.url,
        name: file.name,
        size: file.size,
        mimeType: file.mimeType
      }));

    let type = 'text';
    if (!contentText.trim() && completedAttachments.length === 1) {
      const isImg = uploadedFiles.find(f => f.status === 'completed')?.isImage;
      type = isImg ? 'image' : 'file';
    }

    let finalContent = contentText.trim();
    if (autoMentionAll) {
      if (!finalContent.includes('[@All](All)') && !finalContent.includes('[@all](all)')) {
        finalContent = finalContent ? `${finalContent} [@All](All)` : `[@All](All)`;
      }
    }

    sendMessage(
      channelId,
      finalContent,
      completedAttachments.length > 0 ? completedAttachments : undefined,
      replyingToMessage?._id,
      type,
      undefined,
      threadParentId
    );

    editor.commands.clearContent();
    setIsEmpty(true);
    setUploadedFiles([]);
    setReplyingToMessage(null);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleSendRef = useRef(handleSend);
  const editorRef = useRef<Editor | null>(null);
  React.useEffect(() => {
    handleSendRef.current = handleSend;
    editorRef.current = editor;
  });

  const handleSelectSticker = (stickerId: string) => {
    const contentVal = autoMentionAll ? '[@All](All)' : '';
    sendMessage(channelId, contentVal, undefined, replyingToMessage?._id, 'sticker', stickerId, threadParentId);
    setReplyingToMessage(null);
    setShowMediaPicker(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  const isEditorEmpty = isEmpty;

  return (
    <div className="w-full bg-white dark:bg-[#202020] p-3 border-t border-[#EAEAEA] dark:border-white/[0.06] select-text">
      {/* Replying Banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between bg-[#F7F6F3] dark:bg-white/5 border-l-2 border-[#2563EB] px-3 py-1.5 rounded-r-[6px] mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-[#111111] dark:text-[#E8E8E7]">
              Replying to {replyingSender ? (replyingSender.fullName || replyingSender.email) : 'User'}
            </span>
            <span className="text-xs text-[#787774] dark:text-[#9B9A97] truncate">
              {replyingToMessage.content?.replace(/@@@SOFTBREAK@@@/g, ' ')}
            </span>
          </div>
          <button
            onClick={() => setReplyingToMessage(null)}
            className="p-1 hover:bg-[#EAEAEA] dark:hover:bg-white/10 rounded transition-colors text-[#787774]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Card */}
      <div 
        onClick={() => editor?.commands.focus()} 
        className="w-full border border-[#EAEAEA] dark:border-white/10 rounded-[8px] p-3 bg-white dark:bg-[#252525] focus-within:border-[#2563EB] dark:focus-within:border-[#3B82F6] transition-colors relative shadow-sm cursor-text"
      >
        {/* Uploaded File Previews */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 pb-2 border-b border-[#EAEAEA] dark:border-white/[0.06]">
            {uploadedFiles.map(file => (
              <div key={file.key} className="relative group flex items-center gap-2 bg-[#F0F0EE] dark:bg-white/5 px-2.5 py-1.5 rounded-[6px] text-xs max-w-[200px]">
                {file.isImage && file.url ? (
                  <img src={file.url} alt={file.name} className="w-8 h-8 object-cover rounded shrink-0" />
                ) : (
                  <Paperclip className="w-4 h-4 text-[#787774] shrink-0" />
                )}
                <span className="truncate text-[#111111] dark:text-[#E8E8E7] font-medium">{file.name}</span>
                {file.status === 'uploading' && (
                  <span className="text-[10px] text-[#2563EB] font-bold">{file.progress}%</span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.key)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors shadow-sm"
                  title="Remove file"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tiptap Editor Container */}
        <div className="w-full relative min-h-[24px]" onPaste={handlePaste}>
          <EditorContent editor={editor} className="w-full bg-transparent" />
        </div>

        {/* Media Picker Popover */}
        {showMediaPicker && (
          <EmojiStickerPicker
            onSelectEmoji={(emoji) => editor?.commands.insertContent(emoji)}
            onSelectSticker={handleSelectSticker}
            onClose={() => setShowMediaPicker(false)}
          />
        )}

        {/* Toolbar & Action Buttons */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#EAEAEA]/50 dark:border-white/[0.04]">
          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach File (Max 10MB)"
              className="p-1.5 text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/10 rounded-[4px] transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button 
              type="button"
              onClick={() => setShowMediaPicker(prev => !prev)}
              title="Stickers & Emojis"
              className="p-1.5 text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/10 rounded-[4px] transition-colors"
            >
              <Smile className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-[#EAEAEA] dark:bg-white/[0.06] mx-1 shrink-0" />

            {/* Formatting Toolbar */}
            <button 
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              title="Bold (Ctrl+B)"
              className={cn(
                "p-1.5 rounded-[4px] transition-colors",
                editor?.isActive('bold')
                  ? "bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA]"
                  : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/10"
              )}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              title="Italic (Ctrl+I)"
              className={cn(
                "p-1.5 rounded-[4px] transition-colors",
                editor?.isActive('italic')
                  ? "bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA]"
                  : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/10"
              )}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              title="Strikethrough"
              className={cn(
                "p-1.5 rounded-[4px] transition-colors",
                editor?.isActive('strike')
                  ? "bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA]"
                  : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/10"
              )}
            >
              <Strikethrough className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              title="Code Block"
              className={cn(
                "p-1.5 rounded-[4px] transition-colors",
                editor?.isActive('codeBlock')
                  ? "bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA]"
                  : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/10"
              )}
            >
              <Code className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => toggleFormattedBlock('blockquote')}
              title="Blockquote"
              className={cn(
                "p-1.5 rounded-[4px] transition-colors",
                editor?.isActive('blockquote')
                  ? "bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA]"
                  : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/10"
              )}
            >
              <Quote className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => toggleFormattedBlock('bulletList')}
              title="Bullet List"
              className={cn(
                "p-1.5 rounded-[4px] transition-colors",
                editor?.isActive('bulletList')
                  ? "bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA]"
                  : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/10"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => toggleFormattedBlock('orderedList')}
              title="Numbered List"
              className={cn(
                "p-1.5 rounded-[4px] transition-colors",
                editor?.isActive('orderedList')
                  ? "bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA]"
                  : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-white/10"
              )}
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            type="button"
            onClick={handleSend}
            disabled={(isEditorEmpty && !uploadedFiles.some(f => f.status === 'completed')) || uploadedFiles.some(f => f.status === 'uploading')}
            className="p-1.5 bg-[#111111] text-white dark:bg-[#E8E8E7] dark:text-[#111111] hover:bg-[#2563EB] dark:hover:bg-[#3B82F6] dark:hover:text-white rounded-[6px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
