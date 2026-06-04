"use client";

import { useDocsStore } from "../store/docs.store";
import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardGroup from "./DashboardGroup";
import DashboardEmpty from "./DashboardEmpty";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function DocsDashboard({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const {
    documents, 
    selectDocument, 
    createDocument, 
    renameDocument, 
    deleteDocument, 
  } = useDocsStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "az">("newest");
  const [uploadedDocs, setUploadedDocs] = useState<DocumentItem[]>([]);
  const [personalDocs, setPersonalDocs] = useState<DocumentItem[]>([]);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);

  const loadUploadedDocs = async () => {
    try {
      const list = await documentService.getByWorkspace(workspaceId);
      setUploadedDocs(list);
    } catch {
      setUploadedDocs([]);
    }
  };

  const loadPersonalDocs = async () => {
    try {
      const list = await documentService.listMine();
      setPersonalDocs(list);
    } catch {
      setPersonalDocs([]);
    }
  };

  useEffect(() => {
    loadUploadedDocs();
    loadPersonalDocs();
  }, [workspaceId]);

  const filteredDocs = useMemo(() => {
    const result = documents.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortOrder === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === "newest") {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    }

    return result;
  }, [documents, searchQuery, sortOrder]);

  const groups = useMemo(() => {
    // Docs pages created in wiki editor
    const statuses = Array.from(new Set(filteredDocs.map(d => d.status === 'published' ? 'Published' : 'Draft')));
    return statuses.map(status => ({
      name: status,
      docs: filteredDocs
        .filter(d => (d.status === 'published' ? 'Published' : 'Draft') === status)
        .map((d) => ({ ...d, source: "docs" as const })),
    }));
  }, [filteredDocs]);

  const filteredUploads = useMemo(
    () =>
      uploadedDocs.filter((doc) =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [uploadedDocs, searchQuery],
  );

  const handleCreate = async () => {
    const newDoc = await createDocument(workspaceId);
    if (newDoc) selectDocument(newDoc.id);
  };

  const handleRename = (id: string, currentTitle: string) => {
    const newTitle = prompt("Rename to:", currentTitle);
    if (newTitle) renameDocument(id, newTitle);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this page?")) deleteDocument(id);
  };

  const importableLibraryDocs = useMemo(() => {
    const attachedIds = new Set(uploadedDocs.map((d) => d._id));
    return personalDocs.filter((d) => !attachedIds.has(d._id));
  }, [personalDocs, uploadedDocs]);

  return (
    <div className="flex-1 flex flex-col bg-[#F9FAFB] dark:bg-gray-950 overflow-hidden h-full">
      <DashboardHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onCreatePage={handleCreate}
        onImportFromLibrary={() => {
          setSelectedLibraryIds([]);
          setShowLibraryModal(true);
        }}
      />
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-3">Import from library</h3>
            <div className="max-h-80 overflow-auto border rounded-lg">
              {importableLibraryDocs.map((doc) => (
                <label key={doc._id} className="flex items-center gap-2 p-2 border-b last:border-b-0">
                  <input
                    type="checkbox"
                    checked={selectedLibraryIds.includes(doc._id)}
                    onChange={(e) =>
                      setSelectedLibraryIds((curr) =>
                        e.target.checked ? [...curr, doc._id] : curr.filter((id) => id !== doc._id),
                      )
                    }
                  />
                  <span className="text-sm">{doc.name}</span>
                </label>
              ))}
              {importableLibraryDocs.length === 0 && (
                <p className="p-3 text-sm text-gray-500">No files available to import.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-2 rounded-lg border"
                onClick={() => setShowLibraryModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                disabled={!selectedLibraryIds.length}
                onClick={async () => {
                  await Promise.all(
                    selectedLibraryIds.map((id) => documentService.attach(id, [workspaceId])),
                  );
                  await loadUploadedDocs();
                  window.dispatchEvent(new Event("docs_uploads_changed"));
                  setShowLibraryModal(false);
                  toast.success("Imported from library");
                }}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-10 py-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12">
          {groups.map((group, idx) => (
            <DashboardGroup 
              key={group.name}
              name={group.name}
              docs={group.docs}
              idx={idx}
              onSelect={selectDocument}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}

          <section>
            <div className="flex items-center gap-2 mb-5 px-1">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
              <h3 className="text-[12px] font-bold text-[#42526E] dark:text-gray-300 uppercase tracking-[0.1em]">
                Uploaded Files
              </h3>
              <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold text-gray-500 dark:text-gray-400">
                {filteredUploads.length}
              </span>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUploads.map((doc) => (
                  <div key={doc._id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#172B4D] dark:text-gray-100">{doc.name}</p>
                        <span className="px-2 py-0.5 text-[10px] rounded-full font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          {doc.extension.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {doc.extension} · {(doc.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={documentService.downloadUrl(doc._id)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Download
                      </a>
                      <button
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={async () => {
                          if (!window.confirm("Remove this document from the workspace?")) return;
                          try {
                            await documentService.detach(doc._id, workspaceId);
                            await loadUploadedDocs();
                            window.dispatchEvent(new Event("docs_uploads_changed"));
                            toast.success("Document removed from workspace");
                          } catch {
                            toast.error("Failed to remove document");
                          }
                        }}
                      >
                        Remove from Workspace
                      </button>
                    </div>
                  </div>
                ))}
                {filteredUploads.length === 0 && (
                  <p className="px-6 py-5 text-sm text-gray-500">No files uploaded.</p>
                )}
              </div>
            </div>
          </section>

          {groups.length === 0 && filteredUploads.length === 0 && (
            <DashboardEmpty onClearFilters={() => setSearchQuery("")} />
          )}
        </div>
      </div>
    </div>
  );
}
