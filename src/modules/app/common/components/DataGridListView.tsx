import React, { useState, useEffect, useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  ColumnResizeMode,
  VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown, Columns, MoreHorizontal, FileText, CheckSquare } from 'lucide-react';

interface DataGridListViewProps {
  issues: any[];
  onClickTask?: (issue: any) => void;
  onUpdateIssue?: (issueId: string, updates: any) => void;
}

export default function DataGridListView({ issues, onClickTask, onUpdateIssue }: DataGridListViewProps) {
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

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'checkbox',
      header: () => <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" />,
      cell: () => <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />,
      size: 50,
      enableResizing: false,
    },
    {
      accessorKey: 'id',
      header: 'Key',
      size: 80,
      cell: (info) => <span className="text-gray-500 font-mono text-xs">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'title',
      header: 'Work',
      size: 300,
      cell: (info) => {
        const issue = info.row.original;
        return (
          <div 
            className="flex items-center gap-2 cursor-pointer hover:underline text-gray-800 font-medium"
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
            className={`px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold cursor-pointer outline-none border-none focus:ring-2 focus:ring-indigo-500`}
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
      cell: (info) => <span className="text-sm text-gray-600 font-medium">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'assignee',
      header: 'Assignee',
      size: 120,
      cell: (info) => {
        const assignee = info.getValue() as string;
        return assignee && assignee !== 'U' ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
              {assignee}
            </div>
            <span className="text-sm text-gray-700">{assignee}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">Unassigned</span>
        );
      },
    },
    {
      accessorKey: 'storyPoints',
      header: 'Story Points',
      size: 100,
      cell: (info) => {
        const pts = info.getValue() as number;
        return <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-bold text-gray-600">{pts || '-'}</span>;
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      size: 150,
      cell: (info) => <span className="text-sm text-gray-600">{info.getValue() as string || '-'}</span>,
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      size: 150,
      cell: (info) => <span className="text-sm text-gray-600">{info.getValue() as string || '-'}</span>,
    },
    {
      id: 'actions',
      header: '',
      size: 50,
      enableResizing: false,
      cell: () => (
        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
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
    },
    enableColumnResizing: true,
    columnResizeMode,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col font-sans h-[700px]">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search in list..." 
              className="pl-3 pr-8 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Column Management Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm"
            >
              <Columns className="w-4 h-4 text-gray-500" /> Columns
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2">
                <div className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Show/Hide Columns</div>
                {table.getAllLeafColumns().map(column => {
                  if (column.id === 'checkbox' || column.id === 'actions') return null;
                  return (
                    <label key={column.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{column.id}</span>
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
          <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm border-b border-gray-200">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    style={{ width: header.getSize() }}
                    className="relative px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 select-none group"
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
          <tbody className="divide-y divide-gray-100 bg-white">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id} 
                    style={{ width: cell.column.getSize() }}
                    className="px-3 py-2 border-r border-transparent group-hover:border-gray-100 last:border-r-0"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}} />
    </div>
  );
}
