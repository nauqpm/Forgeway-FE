"use client";

import { FileText } from "lucide-react";
import { useDocsStore } from "../store/docs.store";
import { useWorkspaceDocs } from "../hooks/useWorkspaceDocs";

export default function RecentDocs({ workspaceId }: { workspaceId: string }) {
  const { recentDocumentIds, selectDocument, selectedDocumentId } = useDocsStore();
  const { documents } = useWorkspaceDocs(workspaceId);

  const recentDocs = recentDocumentIds
    .map(id => documents.find(d => d.id === id))
    .filter(Boolean);

  if (recentDocs.length === 0) return null;

  return (
    <div className="mb-6 px-2">
      <h3 className="px-3 flex items-center gap-1.5 text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-widest mb-3">
        Recent
      </h3>
      <ul className="space-y-1">
        {recentDocs.map(doc => (
          doc && (
            <li key={doc.id}>
              <button
                onClick={() => selectDocument(doc.id, documents)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[0.8125rem] transition-all ${
                  selectedDocumentId === doc.id
                    ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6] font-medium"
                    : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5"
                }`}
              >
                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${selectedDocumentId === doc.id ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#ABABAB] dark:text-[#6B6B6B]"}`} />
                <span className="truncate">{doc.title}</span>
              </button>
            </li>
          )
        ))}
      </ul>
    </div>
  );
}
