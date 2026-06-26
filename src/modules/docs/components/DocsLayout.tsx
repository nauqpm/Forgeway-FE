"use client";

import { useEffect, useState } from "react";
import { useDocsStore } from "../store/docs.store";
import { useUploadedWorkspaceDocsQuery, useWorkspaceDocs } from "../hooks/useWorkspaceDocs";
import DocsSidebar from "./DocsSidebar";
import TiptapEditor from "../editor/TiptapEditor";
import DocsDashboard from "./DocsDashboard";
import ImportedDocumentViewer from "./ImportedDocumentViewer";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function DocsLayout({ workspaceId }: { workspaceId: string }) {
  const { selectedDocumentId, selectedImportedDocumentId } = useDocsStore();
  const { documents, isLoading } = useWorkspaceDocs(workspaceId);
  const uploadedDocsQuery = useUploadedWorkspaceDocsQuery(workspaceId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, [workspaceId]);

  const uploadedDocs = uploadedDocsQuery.data ?? [];
  const selectedImportedDoc = uploadedDocs.find((doc) => doc._id === selectedImportedDocumentId) ?? null;

  if (!mounted) return null;

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[37.5rem] w-full bg-white dark:bg-[#252525] rounded-[8px] overflow-hidden border border-[#EAEAEA] dark:border-white/[0.06]">
      <div className={`flex-shrink-0 flex-col md:flex ${selectedDocumentId || selectedImportedDocumentId ? "hidden" : "flex w-full md:w-auto"}`}>
        <DocsSidebar workspaceId={workspaceId} />
      </div>

      <main className={`flex-col bg-white dark:bg-[#252525] overflow-hidden relative ${selectedDocumentId || selectedImportedDocumentId ? "flex flex-1 w-full" : "hidden md:flex md:flex-1"}`}>
        {isLoading && documents.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-[#ABABAB] dark:text-[#6B6B6B]">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-[0.8125rem] font-medium">Loading...</span>
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
                <TiptapEditor workspaceId={workspaceId} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
