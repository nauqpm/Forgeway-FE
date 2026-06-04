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
import { ChevronDown, MoreHorizontal, FileText, RefreshCcw, Calendar, User, X, Check } from 'lucide-react';
import BulkActionBar from './BulkActionBar';
import BulkEditDrawer from './BulkEditDrawer';

type WorkspaceMember = {
  userId: string | { _id?: string; id?: string; fullName?: string; name?: string; email?: string };
  role: string;
};

type BoardColumn = {
  id: string;
  name: string;
  order: number;
  mappedStatuses?: string[];
  isDone?: boolean;
};

function resolveMemberName(members: WorkspaceMember[] | undefined, assigneeId: string | undefined): string | null {
  if (!assigneeId || assigneeId === 'U' || !members) return null;
  for (const m of members) {
    const uid = typeof m.userId === 'string' ? m.userId : (m.userId?._id ?? m.userId?.id ?? '');
    if (uid === assigneeId) {
      const u = m.userId as any;
      return u?.fullName ?? u?.name ?? u?.email ?? null;
    }
  }
  return null;
}

function getMemberId(m: WorkspaceMember): string {
  return typeof m.userId === 'string' ? m.userId : (m.userId?._id ?? m.userId?.id ?? '');
}

function getMemberDisplayName(m: WorkspaceMember): string {
  if (typeof m.userId === 'string') return m.userId;
  const u = m.userId as any;
  return u?.fullName ?? u?.name ?? u?.email ?? 'Unknown';
}

const PRIORITY_OPTIONS = [ 'High', 'Medium', 'Low'];
const TYPE_OPTIONS = ['Task', 'Bug', 'Story', 'Epic'];

