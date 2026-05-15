"use client";

import { useDocsStore } from "../store/docs.store";
import { useState, useMemo } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardGroup from "./DashboardGroup";
import DashboardEmpty from "./DashboardEmpty";

export default function DocsDashboard({ spaceId }: { spaceId: string }) {
  const { 
    documents, 
    selectDocument, 
    createDocument, 
    renameDocument, 
    deleteDocument, 
    duplicateDocument 
  } = useDocsStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "az">("newest");

  const filteredDocs = useMemo(() => {
    let result = documents.filter(doc => 
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
    const categories = Array.from(new Set(filteredDocs.map(d => d.category || "General")));
    return categories.map(cat => ({
      name: cat,
      docs: filteredDocs.filter(d => (d.category || "General") === cat)
    }));
  }, [filteredDocs]);

  const handleCreate = () => {
    const newDoc = createDocument(spaceId);
    selectDocument(newDoc.id);
  };

  const handleRename = (id: string, currentTitle: string) => {
    const newTitle = prompt("Rename to:", currentTitle);
    if (newTitle) renameDocument(id, newTitle);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this page?")) deleteDocument(id);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F9FAFB] overflow-hidden h-full">
      <DashboardHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onCreatePage={handleCreate}
      />

      <div className="flex-1 overflow-y-auto px-10 py-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12">
          {groups.map((group, idx) => (
            <DashboardGroup 
              key={group.name}
              name={group.name}
              docs={group.docs}
              idx={idx}
              onSelect={selectDocument}
              onDuplicate={duplicateDocument}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}

          {groups.length === 0 && (
            <DashboardEmpty onClearFilters={() => setSearchQuery("")} />
          )}
        </div>
      </div>
    </div>
  );
}
