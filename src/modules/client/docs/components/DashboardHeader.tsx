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
    <div className="bg-white dark:bg-[#202020] border-b border-[#EAEAEA] dark:border-white/[0.05] px-6 py-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] rounded-[6px] flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6] shrink-0">
          <Layout className="w-4 h-4" />
        </div>
        <h1 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7] flex-1 min-w-0">Workspace Documents</h1>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onImportFromLibrary}
            className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#EAEAEA] dark:border-white/10 px-3 text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]"
          >
            Import from Library
          </button>
          <button
            onClick={onCreatePage}
            className="flex h-8 items-center gap-1.5 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-3 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]"
          >
            Create New Document
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-4 py-2 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] bg-[#F7F6F3] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/8 rounded-[6px] focus:bg-white dark:focus:bg-[#252525] focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors outline-none placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B]"
          />
        </div>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest" | "az")}
          className="h-9 px-3 bg-[#F7F6F3] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/8 text-xs font-medium text-[#787774] dark:text-[#9B9A97] rounded-[6px] outline-none cursor-pointer hover:border-[#ABABAB] dark:hover:border-white/15 transition-colors"
        >
          <option value="newest" className="dark:bg-[#252525]">
            Newest
          </option>
          <option value="oldest" className="dark:bg-[#252525]">
            Oldest
          </option>
          <option value="az" className="dark:bg-[#252525]">
            A–Z
          </option>
        </select>
      </div>
    </div>
  );
}
