"use client";

import { use, useState, useRef, useEffect } from "react";
import { 
  CheckCircle2, 
  CircleDashed, 
  Clock, 
  Search,
  ChevronDown,
  LayoutList,
  LayoutGrid,
  Share,
  Star,
  MoreHorizontal,
  X,
  Sparkles
} from "lucide-react";

// Hook to detect click outside
function useOnClickOutside(ref: React.RefObject<any>, handler: (event: MouseEvent | TouchEvent) => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// Option Interface
interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string; // used for status tags
}

interface FilterGroup {
  name: string;
  options: FilterOption[];
}

// Reusable Filter Dropdown
function FilterDropdown({ 
  label, 
  searchPlaceholder, 
  groups, 
  selectedIds, 
  onChange,
  onClear
}: { 
  label: string; 
  searchPlaceholder: string;
  groups: FilterGroup[];
  selectedIds: string[];
  onChange: (id: string, checked: boolean) => void;
  onClear?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));

  const hasSelection = selectedIds.length > 0;
  
  // Filter options based on search
  const filteredGroups = groups.map(group => ({
    ...group,
    options: group.options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(group => group.options.length > 0);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors border ${
          hasSelection || isOpen
            ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      >
        {label} 
        {hasSelection && <span className="text-gray-400 font-normal">=</span>}
        {hasSelection && (
          <span className="truncate max-w-[100px]">
             {selectedIds.length === 1 ? groups.flatMap(g => g.options).find(o => o.id === selectedIds[0])?.label : `${selectedIds.length} selected`}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 ${hasSelection ? 'text-indigo-500' : 'text-gray-400'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden flex flex-col max-h-96">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label} = (equals)</span>
            {hasSelection && onClear && (
              <button onClick={onClear} className="text-xs text-indigo-600 hover:underline">Clear</button>
            )}
          </div>
          
          <div className="p-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input 
                autoFocus
                type="text" 
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-4">
            {filteredGroups.length === 0 ? (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No matches found</p>
            ) : (
              filteredGroups.map((group, i) => (
                <div key={i}>
                  {group.name && <h4 className="text-xs font-semibold text-gray-500 mb-2 px-2">{group.name}</h4>}
                  <div className="space-y-1">
                    {group.options.map(opt => {
                      const isChecked = selectedIds.includes(opt.id);
                      return (
                        <label key={opt.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => onChange(opt.id, e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                          />
                          {opt.icon && <span className="text-gray-400 group-hover:text-gray-600">{opt.icon}</span>}
                          {opt.color ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${opt.color}`}>
                              {opt.label}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const filterTitles: Record<string, string> = {
  "my-tasks": "My open work items",
  "created-by-me": "Reported by me",
  "my-incomplete": "My open work items",
  "incomplete": "Open work items",
  "recently-created": "Created recently",
  "recently-viewed": "Viewed recently",
  "recently-updated": "Updated recently",
  "recently-completed": "Done work items",
};

export default function FilterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const title = filterTitles[slug] || "Custom filter";

  // Filter States (ready for backend)
  const [filterWorkspace, setFilterWorkspace] = useState<string[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string[]>(["current_user"]); // Default like Jira screenshot
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const clearAllFilters = () => {
    setFilterWorkspace([]);
    setFilterAssignee([]);
    setFilterType([]);
    setFilterStatus([]);
    setSearchQuery("");
  };

  // Static Mock Data configurations for Dropdowns
  const workspaceGroups: FilterGroup[] = [
    { name: "Recent Workspaces", options: [{ id: "workspace_quan", label: "quan" }, { id: "workspace_software", label: "My Software Team" }] },
    { name: "All Workspaces", options: [{ id: "workspace_backend", label: "Backend Team" }, { id: "workspace_frontend", label: "Frontend Team" }, { id: "workspace_design", label: "Design Team" }, { id: "workspace_product", label: "Product Team" }] }
  ];

  const assigneeGroups: FilterGroup[] = [
    { name: "", options: [{ id: "current_user", label: "Current User" }, { id: "unassigned", label: "Unassigned" }] },
    { name: "Users", options: [{ id: "user_quan", label: "Quân Phạm" }, { id: "user_minh", label: "Minh" }, { id: "user_tuan", label: "Tuấn" }, { id: "user_ha", label: "Hà" }] },
    { name: "Suggested Groups", options: [{ id: "group_jira", label: "jira-users-quanpham0405" }, { id: "group_admin", label: "org-admins" }] }
  ];

  const typeGroups: FilterGroup[] = [
    { name: "Standard work types", options: [
      { id: "Epic", label: "Epic" },
      { id: "Story", label: "Story" },
      { id: "Task", label: "Task" },
      { id: "Bug", label: "Bug" },
    ]},
    { name: "Subtasks", options: [{ id: "Subtask", label: "Subtask" }] }
  ];

  const statusGroups: FilterGroup[] = [
    { name: "", options: [
      { id: "Done", label: "DONE", color: "bg-emerald-100 text-emerald-700" },
      { id: "In Progress", label: "IN PROGRESS", color: "bg-blue-100 text-blue-700" },
      { id: "In Review", label: "IN REVIEW", color: "bg-blue-100 text-blue-700" },
      { id: "To Do", label: "TO DO", color: "bg-gray-100 text-gray-700" },
    ]}
  ];

  // Mock Issues (Normally fetched from API based on filters)
  const allMockIssues = [
    { id: "1", key: "AL-101", title: "Cập nhật tài liệu API cho tính năng mới", status: "In Progress", priority: "High", type: "Task", workspace: "Backend Team", assignee: "Quân Phạm", assigneeId: "user_quan", reporter: "Minh", updatedAt: "2 giờ trước" },
    { id: "2", key: "AL-102", title: "Sửa lỗi UI hiển thị sai trên mobile", status: "To Do", priority: "Medium", type: "Bug", workspace: "Frontend Team", assignee: "Tuấn", assigneeId: "user_tuan", reporter: "Quân Phạm", updatedAt: "Hôm qua" },
    { id: "3", key: "AL-105", title: "Thiết kế luồng Onboarding cho user mới", status: "Done", priority: "High", type: "Story", workspace: "Design Team", assignee: "Hà", assigneeId: "user_ha", reporter: "Minh", updatedAt: "3 ngày trước" },
    { id: "4", key: "AL-108", title: "Review Pull Request #42", status: "To Do", priority: "High", type: "Task", workspace: "Backend Team", assignee: "Quân Phạm", assigneeId: "user_quan", reporter: "Tuấn", updatedAt: "5 phút trước" },
    { id: "5", key: "AL-110", title: "Lên kế hoạch Sprint tiếp theo", status: "In Progress", priority: "Medium", type: "Epic", workspace: "Product Team", assignee: "Minh", assigneeId: "user_minh", reporter: "Minh", updatedAt: "1 giờ trước" },
    { id: "6", key: "QUAN-1", title: "Làm việc", status: "To Do", priority: "Medium", type: "Task", workspace: "quan", assignee: "Unassigned", assigneeId: "unassigned", reporter: "Quân Phạm", updatedAt: "1 ngày trước" },
  ];

  // Client-side filtering simulation (Backend will do this later)
  const filteredIssues = allMockIssues.filter(issue => {
    // Note: "current_user" maps to "user_quan" for this mock demo
    const effectiveAssigneeFilters = filterAssignee.map(a => a === "current_user" ? "user_quan" : a);

    const matchSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || issue.key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAssignee = effectiveAssigneeFilters.length === 0 || effectiveAssigneeFilters.includes(issue.assigneeId);
    const matchType = filterType.length === 0 || filterType.includes(issue.type);
    const matchStatus = filterStatus.length === 0 || filterStatus.includes(issue.status);
    
    // Simplistic Workspace mapping for demo
    const workspaceMap: Record<string, string> = { "workspace_backend": "Backend Team", "workspace_frontend": "Frontend Team", "workspace_design": "Design Team", "workspace_product": "Product Team", "workspace_quan": "quan" };
    const effectiveWorkspaceFilters = filterWorkspace.map(s => workspaceMap[s]).filter(Boolean);
    const matchWorkspace = effectiveWorkspaceFilters.length === 0 || effectiveWorkspaceFilters.includes(issue.workspace);

    return matchSearch && matchAssignee && matchType && matchStatus && matchWorkspace;
  });

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pb-12">
      {/* Header section similar to Jira */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
            <button className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
              <Star className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
              Apps <ChevronDown className="w-4 h-4" />
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
              Share <ChevronDown className="w-4 h-4" />
            </button>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-md ml-2 border border-gray-200 dark:border-gray-700">
              <button className="p-1.5 bg-white dark:bg-gray-700 shadow-sm rounded-sm text-indigo-600">
                <LayoutList className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <button className="p-1.5 ml-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-100">
              <Sparkles className="w-4 h-4" /> Ask AI
            </button>
            
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-md border border-gray-200 dark:border-gray-700 mx-1">
              <button className="px-3 py-1 text-sm font-medium bg-white dark:bg-gray-700 shadow-sm rounded-sm text-gray-800 dark:text-white">
                Basic
              </button>
              <button className="px-3 py-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                JQL
              </button>
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500" />
              </div>
              <input
                type="text"
                placeholder="Search work..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-64 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <FilterDropdown 
              label="Workspace" 
              searchPlaceholder="Search Workspace"
              groups={workspaceGroups} 
              selectedIds={filterWorkspace} 
              onChange={(id, checked) => setFilterWorkspace(prev => checked ? [...prev, id] : prev.filter(v => v !== id))}
              onClear={() => setFilterWorkspace([])}
            />

            <FilterDropdown 
              label="Assignee" 
              searchPlaceholder="Search Assignee"
              groups={assigneeGroups} 
              selectedIds={filterAssignee} 
              onChange={(id, checked) => setFilterAssignee(prev => checked ? [...prev, id] : prev.filter(v => v !== id))}
              onClear={() => setFilterAssignee([])}
            />

            <FilterDropdown 
              label="Type" 
              searchPlaceholder="Search Type"
              groups={typeGroups} 
              selectedIds={filterType} 
              onChange={(id, checked) => setFilterType(prev => checked ? [...prev, id] : prev.filter(v => v !== id))}
              onClear={() => setFilterType([])}
            />

            <FilterDropdown 
              label="Status" 
              searchPlaceholder="Search Status"
              groups={statusGroups} 
              selectedIds={filterStatus} 
              onChange={(id, checked) => setFilterStatus(prev => checked ? [...prev, id] : prev.filter(v => v !== id))}
              onClear={() => setFilterStatus([])}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
              More filters <ChevronDown className="w-4 h-4" />
            </button>
            <button onClick={clearAllFilters} className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline transition-colors">
              Clear filters
            </button>
            <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline transition-colors">
              Copy filter
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                <th className="px-4 py-3 w-10 text-center">
                  <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                </th>
                <th className="px-4 py-3 w-10 text-center">T</th>
                <th className="px-4 py-3">Work</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Reporter</th>
                <th className="px-4 py-3">Workspace</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 group cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className={`w-6 h-6 rounded flex items-center justify-center mx-auto ${
                      issue.type === 'Task' ? 'bg-blue-100 text-blue-600' :
                      issue.type === 'Bug' ? 'bg-red-100 text-red-600' :
                      issue.type === 'Story' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {issue.type === 'Bug' ? <CircleDashed className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400 font-mono text-xs hover:underline">{issue.key}</span>
                      <span className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 truncate max-w-md">{issue.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${issue.assignee === 'Unassigned' ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : 'bg-indigo-100 text-indigo-700'}`}>
                        {issue.assignee.charAt(0)}
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{issue.assignee}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-bold">
                        {issue.reporter.charAt(0)}
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{issue.reporter}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{issue.workspace}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                      issue.status === 'Done' ? 'bg-emerald-100 text-emerald-700' :
                      issue.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredIssues.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <Search className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">There's nothing matching your search</p>
              <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">Try adjusting your filters or clearing them completely.</p>
            </div>
          )}
        </div>
        
        {/* Table footer / Pagination (mock) */}
        {filteredIssues.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between mt-auto">
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-4">Showing {filteredIssues.length} items</span>
          </div>
        )}
      </div>
    </div>
  );
}
