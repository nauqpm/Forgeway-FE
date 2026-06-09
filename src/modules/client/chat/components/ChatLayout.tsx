'use client';

import React from 'react';
import ChatSidebar from './ChatSidebar';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-var(--app-header-h))] overflow-hidden bg-white dark:bg-[#202020]">
      {/* Sidebar - fixed width */}
      <div className="w-64 flex-shrink-0 border-r border-[#EAEAEA] dark:border-white/[0.06] bg-[#FBFBFA] dark:bg-[#252525]">
        <ChatSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
