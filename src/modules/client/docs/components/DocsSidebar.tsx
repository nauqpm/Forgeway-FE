"use client";

import { useDocsStore } from "../store/docs.store";
import DocsSearch from "./DocsSearch";
import DocsTree from "./DocsTree";
import RecentDocs from "./RecentDocs";
import { ChevronLeft, ChevronRight, Download, FileText, Layout, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";
import { toast } from "react-hot-toast";

export default function DocsSidebar({ workspaceId }: { workspaceId: string }) {
  const { documents, createDocument, selectDocument, selectImportedDocument, selectedDocumentId, selectedImportedDocumentId } = useDocsStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<DocumentItem[]>([]);

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
      className="relative flex-shrink-0 flex flex-col bg-white dark:bg-[#252525] border-r border-[#EAEAEA] dark:border-white/[0.06] h-full overflow-visible group"
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -right-3 top-10 z-[80] flex h-6 w-6 items-center justify-center rounded-full border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-opacity ${
          isCollapsed ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        aria-label={isCollapsed ? "Expand docs sidebar" : "Collapse docs sidebar"}
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
                className={`flex items-center gap-3 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all ${
                  !selectedDocumentId
                    ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
                    : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5"
                }`}
              >
                <Layout className={`w-4 h-4 ${!selectedDocumentId ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#ABABAB] dark:text-[#6B6B6B]"}`} />
                All Documents
              </button>

              <div className="h-px bg-[#EAEAEA] dark:bg-white/8 mx-1" />

              <DocsSearch />
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-6 custom-scrollbar">
              {searchQuery ? (
                <div className="px-2">
                  <h3 className="px-3 text-[10px] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-widest mb-3">
                    Search Results
                  </h3>
                  <ul className="space-y-1">
                    {filteredDocs.map(doc => (
                      <li key={doc.id}>
                        <button
                          onClick={() => selectDocument(doc.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[13px] transition-all ${
                            selectedDocumentId === doc.id
                              ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6] font-medium"
                              : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5"
                          }`}
                        >
                          <FileText className={`w-3.5 h-3.5 ${selectedDocumentId === doc.id ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#ABABAB] dark:text-[#6B6B6B]"}`} />
                          <span className="truncate">{doc.title}</span>
                        </button>
                      </li>
                    ))}
                    {filteredDocs.length === 0 && (
                      <p className="px-3 text-[11px] text-[#ABABAB] dark:text-[#6B6B6B] italic py-2">No results found</p>
                    )}
                  </ul>
                </div>
              ) : (
                <>
                  <RecentDocs />
                  <div className="px-2">
                    <div className="flex items-center justify-between px-3 mb-3">
                      <h3 className="text-[10px] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-widest">
                        Documents in Workspace
                      </h3>
                    </div>
                    <DocsTree docs={rootDocs} workspaceId={workspaceId} level={0} />
                  </div>
                  <div className="px-2">
                    <div className="flex items-center justify-between px-3 mb-3">
                      <h3 className="text-[10px] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-widest">
                        Imported Documents
                      </h3>
                    </div>
                    <ul className="space-y-1 px-1">
                      {uploadedDocs.map((doc) => (
                        <li key={doc._id} className="group">
                          <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[13px] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors">
                            <button
                              onClick={() => selectImportedDocument(doc._id)}
                              className="flex items-center gap-2 min-w-0 flex-1 text-left"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-500" />
                              <span className={`truncate ${selectedImportedDocumentId === doc._id ? "font-semibold text-[#2563EB] dark:text-[#3B82F6]" : ""}`}>
                                {doc.name}
                              </span>
                            </button>
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                if (!window.confirm("Remove this document from the workspace?")) return;
                                try {
                                  await documentService.detach(doc._id, workspaceId);
                                  setUploadedDocs((curr) => curr.filter((d) => d._id !== doc._id));
                                  window.dispatchEvent(new Event("docs_uploads_changed"));
                                  toast.success("Removed from workspace");
                                } catch {
                                  toast.error("Failed to remove document");
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-[4px] text-[#ABABAB] hover:text-[#9F2F2D] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] transition-colors"
                              title="Remove from workspace"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={documentService.downloadUrl(doc._id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-[4px] text-[#ABABAB] hover:text-[#2563EB] hover:bg-[#EFF6FF] dark:hover:text-[#3B82F6] dark:hover:bg-[rgba(37,99,235,0.12)] transition-colors"
                              title="Download document"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </li>
                      ))}
                      {uploadedDocs.length === 0 && (
                        <li className="px-3 py-1.5 text-[11px] text-[#ABABAB] dark:text-[#6B6B6B] italic">No imported files</li>
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
