"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useDocsStore } from "../store/docs.store";
import DashboardHeader from "./DashboardHeader";
import DashboardGroup from "./DashboardGroup";
import DashboardEmpty from "./DashboardEmpty";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";
import { Document } from "../types/docs.type";
import { Pencil, Trash2 } from "lucide-react";

export default function DocsDashboard({ workspaceId }: { workspaceId: string }) {
  const {
    documents,
    selectDocument,
    selectImportedDocument,
    createDocument,
    renameDocument,
    deleteDocument,
  } = useDocsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "az">("newest");
  const [uploadedDocs, setUploadedDocs] = useState<DocumentItem[]>([]);
  const [personalDocs, setPersonalDocs] = useState<DocumentItem[]>([]);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
  const [renameTarget, setRenameTarget] = useState<Document | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUploadedDocs = useCallback(async () => {
    try {
      const list = await documentService.getByWorkspace(workspaceId);
      setUploadedDocs(list);
    } catch {
      setUploadedDocs([]);
    }
  }, [workspaceId]);

  const loadPersonalDocs = useCallback(async () => {
    try {
      const list = await documentService.listMine();
      setPersonalDocs(list);
    } catch {
      setPersonalDocs([]);
    }
  }, []);

  useEffect(() => {
    loadUploadedDocs();
    loadPersonalDocs();
  }, [loadPersonalDocs, loadUploadedDocs]);

  const filteredDocs = useMemo(() => {
    const result = documents.filter((doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (sortOrder === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === "newest") {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    }

    return result;
  }, [documents, searchQuery, sortOrder]);

  const filteredUploadedDocs = useMemo(
    () =>
      uploadedDocs
        .filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((doc) => ({
          id: doc._id,
          title: doc.name,
          content: "",
          parentId: null,
          workspaceId,
          slug: doc.filename || doc._id,
          authorId: doc.uploadedBy,
          lastEditedBy: null,
          version: 1,
          status: "draft" as const,
          labels: [],
          versionHistory: [],
          source: "import" as const,
          createdAt: doc.createdAt || doc.updatedAt || new Date(0).toISOString(),
          updatedAt: doc.updatedAt || doc.createdAt || new Date(0).toISOString(),
        })),
    [searchQuery, uploadedDocs, workspaceId],
  );

  const dashboardDocs = useMemo(() => {
    const result = [
      ...filteredDocs.map((doc) => ({ ...doc, source: "docs" as const })),
      ...filteredUploadedDocs,
    ];

    if (sortOrder === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === "newest") {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    }

    return result;
  }, [filteredDocs, filteredUploadedDocs, sortOrder]);

  const groups = useMemo(
    () => (dashboardDocs.length ? [{ name: "Docs", docs: dashboardDocs }] : []),
    [dashboardDocs],
  );

  const handleCreate = async () => {
    const newDoc = await createDocument(workspaceId);
    if (newDoc) selectDocument(newDoc.id);
  };

  const handleRename = (id: string, currentTitle: string) => {
    const target = dashboardDocs.find((doc) => doc.id === id);
    if (!target) return;
    setRenameTarget(target);
    setRenameName(currentTitle);
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

    if (nextName === renameTarget.title) {
      setRenameTarget(null);
      setRenameName("");
      return;
    }

    setRenaming(true);
    try {
      await renameDocument(renameTarget.id, nextName);
      setRenameTarget(null);
      setRenameName("");
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = (doc: Document) => {
    setDeleteTarget(doc);
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteDocument = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    const doc = deleteTarget;

    if (doc.source === "import") {
      try {
        await documentService.detach(doc.id, workspaceId);
        setUploadedDocs((current) => current.filter((item) => item._id !== doc.id));
        selectImportedDocument(null);
        setDeleteTarget(null);
        window.dispatchEvent(new Event("docs_uploads_changed"));
        toast.success("Removed from workspace");
      } catch {
        toast.error("Failed to remove document");
      } finally {
        setDeleting(false);
      }
      return;
    }

    try {
      await deleteDocument(doc.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleSelect = (id: string) => {
    const isUploadedDoc = uploadedDocs.some((doc) => doc._id === id);
    if (isUploadedDoc) {
      selectImportedDocument(id);
      return;
    }
    selectDocument(id);
  };

  const importableLibraryDocs = useMemo(() => {
    const attachedIds = new Set(uploadedDocs.map((doc) => doc._id));
    return personalDocs.filter((doc) => !attachedIds.has(doc._id));
  }, [personalDocs, uploadedDocs]);

  return (
    <div className="flex-1 flex flex-col bg-[#F9FAFB] dark:bg-gray-950 overflow-hidden h-full">
      <DashboardHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onCreatePage={handleCreate}
        onImportFromLibrary={() => {
          setSelectedLibraryIds([]);
          setShowLibraryModal(true);
        }}
      />

      {showLibraryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-3">Import from library</h3>
            <div className="max-h-80 overflow-auto border rounded-lg">
              {importableLibraryDocs.map((doc) => (
                <label key={doc._id} className="flex items-center gap-2 p-2 border-b last:border-b-0">
                  <input
                    type="checkbox"
                    checked={selectedLibraryIds.includes(doc._id)}
                    onChange={(event) =>
                      setSelectedLibraryIds((current) =>
                        event.target.checked
                          ? [...current, doc._id]
                          : current.filter((id) => id !== doc._id),
                      )
                    }
                  />
                  <span className="text-sm">{doc.name}</span>
                </label>
              ))}
              {importableLibraryDocs.length === 0 && (
                <p className="p-3 text-sm text-gray-500">No files available to import.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-2 rounded-lg border"
                onClick={() => setShowLibraryModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                disabled={!selectedLibraryIds.length}
                onClick={async () => {
                  await Promise.all(
                    selectedLibraryIds.map((id) => documentService.attach(id, [workspaceId])),
                  );
                  await loadUploadedDocs();
                  window.dispatchEvent(new Event("docs_uploads_changed"));
                  setShowLibraryModal(false);
                  toast.success("Imported from library");
                }}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {renameTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={closeRenameDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-dashboard-document-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Pencil className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="rename-dashboard-document-title"
                  className="text-base font-semibold text-slate-900 dark:text-slate-100"
                >
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
          onClick={closeDeleteDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dashboard-document-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2
                  id="delete-dashboard-document-title"
                  className="text-base font-semibold text-slate-900 dark:text-slate-100"
                >
                  {deleteTarget.source === "import" ? "Remove from workspace?" : "Delete document?"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {deleteTarget.source === "import" ? (
                    <>
                      This will remove{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {deleteTarget.title}
                      </span>{" "}
                      from this workspace only. The document will remain in your library.
                    </>
                  ) : (
                    <>
                      This will permanently delete{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {deleteTarget.title}
                      </span>
                      . This action cannot be undone.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={closeDeleteDialog}
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
                {deleting
                  ? deleteTarget.source === "import"
                    ? "Removing..."
                    : "Deleting..."
                  : deleteTarget.source === "import"
                    ? "Remove"
                    : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-10 py-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12">
          {groups.map((group, idx) => (
            <DashboardGroup
              key={group.name}
              name={group.name}
              docs={group.docs}
              idx={idx}
              onSelect={handleSelect}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}

          {groups.length === 0 && <DashboardEmpty onClearFilters={() => setSearchQuery("")} />}
        </div>
      </div>
    </div>
  );
}
