import React, { useState, useEffect, useRef } from "react";
import { Filters } from "../types/filter.type";
import { Search, X, Filter } from "lucide-react";

type BoardFiltersProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  uniqueAssignees: any[];
};

export default function BoardFilters({
  filters,
  setFilters,
  uniqueAssignees,
}: BoardFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Status");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Local search for each tab
  const [statusSearch, setStatusSearch] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [typeSearch, setTypeSearch] = useState("");
  const [prioritySearch, setPrioritySearch] = useState("");

  // Debounce global search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (filters.search !== searchValue) {
        setFilters((prev) => ({ ...prev, search: searchValue }));
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchValue, filters.search, setFilters]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleArrayFilter = (field: "statuses" | "assignees" | "types" | "priorities", value: string) => {
    setFilters((prev) => {
      const arr = prev[field];
      const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [field]: newArr };
    });
  };

  const handleClearFilters = () => {
    setSearchValue("");
    setFilters((prev) => ({
      ...prev,
      search: "",
      assigneeId: null,
      reporterId: null,
      priority: null,
      type: null,
      assignees: [],
      types: [],
      statuses: [],
      priorities: [],
      backlog: false,
      archived: false,
    }));
    setIsPopoverOpen(false);
    setStatusSearch("");
    setAssigneeSearch("");
    setTypeSearch("");
    setPrioritySearch("");
  };

  const hasActiveFilters =
    searchValue ||
    filters.assignees.length > 0 ||
    filters.reporterId ||
    filters.priorities.length > 0 ||
    filters.types.length > 0 ||
    filters.statuses.length > 0 ||
    filters.backlog ||
    filters.archived;

  const tabs = ["Status", "Assignee", "Issue type", "Priority", "Other"];

  // Filtered lists
  const allStatuses = ["To Do", "In Progress", "Testing", "Done"];
  const filteredStatuses = allStatuses.filter(s => s.toLowerCase().includes(statusSearch.toLowerCase()));
  
  const filteredAssignees = uniqueAssignees.filter(u => u.id.toLowerCase().includes(assigneeSearch.toLowerCase()));
  
  const allTypes = ["Task", "Bug", "Story"];
  const filteredTypes = allTypes.filter(t => t.toLowerCase().includes(typeSearch.toLowerCase()));
  
  const allPriorities = ["High", "Medium", "Low"];
  const filteredPriorities = allPriorities.filter(p => p.toLowerCase().includes(prioritySearch.toLowerCase()));

  return (
    <div className="flex flex-col gap-3 px-[var(--workspace-surface-pad)] pt-[var(--workspace-surface-pad)] mb-2 relative" ref={popoverRef}>
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full min-w-[240px] pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </div>

        <button
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm transition-colors ${
            isPopoverOpen || hasActiveFilters
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filter</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 flex items-center gap-1 transition-colors px-2"
          >
            <X className="w-4 h-4" /> Clear filters
          </button>
        )}
      </div>

      {isPopoverOpen && (
        <div className="absolute top-[calc(100%+8px)] left-[var(--workspace-surface-pad)] w-[500px] h-[340px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-left text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-white dark:bg-gray-800 text-indigo-600 border-l-2 border-indigo-600"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Right Content */}
          <div className="w-2/3 p-4 overflow-y-auto bg-white dark:bg-gray-800 flex flex-col gap-3">
            {activeTab === "Status" && (
              <>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search statuses..."
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  {filteredStatuses.map((status) => (
                    <label key={status} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={filters.statuses.includes(status)}
                        onChange={() => toggleArrayFilter("statuses", status)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{status}</span>
                    </label>
                  ))}
                  {filteredStatuses.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No statuses found</p>
                  )}
                </div>
              </>
            )}

            {activeTab === "Assignee" && (
              <>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search assignees..."
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  {filteredAssignees.map((user) => (
                    <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={filters.assignees.includes(user.id)}
                        onChange={() => toggleArrayFilter("assignees", user.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{user.id}</span>
                    </label>
                  ))}
                  {filteredAssignees.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No assignees found</p>
                  )}
                </div>
              </>
            )}

            {activeTab === "Issue type" && (
              <>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search issue types..."
                    value={typeSearch}
                    onChange={(e) => setTypeSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  {filteredTypes.map((type) => (
                    <label key={type} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type)}
                        onChange={() => toggleArrayFilter("types", type)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                    </label>
                  ))}
                  {filteredTypes.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No issue types found</p>
                  )}
                </div>
              </>
            )}

            {activeTab === "Priority" && (
              <>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search priorities..."
                    value={prioritySearch}
                    onChange={(e) => setPrioritySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  {filteredPriorities.map((priority) => (
                    <label key={priority} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={filters.priorities.includes(priority)}
                        onChange={() => toggleArrayFilter("priorities", priority)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{priority}</span>
                    </label>
                  ))}
                  {filteredPriorities.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No priorities found</p>
                  )}
                </div>
              </>
            )}

            {activeTab === "Other" && (
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Additional attributes</h4>
                
                <label className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!filters.backlog}
                    onChange={(e) => setFilters(prev => ({ ...prev, backlog: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Backlog (not in sprint)</span>
                </label>

                <label className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!filters.archived}
                    onChange={(e) => setFilters(prev => ({ ...prev, archived: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Archived</span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
