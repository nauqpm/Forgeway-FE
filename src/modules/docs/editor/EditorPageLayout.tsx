// Component defining the main layout of the document editor page, including toolbar, outline, canvas, status bar, and optional comments sidebar.
// Layout uses flexbox to arrange sections flexibly and responsively, 
// and has controls to show/hide outline and comments sidebars as needed.
"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface EditorPageLayoutProps {
  toolbar: React.ReactNode;
  sidebar: React.ReactNode;
  canvas: React.ReactNode;
  statusBar: React.ReactNode;
  rightSidebar?: React.ReactNode;
  rightSidebarOpen?: boolean;
  setRightSidebarOpen?: (open: boolean) => void;
}

export default function EditorPageLayout({
  toolbar,
  sidebar,
  canvas,
  statusBar,
  rightSidebar,
  rightSidebarOpen,
  setRightSidebarOpen,
}: EditorPageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [internalRightOpen, setInternalRightOpen] = useState(false);

  const isRightOpen = rightSidebarOpen !== undefined ? rightSidebarOpen : internalRightOpen;
  const setIsRightOpen = setRightSidebarOpen || setInternalRightOpen;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#F8F9FA] dark:bg-[#202020] overflow-hidden relative">
      {/* Toolbar */}
      {toolbar && (
        <div className="sticky top-0 z-20 shrink-0 bg-white dark:bg-[#202020] border-b border-gray-200/60 dark:border-white/[0.06] print:hidden">
          {toolbar}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Outline Sidebar */}
        {sidebar && (
          <div
            className={`transition-all duration-300 shrink-0 border-r border-gray-200/60 dark:border-white/[0.06] bg-white dark:bg-[#202020] flex flex-col ${
              sidebarOpen ? "w-[240px]" : "w-0 overflow-hidden border-r-0"
            } print:hidden`}
          >
            {sidebar}
          </div>
        )}

        {/* Toggle Sidebar Button */}
        {sidebar && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-4 z-30 flex h-8 w-6 items-center justify-center rounded-r-md border border-gray-200/80 bg-white text-gray-500 shadow-sm transition-all duration-300 hover:text-gray-700 dark:border-white/[0.08] dark:bg-[#202020] dark:hover:text-gray-200 print:hidden"
            style={{
              left: sidebarOpen ? "240px" : "0px",
            }}
            title={sidebarOpen ? "Hide outline" : "Show outline"}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}

        {/* Canvas Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
          {canvas}
        </div>

        {/* Right Sidebar (Comments) */}
        {rightSidebar && (
          <div
            className={`transition-all duration-300 shrink-0 border-l border-gray-200/60 dark:border-white/[0.06] bg-white dark:bg-[#202020] flex flex-col relative ${
              isRightOpen ? "w-[300px]" : "w-0 overflow-hidden border-l-0"
            } print:hidden`}
          >
            {/* Close button */}
            {isRightOpen && (
              <button
                onClick={() => setIsRightOpen(false)}
                className="absolute top-3 right-3 z-10 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                title="Hide sidebar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {rightSidebar}
          </div>
        )}
      </div>

      {/* Status Bar */}
      {statusBar && (
        <div className="shrink-0 bg-white dark:bg-[#202020] border-t border-gray-200/60 dark:border-white/[0.06] px-4 py-1.5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 print:hidden">
          {statusBar}
        </div>
      )}
    </div>
  );
}
