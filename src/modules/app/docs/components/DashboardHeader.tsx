"use client";

import { Search, Plus, Filter, Layout } from "lucide-react";

interface DashboardHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: string;
  setSortOrder: (order: any) => void;
  onCreatePage: () => void;
}

export default function DashboardHeader({
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  onCreatePage,
}: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100 px-10 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E6EFFC] rounded-xl flex items-center justify-center text-[#0052CC]">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight">Space Documentation</h1>
              <p className="text-[#6B778C] text-sm font-medium">Capture and share knowledge with your team.</p>
            </div>
          </div>
          <button 
            onClick={onCreatePage}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-semibold hover:bg-[#0747A6] transition-all shadow-[0_2px_4px_rgba(0,82,204,0.2)] hover:shadow-[0_4px_8px_rgba(0,82,204,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Create Page
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title..."
              className="w-full pl-10 pr-4 py-2.5 text-gray-600 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-[#42526E] hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </div>
            <div className="h-4 w-px bg-gray-200 mx-1" />
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-2 bg-transparent rounded-lg text-[12px] font-semibold text-[#42526E] outline-none cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <option value="newest">Last Updated</option>
              <option value="oldest">Oldest Created</option>
              <option value="az">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
