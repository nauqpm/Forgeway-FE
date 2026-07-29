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

function getFileTheme(extension: string) {
  const ext = (extension || "").toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) {
    return { Icon: FileImage, style: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-100 dark:border-purple-900/30" };
  }
  if ([".xls", ".xlsx", ".csv"].includes(ext)) {
    return { Icon: FileSpreadsheet, style: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" };
  }
  if ([".ppt", ".pptx"].includes(ext)) {
    return { Icon: FileType2, style: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/30" };
  }
  if (ext === ".pdf") {
    return { Icon: FileText, style: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/30" };
  }
  return { Icon: FileText, style: "bg-blue-50 text-[#2563EB] dark:bg-blue-950/40 dark:text-[#3B82F6] border-blue-100 dark:border-blue-900/30" };
}

function formatSize(size: number) {
  if (!size || size <= 0) return "0.0 KB";
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DocumentGridProps {
  documents: DocumentItem[];
  isLoading: boolean;
  viewMode: "grid" | "list";
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
  viewMode,
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[1920px]:grid-cols-5 min-[2560px]:grid-cols-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div
            key={n}
            className="h-44 animate-pulse rounded-[10px] border border-[#EAEAEA] bg-white p-5 dark:border-white/[0.06] dark:bg-[#202020]"
          />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-[#EAEAEA] bg-white p-12 text-center text-sm text-[#787774] dark:border-white/[0.08] dark:bg-[#202020] dark:text-[#9B9A97]">
        <p className="text-base font-semibold text-[#111111] dark:text-[#E8E8E7]">No matching documents</p>
        <p className="mt-1">Try another search keyword or create a new document.</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="rounded-[10px] border border-[#EAEAEA] bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#202020]">
        <div className="hidden rounded-t-[9px] gap-3 grid-cols-[auto_minmax(0,1fr)_9rem_9rem_3rem] border-b border-[#EAEAEA] bg-[#F9F9F8] px-5 py-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[#ABABAB] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#6B6B6B] md:grid">
          <div className="w-9" />
          <span>Name</span>
          <span>Size</span>
          <span>Updated</span>
          <span className="text-center">Actions</span>
        </div>
        <div className="divide-y divide-[#EAEAEA] dark:divide-white/[0.06]">
          {documents.map((doc) => {
            const { Icon, style } = getFileTheme(doc.extension);
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
                className="group relative grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#F7F6F3] focus:outline-none dark:hover:bg-[#252525] md:grid-cols-[auto_minmax(0,1fr)_9rem_9rem_3rem] first:rounded-t-[9px] md:first:rounded-t-none last:rounded-b-[9px]"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-[6px] border ${style}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#111111] group-hover:text-[#2563EB] dark:text-[#E8E8E7] dark:group-hover:text-[#3B82F6]">
                    {doc.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#787774] dark:text-[#9B9A97]">
                    {doc.documentType === "online" ? "Online document" : `${(doc.extension || "").toUpperCase().replace(".", "") || "File"}`}
                  </p>
                </div>
                <span className="hidden text-xs font-medium text-[#787774] dark:text-[#9B9A97] md:block">{formatSize(doc.size)}</span>
                <span className="hidden text-xs text-[#ABABAB] dark:text-[#6B6B6B] md:block">{formatDate(doc.updatedAt || doc.createdAt)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === doc._id ? null : doc._id);
                  }}
                  aria-label={`Open actions for ${doc.name}`}
                  title={`Open actions for ${doc.name}`}
                  className="justify-self-center rounded-[6px] p-1.5 text-[#ABABAB] transition-colors hover:bg-[#EAEAEA] hover:text-[#111111] dark:text-[#6B6B6B] dark:hover:bg-white/10 dark:hover:text-[#E8E8E7]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openMenuId === doc._id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-5 top-12 z-30 w-48 overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-white shadow-lg dark:border-white/[0.08] dark:bg-[#252525]"
                  >
                    <button className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-[#111111] transition hover:bg-[#F7F6F3] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E]" onClick={(e) => { e.stopPropagation(); onView(doc); }}>
                      <FileText className="h-4 w-4 text-[#787774]" /> View
                    </button>
                    <a href={documentService.downloadUrl(doc._id)} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-[#111111] transition hover:bg-[#F7F6F3] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E]">
                      <Download className="h-4 w-4 text-[#787774]" /> Download
                    </a>
                    {doc.documentType === "online" && currentUserId === doc.uploadedBy && (
                      <button className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-[#111111] transition hover:bg-[#F7F6F3] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E]" onClick={(e) => { e.stopPropagation(); onEdit(doc); }}>
                        <Pencil className="h-4 w-4 text-[#787774]" /> Edit online document
                      </button>
                    )}
                    <button className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-[#111111] transition hover:bg-[#F7F6F3] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E]" onClick={(e) => { e.stopPropagation(); onRename(doc); }}>
                      <Pencil className="h-4 w-4 text-[#787774]" /> Rename
                    </button>
                    <button className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-[#9F2F2D] transition hover:bg-[#FDEBEC] dark:text-[#F87171] dark:hover:bg-[rgba(159,47,45,0.15)]" onClick={(e) => { e.stopPropagation(); onDelete(doc); }}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[1920px]:grid-cols-5 min-[2560px]:grid-cols-6">
      {documents.map((doc) => {
        const { Icon, style } = getFileTheme(doc.extension);
        const formattedExt = (doc.extension || "").toUpperCase().replace(".", "") || "DOC";

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
            className="group relative flex min-h-[210px] flex-col justify-between rounded-[10px] border border-[#EAEAEA] bg-white p-[1.125rem] transition-all hover:border-[#2563EB]/40 hover:shadow-md focus:outline-none dark:border-white/[0.08] dark:bg-[#202020] dark:hover:border-[#3B82F6]/40 dark:hover:shadow-black/40 cursor-pointer"
          >
            <div>
              <div className="mb-3.5 flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-[8px] border ${style}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === doc._id ? null : doc._id);
                  }}
                  aria-label={`Open actions for ${doc.name}`}
                  title={`Open actions for ${doc.name}`}
                  className="rounded-[6px] p-1.5 text-[#ABABAB] transition-colors hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#6B6B6B] dark:hover:bg-white/10 dark:hover:text-[#E8E8E7]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {openMenuId === doc._id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-4 top-12 z-30 w-48 overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#252525]"
                >
                  <button
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-[#111111] transition hover:bg-[#F7F6F3] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E]"
                    onClick={() => onView(doc)}
                  >
                    <FileText className="h-4 w-4 text-[#787774]" />
                    View
                  </button>
                  <a
                    href={documentService.downloadUrl(doc._id)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-[#111111] transition hover:bg-[#F7F6F3] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E]"
                  >
                    <Download className="h-4 w-4 text-[#787774]" />
                    Download
                  </a>
                  {doc.documentType === "online" && currentUserId === doc.uploadedBy && (
                    <button
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-[#111111] transition hover:bg-[#F7F6F3] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(doc);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-[#787774]" />
                      Edit online document
                    </button>
                  )}
                  <button
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-[#111111] transition hover:bg-[#F7F6F3] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename(doc);
                    }}
                  >
                    <Pencil className="h-4 w-4 text-[#787774]" />
                    Rename
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-[#9F2F2D] transition hover:bg-[#FDEBEC] dark:text-[#F87171] dark:hover:bg-[rgba(159,47,45,0.15)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(doc);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}

              <h3 className="line-clamp-2 text-sm font-semibold text-[#111111] group-hover:text-[#2563EB] dark:text-[#E8E8E7] dark:group-hover:text-[#3B82F6]">
                {doc.name}
              </h3>
            </div>

            <div className="mt-4 border-t border-[#EAEAEA] pt-3 dark:border-white/[0.06]">
              <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9B9A97]">
                {doc.documentType === "online" ? (
                  <span className="inline-flex items-center rounded-[4px] bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 font-semibold text-blue-600 dark:text-blue-400">
                    Online document
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center rounded-[4px] bg-[#F7F6F3] px-1.5 py-0.5 font-medium text-[#787774] dark:bg-[#252525] dark:text-[#9B9A97]">
                      .{formattedExt}
                    </span>
                    <span>{formatSize(doc.size)}</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
                Uploaded {formatDate(doc.updatedAt || doc.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
