"use client";

import { useDocsStore } from "../store/docs.store";
import DocsSearch from "./DocsSearch";
import DocsTree from "./DocsTree";
import RecentDocs from "./RecentDocs";
import { Plus } from "lucide-react";

export default function DocsSidebar({ spaceId }: { spaceId: string }) {
  const { documents, createDocument, selectDocument } = useDocsStore();
  
  const handleCreateRoot = () => {
    const newDoc = createDocument(spaceId, null);
    selectDocument(newDoc.id);
  };

  const rootDocs = documents.filter((doc) => doc.parentId === null);

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-gray-50 border-r border-gray-200">
      <div className="p-4 flex flex-col gap-4">
        <DocsSearch />
        
        <button 
          onClick={handleCreateRoot}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full"
        >
          <Plus className="w-4 h-4" />
          Tạo trang mới
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-6">
        <RecentDocs />
        
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Tài liệu không gian
          </h3>
          <DocsTree docs={rootDocs} spaceId={spaceId} level={0} />
          {rootDocs.length === 0 && (
            <p className="px-3 text-sm text-gray-400 italic">Chưa có tài liệu nào.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
