"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useDocumentsPage } from "@/modules/docs/hooks/useDocumentsPage";
import DocumentToolbar from "@/modules/docs/components/DocumentToolbar";
import DocumentGrid from "@/modules/docs/components/DocumentGrid";
import DocumentModals from "@/modules/docs/components/DocumentModals";
import { buildDocumentHref, DOCUMENTS_LIBRARY_HREF } from "@/modules/docs/utils/documentRoutes";

type DocumentsLibraryContentProps = {
  documentId?: string;
  documentMode?: "view" | "edit";
};

export default function DocumentsLibraryContent({ documentId, documentMode }: DocumentsLibraryContentProps) {
  usePageTitle("Documents");
  const router = useRouter();
  const { user } = useAuth();
  const page = useDocumentsPage();
  const {
    documents,
    filtered,
    isLoading,
    query,
    setQuery,
    sortBy,
    setSortBy,
    openMenuId,
    setOpenMenuId,
    editingDoc,
    setEditingDoc,
    viewingDoc,
    setViewingDoc,
    deleteTarget,
    setDeleteTarget,
    renameTarget,
    renameName,
    setRenameName,
    linkingDoc,
    setLinkingDoc,
    deleting,
    renaming,
    handleDelete,
    handleRename,
    refetch,
    closeRenameDialog,
    openRenameDialog,
  } = page;
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const routeDocument = useMemo(
    () => documents.find((doc) => doc._id === documentId) ?? null,
    [documentId, documents],
  );

  useEffect(() => {
    if (!documentId || isLoading) return;

    setOpenMenuId(null);
    if (documentMode === "edit") {
      setViewingDoc(null);
      setEditingDoc(routeDocument);
      return;
    }

    setEditingDoc(null);
    setViewingDoc(routeDocument);
  }, [
    documentId,
    documentMode,
    isLoading,
    routeDocument,
    setOpenMenuId,
    setViewingDoc,
    setEditingDoc,
  ]);

  const closeDocumentRoute = () => {
    setEditingDoc(null);
    setViewingDoc(null);
    router.push(DOCUMENTS_LIBRARY_HREF);
  };

  const openDocumentRoute = (doc: { _id: string }) => {
    setOpenMenuId(null);
    router.push(buildDocumentHref(doc._id));
  };

  const openDocumentEditRoute = (doc: { _id: string }) => {
    setOpenMenuId(null);
    router.push(buildDocumentHref(doc._id, "edit"));
  };

  return (
    <div className="flex-1 overflow-y-auto p-[var(--app-page-pad)]">
      <div className="w-full max-w-full pb-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">
              Document Library
            </h1>
            <p className="text-sm text-[#787774] dark:text-[#9B9A97]">
              Create, upload, preview, and organize files you own.
            </p>
          </div>
          <Link
            href="/documents/create"
            className="inline-flex cursor-pointer items-center gap-2 rounded-[6px] bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
          >
            Create document
          </Link>
        </div>

        <DocumentToolbar
          query={query}
          setQuery={setQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        <DocumentGrid
          documents={filtered}
          isLoading={isLoading}
          viewMode={viewMode}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          currentUserId={user?.id}
          onView={openDocumentRoute}
          onEdit={openDocumentEditRoute}
          onRename={(doc) => { setOpenMenuId(null); openRenameDialog(doc); }}
          onDelete={(doc) => { setOpenMenuId(null); setDeleteTarget(doc); }}
        />
      </div>

      <DocumentModals
        editingDoc={editingDoc}
        setEditingDoc={(doc) => (doc ? openDocumentEditRoute(doc) : closeDocumentRoute())}
        viewingDoc={viewingDoc}
        setViewingDoc={(doc) => (doc ? openDocumentRoute(doc) : closeDocumentRoute())}
        onEditViewingDoc={() => {
          if (viewingDoc) openDocumentEditRoute(viewingDoc);
        }}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        renameTarget={renameTarget}
        renameName={renameName}
        setRenameName={setRenameName}
        linkingDoc={linkingDoc}
        setLinkingDoc={setLinkingDoc}
        deleting={deleting}
        renaming={renaming}
        onDelete={handleDelete}
        onRename={handleRename}
        onSaved={refetch}
        closeRenameDialog={closeRenameDialog}
      />
    </div>
  );
}
