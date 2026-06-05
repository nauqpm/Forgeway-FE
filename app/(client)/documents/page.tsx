"use client";

import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
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
  X,
} from "lucide-react";
import { documentService } from "@/modules/client/docs/services/documentService";
import { DocumentItem } from "@/modules/client/docs/types/document.type";
import ImportedDocumentViewer from "@/modules/client/docs/components/ImportedDocumentViewer";
import OnlineDocumentEditorModal from "@/modules/client/docs/components/OnlineDocumentEditorModal";
import DocumentWorkspaceLinkModal from "@/modules/client/docs/components/DocumentWorkspaceLinkModal";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return res?.data?.message || res?.data?.error || fallback;
  }
  return fallback;
};

export default function DocumentsLibraryPage() {
  usePageTitle("Documents");
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "size">("newest");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DocumentItem | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [linkingDoc, setLinkingDoc] = useState<DocumentItem | null>(null);

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

  const handleDeleteDocument = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await documentService.delete(deleteTarget._id);
      setViewingDoc((current) => (current?._id === deleteTarget._id ? null : current));
      setDeleteTarget(null);
      toast.success("Document deleted");
      await load();
    } catch {
      toast.error("Delete document failed");
    } finally {
      setDeleting(false);
    }
  };

  const openRenameDialog = (doc: DocumentItem) => {
    setRenameTarget(doc);
    setRenameName(doc.name);
  };

  const closeRenameDialog = () => {
    if (renaming) return;
    setRenameTarget(null);
    setRenameName("");
  };

  const handleRenameDocument = async () => {
    if (!renameTarget) return;

    const nextName = renameName.trim();
    if (!nextName) {
      toast.error("Document name is required");
      return;
    }

    if (nextName === renameTarget.name) {
      setRenameTarget(null);
      setRenameName("");
      return;
    }

    setRenaming(true);
    try {
      await documentService.rename(renameTarget._id, nextName);
      setViewingDoc((current) =>
        current?._id === renameTarget._id ? { ...current, name: nextName } : current,
      );
      setRenameTarget(null);
      setRenameName("");
      toast.success("Document renamed");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Rename document failed"));
    } finally {
      setRenaming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              LIBRARY OF DOCUMENTS
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Management your documents, create online documents or upload files to keep all your important information in one place.
            </p>
          </div>
          {/*
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            <Upload className="h-4 w-4" />
            Add new document
            <input
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await documentService.upload(file);
                  await load();
                  toast.success("Document uploaded successfully");
                } catch {
                  toast.error("Failed to upload document");
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
          */}
          <Link
            href="/documents/create"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Create new document
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
              placeholder="Search documents..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "newest" | "name" | "size")
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="newest">Newest</option>
            <option value="name">Name (A-Z)</option>
            <option value="size">Size (Largest)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-gray-800 dark:bg-gray-900">
          Loading documents...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-gray-700 dark:bg-gray-900">
          No matching documents found.
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
                      setOpenMenuId((curr) =>
                        curr === doc._id ? null : doc._id,
                      );
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
                      Download
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
                        Edit 
                      </button>
                    )}
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        openRenameDialog(doc);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Rename 
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        setDeleteTarget(doc);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
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
                  Date uploaded: {formatDate(doc.updatedAt || doc.createdAt)}
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
      {renameTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={closeRenameDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-document-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Pencil className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="rename-document-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Rename document
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Enter a new name for this document.
                </p>
              </div>
            </div>

            <input
              autoFocus
              value={renameName}
              disabled={renaming}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRenameDocument();
                }
                if (e.key === "Escape") {
                  closeRenameDialog();
                }
              }}
              className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-100 dark:focus:bg-gray-900"
              placeholder="Document name"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={renaming}
                onClick={closeRenameDialog}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-slate-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={renaming}
                onClick={handleRenameDocument}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {renaming ? "Renaming..." : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-document-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="delete-document-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Delete document?
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  This will permanently delete{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {deleteTarget.name}
                  </span>
                  . This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-slate-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteDocument}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
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
                  {viewingDoc.extension.toUpperCase()} ·{" "}
                  {formatSize(viewingDoc.size)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={documentService.downloadUrl(viewingDoc._id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-gray-800"
                  aria-label="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-gray-800"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <ImportedDocumentViewer doc={viewingDoc} showBackButton={false} />
            </div>
          </div>
        </div>
      )}
      {linkingDoc && (
        <DocumentWorkspaceLinkModal
          doc={linkingDoc}
          open={Boolean(linkingDoc)}
          onClose={() => setLinkingDoc(null)}
          onSaved={async () => {
            await load();
          }}
        />
      )}
    </div>
  );
}
