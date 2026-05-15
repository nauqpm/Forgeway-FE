"use client";

import { Clock, FileText } from "lucide-react";
import { useDocsStore } from "../store/docs.store";

export default function RecentDocs() {
  const { documents, selectDocument, selectedDocumentId } = useDocsStore();
  
  // Lấy 3 docs cập nhật gần nhất
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  if (recentDocs.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="px-3 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        <Clock className="w-3.5 h-3.5" /> Gần đây
      </h3>
      <ul className="space-y-0.5">
        {recentDocs.map(doc => (
          <li key={doc.id}>
            <button
              onClick={() => selectDocument(doc.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedDocumentId === doc.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FileText className={`w-4 h-4 flex-shrink-0 ${selectedDocumentId === doc.id ? "text-indigo-600" : "text-gray-400"}`} />
              <span className="truncate font-medium">{doc.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
