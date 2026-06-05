"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useDocsStore } from "../store/docs.store";
import DashboardHeader from "./DashboardHeader";
import DashboardGroup from "./DashboardGroup";
import DashboardEmpty from "./DashboardEmpty";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";

export default function DocsDashboard({ workspaceId }: { workspaceId: string }) {
  const {
    documents,
    selectDocument,
    selectImportedDocument,
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

  const loadUploadedDocs = useCallback(async () => {
    try {
      const list = await documentService.getByWorkspace(workspaceId);
      setUploadedDocs(list);
    } catch {
      setUploadedDocs([]);
    }
  }, [workspaceId]);

  const loadPersonalDocs = useCallback(async () => {
    try {
      const list = await documentService.listMine();
      setPersonalDocs(list);
    } catch {
      setPersonalDocs([]);
    }
  }, []);

  useEffect(() => {
    loadUploadedDocs();
    loadPersonalDocs();
  }, [loadPersonalDocs, loadUploadedDocs]);

  const filteredDocs = useMemo(() => {
    const result = documents.filter((doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()),
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

  const filteredUploadedDocs = useMemo(
    () =>
      uploadedDocs
        .filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((doc) => ({
          id: doc._id,
          title: doc.name,
          content: "",
          parentId: null,
          workspaceId,
          slug: doc.filename || doc._id,
          authorId: doc.uploadedBy,
          lastEditedBy: null,
          version: 1,
          status: "draft" as const,
          labels: [],
          versionHistory: [],
          source: "import" as const,
          createdAt: doc.createdAt || doc.updatedAt || new Date(0).toISOString(),
          updatedAt: doc.updatedAt || doc.createdAt || new Date(0).toISOString(),
        })),
    [searchQuery, uploadedDocs, workspaceId],
  );

  const dashboardDocs = useMemo(() => {
    const result = [
      ...filteredDocs.map((doc) => ({ ...doc, source: "docs" as const })),
      ...filteredUploadedDocs,
    ];

    if (sortOrder === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === "newest") {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    }

    return result;
  }, [filteredDocs, filteredUploadedDocs, sortOrder]);

  const groups = useMemo(
    () => (dashboardDocs.length ? [{ name: "Docs", docs: dashboardDocs }] : []),
    [dashboardDocs],
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

  const handleSelect = (id: string) => {
    const isUploadedDoc = uploadedDocs.some((doc) => doc._id === id);
    if (isUploadedDoc) {
      selectImportedDocument(id);
      return;
    }
    selectDocument(id);
  };

  const importableLibraryDocs = useMemo(() => {
    const attachedIds = new Set(uploadedDocs.map((doc) => doc._id));
    return personalDocs.filter((doc) => !attachedIds.has(doc._id));
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
                    onChange={(event) =>
                      setSelectedLibraryIds((current) =>
                        event.target.checked
                          ? [...current, doc._id]
                          : current.filter((id) => id !== doc._id),
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
              onSelect={handleSelect}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}

          {groups.length === 0 && <DashboardEmpty onClearFilters={() => setSearchQuery("")} />}
        </div>
      </div>
    </div>
  );
}
