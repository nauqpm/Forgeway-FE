"use client";

import { FileText, History, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Document } from "../types/docs.type";

interface DashboardRowProps {
  doc: Document;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, currentTitle: string) => void;
  onDelete: (id: string) => void;
}

export default function DashboardRow({
  doc,
  onSelect,
  onDuplicate,
  onRename,
  onDelete,
}: DashboardRowProps) {
  return (
    <tr 
      onClick={() => onSelect(doc.id)}
      className="group border-b border-gray-50 last:border-0 hover:bg-[#F8FBFF] cursor-pointer transition-all duration-200"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-[#0052CC] group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors block leading-tight">{doc.title}</span>
            <span className="text-[11px] text-gray-400 font-medium mt-1 block">Created on {new Date(doc.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-200/20">
            JD
          </div>
          <span className="text-[13px] font-medium text-[#42526E]">John Doe</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-xs font-medium text-[#6B778C]">
          <History className="w-3.5 h-3.5 text-gray-300" />
          {new Date(doc.updatedAt).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onDuplicate(doc.id); }}
            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-[#0052CC] transition-all hover:shadow-sm border border-transparent hover:border-gray-100"
            title="Duplicate"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRename(doc.id, doc.title); }}
            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-[#0052CC] transition-all hover:shadow-sm border border-transparent hover:border-gray-100"
            title="Rename"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-all hover:shadow-sm border border-transparent hover:border-red-100"
            title="Delete"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