const PRIORITY_CLS: Record<string, string> = {
    High:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Low:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

function statusCls(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('done') || n.includes('complete')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (n.includes('progress')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (n.includes('test') || n.includes('review')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
}

interface DataGridListViewProps {
  issues: any[];
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
}

export default function DataGridListView({
  issues,
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
  const [newTaskType, setNewTaskType] = useState('Task');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) inputRef.current.focus();
  }, [isCreating]);

  const handleSubmitInlineCreate = async () => {
    if (!taskTitle.trim() || !onCreateTask) return;
    await onCreateTask({ title: taskTitle, type: newTaskType, status: 'To Do', assignee: newTaskAssignee || null, dueDate: newTaskDate || null });
    setTaskTitle('');
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
    {
      id: 'checkbox',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer"
          checked={table.getIsAllRowsSelected()}
          ref={input => { if (input) input.indeterminate = table.getIsSomeRowsSelected(); }}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={e => e.stopPropagation()}
        />
      ),
      size: 40,
      enableResizing: false,
    },
    {
      accessorKey: 'key',
      header: 'Key',
      size: 110,
      cell: info => <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'title',
      header: 'Work',
      size: 300,
      cell: info => {
        const issue = info.row.original;
        const isEditing = editingCell?.rowId === issue.id && editingCell?.col === 'title';
        const typeIcon = issue.type === 'Bug' ? 'text-red-500' : issue.type === 'Story' ? 'text-emerald-500' : 'text-blue-500';
        if (isEditing) {
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
                className="flex-1 px-1.5 py-0.5 text-sm border border-indigo-400 rounded outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 group/title">
            <FileText className={`w-4 h-4 shrink-0 ${typeIcon}`} />
            <span
              className="truncate text-gray-800 dark:text-gray-200 font-medium cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
              onClick={e => { e.stopPropagation(); setEditingCell({ rowId: issue.id, col: 'title' }); setEditValue(issue.title || ''); }}
              title="Click to edit"
            >
              {info.getValue() as string}
            </span>
            <button
              className="opacity-0 group-hover/title:opacity-100 ml-auto shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity"
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
        const status = info.getValue() as string;
        const isOpen = openDropdown?.rowId === issue.id && openDropdown?.col === 'status';
        const colOptions = boardColumns && boardColumns.length > 0
          ? boardColumns
          : [{ id: 'todo', name: 'To Do' }, { id: 'inprogress', name: 'In Progress' }, { id: 'testing', name: 'Testing' }, { id: 'done', name: 'Done' }];
        return (
          <div className="relative" onClick={e => e.stopPropagation()} ref={isOpen ? dropdownRef : undefined}>
            <button
              onClick={() => toggleDropdown(issue.id, 'status')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80 ${statusCls(status)}`}
            >
              {status}
              <ChevronDown className="w-3 h-3" />
            </button>
            {isOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 min-w-[150px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
                {colOptions.map(col => (
                  <button
                    key={col.id}
                    onClick={() => {
                      onUpdateIssue && onUpdateIssue(issue.id, { columnId: col.id, status: col.name });
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors ${col.name === status ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {col.name === status && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span className={col.name === status ? '' : 'ml-5'}>{col.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${PRIORITY_CLS[priority] ?? PRIORITY_CLS.Medium}`}
            >
              {priority}
              <ChevronDown className="w-3 h-3" />
            </button>
            {isOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 min-w-[120px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => { onUpdateIssue && onUpdateIssue(issue.id, { priority: p }); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors ${p === priority ? 'font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ p === 'High' ? 'bg-orange-500' : p === 'Medium' ? 'bg-yellow-500' : 'bg-blue-400'}`} />
                    {p}
                    {p === priority && <Check className="w-3.5 h-3.5 ml-auto text-indigo-500" />}
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
        const displayName = resolveMemberName(members, assigneeId) ?? (assigneeId && assigneeId !== 'U' ? assigneeId : null);
        const initials = displayName ? displayName.substring(0, 2).toUpperCase() : null;
        const isOpen = openDropdown?.rowId === issue.id && openDropdown?.col === 'assigneeId';
        return (
          <div className="relative" onClick={e => e.stopPropagation()} ref={isOpen ? dropdownRef : undefined}>
            <button
              onClick={() => toggleDropdown(issue.id, 'assigneeId')}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 py-0.5 transition-colors max-w-full"
            >
              {initials ? (
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{initials}</div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0">
                  <User className="w-3 h-3 text-gray-400" />
                </div>
              )}
              <span className={`text-sm truncate ${displayName ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                {displayName ?? 'Unassigned'}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
            </button>
            {isOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] max-h-52 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
                <button
                  onClick={() => { onUpdateIssue && onUpdateIssue(issue.id, { assigneeId: null }); setOpenDropdown(null); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0">
                    <X className="w-2.5 h-2.5" />
                  </div>
                  Unassigned
                </button>
                {(members ?? []).map(m => {
                  const uid = getMemberId(m);
                  const name = getMemberDisplayName(m);
                  const ini = name.substring(0, 2).toUpperCase();
                  return (
                    <button
                      key={uid}
                      onClick={() => { onUpdateIssue && onUpdateIssue(issue.id, { assigneeId: uid }); setOpenDropdown(null); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors ${uid === assigneeId ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">{ini}</div>
                      <span className="truncate">{name}</span>
                      {uid === assigneeId && <Check className="w-3.5 h-3.5 ml-auto text-indigo-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
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
        if (isEditing) {
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
              className="w-16 text-center text-xs border border-indigo-400 rounded outline-none px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          );
        }
        return (
          <span
            onClick={e => { e.stopPropagation(); setEditingCell({ rowId: issue.id, col: 'storyPoints' }); setEditValue(String(pts ?? 0)); }}
            className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-xs font-bold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            title="Click to edit"
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
          <div className="relative flex items-center gap-1.5 cursor-pointer group/date" onClick={e => e.stopPropagation()}>
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className={`text-sm ${v ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 italic'}`}>
              {v ? v.slice(0, 10) : 'Set date'}
            </span>
            <input
              type="date"
              value={v ? v.slice(0, 10) : ''}
              onChange={e => onUpdateIssue && onUpdateIssue(issue.id, { startDate: e.target.value || null })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              title="Start date"
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
          <div className="relative flex items-center gap-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
            <Calendar className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : v ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 italic'}`}>
              {v ? v.slice(0, 10) : 'Set date'}
            </span>
            <input
              type="date"
              value={v ? v.slice(0, 10) : ''}
              onChange={e => onUpdateIssue && onUpdateIssue(issue.id, { dueDate: e.target.value || null })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              title="Due date"
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
        return <span className="text-sm text-gray-500 dark:text-gray-400">{v ? v.slice(0, 10) : '-'}</span>;
      },
    },
    {
      accessorKey: 'labels',
      header: 'Labels',
      size: 200,
      cell: info => {
        const issue = info.row.original;
        const isAdding = editingCell?.rowId === issue.id && editingCell?.col === 'labels';
        const labels = (info.getValue() as { id?: string; name: string; color?: string }[]) ?? [];
        return (
          <div className="flex flex-wrap gap-1 items-center min-h-[24px]" onClick={e => e.stopPropagation()}>
            {labels.map((l, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 pl-1.5 pr-0.5 py-0.5 rounded text-[11px] font-medium text-white"
                style={{ backgroundColor: l.color ?? '#6366f1' }}
              >
                {l.name}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const next = labels.filter((_, idx) => idx !== i);
                    onUpdateIssue && onUpdateIssue(issue.id, { labelIds: next.map(x => x.id ?? x.name) });
                  }}
                  className="hover:opacity-75 p-0.5 rounded"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            {isAdding ? (
              <input
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && editValue.trim()) {
                    const newLabel = { id: editValue.trim(), name: editValue.trim() };
                    onUpdateIssue && onUpdateIssue(issue.id, { labelIds: [...labels.map(x => x.id ?? x.name), newLabel.id] });
                    setEditValue('');
                    setEditingCell(null);
                  }
                  if (e.key === 'Escape') { setEditingCell(null); setEditValue(''); }
                }}
                onBlur={() => { setEditingCell(null); setEditValue(''); }}
                placeholder="Label name + Enter"
                className="text-xs border border-indigo-400 rounded px-1.5 py-0.5 w-32 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
              />
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setEditingCell({ rowId: issue.id, col: 'labels' }); setEditValue(''); }}
                className="text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-1 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                + Add
              </button>
            )}
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
          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
          onClick={e => { e.stopPropagation(); onClickTask && onClickTask(row.original); }}
          title="Open"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      ),
    },
  ], [onClickTask, onUpdateIssue, members, boardColumns, editingCell, editValue, openDropdown]);

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
    <div className="workspace-list-height bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col font-sans">

      {/* Data Grid Table */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse" style={{ width: table.getCenterTotalSize() }}>
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="relative px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 select-none"
                  >
                    <div className="flex items-center">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-indigo-500/50 bg-gray-300/0 ${header.column.getIsResizing() ? 'bg-indigo-500' : ''}`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group ${row.getIsSelected() ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className="px-3 py-2 border-r border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-800 last:border-r-0 overflow-visible"
                  >
                    {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length} className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No issues found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex justify-between items-center p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0 h-14">
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            + Create
          </button>
        ) : (
          <div className="flex items-center border border-indigo-500 rounded-md px-2 py-1 flex-1 max-w-[min(100%,var(--app-narrow-content))] shadow-sm bg-white dark:bg-gray-800">
            <select
              value={newTaskType}
              onChange={e => setNewTaskType(e.target.value)}
              className="outline-none text-sm bg-transparent cursor-pointer text-gray-600 dark:text-gray-300 font-medium pl-1 pr-2"
              title="Task Type"
            >
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              ref={inputRef}
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              onKeyDown={handleKeyDownInlineCreate}
              placeholder="What needs to be done?"
              className="flex-1 outline-none py-1 px-3 text-sm ml-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
            />
            <div className="flex items-center gap-1 shrink-0 pr-1">
              <div className="relative flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1.5 rounded cursor-pointer transition-colors" title="Set Date">
                <Calendar className="w-4 h-4" />
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={e => setNewTaskDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {newTaskDate && <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{newTaskDate}</span>}
              </div>
              <div className="relative flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1.5 rounded cursor-pointer transition-colors" title="Assign User">
                <User className="w-4 h-4" />
                <select
                  value={newTaskAssignee}
                  onChange={e => setNewTaskAssignee(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  <option value="">Unassigned</option>
                  {(members ?? []).map(m => {
                    const uid = getMemberId(m);
                    const name = getMemberDisplayName(m);
                    return <option key={uid} value={uid}>{name}</option>;
                  })}
                </select>
                {newTaskAssignee && <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate">{resolveMemberName(members, newTaskAssignee) ?? newTaskAssignee}</span>}
              </div>
              <button
                onClick={handleSubmitInlineCreate}
                className="bg-[#0c66e4] hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded flex items-center gap-1 transition-colors shadow-sm ml-1"
              >
                Create
                <span className="text-[10px] opacity-80 border border-blue-400 rounded-[2px] px-[2px] py-[1px] ml-0.5 leading-none bg-blue-500/30">↵</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm ml-4">
          <span className="font-medium">{table.getRowModel().rows.length} of {totalCount ?? issues.length}</span>
          <button
            onClick={() => onRefresh && !isRefreshing ? onRefresh() : null}
            disabled={isRefreshing}
            className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh Data"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}} />

      <BulkActionBar
        selectedCount={selectedCount}
        onClear={() => setRowSelection({})}
        onChangeStatus={handleBulkStatusChange}
        onEditFields={() => setIsBulkEditDrawerOpen(true)}
        onDelete={handleBulkDelete}
      />

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
