"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { documentService } from "@/modules/client/docs/services/documentService";
import { DocumentItem } from "@/modules/client/docs/types/document.type";
import ImportedDocumentViewer from "@/modules/client/docs/components/ImportedDocumentViewer";
import OnlineDocumentEditorModal from "@/modules/client/docs/components/OnlineDocumentEditorModal";

export default function DocumentsLibraryPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "size">("newest");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await documentService.listMine();
      setDocuments(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const filtered = useMemo(() => {
    const searched = documents.filter((d) =>
      d.name.toLowerCase().includes(query.toLowerCase().trim()),
    );

    const sorted = [...searched];
    if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "size") {
      sorted.sort((a, b) => b.size - a.size);
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime(),
      );
    }
    return sorted;
  }, [documents, query, sortBy]);

  const formatSize = (size: number) => {
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (value?: string) => {
    if (!value) return "--";
    return new Date(value).toLocaleDateString();
  };

  const getFileIcon = (extension: string) => {
    const ext = extension.toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return FileImage;
    if ([".xls", ".xlsx"].includes(ext)) return FileSpreadsheet;
    if ([".ppt", ".pptx"].includes(ext)) return FileType2;
    return FileText;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              THƯ VIỆN TÀI LIỆU CỦA TÔI
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Quản lý toàn bộ tài liệu cá nhân theo bố cục dạng lưới.
            </p>
          </div>
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            <Upload className="h-4 w-4" />
            Thêm tài liệu mới 
            <input
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await documentService.upload(file);
                  await load();
                  toast.success("Tải lên thành công");
                } catch {
                  toast.error("Tải lên thất bại");
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
          <Link
            href="/documents/create"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Tạo tài liệu mới
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tài liệu..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "name" | "size")}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="newest">Mới cập nhật</option>
            <option value="name">Tên từ A-Z</option>
            <option value="size">Dung lượng lớn</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-gray-800 dark:bg-gray-900">
          Đang tải tài liệu...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-gray-700 dark:bg-gray-900">
          Không có tài liệu phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((doc) => {
            const Icon = getFileIcon(doc.extension);
            return (
              <div
                key={doc._id}
                role="button"
                tabIndex={0}
                onClick={() => setViewingDoc(doc)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setViewingDoc(doc);
                  }
                }}
                className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((curr) => (curr === doc._id ? null : doc._id));
                    }}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-gray-800"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
                {openMenuId === doc._id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-4 top-12 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
                  >
                    <a
                      href={documentService.downloadUrl(doc._id)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-800"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Tải về máy 
                    </a>
                    {doc.documentType === "online" && user?.id === doc.uploadedBy && (
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          setEditingDoc(doc);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Chỉnh sửa
                      </button>
                    )}
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-800"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const nextName = window.prompt("Tên mới", doc.name)?.trim();
                        if (!nextName) return;
                        await documentService.rename(doc._id, nextName);
                        setOpenMenuId(null);
                        await load();
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Đổi tên
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm("Bạn chắc chắn muốn xóa tài liệu này? Hành động không thể hoàn tác.")) return;
                        await documentService.delete(doc._id);
                        setOpenMenuId(null);
                        setViewingDoc((current) => (current?._id === doc._id ? null : current));
                        await load();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa
                    </button>
                  </div>
                )}

                <p className="line-clamp-2 min-h-[40px] text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {doc.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {doc.extension.toUpperCase()} · {formatSize(doc.size)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Ngày tải lên: {formatDate(doc.updatedAt || doc.createdAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}
      {editingDoc && (
        <OnlineDocumentEditorModal
          doc={editingDoc}
          open={Boolean(editingDoc)}
          onClose={() => setEditingDoc(null)}
          onSaved={async () => {
            await load();
          }}
        />
      )}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-gray-800">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {viewingDoc.name}
                </p>
                <p className="text-xs text-slate-500">
                  {viewingDoc.extension.toUpperCase()} · {formatSize(viewingDoc.size)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={documentService.downloadUrl(viewingDoc._id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-gray-800"
                  aria-label="Tải xuống"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-gray-800"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <ImportedDocumentViewer doc={viewingDoc} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
