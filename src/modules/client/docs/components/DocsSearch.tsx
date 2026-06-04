"use client";

import { Search } from "lucide-react";
import { useDocsStore } from "../store/docs.store";

export default function DocsSearch() {
  const { searchQuery, setSearchQuery } = useDocsStore();

  return (
    <div className="relative group px-1">
      <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-[#0052CC] dark:group-focus-within:text-blue-400 transition-colors" />
      <input 
        type="text" 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..." 
        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-md text-xs placeholder:text-gray-400 dark:placeholder:text-gray-600 dark:text-gray-300 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0052CC] dark:focus:ring-blue-400 focus:border-[#0052CC] dark:focus:border-blue-400 transition-all duration-200"
      />
    </div>
  );
}
