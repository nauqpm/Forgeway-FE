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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const routeDocument = useMemo(
    () => page.documents.find((doc) => doc._id === documentId) ?? null,
    [documentId, page.documents],
  );

  useEffect(() => {
    if (!documentId || page.isLoading) return;

    page.setOpenMenuId(null);
    if (documentMode === "edit") {
      page.setViewingDoc(null);
      page.setEditingDoc(routeDocument);
      return;
    }

    page.setEditingDoc(null);
    page.setViewingDoc(routeDocument);
  }, [
    documentId,
    documentMode,
    page.isLoading,
    routeDocument,
    page.setOpenMenuId,
    page.setViewingDoc,
    page.setEditingDoc,
  ]);

  const closeDocumentRoute = () => {
    page.setEditingDoc(null);
    page.setViewingDoc(null);
    router.push(DOCUMENTS_LIBRARY_HREF);
  };

  const openDocumentRoute = (doc: { _id: string }) => {
    page.setOpenMenuId(null);
    router.push(buildDocumentHref(doc._id));
  };

  const openDocumentEditRoute = (doc: { _id: string }) => {
    page.setOpenMenuId(null);
    router.push(buildDocumentHref(doc._id, "edit"));
  };

  return (
    <div className="flex-1 overflow-y-auto p-[var(--app-page-pad)]">
      <div className="app-page-wide">
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
          query={page.query}
          setQuery={page.setQuery}
          sortBy={page.sortBy}
          setSortBy={page.setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        <DocumentGrid
          documents={page.filtered}
          isLoading={page.isLoading}
          viewMode={viewMode}
          openMenuId={page.openMenuId}
          setOpenMenuId={page.setOpenMenuId}
          currentUserId={user?.id}
          onView={openDocumentRoute}
          onEdit={openDocumentEditRoute}
          onRename={(doc) => { page.setOpenMenuId(null); page.openRenameDialog(doc); }}
          onDelete={(doc) => { page.setOpenMenuId(null); page.setDeleteTarget(doc); }}
        />
      </div>

      <DocumentModals
        editingDoc={page.editingDoc}
        setEditingDoc={(doc) => (doc ? openDocumentEditRoute(doc) : closeDocumentRoute())}
        viewingDoc={page.viewingDoc}
        setViewingDoc={(doc) => (doc ? openDocumentRoute(doc) : closeDocumentRoute())}
        onEditViewingDoc={() => {
          if (page.viewingDoc) openDocumentEditRoute(page.viewingDoc);
        }}
        deleteTarget={page.deleteTarget}
        setDeleteTarget={page.setDeleteTarget}
        renameTarget={page.renameTarget}
        renameName={page.renameName}
        setRenameName={page.setRenameName}
        linkingDoc={page.linkingDoc}
        setLinkingDoc={page.setLinkingDoc}
        deleting={page.deleting}
        renaming={page.renaming}
        onDelete={page.handleDelete}
        onRename={page.handleRename}
        onSaved={page.refetch}
        closeRenameDialog={page.closeRenameDialog}
      />
    </div>
  );
}
