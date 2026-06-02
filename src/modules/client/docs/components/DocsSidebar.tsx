"use client";

import { useDocsStore } from "../store/docs.store";
import DocsSearch from "./DocsSearch";
import DocsTree from "./DocsTree";
import RecentDocs from "./RecentDocs";
import { Plus, ChevronLeft, ChevronRight, FileText, Layout, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";
import { toast } from "react-hot-toast";

export default function DocsSidebar({ workspaceId }: { workspaceId: string }) {
  const { documents, createDocument, selectDocument, selectImportedDocument, selectedDocumentId, selectedImportedDocumentId } = useDocsStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<DocumentItem[]>([]);
  
  const handleCreateRoot = async () => {
    const newDoc = await createDocument(workspaceId, null);
    if (newDoc) selectDocument(newDoc.id);
  };

  const rootDocs = documents.filter((doc) => doc.parentId === null);
  const { searchQuery } = useDocsStore();

  useEffect(() => {
    const load = async () => {
      try {
        const list = await documentService.getByWorkspace(workspaceId);
        setUploadedDocs(list);
      } catch {
        setUploadedDocs([]);
      }
    };
    load();
    const onChanged = () => load();
    window.addEventListener("docs_uploads_changed", onChanged);
    return () => window.removeEventListener("docs_uploads_changed", onChanged);
  }, [workspaceId]);
  
  const filteredDocs = searchQuery 
    ? documents.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 0 : 260 }}
      className="relative flex-shrink-0 flex flex-col bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 h-full overflow-visible group"
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#0052CC] shadow-sm"
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-4">
              <button
                onClick={() => selectDocument(null)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  !selectedDocumentId 
                    ? "bg-[#E6EFFC] dark:bg-blue-900/30 text-[#0052CC] dark:text-blue-400" 
                    : "text-[#42526E] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <Layout className={`w-4 h-4 ${!selectedDocumentId ? "text-[#0052CC] dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`} />
                Tất cả tài liệu
              </button>

              <div className="h-px bg-gray-100 dark:bg-gray-800 mx-1" />
              
              <DocsSearch />
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-6 custom-scrollbar">
              {searchQuery ? (
                <div className="px-2">
                  <h3 className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                    Kết quả tìm kiếm
                  </h3>
                  <ul className="space-y-1">
                    {filteredDocs.map(doc => (
                      <li key={doc.id}>
                        <button
                          onClick={() => selectDocument(doc.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] transition-all ${
                            selectedDocumentId === doc.id 
                              ? "bg-[#E6EFFC] dark:bg-blue-900/30 text-[#0052CC] dark:text-blue-400 font-medium" 
                              : "text-[#42526E] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                          }`}
                        >
                          <FileText className={`w-3.5 h-3.5 ${selectedDocumentId === doc.id ? "text-[#0052CC] dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`} />
                          <span className="truncate">{doc.title}</span>
                        </button>
                      </li>
                    ))}
                    {filteredDocs.length === 0 && (
                      <p className="px-3 text-xs text-gray-400 dark:text-gray-500 italic py-2">Không tìm thấy kết quả</p>
                    )}
                  </ul>
                </div>
              ) : (
                <>
                  <RecentDocs />
                  <div className="px-2">
                    <div className="flex items-center justify-between px-3 mb-3">
                      <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Tài liệu của workspace 
                      </h3>
                      <button 
                        onClick={handleCreateRoot}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded text-gray-400 dark:text-gray-500 hover:text-[#0052CC] dark:hover:text-blue-400 transition-colors"
                        title="New root page"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <DocsTree docs={rootDocs} workspaceId={workspaceId} level={0} />
                  </div>
                  <div className="px-2">
                    <div className="flex items-center justify-between px-3 mb-3">
                      <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Tài liệu được nhập 
                      </h3>
                    </div>
                    <ul className="space-y-1 px-1">
                      {uploadedDocs.map((doc) => (
                        <li key={doc._id} className="group">
                          <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] text-[#42526E] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900">
                            <button
                              onClick={() => selectImportedDocument(doc._id)}
                              className="flex items-center gap-2 min-w-0 flex-1 text-left"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-500" />
                              <span className={`truncate ${selectedImportedDocumentId === doc._id ? "font-semibold text-[#0052CC] dark:text-blue-400" : ""}`}>
                                {doc.name}
                              </span>
                            </button>
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                if (!window.confirm("Gỡ tài liệu này khỏi workspace?")) return;
                                try {
                                  await documentService.detach(doc._id, workspaceId);
                                  setUploadedDocs((curr) => curr.filter((d) => d._id !== doc._id));
                                  window.dispatchEvent(new Event("docs_uploads_changed"));
                                  toast.success("Đã gỡ khỏi workspace");
                                } catch {
                                  toast.error("Không thể gỡ tài liệu");
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                              title="Gỡ khỏi workspace"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                      {uploadedDocs.length === 0 && (
                        <li className="px-3 py-1.5 text-xs text-gray-400 italic">Không có tệp được nhập</li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
