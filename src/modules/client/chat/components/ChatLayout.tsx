'use client';

import React, { useState } from 'react';
import ChatSidebar from './ChatSidebar';
import { SquarePen } from 'lucide-react';
import NewDMChatModal from './NewDMChatModal';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  return (
    <div className="h-full flex min-h-0 overflow-hidden bg-white dark:bg-[#202020] rounded-[12px] border border-[#EAEAEA] dark:border-white/[0.06] shadow-sm relative m-4">
      {/* Sidebar - fixed width */}
      <div className="w-64 flex-shrink-0 min-h-0 border-r border-[#EAEAEA] dark:border-white/[0.06] bg-[#FBFBFA] dark:bg-[#252525] flex flex-col">

        {/* Messages Header */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <span className="font-semibold text-[1.5rem] tracking-[-0.01em] text-[#111111] dark:text-[#E8E8E7]">Messages</span>
          <button 
            onClick={() => setIsNewChatOpen(true)}
            className="p-1.5 mt-1 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 text-[#787774] transition-colors"
            title="New Message"
          >
            <SquarePen className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 min-h-0">
          <ChatSidebar />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {children}
      </div>

      {/* Modals */}
      <NewDMChatModal 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)} 
      />
    </div>
  );
}
