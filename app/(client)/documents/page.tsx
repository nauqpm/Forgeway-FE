"use client";

import Link from "next/link";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useDocumentsPage } from "@/modules/docs/hooks/useDocumentsPage";
import DocumentToolbar from "@/modules/docs/components/DocumentToolbar";
import DocumentGrid from "@/modules/docs/components/DocumentGrid";
import DocumentModals from "@/modules/docs/components/DocumentModals";

export default function DocumentsLibraryPage() {
  usePageTitle("Documents");
  const { user } = useAuth();
  const page = useDocumentsPage();

  return (
    <div className="space-y-6">
      <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-5 dark:border-white/[0.06] dark:bg-[#252525]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#111111] dark:text-[#E8E8E7]">
              LIBRARY OF DOCUMENTS
            </h1>
            <p className="mt-1 text-sm text-[#787774] dark:text-[#9B9A97]">
              Management your documents, create online documents or upload files to keep all your important information in one place.
            </p>
          </div>
          <Link
            href="/documents/create"
            className="inline-flex cursor-pointer items-center gap-2 rounded-[6px] bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
          >
            Create new document
          </Link>
        </div>
      </div>

      <DocumentToolbar
        query={page.query}
        setQuery={page.setQuery}
        sortBy={page.sortBy}
        setSortBy={page.setSortBy}
      />

      <DocumentGrid
        documents={page.filtered}
        isLoading={page.isLoading}
        openMenuId={page.openMenuId}
        setOpenMenuId={page.setOpenMenuId}
        currentUserId={user?.id}
        onView={page.setViewingDoc}
        onEdit={(doc) => { page.setOpenMenuId(null); page.setEditingDoc(doc); }}
        onRename={(doc) => { page.setOpenMenuId(null); page.openRenameDialog(doc); }}
        onDelete={(doc) => { page.setOpenMenuId(null); page.setDeleteTarget(doc); }}
      />

      <DocumentModals
        editingDoc={page.editingDoc}
        setEditingDoc={page.setEditingDoc}
        viewingDoc={page.viewingDoc}
        setViewingDoc={page.setViewingDoc}
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
