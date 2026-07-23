'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface MentionItem {
  id: string;
  label: string;
  email?: string;
  avatar?: string;
}

export interface MentionListProps {
  items: MentionItem[];
  command: (item: { id: string; label: string }) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const MentionList = forwardRef<MentionListRef, MentionListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command({ id: item.id, label: item.label });
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1));
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/10 rounded-lg shadow-xl overflow-hidden py-1 min-w-[240px] max-w-[320px] z-50">
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        const isAll = item.id === 'All' || item.id === 'all';
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => selectItem(index)}
            className={`w-full px-3 py-1.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
              isSelected
                ? 'bg-[#EFF6FF] dark:bg-white/10 text-[#2563EB] dark:text-[#60A5FA]'
                : 'hover:bg-[#F7F6F3] dark:hover:bg-white/5 text-[#111111] dark:text-[#E8E8E7]'
            }`}
          >
            <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0 ${
              isAll ? 'bg-[#F59E0B]' : 'bg-[#2563EB] dark:bg-[#3B82F6]'
            }`}>
              {isAll ? (
                <span>@</span>
              ) : item.avatar ? (
                <img src={item.avatar} alt={item.label} className="w-full h-full object-cover" />
              ) : (
                <span>{item.label.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <span className="font-semibold text-xs truncate leading-tight">
                {isAll ? '@All' : item.label}
              </span>
              {item.email && (
                <span className="text-[11px] text-[#787774] dark:text-[#9B9A97] truncate leading-tight mt-0.5">
                  {item.email}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
});

MentionList.displayName = 'MentionList';

export default MentionList;
