"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { ChevronDown, MoreHorizontal, FileText, RefreshCcw, Check } from 'lucide-react';
import BulkActionBar from './BulkActionBar';
import BulkEditDrawer from './BulkEditDrawer';
import AssigneePicker, { AssigneePickerMember, getMemberId, toAssigneePickerUsers } from '../../../../../common/components/AssigneePicker';
import CustomDatePicker from '../../../../../common/components/CustomDatePicker';
import TaskLabelsField from '../../../../client/workspaces/components/labels/TaskLabelsField';
import StatusPicker from '../../../../../common/components/StatusPicker';

type WorkspaceMember = AssigneePickerMember;

type BoardColumn = {
  id: string;
  name: string;
  order: number;
  mappedStatuses?: string[];
  isDone?: boolean;
};


const PRIORITY_OPTIONS = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];

const PRIORITY_CLS: Record<string, string> = {
  Highest: 'bg-[#FDEBEC] text-[#7F1D1D] dark:bg-[rgba(127,29,29,0.18)] dark:text-[#FCA5A5]',
  High:   'bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[rgba(159,47,45,0.12)] dark:text-[#F87171]',
  Medium: 'bg-[#FBF3DB] text-[#956400] dark:bg-[rgba(149,100,0,0.12)] dark:text-[#F59E0B]',
  Low:    'bg-[#EFF6FF] text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]',
  Lowest: 'bg-[#EAF6EF] text-[#346538] dark:bg-[rgba(52,101,56,0.12)] dark:text-[#86EFAC]',
};

interface DataGridListViewProps {
  issues: any[];
  workspaceId?: string;
  members?: WorkspaceMember[];
  boardColumns?: BoardColumn[];
  columnVisibility?: VisibilityState;
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>;
  onClickTask?: (issue: any) => void;
  onUpdateIssue?: (issueId: string, updates: any) => void;
  onCreateTask?: (task: any) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  totalCount?: number;
  onBulkUpdate?: (taskIds: string[], updates: any) => Promise<void>;
  onBulkDelete?: (taskIds: string[]) => Promise<void>;
  hideCreate?: boolean;
  canEditTask?: boolean;
  canDeleteTask?: boolean;
}

