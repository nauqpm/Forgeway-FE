import { Grid3X3, List, Search } from "lucide-react";
import { DocumentSortBy } from "../hooks/useDocumentFilters";

interface DocumentToolbarProps {
  query: string;
  setQuery: (q: string) => void;
  sortBy: DocumentSortBy;
  setSortBy: (s: DocumentSortBy) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

export default function DocumentToolbar({
  query,
  setQuery,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
}: DocumentToolbarProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[16.25rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="h-11 w-full rounded-[6px] border border-[#EAEAEA] bg-white pl-9 pr-3 text-sm text-[#111111] outline-none transition-colors focus:border-[#2563EB] dark:border-white/[0.06] dark:bg-[#202020] dark:text-[#E8E8E7] dark:focus:border-[#3B82F6]"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as DocumentSortBy)}
          className="h-11 rounded-[6px] border border-[#EAEAEA] bg-white px-3 text-sm text-[#111111] outline-none transition-colors focus:border-[#2563EB] dark:border-white/[0.06] dark:bg-[#202020] dark:text-[#E8E8E7] dark:focus:border-[#3B82F6]"
        >
          <option value="newest">Newest</option>
          <option value="name">Name (A-Z)</option>
          <option value="size">Size (Largest)</option>
        </select>
        <div className="flex h-11 rounded-[6px] border border-[#EAEAEA] bg-white p-1 dark:border-white/[0.06] dark:bg-[#202020]">
          <button
            type="button"
            title="Grid view"
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-[4px] transition-colors ${
              viewMode === "grid"
                ? "bg-white text-[#2563EB] dark:bg-[#252525] dark:text-[#3B82F6]"
                : "text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7]"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="List view"
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-[4px] transition-colors ${
              viewMode === "list"
                ? "bg-white text-[#2563EB] dark:bg-[#252525] dark:text-[#3B82F6]"
                : "text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7]"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
