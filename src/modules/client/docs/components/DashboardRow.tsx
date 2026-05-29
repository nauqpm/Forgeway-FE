"use client";

import { FileText, History, MoreHorizontal } from "lucide-react";
import { Document } from "../types/docs.type";

interface DashboardRowProps {
  doc: Document;
  onSelect: (id: string) => void;
  onRename: (id: string, currentTitle: string) => void;
  onDelete: (id: string) => void;
}

export default function DashboardRow({
  doc,
  onSelect,
  onRename,
  onDelete,
}: DashboardRowProps) {
  return (
    <tr 
      onClick={() => onSelect(doc.id)}
      className="group border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-[#F8FBFF] dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-200"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:text-[#0052CC] dark:group-hover:text-blue-400 group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#172B4D] dark:text-gray-200 group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors block leading-tight">{doc.title}</span>
              <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${doc.source === "upload" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"}`}>
                {doc.source === "upload" ? "UPLOAD" : "DOCS"}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-1 block">Created on {new Date(doc.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/20 dark:border-indigo-700/20">
            JD
          </div>
          <span className="text-[13px] font-medium text-[#42526E] dark:text-gray-300">John Doe</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-xs font-medium text-[#6B778C] dark:text-gray-400">
          <History className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
          {new Date(doc.updatedAt).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          {doc.source !== "upload" && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onRename(doc.id, doc.title); }}
                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#0052CC] dark:hover:text-blue-400 transition-all hover:shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                title="Rename"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all hover:shadow-sm border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                title="Delete"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
