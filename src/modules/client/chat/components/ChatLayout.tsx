'use client';

import React from 'react';
import ChatSidebar from './ChatSidebar';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex min-h-0 overflow-hidden bg-white dark:bg-[#202020] rounded-[12px] border border-[#EAEAEA] dark:border-white/[0.06] shadow-sm m-4">
      {/* Sidebar - fixed width */}
      <div className="w-64 flex-shrink-0 border-r border-[#EAEAEA] dark:border-white/[0.06] bg-[#FBFBFA] dark:bg-[#252525]">
        <ChatSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
