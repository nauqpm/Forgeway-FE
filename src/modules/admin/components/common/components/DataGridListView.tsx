import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  useReactTable,
  ColumnDef,
  ColumnResizeMode,
  VisibilityState,
  GroupingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Columns, MoreHorizontal, FileText, Search, ListFilter, Group, RefreshCcw, Calendar, User, CheckSquare } from 'lucide-react';
import BulkActionBar from './BulkActionBar';
import BulkEditDrawer from './BulkEditDrawer';

interface DataGridListViewProps {
  issues: any[];
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
  onClickTask, 
  onUpdateIssue, 
  onCreateTask, 
  onRefresh, 
  isRefreshing, 
  totalCount,
  onBulkUpdate,
  onBulkDelete
}: DataGridListViewProps) {
  // Load settings from localStorage
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('list_visible_columns');
      if (saved) return JSON.parse(saved);
    }
    return { id: true, title: true, status: true, priority: true, assignee: true, sprintId: true, storyPoints: true, startDate: true, endDate: true };
  });

  const [columnSizing, setColumnSizing] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('list_column_sizing');
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('list_visible_columns', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  useEffect(() => {
    localStorage.setItem('list_column_sizing', JSON.stringify(columnSizing));
  }, [columnSizing]);

  const [columnResizeMode, setColumnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [globalFilter, setGlobalFilter] = useState('');
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkEditDrawerOpen, setIsBulkEditDrawerOpen] = useState(false);

  // Footer Inline Create state
  const [isCreating, setIsCreating] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState("Task");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleSubmitInlineCreate = async () => {
    if (!taskTitle.trim() || !onCreateTask) return;
    await onCreateTask({ 
      title: taskTitle, 
      type: newTaskType, 
      status: 'To Do',
      assignee: newTaskAssignee || null,
      dueDate: newTaskDate || null
    });
    setTaskTitle("");
    // Giữ nguyên type/assignee/date để user có thể tạo hàng loạt task cùng loại nhanh chóng
  };

  const handleKeyDownInlineCreate = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmitInlineCreate();
    if (e.key === 'Escape') setIsCreating(false);
  };

  // Bulk Actions
  const selectedCount = Object.keys(rowSelection).filter(k => (rowSelection as any)[k]).length;
  
  const getSelectedTaskIds = () => {
    return table.getSelectedRowModel().flatRows.map(row => row.original.id);
  };

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

  // Avatar pile mock data for Quick Filter
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set<string>();
    issues.forEach(issue => {
      if (issue.assignee && issue.assignee !== 'U') assignees.add(issue.assignee);
    });
    return Array.from(assignees);
  }, [issues]);

  const toggleAssigneeFilter = (assignee: string) => {
    setColumnFilters(prev => {
      const existingFilter = prev.find(f => f.id === 'assignee');
      let currentAssignees = existingFilter ? (existingFilter.value as string[]) : [];
      
      if (currentAssignees.includes(assignee)) {
        currentAssignees = currentAssignees.filter(a => a !== assignee);
      } else {
        currentAssignees = [...currentAssignees, assignee];
      }
      
      if (currentAssignees.length === 0) {
        return prev.filter(f => f.id !== 'assignee');
      }
      return [...prev.filter(f => f.id !== 'assignee'), { id: 'assignee', value: currentAssignees }];
    });
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'checkbox',
      header: ({ table }) => (
        <input 
          type="checkbox" 
          className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer" 
          checked={table.getIsAllRowsSelected()}
          ref={input => {
            if (input) input.indeterminate = table.getIsSomeRowsSelected();
          }}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input 
          type="checkbox" 
          className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer" 
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
      enableResizing: false,
    },
    {
      accessorKey: 'id',
      header: 'Key',
      size: 80,
      cell: (info) => <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'title',
      header: 'Work',
      size: 300,
      cell: (info) => {
        const issue = info.row.original;
        return (
          <div 
            className="flex items-center gap-2 cursor-pointer hover:underline text-gray-800 dark:text-gray-200 font-medium"
            onClick={() => onClickTask && onClickTask(issue)}
          >
            <FileText className={`w-4 h-4 ${issue.type === 'Bug' ? 'text-red-500' : issue.type === 'Story' ? 'text-emerald-500' : 'text-blue-500'}`} />
            <span className="truncate">{info.getValue() as string}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 150,
      cell: (info) => {
        const issue = info.row.original;
        const status = info.getValue() as string;
        return (
          <select 
            value={status}
            onChange={(e) => onUpdateIssue && onUpdateIssue(issue.id, { status: e.target.value })}
            className={`px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-bold cursor-pointer outline-none border-none focus:ring-2 focus:ring-indigo-500`}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      size: 120,
      cell: (info) => <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'assignee',
      header: 'Assignee',
      size: 120,
      filterFn: (row, id, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(row.getValue(id));
      },
      cell: (info) => {
        const assignee = info.getValue() as string;
        return assignee && assignee !== 'U' ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
              {assignee}
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">{assignee}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500 italic">Unassigned</span>
        );
      },
    },
    {
      accessorKey: 'storyPoints',
      header: 'Story Points',
      size: 100,
      cell: (info) => {
        const pts = info.getValue() as number;
        return <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-xs font-bold text-gray-600 dark:text-gray-300">{pts || '-'}</span>;
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      size: 150,
      cell: (info) => <span className="text-sm text-gray-600 dark:text-gray-400">{info.getValue() as string || '-'}</span>,
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      size: 150,
      cell: (info) => <span className="text-sm text-gray-600 dark:text-gray-400">{info.getValue() as string || '-'}</span>,
    },
    {
      id: 'actions',
      header: '',
      size: 50,
      enableResizing: false,
      cell: () => (
        <button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      ),
    }
  ], [onClickTask, onUpdateIssue]);

  const table = useReactTable({
    data: issues,
    columns,
    state: {
      columnVisibility,
      columnSizing,
      globalFilter,
      grouping,
      expanded,
      columnFilters,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    enableColumnResizing: true,
    columnResizeMode,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  return (
    <div className="workspace-list-height bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col font-sans">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search in list..." 
              className="w-full min-w-[220px] max-w-[min(100vw-48px,20rem)] pl-9 pr-4 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm sm:w-[clamp(240px,20vw,320px)]"
            />
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          {/* Quick Filter: Avatar Pile */}
          <div className="flex items-center -space-x-2">
            {uniqueAssignees.slice(0, 4).map((assignee, idx) => {
              const isActive = (columnFilters.find(f => f.id === 'assignee')?.value as string[] | undefined)?.includes(assignee);
              return (
                <div 
                  key={idx}
                  onClick={() => toggleAssigneeFilter(assignee)}
                  className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-[10px] font-bold border-2 cursor-pointer transition-transform hover:z-10 hover:scale-110 ${isActive ? 'bg-indigo-600 border-indigo-200 ring-2 ring-indigo-500' : 'bg-gray-400 border-white'}`}
                  title={assignee}
                >
                  {assignee.substring(0, 2).toUpperCase()}
                </div>
              );
            })}
            {uniqueAssignees.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center text-[10px] font-bold z-0">
                +{uniqueAssignees.length - 4}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Popover Button */}
          <button className="inline-flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm transition-colors shadow-sm">
            <ListFilter className="w-4 h-4 text-gray-500 dark:text-gray-400" /> Filter
          </button>

          {/* Group By Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowGroupMenu(!showGroupMenu)}
              className={`inline-flex items-center gap-2 border px-3 py-1.5 rounded-lg font-medium text-sm transition-colors shadow-sm ${grouping.length > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
            >
              <Group className={`w-4 h-4 ${grouping.length > 0 ? 'text-indigo-600' : 'text-gray-500'}`} /> 
              Group: {grouping.length > 0 ? grouping.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ') : 'None'}
            </button>
            {showGroupMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Group By</span>
                  {grouping.length > 0 && (
                    <button onClick={() => setGrouping([])} className="text-xs text-indigo-600 hover:underline">Clear</button>
                  )}
                </div>
                {['status', 'priority', 'assignee'].map(field => (
                  <label key={field} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer">
                    <input
                      type="radio"
                      name="grouping"
                      checked={grouping.includes(field)}
                      onChange={() => {
                        setGrouping([field]);
                        setShowGroupMenu(false);
                      }}
                      className="rounded-full text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{field}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Column Management Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="inline-flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm transition-colors shadow-sm"
            >
              <Columns className="w-4 h-4 text-gray-500 dark:text-gray-400" /> Columns
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2 uppercase tracking-wider">Show/Hide Columns</div>
                {table.getAllLeafColumns().map(column => {
                  if (column.id === 'checkbox' || column.id === 'actions') return null;
                  return (
                    <label key={column.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{column.id}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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
                    className="relative px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 select-none group"
                  >
                    <div className="flex items-center justify-between">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                    {/* Resizer */}
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
            {table.getRowModel().rows.map(row => {
              if (row.getIsGrouped()) {
                return (
                  <tr key={row.id} className="bg-gray-50 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
                    <td colSpan={row.getVisibleCells().length} className="px-3 py-2 cursor-pointer" onClick={row.getToggleExpandedHandler()}>
                      <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                        {row.getIsExpanded() ? <ChevronDown className="w-4 h-4 text-gray-500"/> : <ChevronRight className="w-4 h-4 text-gray-500"/>}
                        <span className="capitalize">{row.groupingColumnId}</span>: {row.groupingColumnId ? (row.getValue(row.groupingColumnId) as string) || 'Unassigned' : 'Unassigned'} 
                        <span className="text-gray-400 font-normal text-xs ml-1">({row.subRows.length})</span>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={row.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group ${row.getIsSelected() ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      style={{ width: cell.column.getSize() }}
                      className="px-3 py-2 border-r border-transparent group-hover:border-gray-100 last:border-r-0"
                    >
                      {cell.getIsGrouped() ? null : cell.getIsAggregated() ? (
                        flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())
                      ) : cell.getIsPlaceholder() ? null : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
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
        {/* Create Area */}
        {!isCreating ? (
          <button 
            onClick={() => setIsCreating(true)} 
            className="px-4 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            + Create
          </button>
        ) : (
          <div className="flex items-center border border-indigo-500 rounded-md px-2 py-1 flex-1 max-w-[min(100%,var(--app-narrow-content))] shadow-sm bg-white dark:bg-gray-800">
             {/* Type Selector thay cho tia chớp */}
             <select 
               value={newTaskType}
               onChange={e => setNewTaskType(e.target.value)}
               className="outline-none text-sm bg-transparent cursor-pointer text-gray-600 dark:text-gray-300 font-medium pl-1 pr-2"
               title="Issue Type"
             >
               <option value="Task">☑️ Task</option>
               <option value="Story">📗 Story</option>
               <option value="Bug">🐞 Bug</option>
               <option value="Epic">⚡ Epic</option>
             </select>
             
             <input 
               ref={inputRef}
               value={taskTitle}
               onChange={(e) => setTaskTitle(e.target.value)}
               onKeyDown={handleKeyDownInlineCreate}
               placeholder="What needs to be done?"
               className="flex-1 outline-none py-1 px-3 text-sm ml-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
             />
             
             <div className="flex items-center gap-1 shrink-0 pr-1">
               {/* Date Picker */}
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

               {/* Assignee Picker */}
               <div className="relative flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1.5 rounded cursor-pointer transition-colors" title="Assign User">
                 <User className="w-4 h-4" />
                 <select
                   value={newTaskAssignee}
                   onChange={e => setNewTaskAssignee(e.target.value)}
                   className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                 >
                   <option value="">Unassigned</option>
                   {uniqueAssignees.map(a => (
                     <option key={a} value={a}>{a}</option>
                   ))}
                 </select>
                 {newTaskAssignee && <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate">{newTaskAssignee}</span>}
               </div>

               {/* Create Button */}
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

        {/* Info & Refresh */}
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

      {isBulkEditDrawerOpen && (
        <BulkEditDrawer
          isOpen={isBulkEditDrawerOpen}
          onClose={() => setIsBulkEditDrawerOpen(false)}
          selectedCount={selectedCount}
          uniqueAssignees={uniqueAssignees}
          onSubmit={handleBulkEditSubmit}
        />
      )}
    </div>
  );
}
