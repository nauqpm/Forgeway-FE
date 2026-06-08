"use client";

import { useDocsStore } from "../store/docs.store";
import { Document } from "../types/docs.type";
import { ChevronRight, CheckCircle2, Loader2, Globe, Save, XCircle } from "lucide-react";

type Props = {
  doc: Document;
  canSave: boolean;
  canCancel: boolean;
  hasUnsavedChanges: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export default function EditorHeader({ doc, canSave, canCancel, hasUnsavedChanges, onCancel, onSave }: Props) {
  const { documents, isSaving } = useDocsStore();

  const getBreadcrumbs = (currentDoc: Document): Document[] => {
    const breadcrumbs: Document[] = [currentDoc];
    let parentId = currentDoc.parentId;
    while (parentId) {
      const parent = documents.find(d => d.id === parentId);
      if (parent) {
        breadcrumbs.unshift(parent);
        parentId = parent.parentId;
      } else {
        break;
      }
    }
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs(doc);

  return (
    <div className="flex flex-col bg-white dark:bg-[#202020] shrink-0">
      <div className="flex items-center justify-between px-6 py-2 border-b border-[#EAEAEA] dark:border-white/[0.06]">
        <div className="flex items-center text-[0.6875rem] text-[#787774] dark:text-[#9B9A97] overflow-hidden flex-1">
          <Globe className="w-3.5 h-3.5 mr-2 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <span className="hover:underline cursor-pointer">Workspace</span>
          {breadcrumbs.map((b, index) => (
            <span key={b.id} className="flex items-center shrink-0">
              <ChevronRight className="w-3.5 h-3.5 mx-0.5 text-[#ABABAB] dark:text-[#6B6B6B]" />
              <span className={`truncate max-w-[9.375rem] ${index === breadcrumbs.length - 1 ? "text-[#111111] dark:text-[#E8E8E7] font-medium" : "hover:underline cursor-pointer"}`}>
                {b.title}
              </span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[0.6875rem] font-medium ml-4">
          {isSaving ? (
            <span className="flex items-center text-[#ABABAB] dark:text-[#6B6B6B]">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Saving...
            </span>
          ) : hasUnsavedChanges ? (
            <span className="flex items-center text-[#9F2F2D] dark:text-[#F87171]">
              <XCircle className="w-3 h-3 mr-1" />
              Unsaved
            </span>
          ) : (
            <span className="flex items-center text-[#346538] dark:text-[#4ADE80]">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || isSaving || !hasUnsavedChanges}
            className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-3 py-1.5 text-[0.6875rem] font-semibold text-white transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
          {canCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#F5C6C7] dark:border-[rgba(159,47,45,0.2)] px-3 py-1.5 text-[0.6875rem] font-semibold text-[#9F2F2D] dark:text-[#F87171] transition-colors hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
