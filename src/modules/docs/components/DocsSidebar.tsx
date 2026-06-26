"use client";

import { useDocsStore } from "../store/docs.store";
import DocsSearch from "./DocsSearch";
import DocsTree from "./DocsTree";
import RecentDocs from "./RecentDocs";
import { ChevronLeft, ChevronRight, Download, FileText, Layout, Trash2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";
import { toast } from "react-hot-toast";
import { queryKeys } from "@/shared/constants/queryKeys";
import { useUploadedWorkspaceDocsQuery, useWorkspaceDocs } from "../hooks/useWorkspaceDocs";

export default function DocsSidebar({ workspaceId }: { workspaceId: string }) {
  const { selectDocument, selectImportedDocument, selectedDocumentId, selectedImportedDocumentId } = useDocsStore();
  const { documents, createDocument } = useWorkspaceDocs(workspaceId);
  const uploadedDocsQuery = useUploadedWorkspaceDocsQuery(workspaceId);
  const queryClient = useQueryClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<DocumentItem | null>(null);

  const rootDocs = documents.filter((doc) => doc.parentId === null);
  const { searchQuery } = useDocsStore();
  const uploadedDocs = useMemo(() => uploadedDocsQuery.data ?? [], [uploadedDocsQuery.data]);

  const removeImportedDocumentMutation = useMutation({
    mutationFn: (documentId: string) => documentService.detach(documentId, workspaceId),
    onSuccess: (_updatedDocument, documentId) => {
      queryClient.setQueryData<DocumentItem[]>(queryKeys.docs.uploadedByWorkspace(workspaceId), (current = []) =>
        current.filter((doc) => doc._id !== documentId),
      );
      if (selectedImportedDocumentId === documentId) {
        selectImportedDocument(null);
      }
      setRemoveTarget(null);
      toast.success("Removed from workspace");
    },
    onError: () => toast.error("Failed to remove document"),
  });

  const filteredDocs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const workspaceDocs = documents
      .filter((doc) => doc.title.toLowerCase().includes(query))
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        source: "page" as const,
      }));

    const importedDocs = uploadedDocs
      .filter((doc) => doc.name.toLowerCase().includes(query))
      .map((doc) => ({
        id: doc._id,
        title: doc.name,
        source: "import" as const,
      }));

    return [...workspaceDocs, ...importedDocs];
  }, [documents, searchQuery, uploadedDocs]);

  const handleRemoveImportedDocument = async () => {
    if (!removeTarget) return;

    removeImportedDocumentMutation.mutate(removeTarget._id);
  };

  const handleCreate = async () => {
    const newDoc = await createDocument();
    if (newDoc) selectDocument(newDoc.id, [...documents, newDoc]);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 0 : "100%" }}
      className={`relative flex-shrink-0 flex flex-col bg-white dark:bg-[#252525] md:border-r border-[#EAEAEA] dark:border-white/[0.06] h-full overflow-visible group ${isCollapsed ? "" : "md:!w-[260px]"}`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`hidden md:flex absolute -right-3 top-10 z-[80] h-6 w-6 items-center justify-center rounded-full border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-opacity ${
          isCollapsed ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        aria-label={isCollapsed ? "Expand docs sidebar" : "Collapse docs sidebar"}
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-4">
              <button
                onClick={() => selectDocument(null, documents)}
                className={`flex items-center gap-3 px-3 py-2 rounded-[6px] text-[0.8125rem] font-medium transition-all ${
                  !selectedDocumentId && !selectedImportedDocumentId
                    ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
                    : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5"
                }`}
              >
                <Layout className={`w-4 h-4 ${!selectedDocumentId && !selectedImportedDocumentId ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#ABABAB] dark:text-[#6B6B6B]"}`} />
                All Documents
              </button>

              <div className="h-px bg-[#EAEAEA] dark:bg-white/8 mx-1" />

              <DocsSearch />
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-6 custom-scrollbar">
              {searchQuery ? (
                <div className="px-2">
                  <h3 className="px-3 text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-widest mb-3">
                    Search Results
                  </h3>
                  <ul className="space-y-1">
                    {filteredDocs.map(doc => (
                      <li key={doc.id}>
                        <button
                          onClick={() =>
                            doc.source === "import"
                              ? selectImportedDocument(doc.id)
                              : selectDocument(doc.id, documents)
                          }
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[0.8125rem] transition-all ${
                            selectedDocumentId === doc.id || selectedImportedDocumentId === doc.id
                              ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6] font-medium"
                              : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5"
                          }`}
                        >
                          <FileText className={`w-3.5 h-3.5 ${doc.source === "import" ? "text-amber-500" : selectedDocumentId === doc.id ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#ABABAB] dark:text-[#6B6B6B]"}`} />
                          <span className="truncate">{doc.title}</span>
                        </button>
                      </li>
                    ))}
                    {filteredDocs.length === 0 && (
                      <p className="px-3 text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] italic py-2">No results found</p>
                    )}
                  </ul>
                </div>
              ) : (
                <>
                  <RecentDocs workspaceId={workspaceId} />
                  <div className="px-2">
                    <div className="flex items-center justify-between px-3 mb-3">
                      <h3 className="text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-widest">
                        Documents in Workspace
                      </h3>
                      <button 
                        onClick={handleCreate}
                        className="p-1 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                        title="Create new document"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <DocsTree docs={rootDocs} workspaceId={workspaceId} level={0} />
                  </div>
                  <div className="px-2">
                    <div className="flex items-center justify-between px-3 mb-3">
                      <h3 className="text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-widest">
                        Imported Documents
                      </h3>
                    </div>
                    <ul className="space-y-1 px-1">
                      {uploadedDocs.map((doc) => (
                        <li key={doc._id} className="group">
                          <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors">
                            <button
                              onClick={() => selectImportedDocument(doc._id)}
                              className="flex items-center gap-2 min-w-0 flex-1 text-left"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-500" />
                              <span className={`truncate ${selectedImportedDocumentId === doc._id ? "font-semibold text-[#2563EB] dark:text-[#3B82F6]" : ""}`}>
                                {doc.name}
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setRemoveTarget(doc);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-[4px] text-[#ABABAB] hover:text-[#9F2F2D] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] transition-colors"
                              title="Remove from workspace"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={documentService.downloadUrl(doc._id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-[4px] text-[#ABABAB] hover:text-[#2563EB] hover:bg-[#EFF6FF] dark:hover:text-[#3B82F6] dark:hover:bg-[rgba(37,99,235,0.12)] transition-colors"
                              title="Download document"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </li>
                      ))}
                      {uploadedDocs.length === 0 && (
                        <li className="px-3 py-1.5 text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] italic">No imported files</li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {removeTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            if (!removeImportedDocumentMutation.isPending) setRemoveTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-imported-document-title"
            className="w-full max-w-md rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] p-5"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] text-[#9F2F2D] dark:text-[#F87171]">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="remove-imported-document-title" className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  Remove from workspace?
                </h2>
                <p className="mt-1 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                  This will remove{" "}
                  <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
                    {removeTarget.name}
                  </span>{" "}
                  from this workspace only. The document will remain in your library.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={removeImportedDocumentMutation.isPending}
                onClick={() => setRemoveTarget(null)}
                className="rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] px-4 py-2 text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removeImportedDocumentMutation.isPending}
                onClick={handleRemoveImportedDocument}
                className="rounded-[6px] bg-[#9F2F2D] px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-[#8F2927] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removeImportedDocumentMutation.isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
