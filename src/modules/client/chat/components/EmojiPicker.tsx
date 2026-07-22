import React from 'react';
import EmojiPickerLib, { EmojiClickData, Theme } from 'emoji-picker-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
}

export default function EmojiPicker({ onSelectEmoji }: EmojiPickerProps) {
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelectEmoji(emojiData.emoji);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden emoji-mart-custom-wrapper">
      <EmojiPickerLib
        onEmojiClick={handleEmojiClick}
        theme={Theme.AUTO}
        previewConfig={{ showPreview: false }}
        skinTonesDisabled
        lazyLoadEmojis
      />
    </div>
  );
}
