import { useState, useMemo } from "react";
import { DocumentItem } from "../types/document.type";

export type DocumentSortBy = "newest" | "name" | "size";

export function useDocumentFilters(documents: DocumentItem[]) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<DocumentSortBy>("newest");

  const filtered = useMemo(() => {
    const searched = documents.filter((d) =>
      d.name.toLowerCase().includes(query.toLowerCase().trim()),
    );
    const sorted = [...searched];
    if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "size") {
      sorted.sort((a, b) => b.size - a.size);
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime(),
      );
    }
    return sorted;
  }, [documents, query, sortBy]);

  return { query, setQuery, sortBy, setSortBy, filtered };
}
