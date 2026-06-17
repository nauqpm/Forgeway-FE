"use client";

import { ArchiveRestore, CheckSquare, FileText, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { BoardColumn } from "@/modules/workspace/shared/types/board.type";

type ArchiveTabProps = {
  issues: Issue[];
  boardColumns?: BoardColumn[];
  isLoading?: boolean;
  isRestoring?: boolean;
  onRestore: (issue: Issue) => void;
  total?: number;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export default function ArchiveTab({
  issues,
  boardColumns,
  isLoading = false,
  isRestoring = false,
  onRestore,
  total,
  onLoadMore,
  isLoadingMore = false,
}: ArchiveTabProps) {
  const resolveStatus = (status: string) => {
    if (!boardColumns?.length) return status;
    return boardColumns.find((c) => c.id === status || c.name === status)?.name ?? status;
  };
  const [searchTerm, setSearchTerm] = useState("");

  const visibleIssues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return issues;

    return issues.filter((issue) =>
      [
        issue.key,
        issue.title,
        issue.status,
        issue.priority,
        issue.type,
        issue.archivedByUser?.fullName ?? "",
        issue.archivedByUser?.email ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [issues, searchTerm]);

  return (
    <div className="workspace-panel bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06]">
      <div className="flex flex-col gap-3 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Archived work items
          </h2>
          <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
            {total !== undefined
              ? `Showing ${issues.length} of ${total}`
              : `${issues.length} item archived`}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search archived items..."
            className="w-full min-w-[13.75rem] rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#252525] py-1.5 pl-9 pr-3 text-[0.8125rem] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-[#111111] dark:text-[#E8E8E7] transition-colors sm:w-80 placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B]"
          />
        </div>
      </div>

      <div className="relative min-h-80 overflow-auto">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-[#202020]/70">
            <Loader2 className="h-6 w-6 animate-spin text-[#2563EB] dark:text-[#3B82F6]" />
          </div>
        )}

        <table className="w-full min-w-[51.25rem] border-collapse text-left">
          <thead className="sticky top-0 z-0 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] text-[0.6875rem] font-semibold uppercase text-[#ABABAB] dark:text-[#6B6B6B]">
            <tr>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Work item</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Archived by</th>
              <th className="px-4 py-3">Archived at</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEAEA] dark:divide-white/[0.06] bg-white dark:bg-[#202020]">
            {visibleIssues.map((issue) => (
              <tr key={issue.id} className="hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]">
                <td className="px-4 py-3 font-mono text-[0.6875rem] font-semibold text-[#787774] dark:text-[#9B9A97]">
                  {issue.key}
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText
                      className={`h-4 w-4 shrink-0 ${
                        issue.type === "Bug"
                          ? "text-[#9F2F2D] dark:text-[#F87171]"
                          : issue.type === "Story"
                            ? "text-[#346538] dark:text-[#4ADE80]"
                            : "text-[#1F6C9F] dark:text-[#93C5FD]"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
                        {issue.title}
                      </p>
                      <p className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
                        {issue.type} - {issue.priority}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-[4px] bg-[#F7F6F3] dark:bg-[#252525] px-2 py-1 text-[0.6875rem] font-semibold text-[#787774] dark:text-[#9B9A97]">
                    {resolveStatus(issue.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                  {issue.archivedByUser?.fullName ||
                    issue.archivedByUser?.email ||
                    issue.archivedBy ||
                    "-"}
                </td>
                <td className="px-4 py-3 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                  {formatDateTime(issue.archivedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRestore(issue)}
                    disabled={isRestoring}
                    className="inline-flex items-center gap-2 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#252525] px-3 py-1.5 text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRestoring ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArchiveRestore className="h-4 w-4" />
                    )}
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && visibleIssues.length === 0 && (
          <div className="flex h-56 flex-col items-center justify-center gap-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            <CheckSquare className="h-6 w-6 text-[#ABABAB] dark:text-[#6B6B6B]" />
            No archived work items match this list.
          </div>
        )}
      </div>

      {onLoadMore && total !== undefined && issues.length < total && (
        <div className="flex justify-center border-t border-[#EAEAEA] dark:border-white/[0.06] p-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#252525] px-4 py-2 text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {isLoadingMore
              ? "Loading..."
              : `Load more (${total - issues.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
