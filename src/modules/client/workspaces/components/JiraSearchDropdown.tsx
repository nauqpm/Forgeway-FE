"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckSquare, FolderKanban, Kanban, Search, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import { Filters } from "../types/filter.type";
import RecentItem from "./RecentItem";
import TaskFilterPanel from "./TaskFilterPanel";

type JiraSearchDropdownProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  projects?: { id: string; name: string; key: string }[];
  assignees?: { id: string; name: string; avatar?: string }[];
  workspaceKey: string;
  currentUserName?: string;
  className?: string;
  inputClassName?: string;
};

const apps = ["Jira", "Confluence", "Trello"];
const goToLinks = ["Boards", "Projects", "Filters", "Plans", "People"];

export default function JiraSearchDropdown({
  filters,
  setFilters,
  projects = [],
  assignees = [],
  workspaceKey,
  currentUserName,
  className = "px-[var(--workspace-surface-pad)] pt-[var(--workspace-surface-pad)]",
  inputClassName = "h-12 text-base",
}: JiraSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeApp, setActiveApp] = useState("Jira");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      const rect = inputWrapRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 24;
      const left = Math.max(16, rect.left);
      const availableWidth = window.innerWidth - left - viewportPadding;
      const width = Math.min(900, Math.max(320, availableWidth));

      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left,
        width,
        zIndex: 9999,
      });
    };

    if (!isOpen) return;

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div ref={inputWrapRef} className="relative w-full">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.search}
            onFocus={() => setIsOpen(true)}
            onClick={() => setIsOpen(true)}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search Jira"
            className={`${inputClassName} w-full rounded-[10px] border border-gray-300 bg-white pl-10 pr-11 font-medium text-gray-900 shadow-sm outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-red-500 dark:focus:ring-red-500`}
          />
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400"
            aria-label="Open task filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
      </div>

      {isOpen && (
        <div
          style={dropdownStyle}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="grid max-h-[min(76vh,640px)] grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(320px,0.95fr)_minmax(340px,1.05fr)]">
            <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
                {apps.map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setActiveApp(app)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                      activeApp === app
                        ? "bg-white text-red-600 shadow-sm dark:bg-gray-800 dark:text-red-400"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                    }`}
                  >
                    {app}
                  </button>
                ))}
              </div>

              <div className="space-y-5">
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recently viewed</h3>
                  <RecentItem icon={CheckSquare} title="KAN-2 Task 2" meta="Task" tone="red" />
                  <RecentItem icon={CheckSquare} title="KAN-1 Task 1" meta="Task" tone="red" />
                </section>

                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent boards, projects, filters and plans</h3>
                  <RecentItem icon={Kanban} title="KAN board" meta="Board" tone="red" />
                  <RecentItem icon={Kanban} title="FRON board" meta="Board" tone="red" />
                  <RecentItem icon={Kanban} title="DAT board" meta="Board" tone="red" />
                  <RecentItem icon={FolderKanban} title="My Software Team (KAN)" meta="Project" />
                  <RecentItem icon={FolderKanban} title="Frontend (FRON)" meta="Project" />
                  <RecentItem icon={FolderKanban} title="database (DAT)" meta="Project" />
                  <RecentItem icon={Sparkles} title="Open issues" meta="Filter" />
                </section>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-700">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Go to all</div>
                <div className="flex flex-wrap gap-2">
                  {goToLinks.map((item) => (
                    <button key={item} type="button" className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-gray-800 dark:text-gray-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300">
                      {item}
                    </button>
                  ))}
                </div>
                <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400">
                  <Search className="h-4 w-4" /> View all work items
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 dark:bg-gray-800/60">
              <TaskFilterPanel
                filters={filters}
                setFilters={setFilters}
                projects={projects}
                assignees={assignees}
                workspaceKey={workspaceKey}
                currentUserName={currentUserName}
              />
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                <Users className="h-4 w-4 text-red-500" />
                Filters apply to workspace tasks when you are inside a workspace.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
