import React from "react";
import { Layers, ChevronDown, ChevronRight } from "lucide-react";

interface SubtaskProgressBarProps {
  done: number;
  total: number;
  isExpanded?: boolean;
  onToggleExpand?: (e: React.MouseEvent) => void;
}

export default function SubtaskProgressBar({ done, total, isExpanded, onToggleExpand }: SubtaskProgressBarProps) {
  if (total === 0) return null;

  return (
    <div
      className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-[#EAEAEA] dark:border-[#333333] cursor-pointer group"
      onClick={onToggleExpand}
    >
      {/* Header Row: Subtasks label + count + arrow */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors">
          <Layers className="w-3.5 h-3.5" />
          <span className="text-[0.75rem] font-medium">Subtasks</span>
          <span className="bg-[#F0F0EE] dark:bg-[#333] px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold text-[#787774] dark:text-[#9B9A97]">
            {done}/{total}
          </span>
        </div>
        {onToggleExpand && (
          <div className="w-5 h-5 flex items-center justify-center rounded-[4px] border border-[#EAEAEA] dark:border-white/[0.1] hover:bg-[#F0F0EE] dark:hover:bg-[#2A2A2A] text-[#787774] transition-colors">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>

      {/* Progress bar - always visible */}
      <div className="w-full bg-[#DFE1E6] dark:bg-[#333333] h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${done / total >= 0.8 ? "bg-[#5E9C76]" : "bg-[#2563EB]"}`}
          style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

