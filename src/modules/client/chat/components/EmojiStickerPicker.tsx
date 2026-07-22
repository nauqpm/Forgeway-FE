import React, { useEffect, useRef, useState } from 'react';
import StickerPicker from './StickerPicker';
import EmojiPicker from './EmojiPicker';

interface EmojiStickerPickerProps {
  onSelectSticker: (id: string, url: string) => void;
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiStickerPicker({ onSelectSticker, onSelectEmoji, onClose }: EmojiStickerPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'stickers' | 'emoji'>('stickers');

  // Close on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-16 left-4 z-50 w-[340px] h-[420px] bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 select-none"
    >
      {/* Header Segment Tabs */}
      <div className="p-2 bg-[#F8F9FA] dark:bg-[#1A1A1A] border-b border-[#EAEAEA] dark:border-white/[0.06]">
        <div className="flex items-center p-1 bg-[#EAEAEA]/70 dark:bg-[#282828] rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`flex-1 py-1.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all ${
              activeTab === 'stickers'
                ? 'bg-white dark:bg-[#383838] text-[#2563EB] dark:text-[#60A5FA] shadow-sm'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            Sticker
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            className={`flex-1 py-1.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all ${
              activeTab === 'emoji'
                ? 'bg-white dark:bg-[#383838] text-[#2563EB] dark:text-[#60A5FA] shadow-sm'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            Emoji
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#202020]">
        {activeTab === 'stickers' ? (
          <StickerPicker onSelectSticker={onSelectSticker} />
        ) : (
          <EmojiPicker onSelectEmoji={onSelectEmoji} />
        )}
      </div>
    </div>
  );
}
