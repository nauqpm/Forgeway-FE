"use client";

import { ChevronDown, ChevronRight, Download, FileText, History, Trash2 } from "lucide-react";
import { documentService } from "../services/documentService";
import { Document } from "../types/docs.type";

interface DashboardRowProps {
  doc: Document;
  level?: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  onSelect: (id: string) => void;
  onRename: (id: string, currentTitle: string) => void;
  onDelete: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  isDownloading: boolean;
}

export default function DashboardRow({
  doc,
  level = 0,
  hasChildren = false,
  isExpanded = false,
  onToggleExpand,
  onSelect,
  onRename,
  onDelete,
  onDownload,
  isDownloading,
}: DashboardRowProps) {
  return (
    <tr
      onClick={() => onSelect(doc.id)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(doc.id);
        }
      }}
      className="group border-b border-[#EAEAEA] dark:border-white/[0.04] last:border-0 hover:bg-[#F7F6F3] dark:hover:bg-white/[0.025] focus-within:bg-[#F7F6F3] dark:focus-within:bg-white/[0.025] cursor-pointer transition-all duration-150"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3" style={{ paddingLeft: level * 24 }}>
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.(doc.id);
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[#787774] transition-colors hover:bg-[#EAEAEA] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/10 dark:hover:text-[#E8E8E7]"
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${doc.title}`}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="h-6 w-6 shrink-0" />
          )}
          <div className="w-10 h-10 bg-[#F7F6F3] dark:bg-[#252525] rounded-[6px] flex items-center justify-center text-[#ABABAB] dark:text-[#6B6B6B] group-hover:bg-white dark:group-hover:bg-[#2A2A2A] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-all border border-transparent group-hover:border-[#EAEAEA] dark:group-hover:border-white/[0.06]">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center">
              <span className="block truncate text-[0.8125rem] font-semibold leading-tight text-[#111111] transition-colors group-hover:text-[#2563EB] dark:text-[#E8E8E7] dark:group-hover:text-[#3B82F6]">
                {doc.title}
              </span>
            </div>
            <span className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] font-medium mt-1 block">
              Created {new Date(doc.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {doc.source === "import" ? (
          <span className="inline-flex whitespace-nowrap rounded-[4px] bg-[#FBF3DB] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#956400] dark:bg-[rgba(149,100,0,0.12)] dark:text-[#F59E0B]">Imported file</span>
        ) : (
          <span className="inline-flex whitespace-nowrap rounded-[4px] bg-[#EFF6FF] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]">Page</span>
        )}
      </td>
      <td className="px-4 py-3">
        {doc.lastEditedBy ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] flex items-center justify-center text-[0.625rem] font-bold text-[#2563EB] dark:text-[#3B82F6] border border-[#2563EB]/10">
              {doc.lastEditedBy?.fullName?.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97]">
              {doc.lastEditedBy.fullName}
            </span>
          </div>
        ) : (
          <span className="text-[0.8125rem] text-[#ABABAB] dark:text-[#6B6B6B]">—</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2 text-[0.6875rem] font-medium text-[#ABABAB] dark:text-[#6B6B6B]">
          <History className="w-3.5 h-3.5" />
          {new Date(doc.updatedAt).toLocaleDateString()}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0">
          {doc.source === "import" ? (
            <>
              <a
                href={documentService.downloadUrl(doc.id)}
                onClick={(e) => e.stopPropagation()}
                className="p-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2A2A2A] rounded-[6px] text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-all border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.06]"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(doc);
                }}
                className="p-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2A2A2A] rounded-[6px] text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#9F2F2D] dark:hover:text-[#F87171] transition-all border border-transparent hover:border-[#F5C6C7] dark:hover:border-red-900/20"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(doc);
                }}
                disabled={isDownloading}
                className="p-2 hover:bg-white dark:hover:bg-[#2A2A2A] rounded-[6px] text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#2563EB] dark:hover:text-[#3B82F6] disabled:cursor-wait disabled:opacity-50 transition-all border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.06]"
                title="Download"
                aria-label={`Download ${doc.title}`}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRename(doc.id, doc.title); }}
                className="p-2 hover:bg-white dark:hover:bg-[#2A2A2A] rounded-[6px] text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-all border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.06]"
                title="Rename"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(doc);
                }}
                className="p-2 hover:bg-white dark:hover:bg-[#2A2A2A] rounded-[6px] text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#9F2F2D] dark:hover:text-[#F87171] transition-all border border-transparent hover:border-[#F5C6C7] dark:hover:border-red-900/20"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
