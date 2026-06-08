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
import TaskStatusChanger from "../../TaskStatusChanger";

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
            className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer"
            aria-label="Select all issues"
          />
        ),
        cell: () => (
          <input
            type="checkbox"
            className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer"
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
          <span className="font-mono text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B]">
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
              className="flex min-w-0 items-center gap-2 text-left font-medium text-[#111111] dark:text-[#E8E8E7] hover:text-[#2563EB] dark:hover:text-[#60A5FA]"
              onClick={() => onClickTask(issue)}
            >
              <FileText
                className={`h-4 w-4 shrink-0 ${
                  issue.type === "Bug"
                    ? "text-[#9F2F2D]"
                    : issue.type === "Story"
                      ? "text-[#346538]"
                      : "text-[#2563EB] dark:text-[#60A5FA]"
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

          return (
            <TaskStatusChanger
              issue={issue}
              boardColumns={boardColumns}
              variant="pill"
              size="sm"
              onChange={({ columnId, status }) =>
                onUpdateIssue(issue.id, { columnId, status })
              }
            />
          );
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        size: 120,
        cell: (info) => (
          <span className="text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "assignee",
        header: "Assignee",
        size: 140,
        cell: (info) => {
          const assigneeId = info.getValue() as string;
          const issue = info.row.original;
          const displayName = issue.assigneeDisplayName;
          const avatar = issue.assigneeAvatar;

          if (!assigneeId || assigneeId === "U" || !displayName) {
            return <span className="text-[0.8125rem] italic text-[#ABABAB] dark:text-[#6B6B6B]">Unassigned</span>;
          }

          return (
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6 rounded-full overflow-hidden shrink-0">
                {avatar ? (
                  <img src={avatar} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-[0.625rem] font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] truncate">{displayName}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "sprintId",
        header: "Sprint",
        size: 120,
        cell: (info) => (
          <span className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            {(info.getValue() as string | null) ?? "Backlog"}
          </span>
        ),
      },
      {
        accessorKey: "storyPoints",
        header: "Points",
        size: 90,
        cell: (info) => (
          <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[0.6875rem] font-bold text-[#787774] dark:text-[#9B9A97]">
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
            className="rounded-[4px] p-1.5 text-[#ABABAB] dark:text-[#6B6B6B] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] hover:text-[#787774] dark:hover:text-[#9B9A97]"
            aria-label="Task actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [boardColumns, onClickTask, onUpdateIssue],
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
    <div className="workspace-list-height flex flex-col overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search in list..."
            className="w-full min-w-[13.75rem] max-w-[min(100vw-48px,20rem)] rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#2A2A2A] py-1.5 pl-9 pr-3 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors sm:w-[clamp(240px,20vw,320px)]"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColumnMenu((value) => !value)}
            className="inline-flex items-center gap-2 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#252525] px-3 py-1.5 text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
          >
            <Columns className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
            Columns
          </button>

          {showColumnMenu && (
            <div
              className="absolute right-0 z-50 mt-2 w-52 rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] p-2"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div className="mb-2 px-2 text-[0.6875rem] font-semibold uppercase text-[#787774] dark:text-[#9B9A97]">
                Show columns
              </div>
              {table.getAllLeafColumns().map((column) => {
                if (column.id === "checkbox" || column.id === "actions") return null;

                return (
                  <label
                    key={column.id}
                    className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer"
                    />
                    <span className="text-[0.8125rem] capitalize text-[#111111] dark:text-[#E8E8E7]">
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
          <thead className="sticky top-0 z-10 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="group relative select-none bg-[#F9F9F8] dark:bg-[#252525] px-3 py-3 text-[0.6875rem] font-semibold uppercase text-[#787774] dark:text-[#9B9A97]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-[#2563EB]/40 ${
                          header.column.getIsResizing() ? "bg-[#2563EB]/60" : ""
                        }`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[#F0F0EE] dark:divide-white/5 bg-white dark:bg-[#202020]">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-[#F9F9F8] dark:hover:bg-[#2E2E2E]">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className="border-r border-transparent px-3 py-2 last:border-r-0 group-hover:border-[#F0F0EE] dark:group-hover:border-white/5"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {visibleIssues.length === 0 && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            <CheckSquare className="h-6 w-6 text-[#ABABAB] dark:text-[#6B6B6B]" />
            No issues match this list.
          </div>
        )}
      </div>
    </div>
  );
}