export default function DataGridListView({
  issues,
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
  const [isBulkEditDrawerOpen, setIsBulkEditDrawerOpen] = useState(false);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ rowId: string; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [openDropdown, setOpenDropdown] = useState<{ rowId: string; col: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    if (openDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const saveEdit = (rowId: string, field: string, value: any) => {
    onUpdateIssue && onUpdateIssue(rowId, { [field]: value });
    setEditingCell(null);
    setEditValue('');
  };

  const toggleDropdown = (rowId: string, col: string) => {
    setOpenDropdown(prev =>
      prev?.rowId === rowId && prev?.col === col ? null : { rowId, col }
    );
  };

  // Footer Inline Create state
  const [isCreating, setIsCreating] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) inputRef.current.focus();
  }, [isCreating]);

  const handleSubmitInlineCreate = async () => {
    if (!taskTitle.trim() || !onCreateTask) return;
    await onCreateTask({ title: taskTitle, type: 'Task', assigneeId: newTaskAssignee || null, dueDate: newTaskDate || null });
    setTaskTitle('');
    setNewTaskAssignee('');
    setNewTaskDate('');
    setIsCreating(false);
  };

  const handleKeyDownInlineCreate = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmitInlineCreate();
    if (e.key === 'Escape') setIsCreating(false);
  };

  // Bulk Actions
  const selectedCount = Object.keys(rowSelection).filter(k => (rowSelection as any)[k]).length;

  const getSelectedTaskIds = () => table.getSelectedRowModel().flatRows.map(row => row.original.id);

  const handleBulkStatusChange = async (status: string) => {
    if (!onBulkUpdate) return;
    const ids = getSelectedTaskIds();
    setRowSelection({});
    await onBulkUpdate(ids, { status });
  };

  const handleBulkEditSubmit = async (payload: any) => {
    if (!onBulkUpdate) return;
    const ids = getSelectedTaskIds();
    setIsBulkEditDrawerOpen(false);
    setRowSelection({});
    await onBulkUpdate(ids, payload);
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    if (confirm(`Are you sure you want to delete ${selectedCount} items?`)) {
      const ids = getSelectedTaskIds();
      setRowSelection({});
      await onBulkDelete(ids);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    ...(canEditTask || canDeleteTask ? [{
      id: 'checkbox',
      header: ({ table }: any) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded-[6px] accent-[#2563EB] cursor-pointer"
          checked={table.getIsAllRowsSelected()}
          ref={(input: HTMLInputElement | null) => { if (input) input.indeterminate = table.getIsSomeRowsSelected(); }}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
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
      cell: info => {
        const issue = info.row.original;
        const isEditing = editingCell?.rowId === issue.id && editingCell?.col === 'title';
        const typeIcon = issue.type === 'Bug' ? 'text-[#9F2F2D]' : issue.type === 'Story' ? 'text-[#346538]' : 'text-[#1F6C9F]';
        if (canEditTask && isEditing) {
          return (
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <FileText className={`w-4 h-4 shrink-0 ${typeIcon}`} />
              <input
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => { if (editValue.trim() && editValue !== issue.title) saveEdit(issue.id, 'title', editValue.trim()); else setEditingCell(null); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { if (editValue.trim() && editValue !== issue.title) saveEdit(issue.id, 'title', editValue.trim()); else setEditingCell(null); }
                  if (e.key === 'Escape') setEditingCell(null);
                }}
                className="flex-1 px-1.5 py-0.5 text-sm border border-[#2563EB] rounded-[6px] outline-none bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7]"
              />
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 group/title">
            <FileText className={`w-4 h-4 shrink-0 ${typeIcon}`} />
            <span
              className="truncate text-[#111111] dark:text-[#E8E8E7] font-medium cursor-pointer hover:text-[#2563EB] dark:hover:text-[#3B82F6]"
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
              onClick={e => { e.stopPropagation(); onClickTask && onClickTask(issue); }}
              title="Open detail"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
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
        const priority = (info.getValue() as string) || 'Medium';
        const isOpen = openDropdown?.rowId === issue.id && openDropdown?.col === 'priority';
        return (
          <div className="relative" onClick={e => e.stopPropagation()} ref={isOpen ? dropdownRef : undefined}>
            <button
              onClick={() => toggleDropdown(issue.id, 'priority')}
              disabled={!canEditTask}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${PRIORITY_CLS[priority] ?? PRIORITY_CLS.Medium}`}
            >
              {priority}
              {canEditTask && <ChevronDown className="w-3 h-3" />}
            </button>
            {canEditTask && isOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 min-w-[7.5rem] bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] overflow-hidden">
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => { onUpdateIssue && onUpdateIssue(issue.id, { priority: p }); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F9F9F8] dark:hover:bg-white/5 flex items-center gap-2 transition-colors ${p === priority ? 'font-semibold' : 'text-[#787774] dark:text-[#9B9A97]'}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      p === 'Highest'
                        ? 'bg-[#7F1D1D]'
                        : p === 'High'
                          ? 'bg-[#9F2F2D]'
                          : p === 'Medium'
                            ? 'bg-[#956400]'
                            : p === 'Low'
                              ? 'bg-[#1F6C9F]'
                              : 'bg-[#346538]'
                    }`} />
                    {p}
                    {p === priority && <Check className="w-3.5 h-3.5 ml-auto text-[#2563EB]" />}
                  </button>
                ))}
              </div>
            )}
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
              users={toAssigneePickerUsers(members)}
              value={assigneeId ?? null}
              onChange={uid => onUpdateIssue && onUpdateIssue(issue.id, { assigneeId: uid })}
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
          onClick={e => { e.stopPropagation(); onClickTask && onClickTask(row.original); }}
          title="Open"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      ),
    },
  ], [onClickTask, onUpdateIssue, members, boardColumns, editingCell, editValue, openDropdown, canEditTask, canDeleteTask, workspaceId]);

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
    <div className="workspace-list-height bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden flex flex-col font-sans">

      {/* Data Grid Table */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse" style={{ width: table.getCenterTotalSize() }}>
          <thead className="sticky top-0 z-10 bg-[#F9F9F8] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.06]">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="relative px-3 py-3 text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wider bg-[#F9F9F8] dark:bg-[#252525] select-none"
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
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[#EAEAEA] dark:divide-white/[0.06] bg-white dark:bg-[#202020]">
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={`hover:bg-[#F9F9F8]/50 dark:hover:bg-white/5 transition-colors group ${row.getIsSelected() ? 'bg-[#EFF6FF]/70 dark:bg-[rgba(37,99,235,0.12)]' : ''}`}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className="px-3 py-2 border-r border-transparent group-hover:border-[#EAEAEA] dark:group-hover:border-white/[0.06] last:border-r-0 overflow-visible"
                  >
                    {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
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
      <div className="flex justify-between items-center p-3 border-t border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020] shrink-0 h-14">
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
                <span className="text-[0.625rem] opacity-80 border border-[#93C5FD] rounded-[2px] px-[2px] py-[1px] leading-none bg-[#3B82F6]/30">↵</span>
              </button>
            </div>
          </div>
        ) : <div />}

        <div className="flex items-center gap-4 text-[#787774] dark:text-[#9B9A97] text-sm ml-4">
          <span className="font-medium">{table.getRowModel().rows.length} of {totalCount ?? issues.length}</span>
          <button
            onClick={() => onRefresh && !isRefreshing ? onRefresh() : null}
            disabled={isRefreshing}
            className={`p-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 text-[#787774] dark:text-[#9B9A97] transition-colors border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/8 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          onChangeStatus={handleBulkStatusChange}
          onEditFields={canEditTask ? () => setIsBulkEditDrawerOpen(true) : undefined}
          onDelete={handleBulkDelete}
          canEditTask={canEditTask}
          canDeleteTask={canDeleteTask}
        />
      )}

      <BulkEditDrawer
        isOpen={isBulkEditDrawerOpen}
        onClose={() => setIsBulkEditDrawerOpen(false)}
        onSubmit={handleBulkEditSubmit}
        selectedCount={selectedCount}
        uniqueAssignees={(members ?? []).map(m => getMemberId(m)).filter(Boolean)}
      />
    </div>
  );
}
