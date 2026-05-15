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
    <div className="mb-6">
      <h3 className="px-3 flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
        Recent
      </h3>
      <ul className="space-y-0.5">
        {recentDocs.map(doc => (
          doc && (
            <li key={doc.id}>
              <button
                onClick={() => selectDocument(doc.id)}
                className={`w-full flex items-center gap-2 px-3 py-1 rounded-md text-[13px] transition-colors ${
                  selectedDocumentId === doc.id 
                    ? "bg-[#E6EFFC] text-[#0052CC]" 
                    : "text-[#42526E] hover:bg-gray-200"
                }`}
              >
                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${selectedDocumentId === doc.id ? "text-[#0052CC]" : "text-gray-400"}`} />
                <span className="truncate">{doc.title}</span>
              </button>
            </li>
          )
        ))}
      </ul>
    </div>
  );
}
