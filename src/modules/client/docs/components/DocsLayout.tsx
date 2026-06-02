"use client";

import { useEffect, useState } from "react";
import { useDocsStore } from "../store/docs.store";
import DocsSidebar from "./DocsSidebar";
import TiptapEditor from "../editor/TiptapEditor";
import DocsDashboard from "./DocsDashboard";
import ImportedDocumentViewer from "./ImportedDocumentViewer";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";

export default function DocsLayout({ workspaceId }: { workspaceId: string }) {
  const { documents, selectedDocumentId, selectedImportedDocumentId, isLoading, loadRootPages } = useDocsStore();
  const [mounted, setMounted] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<DocumentItem[]>([]);

  useEffect(() => {
    // Load root pages from API instead of mock data
    loadRootPages(workspaceId);
    setMounted(true);
  }, [workspaceId]);

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

  const selectedImportedDoc = uploadedDocs.find((doc) => doc._id === selectedImportedDocumentId) ?? null;

  if (!mounted) return null;

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] w-full bg-white dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      {/* Persistent Sidebar */}
      <DocsSidebar workspaceId={workspaceId} />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {isLoading && documents.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">Đang tải trang...</span>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!selectedDocumentId && !selectedImportedDoc ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full flex flex-col"
              >
                <DocsDashboard workspaceId={workspaceId} />
              </motion.div>
            ) : selectedImportedDoc ? (
              <motion.div
                key="imported-viewer"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full flex flex-col"
              >
                <ImportedDocumentViewer doc={selectedImportedDoc} />
              </motion.div>
            ) : (
              <motion.div
                key="editor"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full flex flex-col"
              >
                <TiptapEditor />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
