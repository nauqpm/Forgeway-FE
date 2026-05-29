"use client";

import { Search, Plus, Filter, Layout } from "lucide-react";

interface DashboardHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: string;
  setSortOrder: (order: "newest" | "oldest" | "az") => void;
  onCreatePage: () => void;
  onImportFile: () => void;
  onImportFromLibrary: () => void;
}

export default function DashboardHeader({
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  onCreatePage,
  onImportFile,
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
              <h1 className="text-2xl font-bold text-[#172B4D] dark:text-gray-100 tracking-tight">Workspace Documentation</h1>
              <p className="text-[#6B778C] dark:text-gray-400 text-sm font-medium">Capture and share knowledge with your team.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onImportFromLibrary}
                className="flex items-center gap-2 px-4 py-2.5 border border-[#0052CC]/30 text-[#0052CC] rounded-lg text-sm font-semibold hover:bg-[#E6EFFC] transition-all"
              >
                Thêm file từ thư viện
              </button>
              <button
                onClick={onImportFile}
                className="flex items-center gap-2 px-4 py-2.5 border border-[#0052CC]/30 text-[#0052CC] rounded-lg text-sm font-semibold hover:bg-[#E6EFFC] transition-all"
              >
                Thêm file từ máy
              </button>
            </div>
            <button
              onClick={onCreatePage}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-semibold hover:bg-[#0747A6] transition-all shadow-[0_2px_4px_rgba(0,82,204,0.2)] hover:shadow-[0_4px_8px_rgba(0,82,204,0.3)]"
            >
              <Plus className="w-4 h-4" />
              Create Page
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-lg">
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
            <div className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-[#42526E] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg cursor-pointer transition-colors">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-1" />
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest" | "az")}
              className="px-3 py-2 bg-transparent rounded-lg text-[12px] font-semibold text-[#42526E] dark:text-gray-400 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <option value="newest" className="dark:bg-gray-900">Last Updated</option>
              <option value="oldest" className="dark:bg-gray-900">Oldest Created</option>
              <option value="az" className="dark:bg-gray-900">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
