import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Smile } from 'lucide-react';
import { useStickers } from '@/modules/client/chat/hooks/useChatQueries';

function getStaticUrl(url: string): string {
  if (!url) return '';
  // Cloudinary: insert pg_1 after /upload/ to extract the first frame as a static image
  if (url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/pg_1/');
  }
  return url;
}

interface StickerPickerProps {
  onSelectSticker: (id: string, url: string) => void;
  onClose: () => void;
}

export default function StickerPicker({ onSelectSticker, onClose }: StickerPickerProps) {
  const { data: packs = [], isLoading: loading, isError } = useStickers();
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [hoveredStickerId, setHoveredStickerId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePackId && packs.length > 0) {
      setActivePackId(packs[0]._id);
    }
  }, [activePackId, packs]);

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

  const activePack = packs.find((p) => p._id === activePackId);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-16 left-4 z-50 w-[320px] h-[360px] bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 select-none"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between bg-[#FBFBFA] dark:bg-[#252525]">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
          <Smile className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
          <span>Stickers</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-[#787774] hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
        >
          Close
        </button>
      </div>

      {/* Stickers Grid Area */}
      <div className="flex-1 overflow-y-auto p-3 bg-white dark:bg-[#1C1C1C]">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#787774] gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
            <span>Loading sticker packs...</span>
          </div>
        ) : isError ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-red-500 p-4 text-center">
            Cannot load stickers. Please try again.
          </div>
        ) : packs.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-[#787774]">
            No stickers available
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {activePack?.stickers.map((sticker) => {
              const isHovered = hoveredStickerId === sticker._id;
              const displayUrl = sticker.isAnimated && !isHovered
                ? getStaticUrl(sticker.url)
                : sticker.url;

              return (
                <div
                  key={sticker._id}
                  onClick={() => onSelectSticker(sticker._id, sticker.url)}
                  onMouseEnter={() => setHoveredStickerId(sticker._id)}
                  onMouseLeave={() => setHoveredStickerId(null)}
                  className="aspect-square flex items-center justify-center rounded-lg hover:bg-[#F0F0EE] dark:hover:bg-white/5 cursor-pointer p-1.5 transition-all relative group"
                >
                  <img
                    src={displayUrl}
                    alt={sticker.code}
                    className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
                    loading="lazy"
                    draggable="false"
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs at the Bottom */}
      {!loading && packs.length > 0 && (
        <div className="h-12 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-[#FBFBFA] dark:bg-[#252525] flex items-center px-2 gap-1 overflow-x-auto shrink-0">
          {packs.map((pack) => {
            const isActive = pack._id === activePackId;
            return (
              <button
                key={pack._id}
                onClick={() => setActivePackId(pack._id)}
                className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                  isActive
                    ? 'border-[#2563EB] dark:border-[#3B82F6] bg-white dark:bg-[#1E1E1E]'
                    : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title={pack.name}
              >
                <img
                  src={pack.bannerUrl}
                  alt={pack.name}
                  className="w-6 h-6 object-contain rounded"
                  draggable="false"
                  onDragStart={(e) => e.preventDefault()}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
