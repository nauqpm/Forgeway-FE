"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { queryKeys } from "@/shared/constants/queryKeys";
import { useDocsStore } from "../store/docs.store";
import DashboardHeader from "./DashboardHeader";
import DashboardGroup from "./DashboardGroup";
import DashboardEmpty from "./DashboardEmpty";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";
import { Document } from "../types/docs.type";
import { Pencil, Trash2 } from "lucide-react";
import { useUploadedWorkspaceDocsQuery, useWorkspaceDocs } from "../hooks/useWorkspaceDocs";

export default function DocsDashboard({ workspaceId }: { workspaceId: string }) {
  const {
    selectDocument,
    selectImportedDocument,
  } = useDocsStore();
  const { documents, createDocument, renameDocument, deleteDocument } = useWorkspaceDocs(workspaceId);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "az">("newest");
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
  const [renameTarget, setRenameTarget] = useState<Document | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const uploadedDocsQuery = useUploadedWorkspaceDocsQuery(workspaceId);

  const personalDocsQuery = useQuery({
    queryKey: queryKeys.docs.library(),
    queryFn: documentService.listMine,
  });

  const uploadedDocs = useMemo(() => uploadedDocsQuery.data ?? [], [uploadedDocsQuery.data]);
  const personalDocs = useMemo(() => personalDocsQuery.data ?? [], [personalDocsQuery.data]);

  const attachDocumentsMutation = useMutation({
    mutationFn: (documentIds: string[]) =>
      Promise.all(documentIds.map((id) => documentService.attach(id, [workspaceId]))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.docs.uploadedByWorkspace(workspaceId) });
      setShowLibraryModal(false);
      toast.success("Imported from library");
    },
    onError: () => toast.error("Failed to import from library"),
  });

  const detachDocumentMutation = useMutation({
    mutationFn: (documentId: string) => documentService.detach(documentId, workspaceId),
    onSuccess: (_updatedDocument, documentId) => {
      queryClient.setQueryData<DocumentItem[]>(queryKeys.docs.uploadedByWorkspace(workspaceId), (current = []) =>
        current.filter((item) => item._id !== documentId),
      );
      selectImportedDocument(null);
      setDeleteTarget(null);
      toast.success("Removed from workspace");
    },
    onError: () => toast.error("Failed to remove document"),
  });

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
    const newDoc = await createDocument();
    if (newDoc) selectDocument(newDoc.id, [...documents, newDoc]);
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
      detachDocumentMutation.mutate(doc.id);
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
    selectDocument(id, documents);
  };

  const importableLibraryDocs = useMemo(() => {
    const attachedIds = new Set(uploadedDocs.map((doc) => doc._id));
    return personalDocs.filter((doc) => !attachedIds.has(doc._id));
  }, [personalDocs, uploadedDocs]);

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] dark:bg-[#202020] overflow-hidden h-full">
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
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] p-5"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7] mb-4">Import from library</h3>
            <div className="max-h-80 overflow-auto rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06]">
              {importableLibraryDocs.map((doc) => (
                <label key={doc._id} className="flex items-center gap-2 p-2.5 border-b border-[#EAEAEA] dark:border-white/[0.06] last:border-b-0 hover:bg-[#F7F6F3] dark:hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-[#2563EB]"
                    checked={selectedLibraryIds.includes(doc._id)}
                    onChange={(event) =>
                      setSelectedLibraryIds((current) =>
                        event.target.checked
                          ? [...current, doc._id]
                          : current.filter((id) => id !== doc._id),
                      )
                    }
                  />
                  <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">{doc.name}</span>
                </label>
              ))}
              {importableLibraryDocs.length === 0 && (
                <p className="p-3 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">No files available to import.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-2 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
                onClick={() => setShowLibraryModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] text-[0.8125rem] font-medium text-white hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={!selectedLibraryIds.length || attachDocumentsMutation.isPending}
                onClick={() => attachDocumentsMutation.mutate(selectedLibraryIds)}
              >
                {attachDocumentsMutation.isPending ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {renameTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={closeRenameDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-dashboard-document-title"
            className="w-full max-w-md rounded-[10px] border border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020] p-5"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]">
                <Pencil className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="rename-dashboard-document-title" className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  Rename document
                </h2>
                <p className="mt-0.5 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Enter a new name for this document.</p>
              </div>
            </div>
            <input
              autoFocus
              value={renameName}
              disabled={renaming}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleRenameDocument(); }
                if (e.key === "Escape") closeRenameDialog();
              }}
              className="w-full rounded-[6px] border border-[#EAEAEA] dark:border-white/8 bg-[#F7F6F3] dark:bg-[#252525] px-3 py-2 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] outline-none transition focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:bg-white dark:focus:bg-[#252525] disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B]"
              placeholder="Document name"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" disabled={renaming} onClick={closeRenameDialog}
                className="rounded-[6px] border border-[#EAEAEA] dark:border-white/8 px-4 py-2 text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] transition hover:bg-[#F7F6F3] dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60">
                Cancel
              </button>
              <button type="button" disabled={renaming} onClick={handleRenameDocument}
                className="rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-4 py-2 text-[0.8125rem] font-semibold text-white transition hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60">
                {renaming ? "Renaming..." : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={closeDeleteDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dashboard-document-title"
            className="w-full max-w-md rounded-[10px] border border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020] p-5"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] text-[#9F2F2D] dark:text-[#F87171]">
                <Trash2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 id="delete-dashboard-document-title" className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  {deleteTarget.source === "import" ? "Remove from workspace?" : "Delete document?"}
                </h2>
                <p className="mt-0.5 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                  {deleteTarget.source === "import" ? (
                    <>This will remove <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">{deleteTarget.title}</span> from this workspace only. The document will remain in your library.</>
                  ) : (
                    <>This will permanently delete <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">{deleteTarget.title}</span>. This action cannot be undone.</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" disabled={deleting} onClick={closeDeleteDialog}
                className="rounded-[6px] border border-[#EAEAEA] dark:border-white/8 px-4 py-2 text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] transition hover:bg-[#F7F6F3] dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60">
                Cancel
              </button>
              <button type="button" disabled={deleting || detachDocumentMutation.isPending} onClick={handleDeleteDocument}
                className="rounded-[6px] bg-[#9F2F2D] px-4 py-2 text-[0.8125rem] font-semibold text-white transition hover:bg-[#7F2422] disabled:cursor-not-allowed disabled:opacity-60">
                {deleting || detachDocumentMutation.isPending ? (deleteTarget.source === "import" ? "Removing..." : "Deleting...") : (deleteTarget.source === "import" ? "Remove" : "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
        <div className="space-y-6">
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
