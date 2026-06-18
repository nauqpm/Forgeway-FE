import React, { useState, useEffect, useRef } from "react";
import { Filters } from "../types/filter.type";
import { Search, X, Filter } from "lucide-react";
import {
  filterBoardAssignees,
  getBoardFilterAssigneeLabel,
} from "./boardFilterAssignees";

type BoardFiltersProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uniqueAssignees: any[];
  extraActions?: React.ReactNode;
};

const searchInputCls = "w-full pl-9 pr-4 py-1.5 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] text-[0.8125rem] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:border-[#2563EB] dark:focus:border-[#3B82F6] outline-none transition-colors";
const PRIORITY_OPTIONS = ["Highest", "High", "Medium", "Low", "Lowest"];

export default function BoardFilters({
  filters,
  setFilters,
  uniqueAssignees,
  extraActions,
}: BoardFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Status");
  const popoverRef = useRef<HTMLDivElement>(null);

  const [statusSearch, setStatusSearch] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [typeSearch, setTypeSearch] = useState("");
  const [prioritySearch, setPrioritySearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      if (filters.search !== searchValue) {
        setFilters((prev) => ({ ...prev, search: searchValue, taskKey: null }));
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchValue, filters.search, setFilters]);

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
      taskKey: null,
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

  const tabs = ["Status", "Assignee", "Task type", "Priority"];

  const allStatuses = ["To Do", "In Progress", "Testing", "Done"];
  const filteredStatuses = allStatuses.filter(s => s.toLowerCase().includes(statusSearch.toLowerCase()));

  const filteredAssignees = filterBoardAssignees(uniqueAssignees, assigneeSearch);

  const allTypes = ["Task", "Bug", "Story"];
  const filteredTypes = allTypes.filter(t => t.toLowerCase().includes(typeSearch.toLowerCase()));

  const allPriorities = PRIORITY_OPTIONS;
  const filteredPriorities = allPriorities.filter(p => p.toLowerCase().includes(prioritySearch.toLowerCase()));

  return (
    <div className="flex flex-col gap-3 px-[var(--workspace-surface-pad)] pt-0 mb-2 relative" ref={popoverRef}>
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={`min-w-60 ${searchInputCls}`}
          />
        </div>

        <button
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-[6px] text-[0.8125rem] transition-colors ${
            isPopoverOpen || hasActiveFilters
              ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] border-[#2563EB]/30 dark:border-[#2563EB]/30 text-[#1F6C9F] dark:text-[#93C5FD]"
              : "bg-white dark:bg-[#252525] border-[#EAEAEA] dark:border-white/[0.08] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#9F2F2D]" />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] flex items-center gap-1 transition-colors px-1.5"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        {extraActions}
      </div>

      {isPopoverOpen && (
        <div
          className="absolute top-[calc(100%+6px)] left-[var(--workspace-surface-pad)] w-[30rem] h-80 bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] z-50 flex overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)" }}
        >
          <div className="w-1/3 border-r border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] flex flex-col">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-left text-[0.8125rem] font-medium transition-colors border-l-2 ${
                  activeTab === tab
                    ? "bg-white dark:bg-[#202020] text-[#2563EB] border-l-[#2563EB]"
                    : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] border-l-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="w-2/3 p-3 overflow-y-auto bg-white dark:bg-[#202020] flex flex-col gap-2.5">
            {activeTab === "Status" && (
              <>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
                  <input type="text" placeholder="Search statuses..." value={statusSearch} onChange={(e) => setStatusSearch(e.target.value)} className={searchInputCls} />
                </div>
                <div className="flex flex-col gap-0.5">
                  {filteredStatuses.map((status) => (
                    <label key={status} className="flex items-center gap-2.5 p-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] cursor-pointer transition-colors">
                      <input type="checkbox" checked={filters.statuses.includes(status)} onChange={() => toggleArrayFilter("statuses", status)} className="rounded accent-[#2563EB] w-3.5 h-3.5" />
                      <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">{status}</span>
                    </label>
                  ))}
                  {filteredStatuses.length === 0 && <p className="text-[0.8125rem] text-[#ABABAB] text-center py-4">No statuses found</p>}
                </div>
              </>
            )}

            {activeTab === "Assignee" && (
              <>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
                  <input type="text" placeholder="Search assignees..." value={assigneeSearch} onChange={(e) => setAssigneeSearch(e.target.value)} className={searchInputCls} />
                </div>
                <div className="flex flex-col gap-0.5">
                  {filteredAssignees.map((user) => {
                    const label = getBoardFilterAssigneeLabel(user);

                    return (
                      <label key={user.id} className="flex items-center gap-2.5 p-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] cursor-pointer transition-colors">
                        <input type="checkbox" checked={filters.assignees.includes(user.id)} onChange={() => toggleArrayFilter("assignees", user.id)} className="rounded accent-[#2563EB] w-3.5 h-3.5" />
                        <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">{label}</span>
                      </label>
                    );
                  })}
                  {filteredAssignees.length === 0 && <p className="text-[0.8125rem] text-[#ABABAB] text-center py-4">No assignees found</p>}
                </div>
              </>
            )}

            {activeTab === "Task type" && (
              <>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
                  <input type="text" placeholder="Search task types..." value={typeSearch} onChange={(e) => setTypeSearch(e.target.value)} className={searchInputCls} />
                </div>
                <div className="flex flex-col gap-0.5">
                  {filteredTypes.map((type) => (
                    <label key={type} className="flex items-center gap-2.5 p-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] cursor-pointer transition-colors">
                      <input type="checkbox" checked={filters.types.includes(type)} onChange={() => toggleArrayFilter("types", type)} className="rounded accent-[#2563EB] w-3.5 h-3.5" />
                      <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">{type}</span>
                    </label>
                  ))}
                  {filteredTypes.length === 0 && <p className="text-[0.8125rem] text-[#ABABAB] text-center py-4">No task types found</p>}
                </div>
              </>
            )}

            {activeTab === "Priority" && (
              <>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
                  <input type="text" placeholder="Search priorities..." value={prioritySearch} onChange={(e) => setPrioritySearch(e.target.value)} className={searchInputCls} />
                </div>
                <div className="flex flex-col gap-0.5">
                  {filteredPriorities.map((priority) => (
                    <label key={priority} className="flex items-center gap-2.5 p-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] cursor-pointer transition-colors">
                      <input type="checkbox" checked={filters.priorities.includes(priority)} onChange={() => toggleArrayFilter("priorities", priority)} className="rounded accent-[#2563EB] w-3.5 h-3.5" />
                      <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">{priority}</span>
                    </label>
                  ))}
                  {filteredPriorities.length === 0 && <p className="text-[0.8125rem] text-[#ABABAB] text-center py-4">No priorities found</p>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
