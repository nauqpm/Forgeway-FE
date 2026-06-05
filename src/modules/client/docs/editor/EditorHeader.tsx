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
    <div className="flex flex-col bg-white dark:bg-gray-950 shrink-0">
      {/* Breadcrumbs Row */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center text-[12px] text-gray-500 dark:text-gray-400 overflow-hidden flex-1">
          <Globe className="w-3.5 h-3.5 mr-2 text-gray-400 dark:text-gray-500" />
          <span className="hover:underline cursor-pointer">Workspace</span>
          {breadcrumbs.map((b, index) => (
            <span key={b.id} className="flex items-center shrink-0">
              <ChevronRight className="w-3.5 h-3.5 mx-0.5 text-gray-400 dark:text-gray-600" />
              <span className={`truncate max-w-[150px] ${index === breadcrumbs.length - 1 ? "text-gray-900 dark:text-gray-200 font-medium" : "hover:underline cursor-pointer"}`}>
                {b.title}
              </span>
            </span>
          ))}
        </div>
        
        <div className="flex items-center gap-3 text-[11px] font-medium ml-4">
          {isSaving ? (
            <span className="flex items-center text-gray-400 dark:text-gray-500">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Saving...
            </span>
          ) : hasUnsavedChanges ? (
            <span className="flex items-center text-red-600 dark:text-red-400">
              <XCircle className="w-3 h-3 mr-1" />
              Unsaved
            </span>
          ) : (
            <span className="flex items-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || isSaving || !hasUnsavedChanges}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
          {canCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
