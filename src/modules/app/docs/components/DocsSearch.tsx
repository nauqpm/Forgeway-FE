"use client";

import { Search } from "lucide-react";
import { useDocsStore } from "../store/docs.store";

export default function DocsSearch() {
  const { searchQuery, setSearchQuery } = useDocsStore();

  return (
    <div className="relative group px-1">
      <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-500 transition-colors" />
      <input 
        type="text" 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search documents..." 
        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-transparent rounded-md text-xs placeholder:text-gray-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
      />
    </div>
  );
}
