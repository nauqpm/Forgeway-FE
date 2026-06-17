import {
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";

function getFileIcon(extension: string) {
  const ext = extension.toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return FileImage;
  if ([".xls", ".xlsx"].includes(ext)) return FileSpreadsheet;
  if ([".ppt", ".pptx"].includes(ext)) return FileType2;
  return FileText;
}

function formatSize(size: number) {
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString();
}

interface DocumentGridProps {
  documents: DocumentItem[];
  isLoading: boolean;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  currentUserId?: string;
  onView: (doc: DocumentItem) => void;
  onEdit: (doc: DocumentItem) => void;
  onRename: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
}

export default function DocumentGrid({
  documents,
  isLoading,
  openMenuId,
  setOpenMenuId,
  currentUserId,
  onView,
  onEdit,
  onRename,
  onDelete,
}: DocumentGridProps) {
  if (isLoading) {
    return (
      <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-10 text-center text-sm text-[#787774] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#9B9A97]">
        Loading documents...
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#EAEAEA] bg-white p-10 text-center text-sm text-[#787774] dark:border-white/[0.08] dark:bg-[#252525] dark:text-[#9B9A97]">
        No matching documents found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => {
        const Icon = getFileIcon(doc.extension);
        return (
          <div
            key={doc._id}
            role="button"
            tabIndex={0}
            onClick={() => onView(doc)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onView(doc);
              }
            }}
            className="group relative cursor-pointer rounded-[8px] border border-[#EAEAEA] bg-white p-4 transition-colors hover:border-[#2563EB]/25 hover:bg-[#F9F9F8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 dark:border-white/[0.06] dark:bg-[#252525] dark:hover:border-[#3B82F6]/25 dark:hover:bg-[#2A2A2A]"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#EFF6FF] text-[#2563EB] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#3B82F6]">
                <Icon className="h-5 w-5" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === doc._id ? null : doc._id);
                }}
                className="rounded-[4px] p-1.5 text-[#ABABAB] transition-colors hover:bg-[#F7F6F3] hover:text-[#787774] dark:text-[#6B6B6B] dark:hover:bg-white/5 dark:hover:text-[#9B9A97]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {openMenuId === doc._id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-4 top-12 z-20 w-44 overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-white dark:border-white/[0.06] dark:bg-[#252525]"
              >
                <a
                  href={documentService.downloadUrl(doc._id)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-800"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
                {doc.documentType === "online" && currentUserId === doc.uploadedBy && (
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(doc);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(doc);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Rename
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(doc);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}

            <p className="line-clamp-2 min-h-10 text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
              {doc.name}
            </p>
            <p className="mt-1 text-xs text-[#787774] dark:text-[#9B9A97]">
              {doc.extension.toUpperCase()} · {formatSize(doc.size)}
            </p>
            <p className="mt-1 text-xs text-[#ABABAB] dark:text-[#6B6B6B]">
              Date uploaded: {formatDate(doc.updatedAt || doc.createdAt)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
