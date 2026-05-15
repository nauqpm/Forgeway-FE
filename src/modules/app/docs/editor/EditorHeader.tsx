"use client";

import { useDocsStore } from "../store/docs.store";
import { Document } from "../types/docs.type";
import { ChevronRight, CheckCircle2, Loader2, FileText } from "lucide-react";

export default function EditorHeader({ doc }: { doc: Document }) {
  const { documents, isSaving } = useDocsStore();

  // Tạo breadcrumbs đệ quy
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
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shadow-sm shrink-0">
      <div className="flex items-center text-sm text-gray-500 overflow-hidden flex-1 mr-4">
        <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
        {breadcrumbs.map((b, index) => (
          <span key={b.id} className="flex items-center flex-shrink-0">
            {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
            <span className={`truncate max-w-[150px] ${index === breadcrumbs.length - 1 ? "font-semibold text-gray-900" : ""}`}>
              {b.title}
            </span>
          </span>
        ))}
      </div>
      
      <div className="flex items-center text-xs text-gray-500 font-medium">
        {isSaving ? (
          <span className="flex items-center text-gray-400">
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Đang lưu...
          </span>
        ) : (
          <span className="flex items-center text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Đã lưu
          </span>
        )}
      </div>
    </div>
  );
}
