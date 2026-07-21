import React from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
}

export default function EmojiPicker({ onSelectEmoji }: EmojiPickerProps) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden emoji-mart-custom-wrapper">
      <Picker 
        data={data} 
        onEmojiSelect={(emoji: { native: string }) => onSelectEmoji(emoji.native)}
        previewPosition="none"
        skinTonePosition="none"
        perLine={8}
        navPosition="bottom"
        noCountryFlags={false}
      />
    </div>
  );
}
