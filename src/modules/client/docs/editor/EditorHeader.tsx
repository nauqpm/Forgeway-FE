"use client";

import { useDocsStore } from "../store/docs.store";
import { Document } from "../types/docs.type";
import { ChevronRight, CheckCircle2, Loader2, FileText, Globe } from "lucide-react";
import { useState, useEffect } from "react";

export default function EditorHeader({ doc }: { doc: Document }) {
  const { documents, isSaving, renameDocument } = useDocsStore();
  const [title, setTitle] = useState(doc.title);

  useEffect(() => {
    setTitle(doc.title);
  }, [doc.id, doc.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    renameDocument(doc.id, newTitle);
  };

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
        
        <div className="flex items-center text-[11px] font-medium ml-4">
          {isSaving ? (
            <span className="flex items-center text-gray-400 dark:text-gray-500">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center text-gray-400 dark:text-gray-500">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500 dark:text-emerald-400" />
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
