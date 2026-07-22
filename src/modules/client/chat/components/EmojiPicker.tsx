import React, { useEffect, useState } from 'react';
import EmojiPickerLib, { EmojiClickData, Theme } from 'emoji-picker-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
}

export default function EmojiPicker({ onSelectEmoji }: EmojiPickerProps) {
  const [pickerTheme, setPickerTheme] = useState<Theme>(Theme.AUTO);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setPickerTheme(isDark ? Theme.DARK : Theme.LIGHT);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelectEmoji(emojiData.emoji);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden emoji-mart-custom-wrapper">
      <EmojiPickerLib
        onEmojiClick={handleEmojiClick}
        theme={pickerTheme}
        width="100%"
        height="100%"
        searchPlaceHolder="Search emoji..."
        previewConfig={{ showPreview: false }}
        skinTonesDisabled
        lazyLoadEmojis
        autoFocusSearch={false}
      />
    </div>
  );
}
