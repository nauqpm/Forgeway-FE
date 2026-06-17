import { Search } from "lucide-react";
import { DocumentSortBy } from "../hooks/useDocumentFilters";

interface DocumentToolbarProps {
  query: string;
  setQuery: (q: string) => void;
  sortBy: DocumentSortBy;
  setSortBy: (s: DocumentSortBy) => void;
}

export default function DocumentToolbar({ query, setQuery, sortBy, setSortBy }: DocumentToolbarProps) {
  return (
    <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-4 dark:border-white/[0.06] dark:bg-[#252525]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16.25rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-[6px] border border-[#EAEAEA] bg-[#F9F9F8] py-2.5 pl-9 pr-3 text-sm text-[#111111] outline-none transition-colors focus:border-[#2563EB] focus:bg-white dark:border-white/[0.06] dark:bg-[#2A2A2A] dark:text-[#E8E8E7] dark:focus:border-[#3B82F6]"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as DocumentSortBy)}
          className="rounded-[6px] border border-[#EAEAEA] bg-[#F9F9F8] px-3 py-2.5 text-sm text-[#111111] outline-none transition-colors focus:border-[#2563EB] focus:bg-white dark:border-white/[0.06] dark:bg-[#2A2A2A] dark:text-[#E8E8E7] dark:focus:border-[#3B82F6]"
        >
          <option value="newest">Newest</option>
          <option value="name">Name (A-Z)</option>
          <option value="size">Size (Largest)</option>
        </select>
      </div>
    </div>
  );
}
