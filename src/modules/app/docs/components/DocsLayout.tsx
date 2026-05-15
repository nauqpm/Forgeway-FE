"use client";

import { useEffect, useState } from "react";
import { useDocsStore } from "../store/docs.store";
import DocsSidebar from "./DocsSidebar";
import TiptapEditor from "../editor/TiptapEditor";
import { MOCK_DOCS } from "../mock/docs.mock";
import { BookOpen } from "lucide-react";

export default function DocsLayout({ spaceId }: { spaceId: string }) {
  const { documents, setDocuments, selectedDocumentId, createDocument, selectDocument } = useDocsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Chỉ set MOCK_DOCS vào lần đầu
    if (documents.length === 0) {
      setDocuments(MOCK_DOCS);
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleCreateFirstDoc = () => {
    const doc = createDocument(spaceId);
    selectDocument(doc.id);
  };

  return (
    <div className="flex h-full min-h-[600px] w-full bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <DocsSidebar spaceId={spaceId} />
      
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedDocumentId ? (
          <TiptapEditor />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <BookOpen className="w-16 h-16 text-indigo-100 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tài liệu không gian</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              Chọn một tài liệu ở menu bên trái để bắt đầu đọc và chỉnh sửa, hoặc tạo tài liệu mới.
            </p>
            <button
              onClick={handleCreateFirstDoc}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Tạo trang mới
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
