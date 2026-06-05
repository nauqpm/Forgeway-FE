"use client";

import { Search, Layout } from "lucide-react";

interface DashboardHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: string;
  setSortOrder: (order: "newest" | "oldest" | "az") => void;
  onCreatePage: () => void;
  onImportFromLibrary: () => void;
}

export default function DashboardHeader({
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  onCreatePage,
  onImportFromLibrary,
}: DashboardHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-10 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E6EFFC] dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-[#0052CC] dark:text-blue-400">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#172B4D] dark:text-gray-100 tracking-tight">Workspace Documents</h1>
              <p className="text-[#6B778C] dark:text-gray-400 text-sm font-medium">Record and share knowledge with your team.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onImportFromLibrary}
                className="flex h-10 min-w-[178px] items-center justify-center gap-2 rounded-lg border border-[#0052CC]/30 px-5 text-sm font-semibold text-[#0052CC] transition-all hover:bg-[#E6EFFC]"
              >
                Import from Library
              </button>
            </div>
            <button
              onClick={onCreatePage}
              className="flex h-10 min-w-[178px] items-center justify-center gap-2 rounded-lg bg-[#0052CC] px-5 text-sm font-semibold text-white shadow-[0_2px_4px_rgba(0,82,204,0.2)] transition-all hover:bg-[#0747A6] hover:shadow-[0_4px_8px_rgba(0,82,204,0.3)]"
            >       
              Create New Document
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative min-w-[280px] flex-1 max-w-4xl">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title..."
              className="w-full pl-10 pr-4 py-2.5 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-xl text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-[#42526E] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors">
              <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-1" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest" | "az")}
                className="bg-transparent text-[12px] font-semibold text-[#42526E] dark:text-gray-400 outline-none cursor-pointer"
              >
                <option value="newest" className="dark:bg-gray-900">Newest</option>
                <option value="oldest" className="dark:bg-gray-900">Oldest</option>
                <option value="az" className="dark:bg-gray-900">A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
