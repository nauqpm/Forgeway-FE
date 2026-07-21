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
      className="absolute bottom-16 left-4 z-50 w-[320px] h-[360px] bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 select-none"
    >
      {/* Header Tabs */}
      <div className="flex text-sm font-semibold text-[#787774] dark:text-[#9B9A97] bg-[#FBFBFA] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.06]">
        <button
          onClick={() => setActiveTab('stickers')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            activeTab === 'stickers' ? 'text-[#2563EB] dark:text-[#3B82F6]' : 'hover:text-[#111111] dark:hover:text-[#E8E8E7]'
          }`}
        >
          STICKER
          {activeTab === 'stickers' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563EB] dark:bg-[#3B82F6]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('emoji')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            activeTab === 'emoji' ? 'text-[#2563EB] dark:text-[#3B82F6]' : 'hover:text-[#111111] dark:hover:text-[#E8E8E7]'
          }`}
        >
          EMOJI
          {activeTab === 'emoji' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563EB] dark:bg-[#3B82F6]" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'stickers' ? (
          <StickerPicker onSelectSticker={onSelectSticker} />
        ) : (
          <EmojiPicker onSelectEmoji={onSelectEmoji} />
        )}
      </div>
    </div>
  );
}
