"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  ColumnResizeMode,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CheckSquare, Columns, FileText, MoreHorizontal, Search } from "lucide-react";

import { Issue } from "../../../types/issue.type";
import CustomDatePicker from "@/common/components/CustomDatePicker";

type BoardColumn = { id: string; name: string; order: number; mappedStatuses?: string[]; isDone?: boolean };

type DataGridListViewProps = {
  issues: Issue[];
  boardColumns?: BoardColumn[];
  onClickTask: (issue: Issue) => void;
  onUpdateIssue: (issueId: string, updates: Partial<Issue>) => void;
  onBulkUpdate?: (issueIds: string[], updates: Partial<Issue>) => Promise<void>;
  onBulkDelete?: (issueIds: string[]) => Promise<void>;
};

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  id: true,
  title: true,
  status: true,
  priority: true,
  assignee: true,
  sprintId: true,
  storyPoints: true,
  startDate: true,
  dueDate: true,
};

const readJsonSetting = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

export default function DataGridListView({
  issues,
  boardColumns = [],
  onClickTask,
  onUpdateIssue,
}: DataGridListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columnResizeMode] = useState<ColumnResizeMode>("onChange");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    readJsonSetting("spaces_list_visible_columns", DEFAULT_COLUMN_VISIBILITY),
  );
  const [columnSizing, setColumnSizing] = useState(() =>
    readJsonSetting("spaces_list_column_sizing", {}),
  );

  useEffect(() => {
    window.localStorage.setItem(
      "spaces_list_visible_columns",
      JSON.stringify(columnVisibility),
    );
  }, [columnVisibility]);

  useEffect(() => {
    window.localStorage.setItem(
      "spaces_list_column_sizing",
      JSON.stringify(columnSizing),
    );
  }, [columnSizing]);

  const visibleIssues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return issues;

    return issues.filter((issue) =>
      [
        issue.id,
        issue.key,
        issue.title,
        issue.status,
        issue.priority,
        issue.type,
        issue.assignee,
        issue.sprintId ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [issues, searchTerm]);

  const columns = useMemo<ColumnDef<Issue>[]>(
    () => [
      {
        id: "checkbox",
        header: () => (
          <input
            type="checkbox"
            className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer"
            aria-label="Select all issues"
          />
        ),
        cell: () => (
          <input
            type="checkbox"
            className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer"
            aria-label="Select task"
          />
        ),
        size: 50,
        enableResizing: false,
      },
      {
        accessorKey: "key",
        header: "Key",
        size: 90,
        cell: (info) => (
          <span className="font-mono text-xs font-semibold text-gray-500">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: "Work",
        size: 340,
        cell: (info) => {
          const issue = info.row.original;

          return (
            <button
              type="button"
              className="flex min-w-0 items-center gap-2 text-left font-medium text-gray-800 hover:text-indigo-700"
              onClick={() => onClickTask(issue)}
            >
              <FileText
                className={`h-4 w-4 shrink-0 ${
                  issue.type === "Bug"
                    ? "text-red-500"
                    : issue.type === "Story"
                      ? "text-emerald-500"
                      : "text-blue-500"
                }`}
              />
              <span className="truncate">{info.getValue() as string}</span>
            </button>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 150,
        cell: (info) => {
          const issue = info.row.original;
          const rawStatus = info.getValue() as string;
          const resolvedCol = boardColumns.find((c) => c.id === rawStatus || c.name === rawStatus);
          const displayName = resolvedCol?.name ?? rawStatus;

          if (boardColumns.length > 0) {
            return (
              <select
                value={resolvedCol?.id ?? rawStatus}
                onChange={(event) =>
                  onUpdateIssue(issue.id, { status: event.target.value })
                }
                className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={(event) => event.stopPropagation()}
              >
                {boardColumns.map((col) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            );
          }

          return (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {displayName}
            </span>
          );
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        size: 120,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-600">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "assignee",
        header: "Assignee",
        size: 140,
        cell: (info) => {
          const assignee = info.getValue() as string;

          if (!assignee || assignee === "U") {
            return <span className="text-sm italic text-gray-400">Unassigned</span>;
          }

          return (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                {assignee}
              </div>
              <span className="text-sm text-gray-700">{assignee}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "sprintId",
        header: "Sprint",
        size: 120,
        cell: (info) => (
          <span className="text-sm text-gray-500">
            {(info.getValue() as string | null) ?? "Backlog"}
          </span>
        ),
      },
      {
        accessorKey: "storyPoints",
        header: "Points",
        size: 90,
        cell: (info) => (
          <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600">
            {(info.getValue() as number) || "-"}
          </span>
        ),
      },
      {
        accessorKey: "startDate",
        header: "Start Date",
        size: 140,
        cell: (info) => {
          const issue = info.row.original;
          const value = info.getValue() as string | undefined;

          return (
            <div onClick={(event) => event.stopPropagation()}>
              <CustomDatePicker
                value={value}
                onChange={(nextValue) => onUpdateIssue(issue.id, { startDate: nextValue ?? undefined })}
                inputClassName="h-8 border-transparent bg-transparent px-2 pl-8"
                ariaLabel="Task start date"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        size: 140,
        cell: (info) => {
          const issue = info.row.original;
          const value = info.getValue() as string | undefined;

          return (
            <div onClick={(event) => event.stopPropagation()}>
              <CustomDatePicker
                value={value}
                onChange={(nextValue) => onUpdateIssue(issue.id, { dueDate: nextValue ?? undefined })}
                inputClassName="h-8 border-transparent bg-transparent px-2 pl-8"
                ariaLabel="Task due date"
              />
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableResizing: false,
        cell: () => (
          <button
            type="button"
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Task actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [onClickTask, onUpdateIssue],
  );

  const table = useReactTable({
    data: visibleIssues,
    columns,
    state: {
      columnVisibility,
      columnSizing,
    },
    enableColumnResizing: true,
    columnResizeMode,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="workspace-list-height flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search in list..."
            className="w-full min-w-[220px] max-w-[min(100vw-48px,20rem)] rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 sm:w-[clamp(240px,20vw,320px)]"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColumnMenu((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Columns className="h-4 w-4 text-gray-500" />
            Columns
          </button>

          {showColumnMenu && (
            <div className="absolute right-0 z-50 mt-2 w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
              <div className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500">
                Show columns
              </div>
              {table.getAllLeafColumns().map((column) => {
                if (column.id === "checkbox" || column.id === "actions") return null;

                return (
                  <label
                    key={column.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer"
                    />
                    <span className="text-sm capitalize text-gray-700">
                      {column.id}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-auto">
        <table
          className="w-full border-collapse text-left"
          style={{ width: table.getCenterTotalSize() }}
        >
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="group relative select-none bg-gray-50 px-3 py-3 text-xs font-semibold uppercase text-gray-500"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-indigo-500/50 ${
                          header.column.getIsResizing() ? "bg-indigo-500" : ""
                        }`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className="border-r border-transparent px-3 py-2 last:border-r-0 group-hover:border-gray-100"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {visibleIssues.length === 0 && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <CheckSquare className="h-6 w-6 text-gray-300" />
            No issues match this list.
          </div>
        )}
      </div>
    </div>
  );
}
