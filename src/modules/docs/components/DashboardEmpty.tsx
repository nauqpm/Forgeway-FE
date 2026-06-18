"use client";

import { Search } from "lucide-react";

interface DashboardEmptyProps {
  onClearFilters: () => void;
}

export default function DashboardEmpty({ onClearFilters }: DashboardEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-white dark:bg-[#202020] rounded-[8px] border border-dashed border-[#EAEAEA] dark:border-white/[0.06]">
      <div className="w-20 h-20 bg-[#F7F6F3] dark:bg-[#252525] rounded-[8px] flex items-center justify-center mb-6 text-[#ABABAB] dark:text-[#6B6B6B]">
        <Search className="w-10 h-10" />
      </div>
      <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">No documents found</h3>
      <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mt-2 max-w-xs mx-auto">We couldn&apos;t find any documents matching your current search or filters.</p>
      <button
        onClick={onClearFilters}
        className="mt-6 text-[0.8125rem] text-[#2563EB] dark:text-[#3B82F6] font-semibold hover:underline"
      >
        Clear Search 
      </button>
    </div>
  );
}
