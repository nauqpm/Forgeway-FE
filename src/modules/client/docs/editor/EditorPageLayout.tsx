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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [internalRightOpen, setInternalRightOpen] = useState(false);

  const isRightOpen = rightSidebarOpen !== undefined ? rightSidebarOpen : internalRightOpen;
  const setIsRightOpen = setRightSidebarOpen || setInternalRightOpen;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] dark:bg-gray-900 overflow-hidden relative">
      {/* Toolbar */}
      {toolbar && (
        <div className="sticky top-0 z-20 shrink-0 bg-white dark:bg-gray-950 border-b border-gray-200/60 dark:border-gray-800 print:hidden">
          {toolbar}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Outline Sidebar */}
        {sidebar && (
          <div
            className={`transition-all duration-300 shrink-0 border-r border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col ${
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
            className="absolute top-4 z-30 p-1 bg-white dark:bg-gray-950 border border-gray-200/80 dark:border-gray-800 rounded-r-md shadow-sm text-gray-500 hover:text-gray-700 transition-all duration-300 flex items-center justify-center print:hidden"
            style={{
              left: sidebarOpen ? "240px" : "0px",
            }}
            title={sidebarOpen ? "Hide outline" : "Show outline"}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {canvas}
        </div>

        {/* Right Sidebar (Comments) */}
        {rightSidebar && (
          <div
            className={`transition-all duration-300 shrink-0 border-l border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col relative ${
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
        <div className="shrink-0 bg-white dark:bg-gray-950 border-t border-gray-200/60 dark:border-gray-800 px-6 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 print:hidden">
          {statusBar}
        </div>
      )}
    </div>
  );
}
