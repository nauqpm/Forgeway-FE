"use client";

import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  ColumnDef,
  ColumnResizeMode,
  VisibilityState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { MoreHorizontal, FileText, RefreshCcw } from 'lucide-react';
import TypePicker from '@/shared/components/TypePicker';
import PriorityPicker from '@/shared/components/PriorityPicker';
import BulkActionBar from './BulkActionBar';
import AssigneePicker, { AssigneePickerMember, AssigneePickerUser, toAssigneePickerUsers } from '@/shared/components/AssigneePicker';
import CustomDatePicker from '@/shared/components/CustomDatePicker';
import TaskLabelsField from '@/modules/workspace/tasks/labels/TaskLabelsField';
import StatusPicker from '@/shared/components/StatusPicker';
import { useSubtasks } from '@/modules/workspace/shared/hooks/useSubtasks';
import { Subtask } from '@/modules/workspace/shared/types/task-detail.type';
import { ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react';
import { queryKeys } from '@/shared/constants/queryKeys';
import api from '@/lib/axiosIns';
import { apiRoutes } from '@/config/apiRoutes';
import { toUiLabel } from '@/modules/workspace/shared/services/taskNormalizer';
type WorkspaceMember = AssigneePickerMember;

type BoardColumn = {
  id: string;
  name: string;
  order: number;
  mappedStatuses?: string[];
  isDone?: boolean;
};



interface DataGridListViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  issues: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allIssues?: any[];
  workspaceId?: string;
  members?: WorkspaceMember[];
  boardColumns?: BoardColumn[];
  columnVisibility?: VisibilityState;
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClickTask?: (issue: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateIssue?: (issueId: string, updates: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreateTask?: (task: any) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  totalCount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBulkUpdate?: (taskIds: string[], updates: any) => Promise<void>;
  onBulkDelete?: (taskIds: string[]) => Promise<void>;
  hideCreate?: boolean;
  canEditTask?: boolean;
  canDeleteTask?: boolean;
}

export default function DataGridListView({
  issues,
  allIssues,
  workspaceId,
  members,
  boardColumns,
  columnVisibility: columnVisibilityProp,
  setColumnVisibility: setColumnVisibilityProp,
  onClickTask,
  onUpdateIssue,
  onCreateTask,
  onRefresh,
  isRefreshing,
  totalCount,
  onBulkUpdate,
  onBulkDelete,
  hideCreate,
  canEditTask = true,
  canDeleteTask = true,
}: DataGridListViewProps) {
  const queryClient = useQueryClient();
  const [columnSizing, setColumnSizing] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('list_column_sizing');
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('list_column_sizing', JSON.stringify(columnSizing));
  }, [columnSizing]);

  const columnVisibility = columnVisibilityProp ?? {};
  const setColumnVisibility = setColumnVisibilityProp ?? (() => {});

  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const hasSelectionColumn = canEditTask || canDeleteTask;

  // Expanded State for Subtasks
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpanded = (rowId: string) => {
    setExpanded(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  // Group subtasks from allIssues by parentId for client-side expand (no extra API call)
  const subtasksByParentId = useMemo(() => {
    if (!allIssues) return {} as Record<string, typeof allIssues>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return allIssues.reduce((acc: Record<string, any[]>, issue: any) => {
      if (issue.parentId && issue.type?.toLowerCase() === 'subtask') {
        if (!acc[issue.parentId]) acc[issue.parentId] = [];
        acc[issue.parentId].push(issue);
      }
      return acc;
    }, {});
  }, [allIssues]);

  const prefetchSubtasks = useCallback((issueId: string) => {
    if (!workspaceId) return;
    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.subtasks(workspaceId, issueId),
      queryFn: async () => {
        const { data } = await api.get(apiRoutes.TASKS.BOARD_TASK_SUBTASKS(workspaceId, issueId));
        const resData = data.data || data;
        if (resData.subtasks && Array.isArray(resData.subtasks)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          resData.subtasks = resData.subtasks.map((st: any) => ({
            ...st,
            priority: toUiLabel(st.priority, 'Medium'),
          }));
        }
        return resData;
      },
      staleTime: 30_000,
    });
  }, [workspaceId, queryClient]);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ rowId: string; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const saveEdit = useCallback((rowId: string, field: string, value: unknown) => {
    void (onUpdateIssue && onUpdateIssue(rowId, { [field]: value }));
    setEditingCell(null);
    setEditValue('');
  }, [onUpdateIssue]);

  // Footer Inline Create state
  const [isCreating, setIsCreating] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('Task');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) inputRef.current.focus();
  }, [isCreating]);

  const handleSubmitInlineCreate = async () => {
    if (!taskTitle.trim() || !onCreateTask) return;
    await onCreateTask({ title: taskTitle, type: newTaskType, assigneeId: newTaskAssignee || null, dueDate: newTaskDate || null });
    setTaskTitle('');
    setNewTaskType('Task');
    setNewTaskAssignee('');
    setNewTaskDate('');
    setIsCreating(false);
  };

  const handleKeyDownInlineCreate = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmitInlineCreate();
    if (e.key === 'Escape') setIsCreating(false);
  };

  // Bulk Actions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedCount = Object.keys(rowSelection).filter(k => (rowSelection as any)[k]).length;

  const getSelectedTaskIds = () => table.getSelectedRowModel().flatRows.map(row => row.original.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBulkFieldUpdate = async (updates: Record<string, any>) => {
    if (!onBulkUpdate) return;
    const ids = getSelectedTaskIds();
    setRowSelection({});
    await onBulkUpdate(ids, updates);
  };

  // Clear selection when clicking outside the grid or the floating action bar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      const insideGrid = containerRef.current?.contains(target);
      const insideBar = !!target.closest('[data-bulk-action-bar]');
      const insidePickerMenu = !!target.closest('[data-assignee-picker-menu]');
      if (!insideGrid && !insideBar && !insidePickerMenu) setRowSelection({});
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const normalizedMembers = useMemo(() => toAssigneePickerUsers(members), [members]);

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    if (confirm(`Are you sure you want to delete ${selectedCount} items?`)) {
      const ids = getSelectedTaskIds();
      setRowSelection({});
      await onBulkDelete(ids);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<any>[]>(() => [
    ...(hasSelectionColumn ? [{
      id: 'checkbox',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      header: ({ table }: any) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded-[6px] accent-[#2563EB] cursor-pointer"
          checked={table.getIsAllRowsSelected()}
          ref={(input: HTMLInputElement | null) => { if (input) input.indeterminate = table.getIsSomeRowsSelected(); }}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: ({ row }: any) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded-[6px] accent-[#2563EB] cursor-pointer"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
      ),
      size: 40,
      enableResizing: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as ColumnDef<any>] : []),
    {
      accessorKey: 'key',
      header: 'Key',
      size: 110,
      cell: info => <span className="text-[#787774] dark:text-[#9B9A97] font-mono text-xs">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'title',
      header: 'Work',
      size: 300,
      maxSize: 300,
      cell: info => {
        const issue = info.row.original;
        const isEditing = editingCell?.rowId === issue.id && editingCell?.col === 'title';
        const localSubtasks = subtasksByParentId[issue.id] ?? [];
        const hasSubtasks = localSubtasks.length > 0 || ((issue.subtaskProgress?.total ?? 0) > 0);
        const isExpanded = expanded[issue.id];

        if (canEditTask && isEditing) {
          return (
            <div className="flex min-w-0 items-center gap-2" onClick={e => e.stopPropagation()}>
              <FileText className="w-4 h-4 shrink-0 text-[#1F6C9F]" />
              <input
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => { if (editValue.trim() && editValue !== issue.title) saveEdit(issue.id, 'title', editValue.trim()); else setEditingCell(null); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { if (editValue.trim() && editValue !== issue.title) saveEdit(issue.id, 'title', editValue.trim()); else setEditingCell(null); }
                  if (e.key === 'Escape') setEditingCell(null);
                }}
                className="min-w-0 flex-1 px-1.5 py-0.5 text-sm border border-[#2563EB] rounded-[6px] outline-none bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7]"
              />
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1.5 group/title min-w-0">
            {hasSubtasks ? (
              <button
                className="w-5 h-5 shrink-0 flex items-center justify-center rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333] text-[#787774] dark:text-[#9B9A97]"
                onClick={e => { e.stopPropagation(); toggleExpanded(issue.id); }}
                title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-5 h-5 shrink-0" /> // Spacer
            )}
            <FileText className="w-4 h-4 shrink-0 text-[#1F6C9F]" />
            <span
              className="min-w-0 flex-1 truncate text-[#111111] dark:text-[#E8E8E7] font-medium cursor-pointer hover:text-[#2563EB] dark:hover:text-[#3B82F6]"
              onClick={e => {
                e.stopPropagation();
                if (!canEditTask) {
                  onClickTask?.(issue);
                  return;
                }
                setEditingCell({ rowId: issue.id, col: 'title' });
                setEditValue(issue.title || '');
              }}
              title={canEditTask ? "Click to edit" : "Open detail"}
            >
              {info.getValue() as string}
            </span>
            <button
              className="opacity-0 group-hover/title:opacity-100 ml-auto shrink-0 text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#9B9A97] transition-opacity"
              onClick={e => { e.stopPropagation(); void (onClickTask && onClickTask(issue)); }}
              title="Open detail"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      size: 120,
      cell: info => {
        const issue = info.row.original;
        return (
          <div onClick={e => e.stopPropagation()}>
            <TypePicker
              value={issue.type ?? 'Task'}
              onChange={type => onUpdateIssue?.(issue.id, { type })}
              disabled={!canEditTask}
              variant="pill"
              size="sm"
              placement="bottom"
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 150,
      cell: info => {
        const issue = info.row.original;
        return (
          <StatusPicker
            value={issue.status}
            columnId={issue.columnId}
            options={(boardColumns || []).map(col => ({ id: col.id, name: col.name }))}
            variant="pill"
            size="sm"
            disabled={!canEditTask}
            onChange={(status, option) =>
              onUpdateIssue?.(issue.id, { columnId: option.id, status })
            }
          />
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      size: 120,
      cell: info => {
        const issue = info.row.original;
        return (
          <div onClick={e => e.stopPropagation()}>
            <PriorityPicker
              value={info.getValue() as string}
              onChange={p => onUpdateIssue && onUpdateIssue(issue.id, { priority: p })}
              disabled={!canEditTask}
              variant="pill"
              size="sm"
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'assigneeId',
      header: 'Assignee',
      size: 160,
      cell: info => {
        const issue = info.row.original;
        const assigneeId = info.getValue() as string | undefined;
        return (
          <div onClick={e => e.stopPropagation()}>
            <AssigneePicker
              users={normalizedMembers}
              value={assigneeId ?? null}
              onChange={uid => {
                const selectedUser = normalizedMembers.find(user => user.id === uid);
                onUpdateIssue?.(issue.id, {
                  assigneeId: uid,
                  assignee: uid ?? 'U',
                  assigneeDisplayName: uid ? selectedUser?.name ?? uid : 'Unassigned',
                  assigneeAvatar: uid ? selectedUser?.avatar : undefined,
                });
              }}
              placement="bottom"
              size="md"
              disabled={!canEditTask}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'storyPoints',
      header: 'Story Points',
      size: 100,
      cell: info => {
        const issue = info.row.original;
        const isEditing = editingCell?.rowId === issue.id && editingCell?.col === 'storyPoints';
        const pts = info.getValue() as number;
        if (canEditTask && isEditing) {
          return (
            <input
              type="number"
              min={0}
              autoFocus
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => saveEdit(issue.id, 'storyPoints', Number(editValue) || 0)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveEdit(issue.id, 'storyPoints', Number(editValue) || 0);
                if (e.key === 'Escape') setEditingCell(null);
              }}
              onClick={e => e.stopPropagation()}
              className="w-16 text-center text-xs border border-[#2563EB] rounded-[6px] outline-none px-1 py-0.5 bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7]"
            />
          );
        }
        return (
          <span
            onClick={e => {
              e.stopPropagation();
              if (!canEditTask) return;
              setEditingCell({ rowId: issue.id, col: 'storyPoints' });
              setEditValue(String(pts ?? 0));
            }}
            className={`w-6 h-6 flex items-center justify-center bg-[#F7F6F3] dark:bg-[#2A2A2A] rounded-[6px] text-xs font-bold text-[#787774] dark:text-[#9B9A97] transition-colors ${canEditTask ? "cursor-pointer hover:bg-[#EFF6FF] dark:hover:bg-[rgba(37,99,235,0.12)]" : ""}`}
            title={canEditTask ? "Click to edit" : undefined}
          >
            {pts || '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      size: 140,
      cell: info => {
        const issue = info.row.original;
        const v = info.getValue() as string | undefined;
        return (
          <div onClick={e => e.stopPropagation()}>
            <CustomDatePicker
              value={v}
              onChange={nextValue => onUpdateIssue && onUpdateIssue(issue.id, { startDate: nextValue })}
              disabled={!canEditTask}
              inputClassName="h-8 border-transparent bg-transparent dark:bg-transparent px-2 pl-8"
              popoverPlacement="bottom-start"
              ariaLabel="Task start date"
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      size: 140,
      cell: info => {
        const issue = info.row.original;
        const v = info.getValue() as string | undefined;
        const isOverdue = v && new Date(v) < new Date() && !issue.status?.toLowerCase().includes('done');
        return (
          <div className={isOverdue ? "text-[#9F2F2D] dark:text-[#F87171]" : ""} onClick={e => e.stopPropagation()}>
            <CustomDatePicker
              value={v}
              onChange={nextValue => onUpdateIssue && onUpdateIssue(issue.id, { dueDate: nextValue })}
              disabled={!canEditTask}
              inputClassName="h-8 border-transparent bg-transparent dark:bg-transparent px-2 pl-8"
              popoverPlacement="bottom-start"
              ariaLabel="Task due date"
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      size: 130,
      cell: info => {
        const v = info.getValue() as string | undefined;
        return <span className="text-sm text-[#787774] dark:text-[#9B9A97]">{v ? v.slice(0, 10) : '-'}</span>;
      },
    },
    {
      accessorKey: 'labels',
      header: 'Labels',
      size: 200,
      cell: info => {
        const issue = info.row.original;
        if (workspaceId && issue.id && issue.key) {
          return (
            <div onClick={e => e.stopPropagation()}>
              <TaskLabelsField
                workspaceId={workspaceId}
                issue={issue}
                compact
                disabled={!canEditTask}
              />
            </div>
          );
        }
        const labels = (info.getValue() as { id?: string; name: string; color?: string }[]) ?? [];
        return (
          <div className="flex flex-wrap gap-1 items-center min-h-6 px-1">
            {labels.map((l, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 pl-1.5 pr-0.5 py-0.5 rounded-[6px] text-[0.6875rem] font-medium text-white"
                style={{ backgroundColor: l.color ?? '#6366f1' }}
              >
                {l.name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      size: 40,
      enableResizing: false,
      cell: ({ row }) => (
        <button
          className="p-1.5 text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors opacity-0 group-hover:opacity-100"
          onClick={e => { e.stopPropagation(); void (onClickTask && onClickTask(row.original)); }}
          title="Open"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      ),
    },
  ], [onClickTask, onUpdateIssue, normalizedMembers, boardColumns, editingCell, editValue, canEditTask, workspaceId, saveEdit, hasSelectionColumn, expanded, subtasksByParentId]);

  const table = useReactTable({
    data: issues,
    columns,
    state: {
      columnVisibility,
      columnSizing,
      columnFilters,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    enableColumnResizing: true,
    columnResizeMode,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-white font-sans dark:border-white/[0.06] dark:bg-[#202020]">

      {/* Data Grid Table */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse table-fixed" style={{ width: table.getCenterTotalSize() }}>
          <thead className="sticky top-0 z-10 bg-[#F9F9F8] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.06]">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  (() => {
                    const isPinned = header.column.id === 'checkbox' || header.column.id === 'key';
                    const left = header.column.id === 'key' && hasSelectionColumn ? 40 : 0;
                    return (
                      <th
                        key={header.id}
                        style={{ width: header.getSize(), ...(isPinned ? { left } : {}) }}
                        className={`relative px-3 py-3 text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wider bg-[#F9F9F8] dark:bg-[#252525] select-none ${isPinned ? 'sticky z-20' : ''}`}
                      >
                        <div className="flex items-center">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-[#2563EB]/50 bg-[#EAEAEA]/0 ${header.column.getIsResizing() ? 'bg-[#2563EB]' : ''}`}
                          />
                        )}
                      </th>
                    );
                  })()
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[#EAEAEA] dark:divide-white/[0.06] bg-white dark:bg-[#202020]">
            {table.getRowModel().rows.map(row => (
              <React.Fragment key={row.id}>
                <tr
                  className={`hover:bg-[#F9F9F8]/50 dark:hover:bg-white/5 transition-colors group ${row.getIsSelected() ? 'bg-[#EFF6FF]/70 dark:bg-[rgba(37,99,235,0.12)]' : ''}`}
                  onMouseEnter={() => {
                    const issue = row.original;
                    const localSubtasks = subtasksByParentId[issue.id];
                    const hasSubtasksData = (localSubtasks && localSubtasks.length > 0) || ((issue.subtaskProgress?.total ?? 0) > 0);
                    if (hasSubtasksData && !localSubtasks?.length) {
                      prefetchSubtasks(issue.id);
                    }
                  }}
                >
                  {row.getVisibleCells().map(cell => {
                    const isPinned = cell.column.id === 'checkbox' || cell.column.id === 'key';
                    const left = cell.column.id === 'key' && hasSelectionColumn ? 40 : 0;
                    return (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize(), ...(isPinned ? { left } : {}) }}
                        className={`px-3 py-2 border-r border-transparent group-hover:border-[#EAEAEA] dark:group-hover:border-white/[0.06] last:border-r-0 overflow-visible ${isPinned ? 'sticky z-10 bg-white dark:bg-[#202020] group-hover:bg-[#F9F9F8] dark:group-hover:bg-[#252525]' : ''}`}
                      >
                        {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
                {expanded[row.original.id] && (() => {
                  const localSubtasks = subtasksByParentId[row.original.id];
                  if (localSubtasks && localSubtasks.length > 0) {
                    return (
                      <LocalSubtasksRow
                        subtasks={localSubtasks}
                        visibleCells={row.getVisibleCells()}
                        onClickTask={onClickTask}
                        boardColumns={boardColumns}
                        onUpdateIssue={onUpdateIssue}
                        canEditTask={canEditTask}
                        members={normalizedMembers}
                      />
                    );
                  }
                  if (workspaceId) {
                    return (
                      <ExpandedSubtasksRow
                        parentIssue={row.original}
                        workspaceId={workspaceId}
                        visibleCells={row.getVisibleCells()}
                        onClickTask={onClickTask}
                        onUpdateIssue={onUpdateIssue}
                        canEditTask={canEditTask}
                        boardColumns={boardColumns}
                        members={normalizedMembers}
                      />
                    );
                  }
                  return null;
                })()}
              </React.Fragment>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length} className="px-3 py-8 text-center text-sm text-[#787774] dark:text-[#9B9A97]">
                  No issues found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex justify-between items-center p-3 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] shrink-0 h-14">
        {!isCreating && !hideCreate ? (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-1 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F9F9F8] dark:hover:bg-white/5 text-sm font-medium transition-colors flex items-center gap-2 "
          >
            + Create
          </button>
        ) : !hideCreate ? (
          <div className="flex items-center border border-[#2563EB] rounded-[6px] px-2 py-1 flex-1 max-w-[min(100%,var(--app-narrow-content))]  bg-white dark:bg-[#252525] gap-1">
            <input
              ref={inputRef}
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              onKeyDown={handleKeyDownInlineCreate}
              placeholder="What needs to be done?"
              className="flex-1 outline-none py-1 px-2 text-sm bg-transparent text-[#111111] dark:text-[#E8E8E7] placeholder-[#ABABAB]"
            />
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Type */}
              <TypePicker
                value={newTaskType}
                onChange={setNewTaskType}
                placement="top"
                variant="default"
                size="sm"
              />

              {/* Due date */}
              <div className="w-36">
                <CustomDatePicker
                  value={newTaskDate}
                  onChange={nextValue => setNewTaskDate(nextValue ?? '')}
                  placeholder="Due date"
                  inputClassName="h-8 border-transparent bg-transparent dark:bg-transparent text-sm"
                  popoverPlacement="top-end"
                  ariaLabel="New task due date"
                />
              </div>

              {/* Assignee */}
              <AssigneePicker
                users={toAssigneePickerUsers(members)}
                value={newTaskAssignee || null}
                onChange={uid => setNewTaskAssignee(uid ?? '')}
                placement="top"
                size="sm"
              />

              <button
                onClick={handleSubmitInlineCreate}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium px-3 py-1.5 rounded-[6px] flex items-center gap-1 transition-colors  ml-1"
              >
                Create
                <span className="text-[0.625rem] opacity-80 border border-[#93C5FD] rounded-[2px] px-[2px] py-[1px] leading-none bg-[#3B82F6]/30">{"↵"}</span>
              </button>
            </div>
          </div>
        ) : <div />}

        <div className="flex items-center gap-4 text-[#787774] dark:text-[#9B9A97] text-sm ml-4">
          <span className="font-medium">{table.getRowModel().rows.length} of {totalCount ?? issues.length}</span>
          <button
            onClick={() => onRefresh && !isRefreshing ? onRefresh() : null}
            disabled={isRefreshing}
            className={`p-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 text-[#787774] dark:text-[#9B9A97] transition-colors border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.06] ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh Data"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}} />

      {(canEditTask || canDeleteTask) && (
        <BulkActionBar
          selectedCount={selectedCount}
          onClear={() => setRowSelection({})}
          onBulkUpdate={handleBulkFieldUpdate}
          onDelete={handleBulkDelete}
          members={normalizedMembers}
          canEditTask={canEditTask}
          canDeleteTask={canDeleteTask}
        />
      )}
    </div>
  );
}

function ExpandedSubtasksRow({ parentIssue, workspaceId, visibleCells, onClickTask, onUpdateIssue, canEditTask, boardColumns, members }: { parentIssue: Record<string, unknown> & { id: string }, workspaceId: string, visibleCells: { id: string; column: { id: string; getSize: () => number } }[], onClickTask?: (issue: Record<string, unknown>) => void, onUpdateIssue?: (id: string, updates: Record<string, unknown>) => void, canEditTask?: boolean, boardColumns?: BoardColumn[], members?: AssigneePickerUser[] }) {
  const { subtasks, isLoading } = useSubtasks(workspaceId, parentIssue.id);
  const queryClient = useQueryClient();

  const handleUpdate = (id: string, updates: Record<string, unknown>) => {
    onUpdateIssue?.(id, updates);
    queryClient.setQueryData(queryKeys.tasks.subtasks(workspaceId, parentIssue.id), (old: { subtasks?: Subtask[] } | undefined) => {
      if (!old || !old.subtasks) return old;
      return {
        ...old,
        subtasks: old.subtasks.map((st: Subtask) => st.id === id ? { ...st, ...updates } : st),
      };
    });
  };

  if (isLoading) {
    return (
      <tr className="bg-[#F9F9F8]/20 dark:bg-white/[0.02]">
        <td colSpan={visibleCells.length} className="px-3 py-3 text-sm text-[#787774] dark:text-[#9B9A97] pl-10">
          Loading subtasks...
        </td>
      </tr>
    );
  }

  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  const hasSelectionColumn = visibleCells.some(c => c.column.id === 'checkbox');

  return (
    <>
      {subtasks.map((subtask: Subtask) => (
        <tr key={subtask.id} className="bg-[#F9F9F8]/40 dark:bg-white/[0.03] hover:bg-[#F9F9F8] dark:hover:bg-white/5 transition-colors group/subtask border-t border-[#EAEAEA]/50 dark:border-white/[0.04]">
          {visibleCells.map(cell => {
            const colId = cell.column.id;
            const isPinned = colId === 'checkbox' || colId === 'key';
            const left = colId === 'key' && hasSelectionColumn ? 40 : 0;
            const cellWidth = cell.column.getSize();
            
            let content: React.ReactNode = null;
            
            if (colId === 'checkbox') {
              content = <div className="w-4 h-4" />; // Empty placeholder for subtask checkbox
            } else if (colId === 'key') {
              content = (
                <div className="flex items-center justify-between min-w-0 group/key">
                  <div className="flex items-center gap-1.5 pl-4 truncate">
                    <CornerDownRight className="w-3 h-3 shrink-0 text-[#2563EB]/50 dark:text-[#3B82F6]/50" />
                    <span className="text-[#787774] dark:text-[#9B9A97] font-mono text-xs truncate mr-2">{subtask.key}</span>
                  </div>
                </div>
              );
            } else if (colId === 'title') {
              content = (
                <div className="flex items-center gap-2 min-w-0 pl-6">
                  <div className="w-4 h-4 shrink-0 bg-[#EFF6FF] text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.15)] dark:text-[#93C5FD] flex items-center justify-center rounded-[4px] text-[0.5625rem] font-bold border border-[#BFDBFE] dark:border-[#3B82F6]/30 flex-shrink-0">S</div>
                  <span 
                    className="min-w-0 flex-1 truncate text-[#111111] dark:text-[#E8E8E7] font-medium cursor-pointer hover:text-[#2563EB] dark:hover:text-[#3B82F6]"
                    onClick={(e) => { e.stopPropagation(); if(onClickTask) onClickTask({...subtask, type: 'Subtask'}); }}
                  >
                    {subtask.title}
                  </span>
                </div>
              );
            } else if (colId === 'type') {
              content = (
                <div onClick={e => e.stopPropagation()}>
                  <TypePicker
                    value={subtask.type ?? 'Subtask'}
                    onChange={type => handleUpdate(subtask.id, { type })}
                    disabled={!canEditTask}
                    variant="pill"
                    size="sm"
                    placement="bottom"
                  />
                </div>
              );
            } else if (colId === 'status') {
              content = (
                <StatusPicker
                  value={subtask.status}
                  columnId={subtask.columnId}
                  options={(boardColumns || []).map(col => ({ id: col.id, name: col.name }))}
                  variant="pill"
                  size="sm"
                  disabled={!canEditTask}
                  onChange={(status, option) =>
                    handleUpdate(subtask.id, { columnId: option.id, status })
                  }
                />
              );
            } else if (colId === 'priority') {
              content = (
                <div onClick={e => e.stopPropagation()}>
                  <PriorityPicker
                    value={subtask.priority || '-'}
                    onChange={p => handleUpdate(subtask.id, { priority: p })}
                    disabled={!canEditTask}
                    variant="pill"
                    size="sm"
                  />
                </div>
              );
            } else if (colId === 'assigneeId') {
              content = (
                <div onClick={e => e.stopPropagation()}>
                  <AssigneePicker
                    users={members || []}
                    value={subtask.assignee?.id ?? null}
                    onChange={uid => {
                      const selectedUser = (members || []).find(user => user.id === uid);
                      handleUpdate(subtask.id, {
                        assigneeId: uid,
                        assignee: {
                           ...subtask.assignee,
                           id: uid,
                           fullName: uid ? selectedUser?.name ?? uid : 'Unassigned',
                           avatar: uid ? selectedUser?.avatar : undefined,
                        }
                      });
                    }}
                    placement="bottom"
                    size="md"
                    disabled={!canEditTask}
                  />
                </div>
              );
            } else if (colId === 'startDate') {
              const v = subtask.startDate;
              content = (
                <div onClick={e => e.stopPropagation()}>
                  <CustomDatePicker
                    value={v}
                    onChange={nextValue => handleUpdate(subtask.id, { startDate: nextValue })}
                    disabled={!canEditTask}
                    inputClassName="h-8 border-transparent bg-transparent dark:bg-transparent px-2 pl-8"
                    popoverPlacement="bottom-start"
                    ariaLabel="Task start date"
                  />
                </div>
              );
            } else if (colId === 'dueDate') {
              const v = subtask.dueDate;
              const isOverdue = v && new Date(v) < new Date() && !subtask.status?.toLowerCase().includes('done');
              content = (
                <div className={isOverdue ? "text-[#9F2F2D] dark:text-[#F87171]" : ""} onClick={e => e.stopPropagation()}>
                  <CustomDatePicker
                    value={v}
                    onChange={nextValue => handleUpdate(subtask.id, { dueDate: nextValue })}
                    disabled={!canEditTask}
                    inputClassName="h-8 border-transparent bg-transparent dark:bg-transparent px-2 pl-8"
                    popoverPlacement="bottom-start"
                    ariaLabel="Task due date"
                  />
                </div>
              );
            } else {
              content = <span className="text-[#ABABAB] dark:text-[#6B6B6B] text-[0.8125rem]">-</span>;
            }
            
            return (
              <td
                key={cell.id}
                style={{ width: cellWidth, ...(isPinned ? { left } : {}) }}
                className={`px-3 py-2 border-r border-transparent group-hover/subtask:border-[#EAEAEA] dark:group-hover/subtask:border-white/[0.06] last:border-r-0 overflow-visible ${isPinned ? 'sticky z-10 bg-[#F9F9F8]/40 dark:bg-[#202020] group-hover/subtask:bg-[#F9F9F8] dark:group-hover/subtask:bg-[#252525]' : ''}`}
              >
                {content}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function LocalSubtasksRow({ subtasks, visibleCells, onClickTask, boardColumns, onUpdateIssue, canEditTask, members }: { subtasks: Subtask[], visibleCells: { id: string; column: { id: string; getSize: () => number } }[], onClickTask?: (issue: Subtask) => void, boardColumns?: BoardColumn[], onUpdateIssue?: (id: string, updates: Record<string, unknown>) => void, canEditTask?: boolean, members?: AssigneePickerUser[] }) {
  if (!subtasks || subtasks.length === 0) return null;

  const hasSelectionColumn = visibleCells.some((c: { column: { id: string } }) => c.column.id === 'checkbox');

  return (
    <>
      {subtasks.map((subtask: Subtask) => (
        <tr
          key={subtask.id}
          className="bg-[#F9F9F8]/40 dark:bg-white/[0.03] hover:bg-[#F0F7FF] dark:hover:bg-[rgba(37,99,235,0.06)] transition-colors group/subtask border-t border-[#EAEAEA]/50 dark:border-white/[0.04] cursor-pointer"
          onClick={() => onClickTask?.(subtask)}
        >
          {visibleCells.map((cell: { id: string; column: { id: string; getSize: () => number } }) => {
            const colId = cell.column.id;
            const isPinned = colId === 'checkbox' || colId === 'key';
            const left = colId === 'key' && hasSelectionColumn ? 40 : 0;
            const cellWidth = cell.column.getSize();

            let content: React.ReactNode = null;

            if (colId === 'checkbox') {
              content = <div className="w-4 h-4" />;
            } else if (colId === 'key') {
              content = (
                <div className="flex items-center justify-between min-w-0 group/key">
                  <div className="flex items-center gap-1.5 pl-4 truncate">
                    <CornerDownRight className="w-3 h-3 shrink-0 text-[#2563EB]/50 dark:text-[#3B82F6]/50" />
                    <span className="text-[#787774] dark:text-[#9B9A97] font-mono text-xs truncate mr-2">{subtask.key}</span>
                  </div>
                </div>
              );
            } else if (colId === 'title') {
              content = (
                <div className="flex items-center gap-2 min-w-0 pl-6">
                  <div className="w-4 h-4 shrink-0 bg-[#EFF6FF] text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.15)] dark:text-[#93C5FD] flex items-center justify-center rounded-[4px] text-[0.5625rem] font-bold border border-[#BFDBFE] dark:border-[#3B82F6]/30 flex-shrink-0">
                    S
                  </div>
                  <span
                    className="min-w-0 flex-1 truncate text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] font-medium hover:text-[#2563EB] dark:hover:text-[#3B82F6]"
                    onClick={(e) => { e.stopPropagation(); onClickTask?.(subtask); }}
                  >
                    {subtask.title}
                  </span>
                </div>
              );
            } else if (colId === 'type') {
              content = (
                <div onClick={e => e.stopPropagation()}>
                  <TypePicker
                    value={subtask.type ?? 'Subtask'}
                    onChange={type => onUpdateIssue?.(subtask.id, { type })}
                    disabled={!canEditTask}
                    variant="pill"
                    size="sm"
                    placement="bottom"
                  />
                </div>
              );
            } else if (colId === 'status') {
              content = (
                <StatusPicker
                  value={subtask.status}
                  columnId={subtask.columnId}
                  options={(boardColumns || []).map(col => ({ id: col.id, name: col.name }))}
                  variant="pill"
                  size="sm"
                  disabled={!canEditTask}
                  onChange={(status, option) =>
                    onUpdateIssue?.(subtask.id, { columnId: option.id, status })
                  }
                />
              );
            } else if (colId === 'priority') {
              content = (
                <div onClick={e => e.stopPropagation()}>
                  <PriorityPicker
                    value={subtask.priority || '-'}
                    onChange={p => onUpdateIssue?.(subtask.id, { priority: p })}
                    disabled={!canEditTask}
                    variant="pill"
                    size="sm"
                  />
                </div>
              );
            } else if (colId === 'assigneeId') {
              content = (
                <div onClick={e => e.stopPropagation()}>
                  <AssigneePicker
                    users={members || []}
                    value={subtask.assigneeId ?? null}
                    onChange={uid => {
                      const selectedUser = (members || []).find(user => user.id === uid);
                      onUpdateIssue?.(subtask.id, {
                        assigneeId: uid,
                        assignee: uid ?? 'U',
                        assigneeDisplayName: uid ? selectedUser?.name ?? uid : 'Unassigned',
                        assigneeAvatar: uid ? selectedUser?.avatar : undefined,
                      });
                    }}
                    placement="bottom"
                    size="md"
                    disabled={!canEditTask}
                  />
                </div>
              );
            } else if (colId === 'startDate') {
              const v = subtask.startDate;
              content = (
                <div onClick={e => e.stopPropagation()}>
                  <CustomDatePicker
                    value={v}
                    onChange={nextValue => onUpdateIssue?.(subtask.id, { startDate: nextValue })}
                    disabled={!canEditTask}
                    inputClassName="h-8 border-transparent bg-transparent dark:bg-transparent px-2 pl-8"
                    popoverPlacement="bottom-start"
                    ariaLabel="Task start date"
                  />
                </div>
              );
            } else if (colId === 'dueDate') {
              const v = subtask.dueDate;
              const isOverdue = v && new Date(v) < new Date() && !subtask.status?.toLowerCase().includes('done');
              content = (
                <div className={isOverdue ? "text-[#9F2F2D] dark:text-[#F87171]" : ""} onClick={e => e.stopPropagation()}>
                  <CustomDatePicker
                    value={v}
                    onChange={nextValue => onUpdateIssue?.(subtask.id, { dueDate: nextValue })}
                    disabled={!canEditTask}
                    inputClassName="h-8 border-transparent bg-transparent dark:bg-transparent px-2 pl-8"
                    popoverPlacement="bottom-start"
                    ariaLabel="Task due date"
                  />
                </div>
              );
            } else if (colId === 'updatedAt') {
              const v = subtask.updatedAt;
              content = <span className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">{v ? v.slice(0, 10) : '-'}</span>;
            } else if (colId === 'storyPoints') {
              const pts = subtask.storyPoints;
              content = (
                <span className="w-6 h-6 flex items-center justify-center bg-[#F7F6F3] dark:bg-[#2A2A2A] rounded-[6px] text-xs font-bold text-[#787774] dark:text-[#9B9A97]">
                  {pts || '-'}
                </span>
              );
            } else if (colId === 'actions') {
              content = null;
            } else {
              content = <span className="text-[#ABABAB] dark:text-[#6B6B6B] text-[0.8125rem]">-</span>;
            }

            return (
              <td
                key={`${subtask.id}-${colId}`}
                style={{ width: cellWidth, ...(isPinned ? { left } : {}) }}
                className={`px-3 py-2 border-r border-transparent group-hover/subtask:border-[#EAEAEA] dark:group-hover/subtask:border-white/[0.06] last:border-r-0 overflow-visible ${isPinned ? 'sticky z-10 bg-[#F9F9F8]/40 dark:bg-[#202020] group-hover/subtask:bg-[#F0F7FF] dark:group-hover/subtask:bg-[rgba(37,99,235,0.06)]' : ''}`}
              >
                {content}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
