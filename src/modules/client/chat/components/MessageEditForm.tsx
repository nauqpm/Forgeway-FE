'use client';

import React from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import type { MentionMemberItem } from '../hooks/useMentionSearch';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

interface MessageEditFormProps {
  editContent: string;
  editInputRef: React.RefObject<HTMLTextAreaElement | null>;
  setEditContent: (value: string) => void;
  onMentionSearch: (
    search: string,
    callback: (data: MentionMemberItem[]) => void
  ) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function MessageEditForm({
  editContent,
  editInputRef,
  setEditContent,
  onMentionSearch,
  onSave,
  onCancel,
}: MessageEditFormProps) {
  return (
    <div className="w-full mt-1.5 flex flex-col gap-2">
      <div className="w-full p-2 bg-white dark:bg-[#202020] border border-[#2563EB] dark:border-[#3B82F6] rounded-md focus-within:ring-1 focus-within:ring-[#2563EB] overflow-visible">
        <MentionsInput
          inputRef={editInputRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSave();
            } else if (e.key === 'Escape') {
              onCancel();
            }
          }}
          className="chat-m w-full bg-transparent"
          a11ySuggestionsListLabel="Suggested mentions"
          maxLength={4000}
        >
          <Mention
            trigger="@"
            data={onMentionSearch}
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
          onClick={onCancel}
          className="px-2.5 py-1 text-xs font-medium text-[#555555] dark:text-[#AAAAAA] bg-[#F0F0EE] dark:bg-white/[0.08] hover:bg-[#E5E5E3] dark:hover:bg-white/[0.12] rounded transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-2.5 py-1 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded transition-colors shadow-sm cursor-pointer"
        >
          Save
        </button>
      </div>
    </div>
  );
}
