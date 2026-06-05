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
    <div className="bg-white dark:bg-[#202020] border-b border-[#EAEAEA] dark:border-white/[0.06] px-10 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] rounded-[6px] flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6]">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[20px] font-semibold text-[#111111] dark:text-[#E8E8E7]">Workspace Documents</h1>
              <p className="text-[13px] text-[#787774] dark:text-[#9B9A97]">Record and share knowledge with your team.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onImportFromLibrary}
              className="flex h-9 items-center justify-center gap-2 rounded-[6px] border border-[#2563EB]/20 px-4 text-[13px] font-semibold text-[#2563EB] dark:text-[#3B82F6] transition-colors hover:bg-[#EFF6FF] dark:hover:bg-[rgba(37,99,235,0.08)]"
            >
              Import from Library
            </button>
            <button
              onClick={onCreatePage}
              className="flex h-9 items-center justify-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]"
            >
              Create New Document
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative min-w-[280px] flex-1 max-w-4xl">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title..."
              className="w-full pl-10 pr-4 py-2 text-[13px] text-[#111111] dark:text-[#E8E8E7] bg-[#F7F6F3] dark:bg-[#252525] border border-transparent rounded-[6px] focus:bg-white dark:focus:bg-[#202020] focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors outline-none placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B]"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto px-3 py-2 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors">
            <div className="h-4 w-px bg-[#EAEAEA] dark:bg-white/8 mx-1" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest" | "az")}
              className="bg-transparent text-[12px] font-semibold text-[#787774] dark:text-[#9B9A97] outline-none cursor-pointer"
            >
              <option value="newest" className="dark:bg-[#202020]">Newest</option>
              <option value="oldest" className="dark:bg-[#202020]">Oldest</option>
              <option value="az" className="dark:bg-[#202020]">A-Z</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
