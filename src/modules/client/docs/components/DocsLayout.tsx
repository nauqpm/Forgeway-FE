"use client";

import { useEffect, useState } from "react";
import { useDocsStore } from "../store/docs.store";
import DocsSidebar from "./DocsSidebar";
import TiptapEditor from "../editor/TiptapEditor";
import DocsDashboard from "./DocsDashboard";
import { MOCK_DOCS } from "../mock/docs.mock";
import { motion, AnimatePresence } from "framer-motion";

export default function DocsLayout({ spaceId }: { spaceId: string }) {
  const { documents, setDocuments, selectedDocumentId } = useDocsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (documents.length === 0) {
      setDocuments(MOCK_DOCS);
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] w-full bg-white dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      {/* Persistent Sidebar */}
      <DocsSidebar spaceId={spaceId} />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!selectedDocumentId ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full flex flex-col"
            >
              <DocsDashboard spaceId={spaceId} />
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
      </main>
    </div>
  );
}
