'use client';

import React from 'react';
import ChatLayout from '@/modules/client/chat/components/ChatLayout';
import ChatWindow from '@/modules/client/chat/components/ChatWindow';

export default function ChatPage() {
  return (
    <ChatLayout>
      <ChatWindow />
    </ChatLayout>
  );
}
