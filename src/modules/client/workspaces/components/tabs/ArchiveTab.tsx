"use client";

import { ArchiveRestore, CheckSquare, FileText, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Issue } from "../../types/issue.type";

type ArchiveTabProps = {
  issues: Issue[];
  isLoading?: boolean;
  isRestoring?: boolean;
  onRestore: (issue: Issue) => void;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export default function ArchiveTab({
  issues,
  isLoading = false,
  isRestoring = false,
  onRestore,
}: ArchiveTabProps) {
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
    <div className="workspace-panel bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Archived work items
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {issues.length} item archived
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search archived items..."
            className="w-full min-w-[220px] rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:w-80"
          />
        </div>
      </div>

      <div className="relative min-h-[320px] overflow-auto">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] dark:bg-gray-900/70">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        )}

        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead className="sticky top-0 z-0 border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Work item</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Archived by</th>
              <th className="px-4 py-3">Archived at</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {visibleIssues.map((issue) => (
              <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {issue.key}
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText
                      className={`h-4 w-4 shrink-0 ${
                        issue.type === "Bug"
                          ? "text-red-500"
                          : issue.type === "Story"
                            ? "text-emerald-500"
                            : "text-blue-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {issue.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {issue.type} - {issue.priority}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {issue.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {issue.archivedByUser?.fullName ||
                    issue.archivedByUser?.email ||
                    issue.archivedBy ||
                    "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {formatDateTime(issue.archivedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRestore(issue)}
                    disabled={isRestoring}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
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
          <div className="flex h-56 flex-col items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <CheckSquare className="h-6 w-6 text-gray-300 dark:text-gray-600" />
            No archived work items match this list.
          </div>
        )}
      </div>
    </div>
  );
}
