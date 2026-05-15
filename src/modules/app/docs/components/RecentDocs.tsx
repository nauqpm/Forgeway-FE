"use client";

import { Clock, FileText } from "lucide-react";
import { useDocsStore } from "../store/docs.store";

export default function RecentDocs() {
  const { documents, recentDocumentIds, selectDocument, selectedDocumentId } = useDocsStore();
  
  const recentDocs = recentDocumentIds
    .map(id => documents.find(d => d.id === id))
    .filter(Boolean);

  if (recentDocs.length === 0) return null;

  return (
    <div className="mb-6 px-2">
      <h3 className="px-3 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
        Recent
      </h3>
      <ul className="space-y-1">
        {recentDocs.map(doc => (
          doc && (
            <li key={doc.id}>
              <button
                onClick={() => selectDocument(doc.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] transition-all ${
                  selectedDocumentId === doc.id 
                    ? "bg-[#E6EFFC] dark:bg-blue-900/30 text-[#0052CC] dark:text-blue-400 font-medium" 
                    : "text-[#42526E] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${selectedDocumentId === doc.id ? "text-[#0052CC] dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`} />
                <span className="truncate">{doc.title}</span>
              </button>
            </li>
          )
        ))}
      </ul>
    </div>
  );
}
