"use client";

import { Search } from "lucide-react";

interface DashboardEmptyProps {
  onClearFilters: () => void;
}

export default function DashboardEmpty({ onClearFilters }: DashboardEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
      <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6 text-gray-200 dark:text-gray-700">
        <Search className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-bold text-[#172B4D] dark:text-gray-200">No documents found</h3>
      <p className="text-[#6B778C] dark:text-gray-400 text-sm mt-2 max-w-xs mx-auto">We couldn't find any documents matching your current search or filters.</p>
      <button 
        onClick={onClearFilters}
        className="mt-6 text-[#0052CC] dark:text-blue-400 text-sm font-bold hover:underline"
      >
        Clear Search 
      </button>
    </div>
  );
}
