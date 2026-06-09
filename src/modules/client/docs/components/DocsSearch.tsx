"use client";

import { Search } from "lucide-react";
import { useDocsStore } from "../store/docs.store";

export default function DocsSearch() {
  const { searchQuery, setSearchQuery } = useDocsStore();

  return (
    <div className="relative group px-1">
      <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B] group-focus-within:text-[#2563EB] dark:group-focus-within:text-[#3B82F6] transition-colors" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
        className="w-full pl-8 pr-3 py-1.5 bg-[#F7F6F3] dark:bg-[#252525] border border-transparent rounded-[6px] text-[0.6875rem] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] text-[#111111] dark:text-[#E8E8E7] focus:bg-white dark:focus:bg-[#202020] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-all duration-200"
      />
    </div>
  );
}
