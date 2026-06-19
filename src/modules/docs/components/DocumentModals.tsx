import { Pencil, Trash2, X } from "lucide-react";
import { DocumentItem } from "../types/document.type";
import ImportedDocumentViewer from "./ImportedDocumentViewer";
import OnlineDocumentEditorModal from "./OnlineDocumentEditorModal";
import DocumentWorkspaceLinkModal from "./DocumentWorkspaceLinkModal";

function formatSize(size: number) {
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

interface DocumentModalsProps {
  editingDoc: DocumentItem | null;
  setEditingDoc: (doc: DocumentItem | null) => void;
  viewingDoc: DocumentItem | null;
  setViewingDoc: (doc: DocumentItem | null) => void;
  deleteTarget: DocumentItem | null;
  setDeleteTarget: (doc: DocumentItem | null) => void;
  renameTarget: DocumentItem | null;
  renameName: string;
  setRenameName: (name: string) => void;
  linkingDoc: DocumentItem | null;
  setLinkingDoc: (doc: DocumentItem | null) => void;
  deleting: boolean;
  renaming: boolean;
  onDelete: (doc: DocumentItem) => void;
  onRename: (doc: DocumentItem, name: string) => Promise<boolean>;
  onSaved: () => void;
  closeRenameDialog: (isRenaming: boolean) => void;
}

export default function DocumentModals({
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
  onDelete,
  onRename,
  onSaved,
  closeRenameDialog,
}: DocumentModalsProps) {
  return (
    <>
      {editingDoc && (
        <OnlineDocumentEditorModal
          doc={editingDoc}
          open={Boolean(editingDoc)}
          onClose={() => setEditingDoc(null)}
          onSaved={onSaved}
        />
      )}

      {renameTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => closeRenameDialog(renaming)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-document-title"
            className="w-full max-w-md rounded-[8px] border border-[#EAEAEA] bg-white p-5 dark:border-white/[0.06] dark:bg-[#252525]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#3B82F6]">
                <Pencil className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="rename-document-title" className="text-base font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  Rename document
                </h2>
                <p className="mt-1 text-sm text-[#787774] dark:text-[#9B9A97]">
                  Enter a new name for this document.
                </p>
              </div>
            </div>
            <input
              autoFocus
              value={renameName}
              disabled={renaming}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const ok = await onRename(renameTarget, renameName);
                  if (ok) closeRenameDialog(false);
                }
                if (e.key === "Escape") closeRenameDialog(renaming);
              }}
              className="mt-5 w-full rounded-[6px] border border-[#EAEAEA] bg-[#F9F9F8] px-3 py-2.5 text-sm text-[#111111] outline-none transition-colors focus:border-[#2563EB] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.06] dark:bg-[#2A2A2A] dark:text-[#E8E8E7] dark:focus:border-[#3B82F6]"
              placeholder="Document name"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={renaming}
                onClick={() => closeRenameDialog(renaming)}
                className="rounded-[6px] border border-[#EAEAEA] px-4 py-2 text-sm font-semibold text-[#787774] transition-colors hover:bg-[#F7F6F3] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.06] dark:text-[#9B9A97] dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={renaming}
                onClick={async () => {
                  const ok = await onRename(renameTarget, renameName);
                  if (ok) closeRenameDialog(false);
                }}
                className="rounded-[6px] bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
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
          onClick={() => { if (!deleting) setDeleteTarget(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-document-title"
            className="w-full max-w-md rounded-[8px] border border-[#EAEAEA] bg-white p-5 dark:border-white/[0.06] dark:bg-[#252525]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="delete-document-title" className="text-base font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  Delete document?
                </h2>
                <p className="mt-1 text-sm text-[#787774] dark:text-[#9B9A97]">
                  This will permanently delete{" "}
                  <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
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
                className="rounded-[6px] border border-[#EAEAEA] px-4 py-2 text-sm font-semibold text-[#787774] transition-colors hover:bg-[#F7F6F3] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.06] dark:text-[#9B9A97] dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => onDelete(deleteTarget)}
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
            className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[8px] bg-white dark:bg-[#252525]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#EAEAEA] px-4 py-3 dark:border-white/[0.06]">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  {viewingDoc.name}
                </p>
                <p className="text-xs text-slate-500">
                  {viewingDoc.extension.toUpperCase()} · {formatSize(viewingDoc.size)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
          onSaved={onSaved}
        />
      )}
    </>
  );
}
